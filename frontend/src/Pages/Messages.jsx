import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import DashboardPage from "../components/DashboardPage";
import LoadingSpinner from "../components/LoadingSpinner";
import { StatusDisplay } from "../components/StatusBadge";
import { getConversations, getMessages, sendMessage } from "../services/chatApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

let socket;

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    socket = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001", {
      auth: { userId: user?._id },
    });
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Update lastMessage preview in conversation list
      setConversations((prev) => prev.map((c) =>
        c._id === msg.conversation ? { ...c, lastMessage: msg } : c
      ));
    });
    socket.on("typing", () => setTyping(true));
    socket.on("stopTyping", () => setTyping(false));
    socket.on("onlineUsers", (users) => setOnlineUsers(users));
    socket.on("userStatusChanged", ({ userId, currentStatus, statusUpdatedAt }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: { currentStatus, statusUpdatedAt } }));
    });
    // Refresh conversation list when a new conversation is created (after proposal submit)
    socket.on("newProposal", () => {
      getConversations().then(({ data }) => setConversations(data.conversations)).catch(() => {});
    });
    return () => socket.disconnect();
  }, [user]);

  useEffect(() => {
    getConversations().then(({ data }) => setConversations(data.conversations)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    socket.emit("joinConversation", activeConv._id);
    getMessages(activeConv._id).then(({ data }) => setMessages(data.messages)).catch(() => toast.error("Failed to load messages"));
  }, [activeConv]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv) return;
    socket.emit("sendMessage", { conversationId: activeConv._id, senderId: user._id, text });
    setText("");
    socket.emit("stopTyping", { conversationId: activeConv._id });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket.emit("typing", { conversationId: activeConv?._id, userId: user._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => socket.emit("stopTyping", { conversationId: activeConv?._id }), 1500);
  };

  const getOther = (conv) => conv.participants?.find((p) => p._id !== user?._id);

  return (
    <DashboardPage title="Messages" description="Chat with clients and freelancers.">
      <div className="glass rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[520px]">
        <div className="md:w-72 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto">
          {loading ? <LoadingSpinner className="p-8" /> : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-[#8b8ba3] text-sm mb-2">No conversations available.</p>
              <p className="text-[#8b8ba3] text-xs">Submit a proposal on a job to start chatting with a client.</p>
            </div>
          ) : conversations.map((c) => {
            const other = getOther(c);
            const isOnline = onlineUsers.includes(other?._id);
            return (
              <button key={c._id} type="button" onClick={() => setActiveConv(c)}
                className={`w-full text-left px-4 py-4 border-b border-white/5 transition hover:bg-white/[0.03] ${activeConv?._id === c._id ? "bg-white/[0.06] border-l-2 border-l-[#2ee6a6]" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm">{other?.name?.[0]}</div>
                    {isOnline && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#2ee6a6] border-2 border-[#0f0f18]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{other?.name}</p>
                    <StatusDisplay
                      status={userStatuses[other?._id]?.currentStatus || other?.currentStatus}
                      className="truncate"
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-[#8b8ba3]">Select a conversation</div>
          ) : (
            <>
              <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm">
                  {getOther(activeConv)?.name?.[0]}
                </div>
                <div>
                  <p className="font-display font-bold text-sm">{getOther(activeConv)?.name}</p>
                  <StatusDisplay
                    status={userStatuses[getOther(activeConv)?._id]?.currentStatus || getOther(activeConv)?.currentStatus}
                    updatedAt={userStatuses[getOther(activeConv)?._id]?.statusUpdatedAt || getOther(activeConv)?.statusUpdatedAt}
                  />
                  {typing && <p className="text-xs text-[#2ee6a6]">typing...</p>}
                </div>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {messages.map((m) => {
                  const isMe = m.sender?._id === user?._id || m.sender === user?._id;
                  return (
                    <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 rounded-tr-sm" : "glass-light rounded-tl-sm"}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
                <input type="text" value={text} onChange={handleTyping} placeholder="Type a message..."
                  className="input-field !pl-4 flex-1" />
                <button type="submit" className="btn-primary text-sm py-2 px-5 shrink-0">Send</button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default Messages;
