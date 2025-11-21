import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    getMessageRequests,
    acceptMessageRequest,
    rejectMessageRequest,
    deleteMessageRequest,
    getRequestCount
} from "../controllers/messageRequest.controller.js";

const router = express.Router();

// Get all pending message requests
router.get("/", protectRoute, getMessageRequests);

// Get count of pending requests
router.get("/count", protectRoute, getRequestCount);

// Accept a message request
router.post("/:requestId/accept", protectRoute, acceptMessageRequest);

// Reject a message request
router.post("/:requestId/reject", protectRoute, rejectMessageRequest);

// Delete a message request permanently
router.delete("/:requestId", protectRoute, deleteMessageRequest);

export default router;