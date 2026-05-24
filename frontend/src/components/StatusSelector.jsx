import { useState } from "react";
import { STATUSES } from "./StatusBadge";
import { updateStatus } from "../services/authApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const StatusSelector = () => {
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

export default StatusSelector;
