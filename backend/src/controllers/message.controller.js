import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import UserInbox from "../models/userInbox.model.js";
import MessageRequest from "../models/messageRequest.model.js";
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId, io } from "../lib/socket.js";
import { areUsersConnected, createMessageRequest } from "./messageRequest.controller.js";
import mongoose from "mongoose";

// Helper function to add users to each other's inbox
const addToInbox = async (userId, contactId) => {
    try {
        // Add contact to user's inbox
        await UserInbox.findOneAndUpdate(
            { userId: userId, contactId: contactId },
            { 
                userId: userId,
                contactId: contactId,
                lastMessageAt: new Date(),
                isActive: true
            },
            { upsert: true, new: true }
        );
        
        // Add user to contact's inbox
        await UserInbox.findOneAndUpdate(
            { userId: contactId, contactId: userId },
            {
                userId: contactId,
                contactId: userId,
                lastMessageAt: new Date(),
                isActive: true
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Error in addToInbox:", error.message);
    }
};

export const getUserForSidebar = async(req,res)=>{
    try {
        const loggedInUserId = req.user._id;
        
        // Get users from the user's inbox, sorted by last message time
        const inboxEntries = await UserInbox.find({
            userId: loggedInUserId,
            isActive: true
        })
        .populate("contactId", "fullName email username profilePic")
        .sort({ lastMessageAt: -1 });
        
        // Extract the contact user objects
        const users = inboxEntries.map(entry => entry.contactId).filter(contact => contact !== null);
        
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({error:"Internal Error"});
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const loggedInUserId = req.user._id;
        
        if (!query || query.trim().length < 1) {
            return res.status(400).json({ error: "Search query is required" });
        }
        
        const searchTerm = query.trim();
        let users = [];
        
        // First, try to search by MongoDB ObjectId if the query looks like an ID
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
            const userById = await User.findOne({
                $and: [
                    { _id: searchTerm },
                    { _id: { $ne: loggedInUserId } }
                ]
            }).select("-password");
            
            if (userById) {
                users.push(userById);
            }
        }
        
        // Then search by username, fullName, or email (only if not found by ID or query doesn't look like ID)
        if (users.length === 0 && searchTerm.length >= 2) {
            const searchRegex = new RegExp(searchTerm, 'i');
            const searchResults = await User.find({
                _id: { $ne: loggedInUserId },
                $or: [
                    { fullName: searchRegex },
                    { email: searchRegex },
                    { username: searchRegex }
                ]
            }).select("-password").limit(10); // Limit results for performance
            
            users = searchResults;
        }
        
        res.status(200).json(users);
    } catch (error) {
        console.log("Error in searchUsers controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessages = async(req,res)=>{
    try {
        const { id:userToChatId} =req.params;
        const myId= req.user._id;

        const messages = await Message.find({
            $or:[
            {senderId:myId, receiverId:userToChatId},
            {senderId:userToChatId, receiverId:myId}
            ]
        })

        res.status(200).json(messages);
    } catch (error) {
        console.log("Error in getMessages controller:", error.message);
        res.status(500).json({error: "Internal server error"});
    }
};
export const sendMessage = async (req, res) =>{
    try {
        const { text, image, tempId, optimisticMessage } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        let processingTime = 0;
        
        // Handle image upload with progress tracking
        if(image) {
            const startTime = Date.now();
            
            // Notify receiver about upload start if they're online
            const receiverSocketId = getReceiverSocketId(receiverId);
            if (receiverSocketId && tempId) {
                io.to(receiverSocketId).emit("imageUploadStart", {
                    senderId,
                    tempId,
                    fileName: `image_${tempId}.jpg`
                });
            }
            
            try {
                // Simulate upload progress for real-time feedback
                const uploadPromise = cloudinary.uploader.upload(image, {
                    resource_type: "image",
                    folder: "chat_images",
                    transformation: [
                        { quality: "auto:good" },
                        { fetch_format: "auto" }
                    ]
                });
                
                // Simulate progress updates
                if (receiverSocketId && tempId) {
                    const progressInterval = setInterval(() => {
                        const elapsed = Date.now() - startTime;
                        const progress = Math.min(90, (elapsed / 3000) * 100); // Max 90% until completion
                        
                        io.to(receiverSocketId).emit("imageUploadProgress", {
                            senderId,
                            tempId,
                            progress
                        });
                        
                        if (progress >= 90) {
                            clearInterval(progressInterval);
                        }
                    }, 200);
                    
                    // Clear interval after 5 seconds max
                    setTimeout(() => clearInterval(progressInterval), 5000);
                }
                
                const uploadResponse = await uploadPromise;
                imageUrl = uploadResponse.secure_url;
                processingTime = Date.now() - startTime;
                
                // Notify upload completion
                if (receiverSocketId && tempId) {
                    io.to(receiverSocketId).emit("imageUploadProgress", {
                        senderId,
                        tempId,
                        progress: 100
                    });
                }
                
            } catch (uploadError) {
                console.error("Image upload failed:", uploadError);
                
                // Notify upload failure
                if (receiverSocketId && tempId) {
                    io.to(receiverSocketId).emit("imageUploadError", {
                        senderId,
                        tempId,
                        error: "Upload failed"
                    });
                }
                
                return res.status(500).json({ 
                    error: "Image upload failed",
                    tempId,
                    details: uploadError.message 
                });
            }
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text || '',
            image: imageUrl,
        });

        await newMessage.save();
        
        // Check if users are already connected (have chatted before)
        const areConnected = await areUsersConnected(senderId, receiverId);
        
        if (areConnected) {
            // Normal message flow - users are already connected
            await addToInbox(senderId, receiverId);
            
            // Send real-time message with enhanced data
            const receiverSocketId = getReceiverSocketId(receiverId);
            const messageWithMetadata = {
                ...newMessage.toObject(),
                tempId, // Include temp ID for optimistic update matching
                processingTime,
                deliveredAt: new Date()
            };
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", messageWithMetadata);
            }
            
            // Update chat list for both users
            const senderSocketId = getReceiverSocketId(senderId);
            if (senderSocketId) {
                io.to(senderSocketId).emit("chatListUpdate", {
                    userId: receiverId,
                    lastMessage: {
                        text: text || (imageUrl ? '📷 Photo' : ''),
                        createdAt: newMessage.createdAt,
                        senderId
                    },
                    unreadCount: 0 // Sender doesn't have unread
                });
            }
            
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("chatListUpdate", {
                    userId: senderId,
                    lastMessage: {
                        text: text || (imageUrl ? '📷 Photo' : ''),
                        createdAt: newMessage.createdAt,
                        senderId
                    },
                    unreadCount: 1 // Increment unread for receiver
                });
            }
            
        } else {
            // Check if there's already a pending request between these users
            const existingRequest = await MessageRequest.findOne({
                senderId: senderId,
                receiverId: receiverId,
                status: "pending"
            });
            
            if (!existingRequest) {
                // Create a message request instead of direct message
                await createMessageRequest(senderId, receiverId, newMessage._id, {
                    text: text,
                    image: imageUrl
                });
            } else {
                // Update existing request with new message
                existingRequest.messageId = newMessage._id;
                existingRequest.firstMessage = {
                    text: text,
                    image: imageUrl
                };
                existingRequest.requestedAt = new Date();
                await existingRequest.save();
                
                // Emit update for existing request
                const receiverSocketId = getReceiverSocketId(receiverId);
                if (receiverSocketId) {
                    const populatedRequest = await MessageRequest.findById(existingRequest._id)
                        .populate("senderId", "fullName email username profilePic")
                        .populate("messageId", "text image createdAt");
                        
                    io.to(receiverSocketId).emit("requestUpdated", populatedRequest);
                }
            }
        }

        // Return enhanced response
        res.status(201).json({
            ...newMessage.toObject(),
            tempId,
            processingTime,
            deliveredAt: new Date()
        });
        
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        
        // Send error response with temp ID for error handling
        res.status(500).json({
            error: "Internal server error",
            tempId: req.body.tempId,
            details: error.message
        });
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Find the message and check if user is the sender
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }

        if (message.senderId.toString() !== userId.toString()) {
            return res.status(403).json({ error: "Unauthorized to delete this message" });
        }

        // Delete the message
        await Message.findByIdAndDelete(messageId);

        // Emit delete event to both users via socket
        const { io, getReceiverSocketId } = await import("../lib/socket.js");
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        const senderSocketId = getReceiverSocketId(userId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", { messageId });
        }
        if (senderSocketId) {
            io.to(senderSocketId).emit("messageDeleted", { messageId });
        }

        res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        console.log("Error in deleteMessage controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete contact from user's inbox and all messages between them
export const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const userId = req.user._id;

        // Validate contactId
        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({ error: "Invalid contact ID" });
        }

        // Remove contact from user's inbox (only for the current user)
        const deletedInboxEntry = await UserInbox.findOneAndDelete({
            userId: userId,
            contactId: contactId
        });

        if (!deletedInboxEntry) {
            return res.status(404).json({ error: "Contact not found in your inbox" });
        }

        // Delete all messages between the user and contact (for the user only)
        // In a production app, you might want to implement soft delete or user-specific message visibility
        const deletedMessages = await Message.deleteMany({
            $or: [
                { senderId: userId, receiverId: contactId },
                { senderId: contactId, receiverId: userId }
            ]
        });

        // Emit contact deleted event via socket
        const userSocketId = getReceiverSocketId(userId);
        if (userSocketId) {
            io.to(userSocketId).emit("contactDeleted", { contactId, deletedMessagesCount: deletedMessages.deletedCount });
        }

        res.status(200).json({ 
            message: "Contact deleted successfully", 
            deletedMessagesCount: deletedMessages.deletedCount 
        });
    } catch (error) {
        console.log("Error in deleteContact controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
