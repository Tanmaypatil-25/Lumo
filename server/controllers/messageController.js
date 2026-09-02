import Message from "../models/Message.js";
import User from "../models/User.js";
import { io } from "../server.js";
import mongoose from "mongoose";
import {
    uploadImageBuffer,
    deleteImage
} from "../services/cloudinaryService.js";
import { getUserSockets } from "../socket/socketManager.js";
import {
    MESSAGE_PAGE_LIMIT,
    MAX_MESSAGE_PAGE_LIMIT,
    MAX_MESSAGE_LENGTH,
    MAX_SEARCH_RESULTS
} from "../config/constants.js";
import {
    successResponse,
    errorResponse
} from "../utils/response.js";

// chat Search controller logic
export const searchMessages = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { q } = req.query;

        const myId = req.user._id;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return errorResponse(
                res,
                400,
                "Invalid user ID"
            );
        }

        const searchQuery =
            typeof q === "string"
                ? q.trim()
                : "";

        if (!searchQuery) {
            return successResponse(
                res,
                200,
                {
                    messages: []
                }
            );
        }

        // Escape RegExp special characters
        const escapedQuery =
            searchQuery.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

        const searchRegex =
            new RegExp(
                escapedQuery,
                "i"
            );

        const messages =
            await Message.find({
                $and: [
                    {
                        $or: [
                            {
                                senderId: myId,
                                receiverId: id
                            },
                            {
                                senderId: id,
                                receiverId: myId
                            }
                        ]
                    },
                    {
                        text: {
                            $regex: searchRegex
                        }
                    }
                ]
            })
                .sort({
                    createdAt: -1
                })
                .limit(
                    MAX_SEARCH_RESULTS
                )
                .lean();

        return successResponse(
            res,
            200,
            {
                messages
            }
        );

    } catch (error) {
        console.error(
            "Search messages error:",
            error.message
        );

        return errorResponse(res);
    }
};

// Edit a message
export const editMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { text } = req.body;

        const userId = req.user._id;

        // Validate message ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                400,
                "Invalid message ID"
            );
        }

        const message =
            await Message.findById(id);

        if (!message) {
            return errorResponse(
                res,
                404,
                "Message not found"
            );
        }

        // Only sender can edit
        if (
            message.senderId.toString() !==
            userId.toString()
        ) {
            return errorResponse(
                res,
                403,
                "You can only edit your own messages"
            );
        }

        const cleanText =
            typeof text === "string"
                ? text.trim()
                : "";

        // Edited text cannot be empty
        if (!cleanText) {
            return errorResponse(
                res,
                400,
                "Message cannot be empty"
            );
        }

        if (
            cleanText.length >
            MAX_MESSAGE_LENGTH
        ) {
            return errorResponse(
                res,
                400,
                "Message is too long"
            );
        }

        // Nothing actually changed
        if (message.text === cleanText) {
            return successResponse(
                res,
                200,
                {
                    updatedMessage: message
                }
            );
        }

        message.text = cleanText;
        message.edited = true;

        await message.save();

        const messageData = {
            messageId:
                message._id.toString(),

            text: message.text,

            edited: true,

            updatedAt: message.updatedAt
        };

        // Notify receiver
        const receiverSockets =
            getUserSockets(
                message.receiverId.toString()
            );

        receiverSockets.forEach(
            (socketId) => {
                io.to(socketId).emit(
                    "messageEdited",
                    messageData
                );
            }
        );

        // Synchronize sender's other tabs/devices
        const senderSockets =
            getUserSockets(
                message.senderId.toString()
            );

        senderSockets.forEach(
            (socketId) => {
                io.to(socketId).emit(
                    "messageEdited",
                    messageData
                );
            }
        );

        return successResponse(
            res,
            200,
            {
                updatedMessage: message
            }
        );

    } catch (error) {
        console.error(
            "Edit message error:",
            error.message
        );

        return errorResponse(res);
    }
};

// Delete a message
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(
                res,
                400,
                "Invalid message ID"
            );
        }

        const message = await Message.findById(id);

        if (!message) {
            return errorResponse(
                res,
                404,
                "Message not found"
            );
        }

        if (
            message.senderId.toString() !==
            userId.toString()
        ) {
            return errorResponse(
                res,
                403,
                "You can only delete your own messages"
            );
        }

        // Delete associated Cloudinary image
        if (message.imagePublicId) {
            await deleteImage(
                message.imagePublicId
            );
        }

        // Delete message from MongoDB
        await Message.findByIdAndDelete(id);

        const receiverSockets =
            getUserSockets(
                message.receiverId.toString()
            );

        receiverSockets.forEach((socketId) => {
            io.to(socketId).emit(
                "messageDeleted",
                {
                    messageId:
                        message._id.toString()
                }
            );
        });

        const senderSockets =
            getUserSockets(
                message.senderId.toString()
            );

        senderSockets.forEach((socketId) => {
            io.to(socketId).emit(
                "messageDeleted",
                {
                    messageId:
                        message._id.toString()
                }
            );
        });

        return successResponse(
            res,
            200,
            {
                message:
                    "Message deleted successfully"
            }
        );

    } catch (error) {
        console.error(
            "Delete message error:",
            error.message
        );

        return errorResponse(res);
    }
};

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
            MAX_MESSAGE_PAGE_LIMIT
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

        const unreadMessages =
            await Message.find({
                senderId: selectedUserId,
                receiverId: myId,
                seen: false
            })
                .select("_id")
                .lean();


        if (unreadMessages.length > 0) {

            const unreadMessageIds =
                unreadMessages.map(
                    (message) => message._id
                );


            await Message.updateMany(
                {
                    _id: {
                        $in: unreadMessageIds
                    }
                },
                {
                    $set: {
                        seen: true
                    }
                }
            );


            // Notify sender in real time
            const senderSockets =
                getUserSockets(
                    selectedUserId
                );


            senderSockets.forEach(
                (socketId) => {

                    unreadMessageIds.forEach(
                        (messageId) => {

                            io.to(socketId).emit(
                                "messageSeen",
                                {
                                    messageId:
                                        messageId.toString()
                                }
                            );

                        }
                    );

                }
            );
        }

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
        const userId = req.user._id;

        const message = await Message.findById(id);

        if (!message) {
            return errorResponse(
                res,
                404,
                "Message not found"
            );
        }

        if (
            message.receiverId.toString() !==
            userId.toString()
        ) {
            return errorResponse(
                res,
                403,
                "You cannot mark this message as seen"
            );
        }

        if (!message.seen) {
            message.seen = true;

            await message.save();

            const senderSockets =
                getUserSockets(
                    message.senderId.toString()
                );

            senderSockets.forEach(
                (socketId) => {
                    io.to(socketId).emit(
                        "messageSeen",
                        {
                            messageId:
                                message._id.toString()
                        }
                    );
                }
            );
        }

        return successResponse(
            res,
            200,
            {
                message:
                    "Message marked as seen"
            }
        );

    } catch (error) {
        console.error(
            "Mark message seen error:",
            error.message
        );

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
        let imagePublicId;


        // Upload image if present
        if (imageFile) {
            const uploadResponse =
                await uploadImageBuffer(
                    imageFile.buffer
                );

            imageUrl =
                uploadResponse.secure_url;

            imagePublicId =
                uploadResponse.public_id;
        }


        // Create message
        const newMessage = await Message.create({
            senderId,
            receiverId,
            text: cleanText || undefined,
            image: imageUrl || undefined,
            imagePublicId:
                imagePublicId || undefined
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