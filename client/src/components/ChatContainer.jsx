import { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES
} from "../constants/chat";

const ChatContainer = () => {

  const {
    messages,
    setMessages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    loadOlderMessages,
    hasMoreMessages,
    messagesLoading,
    messagesError,
    loadingOlderMessages,
    typingUserId,
    deleteMessage,
    editMessage,
    searchMessages
  } = useContext(ChatContext);

  const { authUser, onlineUsers, socket } = useContext(AuthContext)



  const messagesContainerRef = useRef(null);
  const scrollEnd = useRef();
  const typingTimeoutRef = useRef(null);
  const initialScrollDoneRef = useRef(false);
  const messageInputRef = useRef(null);
  const searchPanelRef = useRef(null);
  const searchButtonRef = useRef(null);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const [editingMessageId, setEditingMessageId] =
    useState(null);

  const [editInput, setEditInput] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const [searching, setSearching] =
    useState(false);

  const [hasSearched, setHasSearched] =
    useState(false);

  const [highlightedMessageId, setHighlightedMessageId] =
    useState(null);

  const [pendingMessageId, setPendingMessageId] =
    useState(null);

  const [navigatingToMessage, setNavigatingToMessage] =
    useState(false);

  const handleDeleteMessage = async (
    messageId
  ) => {

    const success =
      await deleteMessage(messageId);

    if (success) {
      toast.success(
        "Message deleted"
      );
    }
  };

  const startEditing = (message) => {
    setEditingMessageId(
      message._id
    );

    setEditInput(
      message.text || ""
    );
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditInput("");
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleSearchResultClick = async (
    messageId
  ) => {
    if (navigatingToMessage) {
      return;
    }

    const alreadyLoaded =
      messages.some(
        (message) =>
          message._id === messageId
      );

    if (alreadyLoaded) {
      setPendingMessageId(messageId);
      return;
    }

    try {
      setNavigatingToMessage(true);

      let canLoadMore = hasMoreMessages;
      let found = false;

      while (canLoadMore && !found) {

        const page =
          await loadOlderMessages();

        if (!page) {
          break;
        }

        found =
          page.messages.some(
            (message) =>
              message._id === messageId
          );

        canLoadMore = page.hasMore;
      }

      if (found) {
        setPendingMessageId(messageId);
      } else {
        toast.error(
          "Couldn't locate this message"
        );
      }

    } finally {
      setNavigatingToMessage(false);
    }
  };

  const handleEditMessage = async (
    messageId
  ) => {

    const cleanText =
      editInput.trim();

    if (!cleanText) {
      toast.error(
        "Message cannot be empty"
      );

      return;
    }

    const success =
      await editMessage(
        messageId,
        cleanText
      );

    if (success) {
      cancelEditing();

      toast.success(
        "Message edited"
      );
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;

    setInput(value);

    if (!socket || !selectedUser) {
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (!value.trim()) {
      socket.emit(
        "stopTyping",
        selectedUser._id
      );

      return;
    }

    socket.emit(
      "typing",
      selectedUser._id
    );

    typingTimeoutRef.current =
      setTimeout(() => {
        socket.emit(
          "stopTyping",
          selectedUser._id
        );
      }, 1500);
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    const cleanText = input.trim();

    if (!cleanText || sending) return;

    try {
      setSending(true);

      const formData = new FormData();
      formData.append("text", cleanText);

      const success = await sendMessage(formData);

      if (success) {
        setInput("");

        socket?.emit(
          "stopTyping",
          selectedUser._id
        );

        requestAnimationFrame(() => {
          messageInputRef.current?.focus();
        });
      }
    } finally {
      setSending(false);
    }
  };

  // Handle scrolling
  const handleScroll = async () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    if (!initialScrollDoneRef.current) {
      return;
    }

    if (
      container.scrollTop <= 50 &&
      hasMoreMessages &&
      !messagesLoading &&
      !loadingOlderMessages
    ) {
      const previousScrollHeight =
        container.scrollHeight;

      await loadOlderMessages();

      requestAnimationFrame(() => {
        const newScrollHeight =
          container.scrollHeight;

        container.scrollTop =
          newScrollHeight -
          previousScrollHeight;
      });
    }
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files?.[0];

    if (!file || sending) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG and WebP images are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image must be smaller than 2 MB");
      e.target.value = "";
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      if (input.trim()) {
        formData.append("text", input.trim());
      }

      formData.append("image", file);

      const success = await sendMessage(formData);

      if (success) {
        setInput("");
        e.target.value = "";

        socket?.emit(
          "stopTyping",
          selectedUser._id
        );

        requestAnimationFrame(() => {
          messageInputRef.current?.focus();
        });
      }
    } finally {
      setSending(false);
    }
  };

  const retryMessages = () => {
    if (!selectedUser) return;

    const controller = new AbortController();

    getMessages(
      selectedUser._id,
      controller.signal
    );
  };

  useEffect(() => {
    if (selectedUser && !messagesLoading) {
      messageInputRef.current?.focus();
    }
  }, [selectedUser, messagesLoading]);


  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    initialScrollDoneRef.current = false;

    setMessages([]);

    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);

    const controller = new AbortController();

    getMessages(
      selectedUser._id,
      controller.signal
    );

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current
        );

        typingTimeoutRef.current = null;
      }

      socket?.emit(
        "stopTyping",
        selectedUser._id
      );

      controller.abort();
    };

  }, [
    selectedUser,
    setMessages,
    getMessages,
    socket
  ]);

  useEffect(() => {
    if (!searchOpen || !selectedUser) {
      return;
    }

    const cleanQuery = searchQuery.trim();

    if (!cleanQuery) {
      setSearchResults([]);
      setSearching(false);
      setHasSearched(false);
      return;
    }

    let cancelled = false;

    setSearching(true);
    setHasSearched(false);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchMessages(
          selectedUser._id,
          cleanQuery
        );

        if (!cancelled) {
          setSearchResults(
            Array.isArray(results) ? results : []
          );
          setHasSearched(true);
        }
      } catch {
        if (!cancelled) {
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearching(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [
    searchQuery,
    searchOpen,
    selectedUser?._id,
    searchMessages
  ]);

  useEffect(() => {
    if (!pendingMessageId) {
      return;
    }

    const messageExists =
      messages.some(
        (message) =>
          message._id === pendingMessageId
      );

    if (!messageExists) {
      return;
    }

    const messageId = pendingMessageId;

    // Close search
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);

    // Highlight target
    setHighlightedMessageId(messageId);

    // Clear pending navigation
    setPendingMessageId(null);

    // Wait until React has rendered the message
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const messageElement =
          document.getElementById(
            `message-${messageId}`
          );

        messageElement?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      });
    });

    // Remove highlight after 2 seconds
    setTimeout(() => {
      setHighlightedMessageId(
        (currentId) =>
          currentId === messageId
            ? null
            : currentId
      );
    }, 2000);

  }, [
    pendingMessageId,
    messages
  ]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handleClickOutsideSearch = (event) => {
      const clickedInsidePanel =
        searchPanelRef.current?.contains(event.target);

      const clickedSearchButton =
        searchButtonRef.current?.contains(event.target);

      if (
        !clickedInsidePanel &&
        !clickedSearchButton
      ) {
        closeSearch();
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutsideSearch
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutsideSearch
      );
    };
  }, [searchOpen]);

  useEffect(() => {
    if (
      scrollEnd.current &&
      messages.length > 0 &&
      !loadingOlderMessages
    ) {

      scrollEnd.current.scrollIntoView({
        behavior:
          initialScrollDoneRef.current
            ? "smooth"
            : "auto"
      });

      initialScrollDoneRef.current = true;
    }
  }, [messages.length, loadingOlderMessages]);

  return selectedUser ? (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white/[0.012]">
      {/* ================= CHAT HEADER ================= */}

      <header className="relative z-20 flex h-[76px] shrink-0 items-center gap-3 border-b border-white/[0.07] bg-white/[0.018] px-5 backdrop-blur-xl">

        {/* Mobile back button */}
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="lumo-interactive mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07] hover:text-white active:scale-95 md:hidden"
          aria-label="Back to conversations"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[21px] w-[21px]"
            aria-hidden="true"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* User avatar */}
        <div className="relative shrink-0">
          <img
            src={
              selectedUser.profilePic ||
              assets.avatar_icon
            }
            alt={selectedUser.fullName}
            className="h-11 w-11 rounded-full object-cover ring-1 ring-white/[0.10]"
          />

          {onlineUsers.includes(selectedUser._id) && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111116] bg-[var(--lumo-success)]" />
          )}
        </div>

        {/* User information */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[var(--lumo-text-primary)]">
            {selectedUser.fullName}
          </p>

          <div className="mt-0.5 flex h-4 items-center">
            {typingUserId === selectedUser._id ? (
              <span className="text-xs font-medium text-violet-300">
                typing...
              </span>
            ) : (
              <span
                className={`text-xs ${onlineUsers.includes(selectedUser._id)
                  ? "text-green-400"
                  : "text-[var(--lumo-text-muted)]"
                  }`}
              >
                {onlineUsers.includes(selectedUser._id)
                  ? "Online"
                  : "Offline"}
              </span>
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex shrink-0 items-center gap-1">

          <button
            type="button"
            ref={searchButtonRef}
            onClick={() =>
              setSearchOpen((current) => !current)
            }
            className={`lumo-interactive flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${searchOpen
              ? "border-violet-400/20 bg-violet-500/[0.12]"
              : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.05]"
              }`}
            aria-label="Search messages"
            aria-expanded={searchOpen}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[18px] w-[18px] text-zinc-300"
              aria-hidden="true"
            >
              <path
                d="M21 21L16.65 16.65M19 11A8 8 0 1 1 3 11A8 8 0 0 1 19 11Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="lumo-interactive hidden h-10 w-10 items-center justify-center rounded-xl border border-transparent hover:border-white/[0.07] hover:bg-white/[0.05] md:flex"
            aria-label="Conversation information"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-[19px] w-[19px] text-zinc-300"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.8"
              />

              <path
                d="M12 11V16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />

              <circle
                cx="12"
                cy="8"
                r="1"
                fill="currentColor"
              />
            </svg>
          </button>

        </div>
      </header>

      {/* Search utility */}
      {searchOpen && (
        <section
          ref={searchPanelRef}
          className="relative z-10 shrink-0 border-b border-white/[0.06] bg-white/[0.018] px-4 py-3 backdrop-blur-xl md:px-5"
        >

          {/* 1. SEARCH INPUT ROW */}
          <div className="flex items-center gap-2">

            <div className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.04] pl-4 pr-2 transition-all duration-200 focus-within:border-white/[0.12] focus-within:bg-white/[0.06]">

              {/* Search icon */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[17px] w-[17px] shrink-0 text-zinc-500"
                aria-hidden="true"
              >
                <path
                  d="M21 21L16.65 16.65M19 11A8 8 0 1 1 3 11A8 8 0 0 1 19 11Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                }}
                placeholder="Search in conversation"
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--lumo-text-primary)] outline-none placeholder:text-[var(--lumo-text-muted)]"
                autoFocus
              />

              {/* Clear input */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                  aria-label="Clear search"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M7 7L17 17M17 7L7 17"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Close entire search */}
            <button
              type="button"
              onClick={closeSearch}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-zinc-400 transition hover:bg-white/[0.06] hover:text-white active:scale-95"
              aria-label="Close search"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[19px] w-[19px]"
                aria-hidden="true"
              >
                <path
                  d="M7 7L17 17M17 7L7 17"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

          </div>

          {/* 2. SEARCHING STATE — ADD IT HERE */}
          {searching && searchQuery.trim() && (
            <div className="flex items-center gap-2 px-1 pt-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5 animate-spin text-zinc-500"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-20"
                />

                <path
                  d="M21 12A9 9 0 0 0 12 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <p className="text-xs text-[var(--lumo-text-muted)]">
                Searching...
              </p>
            </div>
          )}

          {/* 3. NO RESULTS STATE */}
          {searchQuery.trim() &&
            hasSearched &&
            !searching &&
            searchResults.length === 0 && (
              <div className="px-1 pt-3">
                <p className="text-xs text-[var(--lumo-text-muted)]">
                  No matching messages
                </p>
              </div>
            )}

          {/* 4. SEARCH RESULTS */}
          {searchResults.map((message) => (
            <button
              key={message._id}
              type="button"
              onClick={() =>
                handleSearchResultClick(
                  message._id
                )
              }
              disabled={navigatingToMessage}
              className="block w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-200 hover:bg-white/[0.045] disabled:cursor-wait disabled:opacity-60"
            >
              <p className="break-words text-sm leading-5 text-[var(--lumo-text-primary)]">
                {message.text}
              </p>

              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--lumo-text-muted)]">
                <span>
                  {message.senderId === authUser._id
                    ? "You"
                    : selectedUser.fullName}
                </span>

                <span>•</span>

                <span>
                  {formatMessageTime(message.createdAt)}
                </span>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* ------ chat_area ------ */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6"
      >
        {loadingOlderMessages && (
          <p className="text-center text-xs text-gray-400 py-2">
            Loading older messages...
          </p>
        )}

        {messagesLoading && messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-gray-400">
              Loading messages...
            </p>
          </div>
        ) : messagesError && messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <p className="text-sm text-red-300 text-center">
              Couldn&apos;t load this conversation.
            </p>

            <button
              type="button"
              onClick={retryMessages}
              className="text-xs text-violet-300 hover:text-violet-200"
            >
              Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-300">
              No messages yet
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Send a message to start the conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              id={`message-${msg._id}`}
              key={msg._id}
              className={`flex items-end gap-2 justify-end rounded-2xl px-2 py-1 transition-all duration-500 ${msg.senderId !== authUser._id
                ? "flex-row-reverse"
                : ""
                } ${highlightedMessageId === msg._id
                  ? "bg-violet-500/[0.14] ring-1 ring-violet-400/25"
                  : "bg-transparent"
                }`}
            >
              {msg.image ? (
                <img
                  src={msg.image}
                  className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'
                  alt=""
                />
              ) : editingMessageId === msg._id ? (
                <div className="mb-8">
                  <input
                    type="text"
                    value={editInput}
                    onChange={(e) => setEditInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleEditMessage(msg._id);
                      }

                      if (e.key === "Escape") {
                        cancelEditing();
                      }
                    }}
                    className="p-2 text-sm rounded bg-gray-700 text-white outline-none"
                    autoFocus
                  />

                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleEditMessage(msg._id)}
                      className="text-xs text-green-400"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id
                    ? "rounded-br-none"
                    : "rounded-bl-none"
                    }`}
                >
                  {msg.text}

                  {msg.edited && (
                    <span className="ml-1 text-[10px] text-gray-400">
                      (edited)
                    </span>
                  )}
                </p>
              )}

              <div className='text-center text-xs'>
                <img
                  src={
                    msg.senderId === authUser._id
                      ? authUser?.profilePic || assets.avatar_icon
                      : selectedUser?.profilePic || assets.avatar_icon
                  }
                  className='w-7 rounded-full'
                  alt=""
                />

                <div className="text-gray-500">
                  <p>
                    {formatMessageTime(
                      msg.createdAt
                    )}
                  </p>

                  {msg.senderId === authUser._id && msg.text && (
                    <button
                      type="button"
                      onClick={() => startEditing(msg)}
                      className="text-xs text-blue-400 hover:text-blue-300 mr-2"
                    >
                      Edit
                    </button>
                  )}

                  {msg.senderId === authUser._id && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteMessage(
                          msg._id
                        )
                      }
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  )}

                  {msg.senderId === authUser._id && (
                    <p className="text-[10px] mt-1">
                      {msg.seen
                        ? "Seen"
                        : "Sent"}
                    </p>
                  )}
                </div>
              </div>

            </div>
          ))
        )}

        <div ref={scrollEnd}></div>

      </div>

      {/* ------- bottom search area ------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input ref={messageInputRef} onChange={handleInputChange} value={input} disabled={sending} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/jpeg,image/png,image/webp"
            disabled={sending}
            hidden
          />
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img
          onClick={sending ? undefined : handleSendMessage}
          src={assets.send_button}
          alt="Send"
          className={`w-7 ${sending
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
            }`}
        />
      </div>

    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} className='max-w-16' alt="" />
      <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
    </div>
  )
}

export default ChatContainer