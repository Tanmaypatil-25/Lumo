import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const { socket, axios } = useContext(AuthContext);

    const getUsers = async () => {
        try {
            const { data } =
                await axios.get("/api/messages/users");

            if (data.success) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message
            );
        }
    };

    const getMessages = async (userId) => {
        try {
            const { data } =
                await axios.get(`/api/messages/${userId}`);

            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message
            );
        }
    };

    const sendMessage = async (messageData) => {
        try {
            if (!selectedUser) return false;

            const { data } = await axios.post(
                `/api/messages/send/${selectedUser._id}`,
                messageData
            );

            if (data.success) {
                setMessages(prev => [
                    ...prev,
                    data.newMessage
                ]);

                return true;
            }

            return false;

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message
            );

            return false;
        }
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = async (newMessage) => {

            if (
                selectedUser &&
                newMessage.senderId === selectedUser._id
            ) {
                const seenMessage = {
                    ...newMessage,
                    seen: true
                };

                setMessages(prev => [
                    ...prev,
                    seenMessage
                ]);

                try {
                    await axios.put(
                        `/api/messages/mark/${newMessage._id}`
                    );
                } catch (error) {
                    console.error(
                        error.response?.data?.message ||
                        error.message
                    );
                }

            } else {
                setUnseenMessages(prev => ({
                    ...prev,

                    [newMessage.senderId]:
                        prev[newMessage.senderId]
                            ? prev[newMessage.senderId] + 1
                            : 1
                }));
            }
        };

        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off(
                "newMessage",
                handleNewMessage
            );
        };

    }, [socket, selectedUser]);

    const value = {
        messages,
        users,
        selectedUser,
        getUsers,
        getMessages,
        sendMessage,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};