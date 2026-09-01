import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../server.js"
import mongoose from "mongoose";
import { getUserSockets } from "../socket/socketManager.js";
import {
    MESSAGE_PAGE_LIMIT,
    MAX_MESSAGE_LENGTH
} from "../config/constants.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;

        const filteredUsers = await User.find({
            _id: { $ne: userId }
        })
            .select("_id fullName profilePic bio")
            .lean();

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    receiverId: userId,
                    seen: false
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        const unseenMessages = {};

        unreadCounts.forEach((item) => {
            unseenMessages[item._id.toString()] = item.count;
        });

        return res.status(200).json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// Get all messages for selected user 
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const { before } = req.query;

        const limit = Math.min(
            parseInt(req.query.limit) || MESSAGE_PAGE_LIMIT,
            50
        );

        const conversationQuery = {
            $or: [
                {
                    senderId: myId,
                    receiverId: selectedUserId
                },
                {
                    senderId: selectedUserId,
                    receiverId: myId
                }
            ]
        };

        if (before) {
            conversationQuery.createdAt = {
                $lt: new Date(before)
            };
        }

        const messages = await Message.find(conversationQuery)
            .sort({ createdAt: -1 })
            .limit(limit + 1)
            .lean();

        const hasMore = messages.length > limit;

        if (hasMore) {
            messages.pop();
        }

        const nextCursor =
            messages.length > 0
                ? messages[messages.length - 1].createdAt
                : null;

        await Message.updateMany(
            {
                senderId: selectedUserId,
                receiverId: myId,
                seen: false
            },
            {
                seen: true
            }
        );

        return res.status(200).json({
            success: true,
            messages: messages.reverse(),
            hasMore,
            nextCursor
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// api to mark messages seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedMessage =
            await Message.findByIdAndUpdate(
                id,
                { seen: true },
                { new: true }
            );

        if (!updatedMessage) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        const userId = req.user._id.toString();

        const userSockets =
            getUserSockets[userId];

        if (userSockets) {
            userSockets.forEach((socketId) => {
                io.to(socketId).emit(
                    "messageSeen",
                    updatedMessage._id.toString()
                );
            });
        }

        return res.status(200).json({
            success: true
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

const uploadBufferToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "image",
                folder: "lumo"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(buffer);
    });
};

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const imageFile = req.file;

        const receiverId = req.params.id;
        const senderId = req.user._id;

        // Validate receiver ID
        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID"
            });
        }

        // Prevent messaging yourself
        if (senderId.toString() === receiverId) {
            return res.status(400).json({
                success: false,
                message: "You cannot send a message to yourself"
            });
        }

        // Remove unnecessary whitespace
        const cleanText =
            typeof text === "string"
                ? text.trim()
                : "";

        // Message must contain text or image
        if (!cleanText && !imageFile) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        if (cleanText.length > MAX_MESSAGE_LENGTH) {
            return res.status(400).json({
                success: false,
                message: "Message is too long"
            });
        }

        // Make sure receiver exists
        const receiverExists = await User.exists({
            _id: receiverId
        });

        if (!receiverExists) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        let imageUrl;

        if (imageFile) {
            const uploadResponse = await uploadBufferToCloudinary(
                imageFile.buffer
            );

            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: cleanText || undefined,
            image: imageUrl
        });

        // Send message to all active receiver sockets
        const receiverSockets = getUserSockets(receiverId);

        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit(
                "newMessage",
                newMessage
            );
        });

        return res.status(201).json({
            success: true,
            newMessage
        });

    } catch (error) {
        console.log(error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};