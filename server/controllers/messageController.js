import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, userSocketMap } from "../server.js"

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        // count number of unseen messages
        const unseenMessages = {}
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, recieverId: userId, seen: false })

            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })

        await Promise.all(promises);
        return res.status(200).json({
            success: true,
            users: filteredUsers,
            unseenMessages
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// Get all messages for selected user 
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, recieverId: selectedUserId },
                { senderId: selectedUserId, recieverId: myId },
            ]
        })

        await Message.updateMany({ senderId: selectedUserId, recieverId: myId }, { seen: true });
        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

// api to mark messages seen using message id
export const markMessagesAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        return res.status(200).json({
            success: true
        });
    } catch (error) {
        console.log(error.message)
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

        let imageUrl;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = await Message.create({
            senderId,
            recieverId,
            text,
            image: imageUrl
        })

        // Emit the new message to the recievers socket
        const recieverSocketId = userSocketMap[recieverId];
        if (recieverSocketId) {
            io.to(recieverSocketId).emit("newMessage", newMessage);
        }

        return res.status(201).json({
            success: true,
            newMessage
        });
    } catch (error) {
        console.log(error.message)
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}