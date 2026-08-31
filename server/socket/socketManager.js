const userSocketMap = new Map();

export const addUserSocket = (userId, socketId) => {
    const id = userId.toString();

    const wasOnline = userSocketMap.has(id);

    if (!wasOnline) {
        userSocketMap.set(id, new Set());
    }

    userSocketMap.get(id).add(socketId);

    return !wasOnline;
};

export const removeUserSocket = (userId, socketId) => {
    const id = userId.toString();

    const sockets = userSocketMap.get(id);

    if (!sockets) return false;

    sockets.delete(socketId);

    if (sockets.size === 0) {
        userSocketMap.delete(id);
        return true;
    }

    return false;
};

export const getUserSockets = (userId) => {
    return userSocketMap.get(userId.toString()) || new Set();
};

export const getOnlineUsers = () => {
    return Array.from(userSocketMap.keys());
};