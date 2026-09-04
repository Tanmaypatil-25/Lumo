import { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import defaultAvatar from "../assets/branding/lumo-avatar-default.svg";
import lumoWordmark from "../assets/branding/lumo-wordmark.svg";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";

const Sidebar = () => {
    const {
        getUsers,
        users,
        usersLoading,
        usersError,
        selectedUser,
        setSelectedUser,
        unseenMessages,
    } = useContext(ChatContext);

    const { logout, onlineUsers } = useContext(AuthContext);

    const [input, setInput] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const navigate = useNavigate();

    const filteredUsers = useMemo(() => {
        const searchTerm = input.trim().toLowerCase();

        if (!searchTerm) {
            return users;
        }

        return users.filter((user) =>
            user.fullName?.toLowerCase().includes(searchTerm)
        );
    }, [users, input]);

    useEffect(() => {
        getUsers();
    }, [getUsers]);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [menuOpen]);

    return (
        <aside
            className={`relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/[0.07] bg-white/[0.025] backdrop-blur-2xl ${selectedUser ? "max-md:hidden" : ""
                }`}
        >
            {/* ================= HEADER ================= */}

            <div className="shrink-0 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedUser(null);
                            navigate("/");
                        }}
                        className="
    flex
    items-center
    rounded-xl
    transition-opacity
    hover:opacity-90
    active:scale-[0.98]
  "
                        aria-label="Go to Lumo home"
                    >
                        <img
                            src={lumoWordmark}
                            alt="Lumo"
                            className="
      h-10
      w-auto
      max-w-[160px]
      object-contain
      object-left
      sm:h-11
      sm:max-w-[175px]
    "
                        />
                    </button>

                    <div ref={menuRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((previous) => !previous)}
                            className="lumo-interactive flex h-9 w-9 items-center justify-center rounded-xl border border-transparent hover:border-white/[0.08] hover:bg-white/[0.06]"
                            aria-label="Open menu"
                            aria-expanded={menuOpen}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-[19px] w-[19px]"
                                aria-hidden="true"
                            >
                                <circle
                                    cx="12"
                                    cy="5"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="1.5"
                                    fill="currentColor"
                                />
                                <circle
                                    cx="12"
                                    cy="19"
                                    r="1.5"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 top-11 z-30 w-40 overflow-hidden rounded-2xl border border-white/[0.10] bg-[#17171D]/95 p-1.5 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:w-44">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate("/profile");
                                    }}
                                    className="lumo-interactive flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-[var(--lumo-text-secondary)] hover:text-white"
                                >
                                    Edit profile
                                </button>

                                <div className="mx-2 my-1 h-px bg-white/[0.07]" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        logout();
                                    }}
                                    className="lumo-interactive flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-red-300 hover:bg-red-400/[0.08] hover:text-red-200"
                                >
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= TITLE ================= */}

                <div className="mt-5 sm:mt-6">
                    <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-[var(--lumo-text-primary)] sm:text-xl">
                        Messages
                    </h1>

                    <p className="mt-1 text-[11px] leading-5 text-[var(--lumo-text-muted)] sm:text-xs">
                        Stay connected with your conversations
                    </p>
                </div>

                {/* ================= SEARCH ================= */}

                <div className="mt-4 flex h-11 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] pl-3.5 pr-2.5 transition-all duration-200 hover:bg-white/[0.055] focus-within:border-white/[0.12] focus-within:bg-white/[0.065] focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.06)] sm:mt-5 sm:pl-4">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="
    h-[18px]
    w-[18px]
    shrink-0
    text-zinc-500
  "
                        aria-hidden="true"
                    >
                        <circle
                            cx="11"
                            cy="11"
                            r="6.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                        />

                        <path
                            d="M16 16L20 20"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                        />
                    </svg>

                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        type="text"
                        placeholder="Search conversations"
                        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--lumo-text-primary)] outline-none placeholder:text-[var(--lumo-text-muted)]"
                    />

                    {input && (
                        <button
                            type="button"
                            onClick={() => setInput("")}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg font-light leading-none text-zinc-400 transition-all duration-200 hover:bg-white/[0.10] hover:text-white active:scale-90"
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* ================= CONVERSATIONS ================= */}

            <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-2.5 pb-4 sm:px-3">
                <div className="px-2 pb-2 pt-1">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--lumo-text-muted)]">
                        Conversations
                    </p>
                </div>

                {usersLoading && users.length === 0 && (
                    <div className="flex min-h-32 items-center justify-center">
                        <p className="text-sm text-[var(--lumo-text-muted)]">
                            Loading conversations...
                        </p>
                    </div>
                )}

                {!usersLoading && usersError && users.length === 0 && (
                    <div className="mx-2 flex min-h-36 flex-col items-center justify-center rounded-2xl border border-red-400/10 bg-red-400/[0.03] px-4 text-center">
                        <p className="text-sm text-red-300">
                            Couldn't load conversations.
                        </p>

                        <button
                            type="button"
                            onClick={getUsers}
                            className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white transition hover:bg-white/[0.08]"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!usersLoading && !usersError && users.length === 0 && (
                    <div className="flex min-h-32 items-center justify-center px-4 text-center">
                        <p className="text-sm text-[var(--lumo-text-muted)]">
                            No conversations available.
                        </p>
                    </div>
                )}

                {!usersLoading &&
                    !usersError &&
                    users.length > 0 &&
                    filteredUsers.length === 0 && (
                        <div className="flex min-h-32 items-center justify-center px-4 text-center">
                            <p className="text-sm text-[var(--lumo-text-muted)]">
                                No users match your search.
                            </p>
                        </div>
                    )}

                <div className="space-y-1">
                    {filteredUsers.map((user) => {
                        const isOnline = onlineUsers.includes(user._id);
                        const isSelected = selectedUser?._id === user._id;
                        const unreadCount = unseenMessages[user._id] || 0;

                        return (
                            <button
                                type="button"
                                key={user._id}
                                onClick={() => setSelectedUser(user)}
                                className={`lumo-interactive group relative flex w-full items-center gap-2.5 rounded-2xl border px-2.5 py-2.5 text-left sm:gap-3 sm:px-3 sm:py-3 ${isSelected
                                    ? "border-violet-400/20 bg-violet-500/[0.12]"
                                    : "border-transparent hover:border-white/[0.05] hover:bg-white/[0.045]"
                                    }`}
                            >
                                {/* Avatar */}

                                <div className="relative shrink-0">
                                    <img
                                        src={user?.profilePic || defaultAvatar}
                                        alt={user.fullName}
                                        className="h-10 w-10 rounded-full object-cover ring-1 ring-white/[0.08] sm:h-11 sm:w-11"
                                    />

                                    <span
                                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111116] ${isOnline
                                            ? "bg-[var(--lumo-success)]"
                                            : "bg-zinc-600"
                                            }`}
                                    />
                                </div>

                                {/* User information */}

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className={`truncate text-sm font-medium ${isSelected
                                                ? "text-white"
                                                : "text-[var(--lumo-text-primary)]"
                                                }`}
                                        >
                                            {user.fullName}
                                        </p>

                                        {unreadCount > 0 && (
                                            <span className="flex min-h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--lumo-primary)] px-1.5 text-[10px] font-semibold text-white shadow-lg shadow-violet-950/20">
                                                {unreadCount > 99 ? "99+" : unreadCount}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1 flex items-center gap-1.5">
                                        <span
                                            className={`text-xs ${isOnline
                                                ? "text-green-400"
                                                : "text-[var(--lumo-text-muted)]"
                                                }`}
                                        >
                                            {isOnline ? "Online" : "Offline"}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;