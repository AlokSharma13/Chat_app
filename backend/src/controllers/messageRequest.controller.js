import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import MessageRequest from "../models/messageRequest.model.js";
import UserInbox from "../models/userInbox.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";

// Get all pending message requests for the logged-in user
export const getMessageRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const requests = await MessageRequest.find({
            receiverId: userId,
            status: "pending"
        })
        .populate("senderId", "fullName email username profilePic")
        .populate("messageId", "text image createdAt")
        .sort({ requestedAt: -1 });
        
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error in getMessageRequests:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Accept a message request
export const acceptMessageRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;
        
        // Find the request
        const request = await MessageRequest.findOne({
            _id: requestId,
            receiverId: userId,
            status: "pending"
        }).populate("senderId");
        
        if (!request) {
            return res.status(404).json({ error: "Message request not found" });
        }
        
        // Update request status
        request.status = "accepted";
        request.respondedAt = new Date();
        await request.save();
        
        // Add both users to each other's inbox
        await Promise.all([
            UserInbox.findOneAndUpdate(
                { userId: userId, contactId: request.senderId._id },
                {
                    userId: userId,
                    contactId: request.senderId._id,
                    lastMessageAt: new Date(),
                    isActive: true
                },
                { upsert: true, new: true }
            ),
            UserInbox.findOneAndUpdate(
                { userId: request.senderId._id, contactId: userId },
                {
                    userId: request.senderId._id,
                    contactId: userId,
                    lastMessageAt: new Date(),
                    isActive: true
                },
                { upsert: true, new: true }
            )
        ]);
        
        // Emit real-time updates
        const userSocketId = getReceiverSocketId(userId);
        const senderSocketId = getReceiverSocketId(request.senderId._id);
        
        if (userSocketId) {
            io.to(userSocketId).emit("requestAccepted", {
                requestId: request._id,
                sender: request.senderId
            });
        }
        
        if (senderSocketId) {
            io.to(senderSocketId).emit("requestAcceptedBySender", {
                requestId: request._id,
                receiver: req.user
            });
        }
        
        res.status(200).json({ 
            message: "Message request accepted successfully",
            sender: request.senderId
        });
    } catch (error) {
        console.error("Error in acceptMessageRequest:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Reject a message request
export const rejectMessageRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;
        
        // Find the request
        const request = await MessageRequest.findOne({
            _id: requestId,
            receiverId: userId,
            status: "pending"
        });
        
        if (!request) {
            return res.status(404).json({ error: "Message request not found" });
        }
        
        // Update request status
        request.status = "rejected";
        request.respondedAt = new Date();
        await request.save();
        
        // Emit real-time update
        const userSocketId = getReceiverSocketId(userId);
        if (userSocketId) {
            io.to(userSocketId).emit("requestRejected", {
                requestId: request._id
            });
        }
        
        res.status(200).json({ message: "Message request rejected successfully" });
    } catch (error) {
        console.error("Error in rejectMessageRequest:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Delete a message request permanently
export const deleteMessageRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.user._id;
        
        // Find the request
        const request = await MessageRequest.findOne({
            _id: requestId,
            receiverId: userId
        });
        
        if (!request) {
            return res.status(404).json({ error: "Message request not found" });
        }
        
        // Delete the associated message
        await Message.findByIdAndDelete(request.messageId);
        
        // Delete the request
        await MessageRequest.findByIdAndDelete(requestId);
        
        // Emit real-time update
        const userSocketId = getReceiverSocketId(userId);
        if (userSocketId) {
            io.to(userSocketId).emit("requestDeleted", {
                requestId: request._id
            });
        }
        
        res.status(200).json({ message: "Message request deleted successfully" });
    } catch (error) {
        console.error("Error in deleteMessageRequest:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get count of pending requests
export const getRequestCount = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const count = await MessageRequest.countDocuments({
            receiverId: userId,
            status: "pending"
        });
        
        res.status(200).json({ count });
    } catch (error) {
        console.error("Error in getRequestCount:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Helper function to check if users are already connected
export const areUsersConnected = async (userId1, userId2) => {
    try {
        const connection = await UserInbox.findOne({
            userId: userId1,
            contactId: userId2,
            isActive: true
        });
        return !!connection;
    } catch (error) {
        console.error("Error checking user connection:", error);
        return false;
    }
};

// Helper function to create a message request
export const createMessageRequest = async (senderId, receiverId, messageId, messageData) => {
    try {
        const request = new MessageRequest({
            senderId,
            receiverId,
            messageId,
            firstMessage: {
                text: messageData.text,
                image: messageData.image
            },
            status: "pending"
        });
        
        await request.save();
        
        // Emit real-time notification to receiver
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            const populatedRequest = await MessageRequest.findById(request._id)
                .populate("senderId", "fullName email username profilePic")
                .populate("messageId", "text image createdAt");
                
            io.to(receiverSocketId).emit("newMessageRequest", populatedRequest);
        }
        
        return request;
    } catch (error) {
        console.error("Error creating message request:", error);
        throw error;
    }
};