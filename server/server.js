import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

// Creating express app
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL }
});

// Store online users
export const userSocketMap = {}; // { userId: socketId }

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(
                new Error("Unauthorized")
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.userId = decoded.userId;

        next();

    } catch (error) {
        next(new Error("Unauthorized"));
    }
});

// Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.userId;

    console.log("User Connected", userId);

    if (!userSocketMap[userId]) {
        userSocketMap[userId] = new Set();
    }

    userSocketMap[userId].add(socket.id);

    io.emit(
        "getOnlineUsers",
        Object.keys(userSocketMap)
    );

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);

        userSocketMap[userId]?.delete(socket.id);

        if (
            userSocketMap[userId] &&
            userSocketMap[userId].size === 0
        ) {
            delete userSocketMap[userId];
        }

        io.emit(
            "getOnlineUsers",
            Object.keys(userSocketMap)
        );
    });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors({
    origin: process.env.CLIENT_URL
}));

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live!"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// connecting to mongodb
await connectDB();

if (process.env.NODE_ENV !== "production") {

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log("Server is running on PORT: " + PORT);
    })

}

// Export server for vercel
export default server;