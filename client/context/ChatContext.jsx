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

    const [messagesLoading, setMessagesLoading] =
        useState(false);

    const [messageCursor, setMessageCursor] =
        useState(null);

    const [hasMoreMessages, setHasMoreMessages] =
        useState(true);

    const [loadingOlderMessages, setLoadingOlderMessages] =
        useState(false);


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

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );
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

                    toast.error(
                        error.response
                            ?.data
                            ?.message ||
                        error.message
                    );
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
                return;
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
                }

            } catch (error) {

                toast.error(
                    error.response
                        ?.data
                        ?.message ||
                    error.message
                );

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


    // Reset chat state after logout
    useEffect(() => {

        if (!authUser) {

            setMessages([]);

            setUsers([]);

            setSelectedUser(null);

            setUnseenMessages({});

            setMessagesLoading(false);

            setMessageCursor(null);

            setHasMoreMessages(true);

            setLoadingOlderMessages(false);

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


        const handleMessageSeen =
            (messageId) => {

                setMessages(
                    (prev) =>
                        prev.map(
                            (msg) =>
                                msg._id ===
                                    messageId

                                    ? {
                                        ...msg,
                                        seen: true
                                    }

                                    : msg
                        )
                );
            };


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

                hasMoreMessages,
                loadingOlderMessages,

                users,

                selectedUser,
                setSelectedUser,

                unseenMessages,
                setUnseenMessages,

                getUsers,
                getMessages,
                loadOlderMessages,
                sendMessage
            }),
            [
                messages,
                messagesLoading,
                hasMoreMessages,
                loadingOlderMessages,
                users,
                selectedUser,
                unseenMessages,
                getUsers,
                getMessages,
                loadOlderMessages,
                sendMessage
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