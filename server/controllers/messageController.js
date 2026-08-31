import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js"
import mongoose from "mongoose";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;

        const filteredUsers = await User.find({
            _id: { $ne: userId }
        }).select("-password");

        const unreadCounts = await Message.aggregate([
            {
                $match: {
                    recieverId: userId,
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
            parseInt(req.query.limit) || 20,
            50
        );

        const conversationQuery = {
            $or: [
                {
                    senderId: myId,
                    recieverId: selectedUserId
                },
                {
                    senderId: selectedUserId,
                    recieverId: myId
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
            .limit(limit + 1);

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
                recieverId: myId,
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
            userSocketMap[userId];

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

// Send message to selected user
export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;

        const recieverId = req.params.id;
        const senderId = req.user._id;

        // Validate receiver ID
        if (!mongoose.Types.ObjectId.isValid(recieverId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid receiver ID"
            });
        }

        // Prevent messaging yourself
        if (senderId.toString() === recieverId) {
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
        if (!cleanText && !image) {
            return res.status(400).json({
                success: false,
                message: "Message cannot be empty"
            });
        }

        if (cleanText.length > 5000) {
            return res.status(400).json({
                success: false,
                message: "Message is too long"
            });
        }

        // Make sure receiver exists
        const receiverExists = await User.exists({
            _id: recieverId
        });

        if (!receiverExists) {
            return res.status(404).json({
                success: false,
                message: "Receiver not found"
            });
        }

        let imageUrl;

        if (image) {
            const uploadResponse =
                await cloudinary.uploader.upload(image);

            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({
            senderId,
            recieverId,
            text: cleanText || undefined,
            image: imageUrl
        });

        // Send message to all active receiver sockets
        const receiverSockets =
            userSocketMap[recieverId];

        if (receiverSockets) {
            receiverSockets.forEach((socketId) => {
                io.to(socketId).emit(
                    "newMessage",
                    newMessage
                );
            });
        }

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