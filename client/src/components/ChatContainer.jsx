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
    loadingOlderMessages,
    typingUserId,
    deleteMessage
  } = useContext(ChatContext);

  const { authUser, onlineUsers, socket } = useContext(AuthContext)



  const messagesContainerRef = useRef(null);
  const scrollEnd = useRef();
  const typingTimeoutRef = useRef(null);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

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
      }
    } finally {
      setSending(false);
    }
  };

  // Handle scrolling
  const handleScroll = async () => {
    const container = messagesContainerRef.current;

    if (!container) return;

    if (
      container.scrollTop <= 50 &&
      hasMoreMessages &&
      !messagesLoading
    ) {
      const previousScrollHeight = container.scrollHeight;

      await loadOlderMessages();

      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;

        container.scrollTop =
          newScrollHeight - previousScrollHeight;
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
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      return;
    }

    setMessages([]);

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

  }, [selectedUser]);

  useEffect(() => {
    if (
      scrollEnd.current &&
      messages.length > 0 &&
      !loadingOlderMessages
    ) {
      scrollEnd.current.scrollIntoView({
        behavior: "smooth"
      });
    }
  }, [messages.length, loadingOlderMessages]);

  return selectedUser ? (
    <div className='h-full overflow-scroll relative backdrop-blur-lg'>
      {/* ------- header -------- */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <div className="flex-1">

          <p className="text-lg text-white flex items-center gap-2">
            {selectedUser.fullName}

            {onlineUsers.includes(
              selectedUser._id
            ) && (
                <span className="w-2 h-2 rounded-full bg-green-500" />
              )}
          </p>

          {typingUserId === selectedUser._id && (
            <p className="text-xs text-gray-400">
              typing...
            </p>
          )}

        </div>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5' />
      </div>

      {/* ------ chat_area ------ */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'
      >
        {messages.map((msg) => (
          <div key={msg._id} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>
            {msg.image ? (
              <img src={msg.image} className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' alt="" />
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>{msg.text}</p>
            )}

            <div className='text-center text-xs'>
              <img src={msg.senderId === authUser._id ? authUser?.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} className='w-7 rounded-full' alt="" />

              <div className="text-gray-500">
                <p>
                  {formatMessageTime(
                    msg.createdAt
                  )}
                </p>

                {msg.senderId === authUser._id && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteMessage(
                        msg._id
                      )
                    }
                    className="text-xs text-red-400 hover:text-red-300 mb-8"
                  >
                    Delete
                  </button>
                )}

                {msg.senderId === authUser._id && (
                  <p className="text-[10px]">
                    {msg.seen
                      ? "Seen"
                      : "Sent"}
                  </p>
                )}
              </div>
            </div>

          </div>
        ))}

        <div ref={scrollEnd}></div>

      </div>

      {/* ------- bottom search area ------- */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input onChange={handleInputChange} value={input} disabled={sending} onKeyDown={(e) => e.key === "Enter" ? handleSendMessage(e) : null} type="text" placeholder='Send a message' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' />
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