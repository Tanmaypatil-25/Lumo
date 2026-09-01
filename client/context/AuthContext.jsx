import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";


const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(
        localStorage.getItem("token")
    );

    const [authUser, setAuthUser] = useState(null);

    const [authLoading, setAuthLoading] =
        useState(true);

    const [onlineUsers, setOnlineUsers] =
        useState([]);

    const [socket, setSocket] =
        useState(null);

    const [socketConnected, setSocketConnected] =
        useState(false);


    // Connect user to Socket.IO
    const connectSocket = useCallback(
        (userData, authToken) => {

            if (
                !userData ||
                !authToken ||
                socket
            ) {
                return;
            }

            const newSocket = io(
                backendUrl,
                {
                    auth: {
                        token: authToken
                    },

                    transports: [
                        "websocket"
                    ],

                    reconnection: true
                }
            );


            newSocket.on(
                "connect",
                () => {
                    setSocketConnected(true);

                    console.log(
                        "Socket connected:",
                        newSocket.id
                    );
                }
            );


            newSocket.on(
                "disconnect",
                (reason) => {
                    setSocketConnected(false);

                    setOnlineUsers([]);

                    console.log(
                        "Socket disconnected:",
                        reason
                    );
                }
            );


            newSocket.on(
                "connect_error",
                (error) => {
                    console.error(
                        "Socket connection error:",
                        error.message
                    );
                }
            );


            newSocket.on(
                "getOnlineUsers",
                (userIds) => {
                    setOnlineUsers(userIds);
                }
            );


            setSocket(newSocket);
        },
        [socket]
    );


    // Check whether stored token is still valid
    const checkAuth = useCallback(
        async () => {

            try {

                const { data } =
                    await axios.get(
                        "/api/auth/check"
                    );


                if (data.success) {

                    setAuthUser(data.user);

                    connectSocket(
                        data.user,
                        token
                    );
                }

            } catch (error) {

                localStorage.removeItem(
                    "token"
                );

                setToken(null);

                setAuthUser(null);

                setOnlineUsers([]);

                delete axios
                    .defaults
                    .headers
                    .common["Authorization"];

            } finally {

                setAuthLoading(false);
            }

        },
        [
            token,
            connectSocket
        ]
    );


    // Shared authentication function
    // Used for both login and signup endpoints
    const authenticate = useCallback(
        async (
            state,
            credentials
        ) => {

            try {

                const { data } =
                    await axios.post(
                        `/api/auth/${state}`,
                        credentials
                    );


                if (!data.success) {

                    toast.error(
                        data.message
                    );

                    return false;
                }


                setAuthUser(
                    data.userData
                );


                axios.defaults.headers.common[
                    "Authorization"
                ] = `Bearer ${data.token}`;


                setToken(
                    data.token
                );


                localStorage.setItem(
                    "token",
                    data.token
                );


                connectSocket(
                    data.userData,
                    data.token
                );


                toast.success(
                    data.message
                );


                return true;

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
        [connectSocket]
    );


    // Login user
    const login = useCallback(
        async (credentials) => {

            return authenticate(
                "login",
                credentials
            );

        },
        [authenticate]
    );


    // Signup user
    const signup = useCallback(
        async (credentials) => {

            return authenticate(
                "signup",
                credentials
            );

        },
        [authenticate]
    );


    // Logout user
    const logout = useCallback(
        () => {

            localStorage.removeItem(
                "token"
            );


            delete axios
                .defaults
                .headers
                .common["Authorization"];


            socket?.disconnect();


            setToken(null);

            setAuthUser(null);

            setOnlineUsers([]);

            setSocket(null);

            setSocketConnected(false);


            toast.success(
                "Logged out successfully"
            );

        },
        [socket]
    );


    // Update profile
    const updateProfile = useCallback(
        async (body) => {

            try {

                const { data } =
                    await axios.put(
                        "/api/auth/update-profile",
                        body
                    );


                if (data.success) {

                    setAuthUser(
                        data.user
                    );


                    toast.success(
                        "Profile updated successfully"
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
        []
    );


    // Restore authentication when app starts
    useEffect(() => {

        if (token) {

            axios.defaults.headers.common[
                "Authorization"
            ] = `Bearer ${token}`;


            checkAuth();

        } else {

            setAuthLoading(false);
        }

    }, [
        token,
        checkAuth
    ]);


    // Memoized context value
    const authContextValue =
        useMemo(
            () => ({
                axios,

                authUser,
                setAuthUser,

                token,

                onlineUsers,

                socket,
                socketConnected,

                authLoading,

                login,
                signup,
                logout,
                updateProfile
            }),
            [
                authUser,
                token,
                onlineUsers,
                socket,
                socketConnected,
                authLoading,
                login,
                signup,
                logout,
                updateProfile
            ]
        );


    return (
        <AuthContext.Provider
            value={authContextValue}
        >
            {children}
        </AuthContext.Provider>
    );
};