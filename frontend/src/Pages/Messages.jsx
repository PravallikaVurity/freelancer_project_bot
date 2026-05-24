import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import DashboardPage from "../components/DashboardPage";
import LoadingSpinner from "../components/LoadingSpinner";
import { StatusDisplay } from "../components/StatusBadge";
import { getConversations, getMessages, sendMessage } from "../services/chatApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

let socket;

const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeConvRef = useRef(null);
  activeConvRef.current = activeConv;

  // Stable message dedup helper
  const addMessage = useCallback((msg) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
    setConversations((prev) =>
      prev.map((c) => (c._id === msg.conversation ? { ...c, lastMessage: msg } : c))
    );
  }, []);

  // Socket setup
  useEffect(() => {
    socket = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001",
      { auth: { userId: user?._id } }
    );

    socket.on("newMessage", (msg) => {
      // Only add if it belongs to the active conversation
      if (msg.conversation === activeConvRef.current?._id) {
        addMessage(msg);
      } else {
        // Update lastMessage preview for other conversations
        setConversations((prev) =>
          prev.map((c) => (c._id === msg.conversation ? { ...c, lastMessage: msg } : c))
        );
      }
    });

    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    socket.on("userStatusChanged", ({ userId, currentStatus, statusUpdatedAt }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: { currentStatus, statusUpdatedAt } }));
    });
    socket.on("newProposal", () => {
      getConversations().then(({ data }) => setConversations(data.conversations)).catch(() => {});
    });
    socket.on("messageError", (err) => toast.error(err || "Message failed"));

    return () => socket.disconnect();
  }, [user, addMessage]);

  // Load conversations
  useEffect(() => {
    getConversations()
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setLoading(false));
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConv) return;
    socket?.emit("joinConversation", activeConv._id);
    getMessages(activeConv._id)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => toast.error("Failed to load messages"));
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    setSending(true);
    socket?.emit("stopTyping", { conversationId: activeConv._id });
    try {
      const { data } = await sendMessage(activeConv._id, { text: text.trim() });
      // REST response is the source of truth — socket will also emit to other participants
      addMessage(data.message);
      setText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!activeConv) return;
    socket?.emit("typing", { conversationId: activeConv._id, userId: user._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket?.emit("stopTyping", { conversationId: activeConv._id }),
      1500
    );
  };

  // Safe ID comparison — handles both populated objects and raw ObjectId strings
  const isSameId = (a, b) => a?.toString() === b?.toString();

  const getOther = (conv) =>
    conv.participants?.find((p) => !isSameId(p._id, user?._id));

  return (
    <DashboardPage title="Messages" description="Chat with clients and freelancers.">
      <div className="glass rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        {/* Conversation list */}
        <div className="md:w-72 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
          {loading ? (
            <LoadingSpinner className="p-8" />
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#8b8ba3] text-sm mb-2">No conversations yet.</p>
              <p className="text-[#8b8ba3] text-xs">Submit a proposal on a job to start chatting.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const other = getOther(c);
              const isOnline = onlineUsers.includes(other?._id?.toString());
              const lastText = c.lastMessage?.text;
              return (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => setActiveConv(c)}
                  className={`w-full text-left px-4 py-4 border-b border-white/5 transition hover:bg-white/[0.03] ${
                    activeConv?._id === c._id ? "bg-white/[0.06] border-l-2 border-l-[#2ee6a6]" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm">
                        {other?.name?.[0] || "?"}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2ee6a6] border-2 border-[#0f0f18]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{other?.name || "Unknown User"}</p>
                      <p className="text-xs text-[#8b8ba3] truncate">
                        {lastText || <StatusDisplay status={userStatuses[other?._id]?.currentStatus || other?.currentStatus} />}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-[#8b8ba3]">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm">
                  {getOther(activeConv)?.name?.[0] || "?"}
                </div>
                <div>
                  <p className="font-display font-bold text-sm">
                    {getOther(activeConv)?.name || "Unknown User"}
                  </p>
                  <StatusDisplay
                    status={
                      userStatuses[getOther(activeConv)?._id]?.currentStatus ||
                      getOther(activeConv)?.currentStatus
                    }
                    updatedAt={
                      userStatuses[getOther(activeConv)?._id]?.statusUpdatedAt ||
                      getOther(activeConv)?.statusUpdatedAt
                    }
                  />
                  {typing && <p className="text-xs text-[#2ee6a6]">typing...</p>}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.length === 0 && (
                  <p className="text-center text-[#8b8ba3] text-sm py-8">
                    No messages yet. Say hello! 👋
                  </p>
                )}
                {messages.map((m) => {
                  const isMe = isSameId(m.sender?._id || m.sender, user?._id);
                  const senderName = m.sender?.name || (isMe ? user?.name : getOther(activeConv)?.name || "Unknown");
                  return (
                    <div key={m._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {/* Sender name — only show for received messages */}
                      {!isMe && (
                        <span className="text-[10px] text-[#8b8ba3] mb-0.5 ml-1">{senderName}</span>
                      )}
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                        isMe
                          ? "bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 rounded-tr-sm"
                          : "glass-light rounded-tl-sm"
                      }`}>
                        {m.text}
                        {m.file?.url && (
                          <a href={m.file.url} target="_blank" rel="noreferrer"
                            className="block mt-1 text-xs text-[#2ee6a6] underline">
                            📎 {m.file.name || "Attachment"}
                          </a>
                        )}
                      </div>
                      {/* Timestamp + read status */}
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                        <span className="text-[10px] text-[#8b8ba3]">
                          {m.createdAt ? fmtTime(m.createdAt) : ""}
                        </span>
                        {isMe && (
                          <span className={`text-[10px] ${m.read ? "text-[#2ee6a6]" : "text-[#8b8ba3]"}`}>
                            {m.read ? "✓✓" : "✓"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="input-field !pl-4 flex-1"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="btn-primary text-sm py-2 px-5 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? "..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default Messages;
