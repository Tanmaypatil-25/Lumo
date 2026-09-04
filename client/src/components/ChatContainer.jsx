import { useContext, useEffect, useRef, useState } from 'react'
import defaultAvatar from "../assets/branding/lumo-avatar-default.svg";
import lumoMark from "../assets/branding/lumo-mark.svg";
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import {
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES
} from "../constants/chat";

const ChatContainer = ({
  detailsOpen,
  onToggleDetails
}) => {

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
  const [image, setImage] = useState(null);

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

  const [messageToDelete, setMessageToDelete] = useState(null);

  const [imagePreview, setImagePreview] = useState("");

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
  const handleSendMessage = async () => {
    const cleanText = input.trim();

    if ((!cleanText && !image) || sending) {
      return;
    }

    try {
      setSending(true);

      const formData = new FormData();

      if (cleanText) {
        formData.append("text", cleanText);
      }

      if (image) {
        formData.append("image", image);
      }

      const success =
        await sendMessage(formData);

      if (success) {
        setInput("");
        setImage(null);

        socket?.emit(
          "stopTyping",
          selectedUser._id
        );

        if (messageInputRef.current) {
          messageInputRef.current.style.height =
            "auto";
        }

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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    // Allow selecting the same image again later
    e.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        "Only JPEG, PNG and WebP images are allowed"
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(
        "Image must be smaller than 2 MB"
      );
      return;
    }

    setImage(file);
  };

  const handlePaste = (e) => {
    const items = Array.from(
      e.clipboardData?.items || []
    );

    const imageItem = items.find(
      (item) =>
        item.kind === "file" &&
        item.type.startsWith("image/")
    );

    if (!imageItem) {
      return;
    }

    const file = imageItem.getAsFile();

    if (!file) {
      return;
    }

    e.preventDefault();

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(
        "Only JPEG, PNG and WebP images are allowed"
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(
        "Image must be smaller than 2 MB"
      );
      return;
    }

    setImage(file);
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
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl =
      URL.createObjectURL(image);

    setImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [image]);

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
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-white/[0.012]">
      {/* ================= CHAT HEADER ================= */}

      <header className="relative z-20 flex h-[72px] shrink-0 items-center gap-2 border-b border-white/[0.07] bg-white/[0.018] px-3 backdrop-blur-xl md:h-[76px] md:gap-3 md:px-5">

        {/* Mobile back button */}
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="lumo-interactive flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 hover:bg-white/[0.07] hover:text-white active:scale-95 md:hidden"
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
              defaultAvatar
            }
            alt={selectedUser.fullName}
            className="h-10 w-10 rounded-full object-cover ring-1 ring-white/[0.10] md:h-11 md:w-11"
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
        <div className="flex shrink-0 items-center gap-0.5 md:gap-1">

          <button
            type="button"
            ref={searchButtonRef}
            onClick={() =>
              setSearchOpen((current) => !current)
            }
            className={`lumo-interactive flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 md:h-10 md:w-10 ${searchOpen
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
            onClick={onToggleDetails}
            className={`
    lumo-interactive
    flex
    h-9
    w-9
    items-center
    md:h-10
    md:w-10
    justify-center
    rounded-xl
    border
    transition-all
    duration-200
    ${detailsOpen
                ? "border-violet-400/20 bg-violet-500/[0.12]"
                : "border-transparent hover:border-white/[0.07] hover:bg-white/[0.05]"
              }
  `}
            aria-label={
              detailsOpen
                ? "Close conversation information"
                : "Open conversation information"
            }
            aria-expanded={detailsOpen}
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
        className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4 md:px-6 md:py-5"
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
          messages.map((msg, index) => {
            const isOwnMessage =
              msg.senderId === authUser._id;

            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];

            const isSameSenderAsPrevious =
              previousMessage &&
              previousMessage.senderId === msg.senderId;

            const isSameSenderAsNext =
              nextMessage &&
              nextMessage.senderId === msg.senderId;

            const isFirstInGroup =
              !isSameSenderAsPrevious;

            const isLastInGroup =
              !isSameSenderAsNext;

            return (
              <div
                id={`message-${msg._id}`}
                key={msg._id}
                className={`group flex w-full px-1 transition-all duration-500 ${isOwnMessage
                  ? "justify-end"
                  : "justify-start"
                  } ${isFirstInGroup
                    ? "pt-3"
                    : "pt-0.5"
                  } ${isLastInGroup
                    ? "pb-2"
                    : "pb-0.5"
                  } ${highlightedMessageId === msg._id
                    ? "rounded-2xl bg-violet-500/[0.14] ring-1 ring-violet-400/25"
                    : "bg-transparent"
                  }`}
              >
                <div
                  className={`flex max-w-[88%] items-end gap-2 md:max-w-[72%] md:gap-2.5 ${isOwnMessage
                    ? "flex-row-reverse"
                    : "flex-row"
                    }`}
                >

                  {/* Avatar */}
                  <div className="mb-5 w-7 shrink-0">
                    {isLastInGroup ? (
                      <img
                        src={
                          isOwnMessage
                            ? authUser?.profilePic ||
                            defaultAvatar
                            : selectedUser?.profilePic ||
                            defaultAvatar
                        }
                        alt=""
                        className="h-7 w-7 rounded-full object-cover ring-1 ring-white/[0.08]"
                      />
                    ) : (
                      <div className="h-7 w-7" />
                    )}
                  </div>

                  {/* Message content */}
                  <div
                    className={`relative flex min-w-0 flex-col ${isOwnMessage
                      ? "items-end"
                      : "items-start"
                      }`}
                  >

                    {/* IMAGE MESSAGE */}
                    {msg.image ? (
                      <div
                        className={`relative overflow-hidden rounded-[20px] border p-1.5 transition-all duration-200 ${isOwnMessage
                          ? `
    ${isFirstInGroup && isLastInGroup
                            ? "rounded-[20px] rounded-br-[6px]"
                            : isFirstInGroup
                              ? "rounded-[20px] rounded-br-[10px]"
                              : isLastInGroup
                                ? "rounded-[20px] rounded-tr-[10px] rounded-br-[6px]"
                                : "rounded-[20px] rounded-tr-[10px] rounded-br-[10px]"
                          }
    border-violet-300/[0.14]
    bg-gradient-to-br
    from-violet-500/[0.24]
    via-violet-500/[0.16]
    to-indigo-500/[0.12]
    shadow-[0_8px_28px_rgba(76,29,149,0.14)]
  `
                          : `
    ${isFirstInGroup && isLastInGroup
                            ? "rounded-[20px] rounded-bl-[6px]"
                            : isFirstInGroup
                              ? "rounded-[20px] rounded-bl-[10px]"
                              : isLastInGroup
                                ? "rounded-[20px] rounded-tl-[10px] rounded-bl-[6px]"
                                : "rounded-[20px] rounded-tl-[10px] rounded-bl-[10px]"
                          }
    border-white/[0.09]
    bg-gradient-to-br
    from-white/[0.075]
    via-white/[0.055]
    to-white/[0.035]
    shadow-[0_8px_24px_rgba(0,0,0,0.10)]
  `
                          }`}
                      >

                        {/* Glass highlight */}
                        <div
                          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px ${isOwnMessage
                            ? "bg-gradient-to-r from-transparent via-violet-200/30 to-transparent"
                            : "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            }`}
                        />

                        {/* Image */}
                        <div className="overflow-hidden rounded-[15px]">
                          <img
                            src={msg.image}
                            alt="Shared media"
                            className="
          block
          max-h-[380px]
          w-full
          max-w-full
          object-cover
          md:max-w-[320px]
          transition-transform
          duration-300
          hover:scale-[1.015]
        "
                          />
                        </div>

                        {/* EDIT IMAGE CAPTION */}
                        {editingMessageId === msg._id ? (
                          <div className="px-2 pb-2 pt-2.5">

                            <input
                              type="text"
                              value={editInput}
                              onChange={(e) =>
                                setEditInput(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleEditMessage(msg._id);
                                }

                                if (e.key === "Escape") {
                                  cancelEditing();
                                }
                              }}
                              placeholder="Edit caption"
                              className="
            w-full
            rounded-xl
            border
            border-white/[0.10]
            bg-black/20
            px-3
            py-2
            text-sm
            text-white
            outline-none
            transition
            placeholder:text-zinc-500
            focus:border-violet-400/30
            focus:bg-black/25
          "
                              autoFocus
                            />

                            <div className="mt-2 flex justify-end gap-3 px-1">

                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="text-xs text-zinc-400 transition hover:text-white"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleEditMessage(msg._id)
                                }
                                className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                              >
                                Save
                              </button>

                            </div>
                          </div>
                        ) : (
                          msg.text && (
                            <p
                              className={`max-w-full whitespace-pre-wrap break-words px-2.5 pb-2 pt-2.5 text-[14px] leading-[1.5] md:max-w-[320px] ${isOwnMessage
                                ? "text-zinc-50"
                                : "text-zinc-200"
                                }`}
                            >
                              {msg.text}
                            </p>
                          )
                        )}

                      </div>

                    ) : editingMessageId === msg._id ? (

                      /* NORMAL TEXT EDITING */
                      <div className="min-w-[180px] rounded-2xl border border-white/[0.08] bg-white/[0.05] p-2 sm:min-w-[220px]">

                        <input
                          type="text"
                          value={editInput}
                          onChange={(e) =>
                            setEditInput(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleEditMessage(msg._id);
                            }

                            if (e.key === "Escape") {
                              cancelEditing();
                            }
                          }}
                          className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-white/[0.14]"
                          autoFocus
                        />

                        <div className="mt-2 flex justify-end gap-3 px-1">

                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="text-xs text-zinc-400 transition hover:text-white"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEditMessage(msg._id)
                            }
                            className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                          >
                            Save
                          </button>

                        </div>
                      </div>

                    ) : (

                      /* NORMAL TEXT MESSAGE */
                      <div
                        className={`relative max-w-full overflow-hidden rounded-[20px] px-4 py-2.5 text-[14px] leading-[1.5] transition-all duration-200 ${isOwnMessage
                          ? `
    ${isFirstInGroup && isLastInGroup
                            ? "rounded-[20px] rounded-br-[6px]"
                            : isFirstInGroup
                              ? "rounded-[20px] rounded-br-[10px]"
                              : isLastInGroup
                                ? "rounded-[20px] rounded-tr-[10px] rounded-br-[6px]"
                                : "rounded-[20px] rounded-tr-[10px] rounded-br-[10px]"
                          }
    border border-violet-300/[0.14]
    bg-gradient-to-br
    from-violet-500/[0.28]
    via-violet-500/[0.20]
    to-indigo-500/[0.16]
    text-zinc-50
    shadow-[0_8px_28px_rgba(76,29,149,0.14)]
  `
                          : `
    ${isFirstInGroup && isLastInGroup
                            ? "rounded-[20px] rounded-bl-[6px]"
                            : isFirstInGroup
                              ? "rounded-[20px] rounded-bl-[10px]"
                              : isLastInGroup
                                ? "rounded-[20px] rounded-tl-[10px] rounded-bl-[6px]"
                                : "rounded-[20px] rounded-tl-[10px] rounded-bl-[10px]"
                          }
    border border-white/[0.09]
    bg-gradient-to-br
    from-white/[0.075]
    via-white/[0.055]
    to-white/[0.035]
    text-zinc-200
    shadow-[0_8px_24px_rgba(0,0,0,0.10)]
  `
                          }`}
                      >

                        <div
                          className={`pointer-events-none absolute inset-x-0 top-0 h-px ${isOwnMessage
                            ? "bg-gradient-to-r from-transparent via-violet-200/25 to-transparent"
                            : "bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            }`}
                        />

                        <p className="relative whitespace-pre-wrap break-words">
                          {msg.text}
                        </p>

                      </div>
                    )}

                    {/* MESSAGE META */}
                    <div
                      className={`mt-1 flex min-h-[16px] items-center gap-1.5 px-1 text-[10px] font-medium tracking-[0.01em] text-zinc-500 ${isOwnMessage
                        ? "justify-end"
                        : "justify-start"
                        }`}
                    >
                      <span>
                        {formatMessageTime(
                          msg.createdAt
                        )}
                      </span>

                      {msg.edited && (
                        <>
                          <span>•</span>
                          <span>Edited</span>
                        </>
                      )}

                      {isOwnMessage && (
                        <>
                          <span>•</span>

                          {msg.seen ? (
                            <span className="flex items-center gap-1 text-violet-300/80">
                              <svg
                                viewBox="0 0 20 20"
                                fill="none"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M2.5 10.5L6 14L12.5 7.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                <path
                                  d="M8 13.5L9.5 15L17 7.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>

                              Seen
                            </span>
                          ) : (
                            <span className="text-zinc-500">
                              Sent
                            </span>
                          )}
                        </>
                      )}
                    </div>


                    {/* MESSAGE ACTIONS */}
                    {isOwnMessage && (
                      <div
                        className="
      pointer-events-none
      absolute
      right-full
      top-1/2
      z-20
      mr-2
      -translate-y-1/2
      opacity-0
      transition-all
      duration-200
      group-hover:pointer-events-auto
      group-hover:opacity-100
    "
                      >
                        <div
                          className="
        flex
        items-center
        gap-0.5
        rounded-xl
        border
        border-white/[0.08]
        bg-[#17171D]/95
        p-1
        shadow-[0_8px_30px_rgba(0,0,0,0.28)]
        backdrop-blur-xl
      "
                        >

                          {/* EDIT */}
                          {msg.text && (
                            <button
                              type="button"
                              onClick={() => startEditing(msg)}
                              className="
            lumo-interactive
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            text-zinc-400
            transition
            hover:bg-white/[0.07]
            hover:text-zinc-100
            active:scale-95
          "
                              aria-label="Edit message"
                              title="Edit message"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                className="h-[16px] w-[16px]"
                                aria-hidden="true"
                              >
                                <path
                                  d="M13.5 6.5L17.5 10.5"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                />

                                <path
                                  d="M4.5 19.5L8.3 18.7L18.2 8.8C19 8 19 6.8 18.2 6L18 5.8C17.2 5 16 5 15.2 5.8L5.3 15.7L4.5 19.5Z"
                                  stroke="currentColor"
                                  strokeWidth="1.7"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}

                          {/* DELETE */}
                          <button
                            type="button"
                            onClick={() => setMessageToDelete(msg)}
                            className="
          lumo-interactive
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-zinc-400
          transition
          hover:bg-red-500/[0.08]
          hover:text-red-300
          active:scale-95
        "
                            aria-label="Delete message"
                            title="Delete message"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              className="h-[16px] w-[16px]"
                              aria-hidden="true"
                            >
                              <path
                                d="M8 8V18"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />

                              <path
                                d="M12 8V18"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />

                              <path
                                d="M16 8V18"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />

                              <path
                                d="M5 6H19"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />

                              <path
                                d="M9 6L10 4H14L15 6"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M7 6L8 20H16L17 6"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={scrollEnd}></div>

      </div>

      {/* DELETE MESSAGE CONFIRMATION */}
      {messageToDelete && (
        <div
          className="
      absolute
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/45
      px-4
      backdrop-blur-[3px]
    "
          onMouseDown={() =>
            setMessageToDelete(null)
          }
        >
          <div
            className="
        w-full
        max-w-[360px]
        rounded-[22px]
        border
        border-white/[0.09]
        bg-[#18181E]/95
        p-5
        shadow-[0_24px_80px_rgba(0,0,0,0.45)]
        backdrop-blur-2xl
      "
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            {/* Icon */}
            <div
              className="
          mb-4
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-2xl
          bg-red-500/[0.10]
          text-red-300
        "
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  d="M5 6H19"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <path
                  d="M9 6L10 4H14L15 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 6L8 20H16L17 6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <path
                  d="M10 10V16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />

                <path
                  d="M14 10V16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <h3 className="text-[16px] font-semibold text-zinc-100">
              Delete message?
            </h3>

            <p className="mt-1.5 text-[13px] leading-5 text-zinc-400">
              This message will be permanently deleted
              for everyone in this conversation.
            </p>

            {/* Preview */}
            {(messageToDelete.text ||
              messageToDelete.image) && (
                <div
                  className="
            mt-4
            max-h-[90px]
            overflow-hidden
            rounded-xl
            border
            border-white/[0.06]
            bg-white/[0.035]
            px-3
            py-2.5
          "
                >
                  {messageToDelete.image && (
                    <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="16"
                          rx="3"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />

                        <path
                          d="M3 16L8 11L12 15L15 12L21 18"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>

                      Image
                    </div>
                  )}

                  {messageToDelete.text && (
                    <p className="truncate text-[13px] text-zinc-300">
                      {messageToDelete.text}
                    </p>
                  )}
                </div>
              )}

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-2">

              <button
                type="button"
                onClick={() =>
                  setMessageToDelete(null)
                }
                className="
            lumo-interactive
            rounded-xl
            px-4
            py-2
            text-sm
            font-medium
            text-zinc-300
            transition
            hover:bg-white/[0.06]
            hover:text-white
          "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  const messageId =
                    messageToDelete._id;

                  setMessageToDelete(null);

                  await handleDeleteMessage(
                    messageId
                  );
                }}
                className="
            lumo-interactive
            rounded-xl
            bg-red-500/[0.12]
            px-4
            py-2
            text-sm
            font-medium
            text-red-300
            transition
            hover:bg-red-500/[0.18]
            hover:text-red-200
            active:scale-[0.98]
          "
              >
                Delete
              </button>

            </div>
          </div>
        </div>
      )}

      {/* MESSAGE COMPOSER */}
      <div
        className="
    relative
    z-20
    shrink-0
    border-t
    border-white/[0.06]
    bg-[#0f0f14]/80
    px-3
    py-3
    backdrop-blur-2xl
    md:px-5
  "
      >

        {/* IMAGE PREVIEW */}
        {image && (
          <div
            className="
        mb-3
        flex
        items-center
        gap-3
        rounded-2xl
        border
        border-white/[0.08]
        bg-white/[0.035]
        p-2
      "
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
              <img
                src={imagePreview}
                alt="Selected attachment"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">
                Image selected
              </p>

              <p className="mt-0.5 text-xs text-zinc-500">
                Add a caption or send directly
              </p>
            </div>

            <button
              type="button"
              onClick={() => setImage(null)}
              className="
          lumo-interactive
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          text-zinc-500
          transition
          hover:bg-white/[0.06]
          hover:text-zinc-200
          active:scale-95
        "
              aria-label="Remove image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px]"
                aria-hidden="true"
              >
                <path
                  d="M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />

                <path
                  d="M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">

          {/* MAIN INPUT SURFACE */}
          <div
            className="
        flex
        min-w-0
        flex-1
        items-end
        rounded-[22px]
        border
        border-white/[0.08]
        bg-white/[0.045]
        px-1.5
py-1
md:px-2
md:py-2
        shadow-[0_10px_35px_rgba(0,0,0,0.12)]
        transition
        focus-within:border-violet-400/[0.18]
        focus-within:bg-white/[0.055]
      "
          >

            {/* ATTACH IMAGE */}
            <input
              type="file"
              id="message-image"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={handleImageSelect}
            />

            <label
              htmlFor={sending ? undefined : "message-image"}
              className={`
  lumo-interactive
  flex
  h-10
  w-10
  shrink-0
  items-center
  justify-center
  rounded-xl
  text-zinc-500
  transition
  hover:bg-white/[0.06]
  hover:text-zinc-200
  active:scale-95
  ${sending
                  ? "pointer-events-none cursor-not-allowed opacity-40"
                  : "cursor-pointer"
                }
`}
              aria-label="Attach image"
              title="Attach image"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[20px] w-[20px]"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="16"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />

                <circle
                  cx="8.5"
                  cy="9"
                  r="1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                <path
                  d="M3.5 17L8.5 12L12.5 16L15.5 13L20.5 18"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </label>

            {/* MESSAGE INPUT */}
            <textarea
              ref={messageInputRef}
              rows={1}
              value={input}
              onPaste={handlePaste}
              onChange={(e) => {
                handleInputChange(e);

                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(
                  e.target.scrollHeight,
                  120
                )}px`;
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();

                  if (!sending) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder="Message..."
              disabled={sending}
              className="max-h-[120px] min-h-[40px] min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5
                          text-[14px]
                          leading-5
                          text-zinc-100
                          outline-none
                          placeholder:text-zinc-600
                          disabled:cursor-not-allowed
                          disabled:opacity-60"
            />

          </div>

          {/* SEND BUTTON */}
          <button
            type="button"
            onClick={handleSendMessage}
            disabled={
              sending ||
              (!input.trim() && !image)
            }
            className="
        lumo-interactive
        flex
        h-11
w-11
md:h-12
md:w-12
        shrink-0
        items-center
        justify-center
        rounded-[15px]
        border
        border-violet-300/[0.12]
        bg-gradient-to-br
        from-violet-500
        to-indigo-500
        text-white
        shadow-[0_8px_28px_rgba(109,40,217,0.22)]
        transition
        hover:brightness-110
        active:scale-95
        disabled:cursor-not-allowed
        disabled:border-white/[0.05]
        disabled:bg-none
        disabled:bg-white/[0.05]
        disabled:text-zinc-600
        disabled:shadow-none
      "
            aria-label="Send message"
          >
            {sending ? (
              <svg
                viewBox="0 0 24 24"
                className="h-[19px] w-[19px] animate-spin"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-20"
                />

                <path
                  d="M20 12A8 8 0 0 0 12 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-[19px] w-[19px]"
                aria-hidden="true"
              >
                <path
                  d="M4 5L20 12L4 19L7 12L4 5Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />

                <path
                  d="M7 12H20"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

        </div>

        <div className="mt-1.5 hidden px-2 sm:block">
          <p className="text-[10px] text-zinc-600">
            Enter to send • Shift + Enter for a new line
          </p>
        </div>
      </div>

    </div>
  ) : (
    <div
      className="
        relative
        hidden
        h-full
        min-h-0
        min-w-0
        flex-1
        flex-col
        items-center
        justify-center
        overflow-hidden
        bg-white/[0.012]
        px-6
        text-center
        md:flex
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          h-64
          w-64
          rounded-full
          bg-violet-500/[0.07]
          blur-[110px]
        "
      />

      <div className="relative z-10 flex flex-col items-center gap-4">
        <img
          src={lumoMark}
          alt=""
          className="h-20 w-20 object-contain lg:h-24 lg:w-24"
          aria-hidden="true"
        />

        <div>
          <p className="text-lg font-semibold tracking-[-0.02em] text-zinc-100">
            Good conversations start here.
          </p>

          <p className="mt-1.5 text-sm text-zinc-500">
            Select a conversation from the sidebar to start chatting.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatContainer