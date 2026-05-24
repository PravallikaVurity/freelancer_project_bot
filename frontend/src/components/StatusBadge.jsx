import { useState } from "react";
import { updateStatus } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const STATUSES = {
  available: { emoji: "🟢", label: "Available",    color: "text-[#2ee6a6]",  bg: "bg-[#2ee6a6]/10 border-[#2ee6a6]/25" },
  busy:      { emoji: "🟡", label: "Busy",         color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/25" },
  deep_work: { emoji: "🔴", label: "Deep Work",    color: "text-[#ff6b6b]",  bg: "bg-[#ff6b6b]/10 border-[#ff6b6b]/25" },
  break:     { emoji: "☕", label: "Taking Break", color: "text-orange-400", bg: "bg-orange-400/10 border-orange-400/25" },
  offline:   { emoji: "🌙", label: "Offline",      color: "text-[#8b8ba3]",  bg: "bg-white/5 border-white/10" },
};

const timeAgo = (updatedAt) => {
  if (!updatedAt) return null;
  const diff = Math.floor((Date.now() - new Date(updatedAt)) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
};

// Default export — small inline badge (used on cards, chat list, etc.)
const StatusBadge = ({ status = "available", updatedAt, size = "sm" }) => {
  const s = STATUSES[status] || STATUSES.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${s.bg} ${s.color}`}>
      <span>{s.emoji}</span>
      <span>{s.label}</span>
      {size === "md" && updatedAt && (
        <span className="opacity-60 text-[10px]">· {timeAgo(updatedAt)}</span>
      )}
    </span>
  );
};

export default StatusBadge;

// Named export — used on profile page to show status + last updated
export const StatusDisplay = ({ status = "available", updatedAt }) => {
  const s = STATUSES[status] || STATUSES.available;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${s.bg} ${s.color}`}>
        <span>{s.emoji}</span>
        <span>{s.label}</span>
      </span>
      {updatedAt && (
        <span className="text-[10px] text-[#8b8ba3]">Updated {timeAgo(updatedAt)}</span>
      )}
    </div>
  );
};

// Named export — dropdown selector to change status
export const StatusSelector = () => {
  const { user, updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = STATUSES[user?.currentStatus] || STATUSES.available;

  const handleSelect = async (key) => {
    if (key === user?.currentStatus) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const { data } = await updateStatus(key);
      updateUser({ currentStatus: data.currentStatus, statusUpdatedAt: data.statusUpdatedAt });
      toast.success(`Status set to ${STATUSES[key].label}`);
    } catch {
      toast.error("Failed to update status");
    } finally { setSaving(false); }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 glass-light rounded-xl border border-white/10 hover:border-white/20 transition text-sm disabled:opacity-50"
      >
        <span>{current.emoji}</span>
        <span className={`font-medium ${current.color}`}>{current.label}</span>
        <span className="text-[#8b8ba3] text-xs ml-1">▼</span>
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 glass rounded-xl border border-white/10 shadow-xl overflow-hidden min-w-[170px]">
          {Object.entries(STATUSES).map(([key, s]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(key)}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/[0.05] transition text-left ${user?.currentStatus === key ? "bg-white/[0.06]" : ""}`}
            >
              <span>{s.emoji}</span>
              <span className={s.color}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
