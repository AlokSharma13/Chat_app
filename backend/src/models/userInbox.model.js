import mongoose from "mongoose";

const userInboxSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        contactId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", 
            required: true,
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    { timestamps: true }
);

// Create compound index to ensure uniqueness and improve query performance
userInboxSchema.index({ userId: 1, contactId: 1 }, { unique: true });
userInboxSchema.index({ userId: 1, lastMessageAt: -1 });

const UserInbox = mongoose.model("UserInbox", userInboxSchema);

export default UserInbox;