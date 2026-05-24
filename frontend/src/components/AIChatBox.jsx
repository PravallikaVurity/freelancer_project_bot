import { useState, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaChevronDown } from "react-icons/fa";
import api from "../services/api";

// Extract projectId from window.location — safe outside BrowserRouter
function getProjectId() {
  const match = window.location.pathname.match(/\/(?:jobs|projects)\/([a-f0-9]{24})/i);
  return match ? match[1] : null;
}

// Timestamp formatter
const fmtTime = (d) =>
  new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const Msg = ({ msg }) => (
  <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} mb-3`}>
    {msg.from === "bot" && (
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center shrink-0 mr-2 mt-0.5">
        <FaRobot className="text-[#07070d] text-xs" />
      </div>
    )}
    <div className="flex flex-col gap-0.5 max-w-[80%]">
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
        msg.from === "user"
          ? "bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 rounded-tr-sm text-[#e8e8f0]"
          : "glass-light rounded-tl-sm text-[#e8e8f0]"
      }`}>
        {msg.text}
      </div>
      <span className={`text-[10px] text-[#8b8ba3] ${msg.from === "user" ? "text-right" : "text-left"}`}>
        {fmtTime(msg.ts)}
      </span>
    </div>
  </div>
);

const SUGGESTIONS_FREELANCER = [
  "Am I suitable for this project?",
  "What skills are required?",
  "How can I improve my proposal?",
  "Explain React",
];

const AIChatBox = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your Freelancer Board assistant 🤖 Ask me about projects, proposals, earnings, or how to get started!", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const [projectId, setProjectId] = useState(getProjectId);

  // Re-detect projectId on every navigation (SPA route changes)
  useEffect(() => {
    const onNav = () => setProjectId(getProjectId());
    window.addEventListener("popstate", onNav);
    // Also poll on open so clicking a project then opening chat works
    if (open) setProjectId(getProjectId());
    return () => window.removeEventListener("popstate", onNav);
  }, [open]);

  const suggestions = SUGGESTIONS_FREELANCER;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text) => {
    const q = text.trim();
    if (!q || typing) return;

    const userMsg = { from: "user", text: q, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    let answer = "I'm having trouble responding right now. Please try again.";

    try {
      const token = localStorage.getItem("fb_token");

      if (token) {
        // Build history: skip the initial welcome message (index 0), send last 20
        const history = messages
          .slice(1)  // skip welcome bot message
          .slice(-20)
          .map((m) => ({ from: m.from, text: m.text }));

        const { data } = await api.post(
          "/ai/chat",
          { message: q, projectId: projectId || undefined, history },
          { timeout: 30000 }
        );
        answer = data.answer?.trim() || "I'm having trouble responding right now. Please try again.";
      } else {
        answer = getOfflineAnswer(q);
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        answer = "Request timed out. Please try again.";
        console.error("[AI Chat] Timeout error");
      } else if (!err.response) {
        answer = getOfflineAnswer(q);
        console.error("[AI Chat] Network error — using offline fallback");
      } else {
        answer = err.response?.data?.message || "Something went wrong. Please try again.";
        console.error("[AI Chat] API error:", err.response?.status, err.response?.data?.message);
      }
    }

    setTyping(false);
    setMessages((prev) => [...prev, { from: "bot", text: answer, ts: Date.now() }]);
  };

  const handleSubmit = (e) => { e.preventDefault(); send(input); };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center shadow-lg shadow-[#2ee6a6]/30 hover:scale-110 transition-transform"
        aria-label="Open AI assistant"
      >
        {open ? <FaChevronDown className="text-[#07070d] text-lg" /> : <FaRobot className="text-[#07070d] text-xl" />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] glass rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-fade-up"
          style={{ maxHeight: "520px" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center">
                <FaRobot className="text-[#07070d] text-sm" />
              </div>
              <div>
                <p className="font-display font-bold text-sm">FB Assistant</p>
                <p className="text-xs text-[#2ee6a6]">● Online{projectId ? " · Project context loaded" : ""}</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-[#8b8ba3] hover:text-[#e8e8f0] transition p-1">
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: "280px", maxHeight: "340px" }}>
            {messages.map((m, i) => <Msg key={i} msg={m} />)}
            {typing && (
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center shrink-0">
                  <FaRobot className="text-[#07070d] text-xs" />
                </div>
                <div className="glass-light rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 rounded-full bg-[#8b8ba3] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button key={s} type="button" onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 glass-light rounded-full text-[#8b8ba3] hover:text-[#2ee6a6] hover:border-[#2ee6a6]/30 border border-white/10 transition">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="input-field !pl-4 flex-1 text-sm py-2"
            />
            <button type="submit" disabled={!input.trim() || typing}
              className="btn-primary text-sm py-2 px-3 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

// Offline fallback for when backend is unreachable
function getOfflineAnswer(q) {
  const t = q.toLowerCase();
  if (/\b(hi|hello|hey)\b/.test(t)) return "Hi! 👋 I'm your Freelancer Board assistant. The server seems offline — here are some things I can still help with.";
  if (/\breact\b/.test(t)) return "React is a JavaScript library for building UIs. Key concepts: Components, JSX, Props, State (useState), Effects (useEffect), and Virtual DOM. Use it for SPAs and dynamic interfaces.";
  if (/\bnode\.?js\b/.test(t)) return "Node.js is a server-side JavaScript runtime. It's non-blocking, event-driven, and great for REST APIs and real-time apps.";
  if (/mongodb|mongoose/.test(t)) return "MongoDB is a NoSQL document database. Mongoose is the Node.js ODM for it — it adds schemas, validation, and query helpers.";
  if (/\bapi\b|rest.*api/.test(t)) return "A REST API uses HTTP methods: GET (fetch), POST (create), PUT/PATCH (update), DELETE (remove). Data is exchanged as JSON.";
  if (/\bjavascript\b|\bjs\b/.test(t)) return "JavaScript is the language of the web. Key features: async/await, arrow functions, destructuring, optional chaining (?.), and the spread operator.";
  if (/typescript/.test(t)) return "TypeScript adds static types to JavaScript. Benefits: catch errors early, better autocomplete, clearer code contracts.";
  if (/\bgit\b/.test(t)) return "Git essentials: git init, git add ., git commit -m 'msg', git push, git pull, git branch, git merge.";
  if (/debug|fix.*bug/.test(t)) return "Debugging tips: read the error message, use console.log(), check the Network tab in DevTools, isolate the problem, and search the exact error on Stack Overflow.";
  if (/interview/.test(t)) return "Common interview topics: JavaScript fundamentals, React lifecycle, REST APIs, async/await, database design, and system design basics.";
  if (/proposal|apply|bid/.test(t)) return "Winning proposal tips: reference the client's project specifically, highlight relevant skills, justify your bid, keep it under 250 words, and end with a clear next step.";
  if (/register|sign up/.test(t)) return "To register: Click Sign Up, enter your details, choose Freelancer, and complete your profile.";
  if (/forgot password|reset/.test(t)) return "On the login page, click 'Forgot password?' and enter your email to receive a reset link.";
  return "The server is currently unreachable. Please check your connection and try again. I can answer general tech questions (React, Node.js, MongoDB, APIs, Git, etc.) once reconnected.";
}

export default AIChatBox;
