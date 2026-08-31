const userSocketMap = new Map();

export const addUserSocket = (userId, socketId) => {
    const id = userId.toString();

    if (!userSocketMap.has(id)) {
        userSocketMap.set(id, new Set());
    }

    userSocketMap.get(id).add(socketId);
};

export const removeUserSocket = (userId, socketId) => {
    const id = userId.toString();

    const sockets = userSocketMap.get(id);

    if (!sockets) return;

    sockets.delete(socketId);

    if (sockets.size === 0) {
        userSocketMap.delete(id);
    }
};

export const getUserSockets = (userId) => {
    return userSocketMap.get(userId.toString()) || new Set();
};

export const getOnlineUsers = () => {
    return Array.from(userSocketMap.keys());
};