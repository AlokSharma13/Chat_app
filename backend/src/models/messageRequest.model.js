import mongoose from "mongoose";

const messageRequestSchema = new mongoose.Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending",
        },
        firstMessage: {
            text: String,
            image: String,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        respondedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Create compound index to ensure uniqueness and improve query performance
messageRequestSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });
messageRequestSchema.index({ receiverId: 1, status: 1 });
messageRequestSchema.index({ senderId: 1, status: 1 });

const MessageRequest = mongoose.model("MessageRequest", messageRequestSchema);

export default MessageRequest;