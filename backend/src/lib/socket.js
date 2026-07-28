import {Server} from "socket.io";

let io;
let server;

// Store online users with their socket IDs
const userSocketMap = {};

// Store user status (online, away, busy, etc.)
const userStatusMap = {};

// Store typing users per conversation
const typingUsers = new Map();

export function initializeSocket(httpServer) {
    server = httpServer;
    
    // Build CORS origins safely
    let clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    
    // Validate URL format
    try {
        new URL(clientUrl);
    } catch (e) {
        console.warn(`Invalid CLIENT_URL: ${clientUrl}, falling back to localhost`);
        clientUrl = "http://localhost:5173";
    }
    
    const allowedOrigins = ["http://localhost:5173", clientUrl].filter(Boolean);
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    setupSocketHandlers();
    return { io, server };
}

function setupSocketHandlers() {
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        const userId = socket.handshake.query.userId;
        if(userId && userId !== 'undefined' && userId !== 'null') {
            userSocketMap[userId] = socket.id;
            userStatusMap[userId] = 'online';
            
            // Notify all users about online status change
            socket.broadcast.emit("userStatusChanged", {
                userId,
                status: 'online'
            });
        }

        // Send online users list
        io.emit("getOnlineUsers", Object.keys(userSocketMap));

        // Join user to their personal room for direct messaging
        if(userId && userId !== 'undefined' && userId !== 'null') {
            socket.join(`user_${userId}`);
        }

        // Handle typing events
        socket.on("typing", ({ receiverId, isTyping, conversationId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                const typingKey = `${userId}-${receiverId}`;
                
                if (isTyping) {
                    typingUsers.set(typingKey, {
                        userId,
                        receiverId,
                        timestamp: Date.now()
                    });
                } else {
                    typingUsers.delete(typingKey);
                }
                
                io.to(receiverSocketId).emit("typing", {
                    userId: userId,
                    isTyping: isTyping,
                    conversationId
                });
            }
        });

        // Handle user status changes
        socket.on("statusChange", ({ status }) => {
            if (userId && ['online', 'away', 'busy', 'offline'].includes(status)) {
                userStatusMap[userId] = status;
                socket.broadcast.emit("userStatusChanged", {
                    userId,
                    status
                });
            }
        });

        // Handle joining specific conversation rooms
        socket.on("joinConversation", ({ conversationId }) => {
            socket.join(`conversation_${conversationId}`);
        });

        // Handle leaving conversation rooms
        socket.on("leaveConversation", ({ conversationId }) => {
            socket.leave(`conversation_${conversationId}`);
        });

        // Handle image upload progress
        socket.on("imageUploadProgress", ({ receiverId, progress, messageId }) => {
            const receiverSocketId = userSocketMap[receiverId];
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("imageUploadProgress", {
                    senderId: userId,
                    progress,
                    messageId
                });
            }
        });

        // Handle message read receipts
        socket.on("messageRead", ({ messageIds, senderId }) => {
            const senderSocketId = userSocketMap[senderId];
            if (senderSocketId) {
                io.to(senderSocketId).emit("messageRead", {
                    messageIds,
                    readBy: userId,
                    readAt: new Date()
                });
            }
        });

        // Handle user going offline/disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            
            if (userId && userId !== 'undefined' && userId !== 'null') {
                delete userSocketMap[userId];
                userStatusMap[userId] = 'offline';
                
                // Clear any typing indicators for this user
                for (const [key, value] of typingUsers.entries()) {
                    if (value.userId === userId) {
                        const receiverSocketId = userSocketMap[value.receiverId];
                        if (receiverSocketId) {
                            io.to(receiverSocketId).emit("typing", {
                                userId: userId,
                                isTyping: false
                            });
                        }
                        typingUsers.delete(key);
                    }
                }
                
                // Notify all users about offline status
                socket.broadcast.emit("userStatusChanged", {
                    userId,
                    status: 'offline'
                });
            }
            
            io.emit("getOnlineUsers", Object.keys(userSocketMap));
        });

        // Handle manual disconnect
        socket.on("userOffline", () => {
            if (userId && userId !== 'undefined' && userId !== 'null') {
                userStatusMap[userId] = 'offline';
                socket.broadcast.emit("userStatusChanged", {
                    userId,
                    status: 'offline'
                });
            }
        });
    });
}

export function getReceiverSocketId(userId) {
    return userSocketMap[userId];
}

export function getAllOnlineUsers() {
    return Object.keys(userSocketMap);
}

export function emitToUser(userId, event, data) {
    const socketId = userSocketMap[userId];
    if (socketId) {
        io.to(socketId).emit(event, data);
        return true;
    }
    return false;
}

export function emitToAllUsers(event, data) {
    io.emit(event, data);
}

export { io, server };

