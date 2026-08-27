import { createContext, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagePage, setMessagePage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);

    const { socket, axios, authUser } = useContext(AuthContext);

    const latestMessagesRequest = useRef(0);

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

    const getMessages = async (userId, signal) => {
        const requestId = ++latestMessagesRequest.current;

        try {
            setMessagesLoading(true);

            const { data } = await axios.get(
                `/api/messages/${userId}`,
                {
                    params: {
                        page: 1,
                        limit: 20
                    },
                    signal
                }
            );

            if (
                data.success &&
                requestId === latestMessagesRequest.current
            ) {
                setMessages(data.messages);

                setMessagePage(1);
                setHasMoreMessages(data.hasMore);

                setUnseenMessages(prev => ({
                    ...prev,
                    [userId]: 0
                }));
            }

        } catch (error) {
            if (
                error.name === "CanceledError" ||
                error.code === "ERR_CANCELED"
            ) {
                return;
            }

            if (requestId === latestMessagesRequest.current) {
                toast.error(
                    error.response?.data?.message ||
                    error.message
                );
            }

        } finally {
            if (requestId === latestMessagesRequest.current) {
                setMessagesLoading(false);
            }
        }
    };

    const loadOlderMessages = async () => {
        if (
            !selectedUser ||
            !hasMoreMessages ||
            messagesLoading
        ) {
            return;
        }

        const nextPage = messagePage + 1;

        try {
            setMessagesLoading(true);
            setLoadingOlderMessages(true);

            const { data } = await axios.get(
                `/api/messages/${selectedUser._id}`,
                {
                    params: {
                        page: nextPage,
                        limit: 20
                    }
                }
            );

            if (data.success) {
                setMessages(prev => [
                    ...data.messages,
                    ...prev
                ]);

                setMessagePage(nextPage);
                setHasMoreMessages(data.hasMore);
            }

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                error.message
            );
        } finally {
            setMessagesLoading(false);
            setLoadingOlderMessages(false);
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
                appendMessageIfNew(data.newMessage);

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

    const appendMessageIfNew = (newMessage) => {
        setMessages(prev => {
            const alreadyExists = prev.some(
                msg => msg._id === newMessage._id
            );

            if (alreadyExists) {
                return prev;
            }

            return [...prev, newMessage];
        });
    };

    useEffect(() => {
        if (!authUser) {
            setMessages([]);
            setUsers([]);
            setSelectedUser(null);
            setUnseenMessages({});
            setMessagesLoading(false);
        }
    }, [authUser]);

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

                appendMessageIfNew(seenMessage);

                setUnseenMessages(prev => ({
                    ...prev,
                    [newMessage.senderId]: 0
                }));

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


        const handleMessageSeen = (messageId) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg._id === messageId
                        ? { ...msg, seen: true }
                        : msg
                )
            );
        };

        socket.on("newMessage", handleNewMessage);

        socket.on(
            "messageSeen",
            handleMessageSeen
        );

        return () => {
            socket.off(
                "newMessage",
                handleNewMessage
            );

            socket.off(
                "messageSeen",
                handleMessageSeen
            );
        };

    }, [socket, selectedUser]);

    const value = {
        messages,
        setMessages,
        messagesLoading,

        messagePage,
        hasMoreMessages,
        loadOlderMessages,
        loadingOlderMessages,

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