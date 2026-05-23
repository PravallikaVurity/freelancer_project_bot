const variants = {
  open: "text-[#2ee6a6] bg-[#2ee6a6]/15 border-[#2ee6a6]/30",
  in_progress: "text-[#9b6dff] bg-[#9b6dff]/15 border-[#9b6dff]/30",
  completed: "text-[#2ee6a6] bg-[#2ee6a6]/15 border-[#2ee6a6]/30",
  cancelled: "text-[#ff6b6b] bg-[#ff6b6b]/15 border-[#ff6b6b]/30",
  draft: "text-[#8b8ba3] bg-white/5 border-white/10",
  pending: "text-yellow-400 bg-yellow-400/15 border-yellow-400/30",
  accepted: "text-[#2ee6a6] bg-[#2ee6a6]/15 border-[#2ee6a6]/30",
  rejected: "text-[#ff6b6b] bg-[#ff6b6b]/15 border-[#ff6b6b]/30",
  withdrawn: "text-[#8b8ba3] bg-white/5 border-white/10",
};

const Badge = ({ status, label }) => {
  const cls = variants[status] || "text-[#8b8ba3] bg-white/5 border-white/10";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label || status?.replace("_", " ")}
    </span>
  );
};

export default Badge;
