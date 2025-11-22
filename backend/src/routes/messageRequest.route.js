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

// Get count of pending requests (must come before /:requestId routes)
router.get("/count", protectRoute, getRequestCount);

// Get all pending message requests
router.get("/", protectRoute, getMessageRequests);

// Accept a message request
router.post("/:requestId/accept", protectRoute, acceptMessageRequest);

// Reject a message request
router.post("/:requestId/reject", protectRoute, rejectMessageRequest);

// Delete a message request permanently
router.delete("/:requestId", protectRoute, deleteMessageRequest);

export default router;