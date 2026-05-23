import { useState, useRef, useEffect } from "react";
import { FaRobot, FaTimes, FaPaperPlane, FaChevronDown } from "react-icons/fa";
import api from "../services/api";

const FALLBACK = "I couldn't find exact information. Try asking about projects, jobs, proposals, earnings, messages, or dashboard details.";

const staticAnswer = (q) => {
  if (/\b(hi|hello|hey|help)\b/.test(q))
    return "Hi! Welcome to Freelancer Board 👋 How can I help you today?";
  if (/\b(register|sign up|signup|create account|join)\b/.test(q))
    return "To register:\n1. Click Sign Up\n2. Enter your details\n3. Choose Freelancer or Client\n4. Complete profile setup";
  if (/\b(post|posting)\b.*\b(project|job)\b|\b(project|job)\b.*\b(post|posting)\b/.test(q))
    return "To post a project:\n1. Login as Client\n2. Open Dashboard → Post Project\n3. Add title, description, budget and deadline\n4. Submit";
  if (/\b(bid|bidding|submit proposal|apply)\b/.test(q))
    return "To submit a proposal:\n1. Go to Browse Jobs\n2. Open a project\n3. Click Submit Proposal\n4. Enter bid amount, delivery time and cover letter";
  if (/\b(forgot password|reset password)\b/.test(q))
    return "On the login page click 'Forgot password?'. Enter your email and we'll send a reset link valid for 10 minutes.";
  if (/\b(admin|admin panel)\b/.test(q))
    return "The Admin Panel helps manage users, projects, reports, and platform activity. Access it at /admin/dashboard.";
  if (/\b(save|bookmark|saved jobs)\b/.test(q))
    return "Click the bookmark icon on any job card to save it. Access saved jobs from the Saved Jobs section in your sidebar.";
  if (/\b(role|freelancer vs client|difference)\b/.test(q))
    return "Freelancer: browse jobs, submit proposals, earn money.\nClient: post projects, review proposals, hire freelancers.";
  return null;
};

const getAnswer = async (input, token) => {
  const q = input.toLowerCase().trim().replace(/\s+/g, " ");

  // Static answers first (no DB needed)
  const stat = staticAnswer(q);
  if (stat) return stat;

  if (!token) return FALLBACK;

  const headers = { Authorization: `Bearer ${token}` };

  try {
    // Proposal count query
    if (/how many proposals|proposal count|proposals (have i|i have|submitted)/.test(q)) {
      const { data } = await api.get("/proposals/my", { headers });
      const list = data.proposals || [];
      const pending = list.filter((p) => p.status === "pending").length;
      const accepted = list.filter((p) => p.status === "accepted").length;
      const rejected = list.filter((p) => p.status === "rejected").length;
      return `You have submitted ${list.length} proposal(s) in total.\n• Pending: ${pending}\n• Accepted: ${accepted}\n• Rejected: ${rejected}`;
    }

    // Proposal status
    if (/\b(proposal|proposals)\b/.test(q)) {
      const { data } = await api.get("/proposals/my", { headers });
      const list = data.proposals || [];
      if (!list.length) return "You haven't submitted any proposals yet.";
      const recent = list.slice(0, 3).map((p) => `• ${p.project?.title || "Project"} — ${p.status} (₹${p.bidAmount})`).join("\n");
      return `You have ${list.length} proposal(s). Recent:\n${recent}`;
    }

    // Earnings query
    if (/\b(earning|earnings|total earned|how much|income|payment)\b/.test(q)) {
      const { data } = await api.get("/earnings", { headers });
      return `Your Earnings:\n• Total Earned: ₹${(data.total || 0).toLocaleString()}\n• Available Balance: ₹${(data.available || 0).toLocaleString()}\n• This Month: ₹${(data.thisMonth || 0).toLocaleString()}`;
    }

    // Dashboard stats
    if (/\b(dashboard|stats|statistics|overview|summary)\b/.test(q)) {
      const { data } = await api.get("/auth/dashboard-stats", { headers });
      const s = data.stats || {};
      return `Your Dashboard Summary:\n• Active Proposals: ${s.activeProposals || 0}\n• Jobs Completed: ${s.completedJobs || 0}\n• Total Earnings: ₹${(s.totalEarnings || 0).toLocaleString()}\n• Rating: ${s.rating > 0 ? `⭐ ${s.rating} (${s.reviewCount} reviews)` : "No ratings yet"}`;
    }

    // Project search by title
    if (/project|job/.test(q)) {
      const titleMatch = q.replace(/tell me about|show me|details of|project|job/g, "").trim();
      if (titleMatch.length > 2) {
        const { data } = await api.get("/projects", { params: { search: titleMatch, limit: 3 } });
        const projects = data.projects || [];
        if (!projects.length) return `No projects found matching "${titleMatch}". ${FALLBACK}`;
        return projects.map((p) =>
          `📁 ${p.title}\nBudget: ₹${p.budget?.min}–₹${p.budget?.max}\nSkills: ${p.skills?.join(", ") || "N/A"}\nStatus: ${p.status}\nDeadline: ${p.deadline ? new Date(p.deadline).toLocaleDateString() : "N/A"}\n${p.description?.slice(0, 100)}...`
        ).join("\n\n");
      }
      const { data } = await api.get("/projects", { params: { limit: 5, status: "open" } });
      const projects = data.projects || [];
      if (!projects.length) return "No open projects found right now.";
      return `Open Projects:\n${projects.map((p) => `• ${p.title} — ₹${p.budget?.min}–₹${p.budget?.max} (${p.skills?.slice(0, 2).join(", ")})`).join("\n")}`;
    }

    // Messages
    if (/\b(message|messages|chat)\b/.test(q))
      return "You can communicate with clients and freelancers through the Messages section in your sidebar.";

    // Profile
    if (/\b(profile|account|my info)\b/.test(q))
      return "You can view and update your profile from the Profile section in your sidebar. Add skills, portfolio, hourly rate and bio.";

  } catch (err) {
    console.error("Chatbot API error:", err);
  }

  return FALLBACK;
};

const Msg = ({ msg }) => (
  <div className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} mb-3`}>
    {msg.from === "bot" && (
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center shrink-0 mr-2 mt-0.5">
        <FaRobot className="text-[#07070d] text-xs" />
      </div>
    )}
    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
      msg.from === "user"
        ? "bg-[#2ee6a6]/15 border border-[#2ee6a6]/30 rounded-tr-sm text-[#e8e8f0]"
        : "glass-light rounded-tl-sm text-[#e8e8f0]"
    }`}>
      {msg.text}
    </div>
  </div>
);

const SUGGESTIONS = ["How many proposals do I have?", "Show my earnings", "Show open projects", "Dashboard summary"];

const AIChatBox = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! I'm your Freelancer Board assistant 🤖 Ask me about projects, proposals, earnings, or how to get started!" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text) => {
    const q = text.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { from: "user", text: q }]);
    setInput("");
    setTyping(true);
    const token = localStorage.getItem("fb_token");
    const answer = await getAnswer(q, token);
    setTyping(false);
    setMessages((prev) => [...prev, { from: "bot", text: answer }]);
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
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] glass rounded-2xl border border-white/10 shadow-2xl flex flex-col animate-fade-up"
          style={{ maxHeight: "520px" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center">
                <FaRobot className="text-[#07070d] text-sm" />
              </div>
              <div>
                <p className="font-display font-bold text-sm">FB Assistant</p>
                <p className="text-xs text-[#2ee6a6]">● Online</p>
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
              {SUGGESTIONS.map((s) => (
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

export default AIChatBox;
