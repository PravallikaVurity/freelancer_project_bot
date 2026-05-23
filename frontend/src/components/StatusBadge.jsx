import { useState } from "react";
import { updateStatus } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export const STATUS_OPTIONS = [
  { value: "available", label: "Available", emoji: "🟢" },
  { value: "busy", label: "Busy", emoji: "🟡" },
  { value: "deep_work", label: "Deep Work", emoji: "🔴" },
  { value: "break", label: "Taking Break", emoji: "☕" },
  { value: "offline", label: "Offline", emoji: "🌙" },
];

export const getStatusOption = (value) =>
  STATUS_OPTIONS.find((s) => s.value === value) || STATUS_OPTIONS[0];

/** Read-only badge — just shows the status */
export const StatusDisplay = ({ status, updatedAt, className = "" }) => {
  const opt = getStatusOption(status);
  return (
    <span className={`inline-flex items-center gap-1 text-xs text-[#8b8ba3] ${className}`}>
      {opt.emoji} {opt.label}
      {updatedAt && (
        <span className="ml-1 opacity-60">
          · {new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </span>
  );
};

/** Dropdown to change own status — only for the logged-in user */
export const StatusSelector = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  // Default to "available" if currentStatus not yet loaded in session
  const currentVal = user?.currentStatus || "available";

  const handleChange = async (e) => {
    const val = e.target.value;
    setSaving(true);
    try {
      const { data } = await updateStatus(val);
      if (data.success) {
        updateUser({ currentStatus: data.currentStatus, statusUpdatedAt: data.statusUpdatedAt });
        toast.success("Status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (err) {
      console.error("Status update error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[#8b8ba3] shrink-0">Current Status:</span>
      <select
        value={currentVal}
        onChange={handleChange}
        disabled={saving}
        className="bg-[#0f0f18] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-[#e8e8f0] focus:outline-none focus:border-[#2ee6a6]/50 disabled:opacity-50 cursor-pointer"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.emoji} {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};
