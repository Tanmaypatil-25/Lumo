import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../server.js";
import mongoose from "mongoose";
import {
    uploadImageBuffer
} from "../services/cloudinaryService.js";

import { getUserSockets } from "../socket/socketManager.js";

import {
    MESSAGE_PAGE_LIMIT,
    MAX_MESSAGE_LENGTH
} from "../config/constants.js";

import {
    successResponse,
    errorResponse
} from "../utils/response.js";


// Get all users except the logged-in user
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

        return successResponse(res, 200, {
            users: filteredUsers,
            unseenMessages
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};


// Get messages for selected user
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

        return successResponse(res, 200, {
            messages: messages.reverse(),
            hasMore,
            nextCursor
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};


// Mark message as seen
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;

        const updatedMessage = await Message.findByIdAndUpdate(
            id,
            { seen: true },
            { new: true }
        );

        if (!updatedMessage) {
            return errorResponse(
                res,
                404,
                "Message not found"
            );
        }

        const userId = req.user._id.toString();

        const userSockets = getUserSockets(userId);

        userSockets.forEach((socketId) => {
            io.to(socketId).emit(
                "messageSeen",
                updatedMessage._id.toString()
            );
        });

        return successResponse(res, 200);

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
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
            return errorResponse(
                res,
                400,
                "Invalid receiver ID"
            );
        }


        // Prevent sending messages to yourself
        if (senderId.toString() === receiverId) {
            return errorResponse(
                res,
                400,
                "You cannot send a message to yourself"
            );
        }


        // Remove unnecessary whitespace
        const cleanText =
            typeof text === "string"
                ? text.trim()
                : "";


        // Message must contain text or image
        if (!cleanText && !imageFile) {
            return errorResponse(
                res,
                400,
                "Message cannot be empty"
            );
        }


        // Validate message length
        if (cleanText.length > MAX_MESSAGE_LENGTH) {
            return errorResponse(
                res,
                400,
                "Message is too long"
            );
        }


        // Make sure receiver exists
        const receiverExists = await User.exists({
            _id: receiverId
        });

        if (!receiverExists) {
            return errorResponse(
                res,
                404,
                "Receiver not found"
            );
        }


        let imageUrl;

        // Upload image if present
        if (imageFile) {
            const uploadResponse =
                await uploadImageBuffer(
                    imageFile.buffer
                );
            imageUrl = uploadResponse.secure_url;
        }


        // Create message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: cleanText || undefined,
            image: imageUrl || undefined
        });


        // Send message to all active receiver sockets
        const receiverSockets =
            getUserSockets(receiverId);

        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit(
                "newMessage",
                newMessage
            );
        });


        return successResponse(res, 201, {
            newMessage
        });

    } catch (error) {
        console.log(error.message);

        return errorResponse(res);
    }
};