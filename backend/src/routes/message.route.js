import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import{ getMessages,getUserForSidebar, sendMessage, deleteMessage, searchUsers, deleteContact } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users",protectRoute, getUserForSidebar);

router.get("/search", protectRoute, searchUsers);

router.get("/:id",protectRoute,getMessages);

router.post("/send/:id", protectRoute, sendMessage);

router.delete("/message/:messageId", protectRoute, deleteMessage);

router.delete("/contact/:contactId", protectRoute, deleteContact);

export default router;
