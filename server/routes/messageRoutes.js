import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import { getMessages, getUsersForSidebar, markMessagesAsSeen, sendMessage } from '../controllers/messageController.js';
import upload from "../middleware/upload.js";
import handleUpload from "../middleware/uploadError.js";
import { deleteMessage, editMessage, searchMessages } from '../controllers/messageController.js';

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/search/:id", protectRoute, searchMessages);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);
messageRouter.post("/send/:id", protectRoute, handleUpload(upload.single("image")), sendMessage);
messageRouter.delete("/:id", protectRoute, deleteMessage);
messageRouter.put("/edit/:id", protectRoute, editMessage);

export default messageRouter;