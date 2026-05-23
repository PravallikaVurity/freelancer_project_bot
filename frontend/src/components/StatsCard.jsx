const StatsCard = ({ label, value, icon: Icon, color = "text-[#2ee6a6]", sub }) => (
  <div className="glass rounded-2xl p-6 card-glow h-full">
    <div className="flex items-start justify-between mb-4">
      <p className="text-sm text-[#8b8ba3]">{label}</p>
      {Icon && (
        <span className={`p-2 rounded-xl bg-white/5 ${color}`}>
          <Icon className="text-lg" />
        </span>
      )}
    </div>
    <p className={`font-display text-3xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-xs text-[#8b8ba3] mt-1">{sub}</p>}
  </div>
);

export default StatsCard;
