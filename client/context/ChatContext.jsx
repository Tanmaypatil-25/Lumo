import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import toast from "react-hot-toast";

import { AuthContext } from "./AuthContext";

import {
    MESSAGE_PAGE_LIMIT
} from "../src/constants/chat";


export const ChatContext = createContext();


export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const [usersLoading, setUsersLoading] =
        useState(false);

    const [usersError, setUsersError] =
        useState("");

    const [messagesLoading, setMessagesLoading] =
        useState(false);

    const [messagesError, setMessagesError] =
        useState("");

    const [messageCursor, setMessageCursor] =
        useState(null);

    const [hasMoreMessages, setHasMoreMessages] =
        useState(true);

    const [loadingOlderMessages, setLoadingOlderMessages] =
        useState(false);

    const [typingUserId, setTypingUserId] =
        useState(null);


    const {
        socket,
        axios,
        authUser
    } = useContext(AuthContext);


    const latestMessagesRequest = useRef(0);


    // Add message only if it is not already present
    const appendMessageIfNew = useCallback(
        (newMessage) => {

            setMessages((prev) => {

                const alreadyExists =
                    prev.some(
                        (msg) =>
                            msg._id === newMessage._id
                    );

                if (alreadyExists) {
                    return prev;
                }

                return [
                    ...prev,
                    newMessage
                ];
            });
        },
        []
    );


    // Get users for sidebar
    const getUsers = useCallback(
        async () => {

            try {
                setUsersLoading(true);
                setUsersError("");

                const { data } =
                    await axios.get(
                        "/api/messages/users"
                    );

                if (data.success) {

                    setUsers(data.users);

                    setUnseenMessages(
                        data.unseenMessages
                    );
                }

            } catch (error) {

                const message =
                    error.response
                        ?.data
                        ?.message ||
                    error.message;

                setUsersError(message);

                toast.error(message);

            } finally {
                setUsersLoading(false);
            }
        },
        [axios]
    );


    // Get initial messages for selected user
    const getMessages = useCallback(
        async (userId, signal) => {

            const requestId =
                ++latestMessagesRequest.current;

            try {

                setMessagesLoading(true);
                setMessagesError("");


                const { data } =
                    await axios.get(
                        `/api/messages/${userId}`,
                        {
                            params: {
                                limit:
                                    MESSAGE_PAGE_LIMIT
                            },

                            signal
                        }
                    );


                if (
                    data.success &&
                    requestId ===
                    latestMessagesRequest.current
                ) {

                    setMessages(
                        data.messages
                    );

                    setMessageCursor(
                        data.nextCursor
                    );

                    setHasMoreMessages(
                        data.hasMore
                    );


                    setUnseenMessages(
                        (prev) => ({
                            ...prev,
                            [userId]: 0
                        })
                    );
                }

            } catch (error) {

                if (
                    error.name ===
                    "CanceledError" ||
                    error.code ===
                    "ERR_CANCELED"
                ) {
                    return;
                }


                if (
                    requestId ===
                    latestMessagesRequest.current
                ) {

                    const message =
                        error.response
                            ?.data
                            ?.message ||
                        error.message;

                    setMessagesError(message);
                    toast.error(message);
                }

            } finally {

                if (
                    requestId ===
                    latestMessagesRequest.current
                ) {

                    setMessagesLoading(
                        false
                    );
                }
            }
        },
        [axios]
    );


    // Load older messages using cursor pagination
    const loadOlderMessages = useCallback(
        async () => {

            if (
                !selectedUser ||
                !hasMoreMessages ||
                messagesLoading ||
                loadingOlderMessages
            ) {
                return null;
            }


            try {

                setMessagesLoading(true);

                setLoadingOlderMessages(
                    true
                );


                const { data } =
                    await axios.get(
                        `/api/messages/${selectedUser._id}`,
                        {
                            params: {
                                limit:
                                    MESSAGE_PAGE_LIMIT,

                                before:
                                    messageCursor
                            }
                        }
                    );


                if (data.success) {

                    setMessages(
                        (prev) => [
                            ...data.messages,
                            ...prev
                        ]
                    );

                    setMessageCursor(
                        data.nextCursor
                    );

                    setHasMoreMessages(
                        data.hasMore
                    );

                    return {
                        messages: data.messages,
                        nextCursor: data.nextCursor,
                        hasMore: data.hasMore
                    };
                }

                return null;

            } catch (error) {

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );
                return null;

            } finally {

                setMessagesLoading(
                    false
                );

                setLoadingOlderMessages(
                    false
                );
            }
        },
        [
            axios,
            selectedUser,
            hasMoreMessages,
            messagesLoading,
            loadingOlderMessages,
            messageCursor
        ]
    );


    // Send message
    const sendMessage = useCallback(
        async (formData) => {

            if (!selectedUser) {
                return false;
            }


            try {

                const { data } =
                    await axios.post(
                        `/api/messages/send/${selectedUser._id}`,
                        formData
                    );


                if (data.success) {

                    appendMessageIfNew(
                        data.newMessage
                    );

                    return true;
                }


                return false;

            } catch (error) {

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );


                return false;
            }
        },
        [
            axios,
            selectedUser,
            appendMessageIfNew
        ]
    );

    // Delete message func
    const deleteMessage = useCallback(
        async (messageId) => {
            try {
                const { data } =
                    await axios.delete(
                        `/api/messages/${messageId}`
                    );

                return data.success;

            } catch (error) {

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );

                return false;
            }
        },
        [axios]
    );

    const searchMessages = useCallback(
        async (userId, query) => {
            try {
                const { data } =
                    await axios.get(
                        `/api/messages/search/${userId}`,
                        {
                            params: {
                                q: query
                            }
                        }
                    );

                return data.messages || [];

            } catch (error) {
                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );

                return [];
            }
        },
        [axios]
    );

    // Edit message func
    const editMessage = useCallback(
        async (messageId, text) => {

            try {
                const { data } =
                    await axios.put(
                        `/api/messages/edit/${messageId}`,
                        {
                            text
                        }
                    );

                return data.success;

            } catch (error) {

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );

                return false;
            }
        },
        [axios]
    );


    // Reset chat state after logout
    useEffect(() => {

        if (!authUser) {

            setMessages([]);

            setUsers([]);

            setSelectedUser(null);

            setUnseenMessages({});

            setUsersLoading(false);
            setUsersError("");

            setMessagesLoading(false);
            setMessagesError("");

            setMessageCursor(null);

            setHasMoreMessages(true);

            setLoadingOlderMessages(false);

            setTypingUserId(null);

            latestMessagesRequest.current++;
        }

    }, [authUser]);


    // Socket listeners
    useEffect(() => {

        if (!socket) {
            return;
        }


        const handleNewMessage =
            async (newMessage) => {

                if (
                    selectedUser &&
                    newMessage.senderId ===
                    selectedUser._id
                ) {

                    const seenMessage = {
                        ...newMessage,
                        seen: true
                    };


                    appendMessageIfNew(
                        seenMessage
                    );


                    setUnseenMessages(
                        (prev) => ({
                            ...prev,
                            [newMessage.senderId]:
                                0
                        })
                    );


                    try {

                        await axios.put(
                            `/api/messages/mark/${newMessage._id}`
                        );

                    } catch (error) {

                        console.error(
                            error.response
                                ?.data
                                ?.message ||
                            error.message
                        );
                    }

                } else {

                    setUnseenMessages(
                        (prev) => ({
                            ...prev,

                            [newMessage.senderId]:
                                (
                                    prev[
                                    newMessage.senderId
                                    ] || 0
                                ) + 1
                        })
                    );
                }
            };


        const handleMessageSeen = ({
            messageId
        }) => {
            setMessages((prevMessages) =>
                prevMessages.map((message) =>
                    message._id === messageId
                        ? {
                            ...message,
                            seen: true
                        }
                        : message
                )
            );
        };

        const handleMessageEdited = ({
            messageId,
            text,
            edited,
            updatedAt
        }) => {

            setMessages(
                (prevMessages) =>
                    prevMessages.map(
                        (message) =>
                            message._id === messageId
                                ? {
                                    ...message,
                                    text,
                                    edited,
                                    updatedAt
                                }
                                : message
                    )
            );
        };

        const handleMessageDeleted = ({
            messageId
        }) => {

            setMessages((prevMessages) =>
                prevMessages.filter(
                    (message) =>
                        message._id !== messageId
                )
            );
        };

        const handleTyping = ({ senderId }) => {
            setTypingUserId(senderId);
        };

        const handleStopTyping = ({ senderId }) => {
            setTypingUserId((currentUserId) =>
                currentUserId === senderId
                    ? null
                    : currentUserId
            );
        };

        socket.on(
            "typing",
            handleTyping
        );

        socket.on(
            "stopTyping",
            handleStopTyping
        );

        socket.on(
            "messageEdited",
            handleMessageEdited
        );

        socket.on(
            "messageDeleted",
            handleMessageDeleted
        );


        socket.on(
            "newMessage",
            handleNewMessage
        );


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

            socket.off(
                "messageEdited",
                handleMessageEdited
            );

            socket.off(
                "messageDeleted",
                handleMessageDeleted
            );

            socket.off(
                "typing",
                handleTyping
            );

            socket.off(
                "stopTyping",
                handleStopTyping
            );
        };

    }, [
        socket,
        selectedUser,
        axios,
        appendMessageIfNew
    ]);


    // Memoized context value
    const chatContextValue =
        useMemo(
            () => ({
                messages,
                setMessages,

                messagesLoading,
                messagesError,

                hasMoreMessages,
                loadingOlderMessages,

                users,
                usersLoading,
                usersError,

                selectedUser,
                setSelectedUser,

                unseenMessages,
                typingUserId,
                deleteMessage,
                searchMessages,

                getUsers,
                getMessages,
                loadOlderMessages,
                sendMessage,
                editMessage
            }),
            [
                messages,
                messagesLoading,
                messagesError,
                hasMoreMessages,
                loadingOlderMessages,
                users,
                usersLoading,
                usersError,
                selectedUser,
                unseenMessages,
                typingUserId,
                getUsers,
                getMessages,
                loadOlderMessages,
                sendMessage,
                deleteMessage,
                editMessage,
                searchMessages
            ]
        );


    return (
        <ChatContext.Provider
            value={chatContextValue}
        >
            {children}
        </ChatContext.Provider>
    );
};