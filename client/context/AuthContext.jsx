import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    // Check if user is authenticated and if so, set the user data and connect the socket
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check");

            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user, token);
            }
        } catch (error) {
            localStorage.removeItem("token");
            setToken(null);
            setAuthUser(null);
            delete axios.defaults.headers.common["Authorization"];
        } finally {
            setAuthLoading(false);
        }
    }

    // Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);
            if (data.success) {
                setAuthUser(data.userData);
                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
                setToken(data.token);
                localStorage.setItem("token", data.token);
                connectSocket(data.userData, data.token);
                toast.success(data.message);
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    }

    // Logout function to handle user logout and socket disconnection
    const logout = () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUsers([]);
        delete axios.defaults.headers.common["Authorization"];
        socket?.disconnect();
        setSocket(null);
        setSocketConnected(false);
        toast.success("Logged out successfully");
    }

    // Update profile function to handle user profile updates
    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body);
            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
                return true;
            }

            return false;

        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
            return false;
        }
    }

    // connect socket function to handle socket connection and online users updates
    const connectSocket = (userData, authToken) => {
        if (!userData || !authToken || socket?.connected) {
            return;
        }
        const newSocket = io(backendUrl, {
            auth: {
                token: authToken
            },
            transports: ["websocket"],
            reconnection: true
        });

        newSocket.on("connect", () => {
            setSocketConnected(true);
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on("disconnect", (reason) => {
            setSocketConnected(false);
            setOnlineUsers([]);
            console.log("Socket disconnected:", reason);
        });

        newSocket.on("connect_error", (error) => {
            console.error(
                "Socket connection error:",
                error.message
            );
        });

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });

        setSocket(newSocket);

    }

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            checkAuth();
        } else {
            setAuthLoading(false);
        }
    }, []);

    const value = {
        axios,
        authUser,
        authLoading,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        socketConnected
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}