import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { FaBriefcase, FaCheckCircle, FaClock, FaChartBar, FaWallet, FaCalendarAlt } from "react-icons/fa";
import { getFreelancerAnalytics } from "../services/bidApi";

const COLORS = ["#2ee6a6", "#9b6dff", "#ff6b6b", "#fbbf24", "#60a5fa"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-3 py-2 text-xs border border-white/10">
      <p className="text-[#8b8ba3] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("₹") ? `₹${p.value.toLocaleString()}` : p.value}</p>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="glass-light rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-[#8b8ba3]">{label}</p>
      {Icon && <Icon className={`text-sm ${color}`} />}
    </div>
    <p className={`font-display text-xl font-bold ${color}`}>{value ?? "—"}</p>
    {sub && <p className="text-[10px] text-[#8b8ba3] mt-0.5">{sub}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h3 className="font-display font-bold text-sm text-[#e8e8f0] mb-4 flex items-center gap-2">{children}</h3>
);

const FreelancerAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getFreelancerAnalytics()
      .then(({ data: res }) => setData(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="glass rounded-2xl p-6 mt-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-white/10 rounded w-40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-xl" />)}
        </div>
        <div className="h-48 bg-white/5 rounded-xl" />
      </div>
    </div>
  );

  if (error) return (
    <div className="glass rounded-2xl p-6 mt-6 text-center text-[#8b8ba3] text-sm">
      Failed to load analytics. Please refresh the page.
    </div>
  );

  const { proposalStats, projectStats, upcomingDeadlines, earningsStats, monthlyEarnings, proposalTrend, categoryDistribution, avgBid } = data;

  const completionPct = proposalStats.total > 0
    ? Math.round((proposalStats.accepted / proposalStats.total) * 100)
    : 0;

  const workDistribution = [
    { name: "Accepted", value: proposalStats.accepted },
    { name: "Pending", value: proposalStats.pending },
    { name: "Rejected", value: proposalStats.rejected },
  ].filter((d) => d.value > 0);

  const projectDistribution = [
    { name: "Active", value: projectStats.active },
    { name: "Completed", value: projectStats.completed },
    { name: "Open", value: projectStats.open },
  ].filter((d) => d.value > 0);

  return (
    <div className="glass rounded-2xl p-6 mt-6 space-y-8">
      <div className="flex items-center gap-2 border-b border-white/10 pb-4">
        <FaChartBar className="text-[#9b6dff]" />
        <h2 className="font-display text-lg font-bold">My Analytics</h2>
      </div>

      {/* Performance Cards */}
      <div>
        <SectionTitle><FaBriefcase className="text-[#2ee6a6]" /> Performance Overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Total Proposals" value={proposalStats.total} icon={FaChartBar} color="text-[#9b6dff]" />
          <StatCard label="Accepted" value={proposalStats.accepted} icon={FaCheckCircle} color="text-[#2ee6a6]" sub="Proposals won" />
          <StatCard label="Pending" value={proposalStats.pending} icon={FaClock} color="text-yellow-400" sub="Awaiting response" />
          <StatCard label="Win Rate" value={`${completionPct}%`} icon={FaChartBar} color="text-[#ff6b6b]" sub="Acceptance rate" />
          <StatCard label="Avg Bid" value={`₹${avgBid.toLocaleString()}`} icon={FaWallet} color="text-[#2ee6a6]" sub="Per proposal" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          <StatCard label="Assigned Projects" value={projectStats.total} icon={FaBriefcase} color="text-[#9b6dff]" />
          <StatCard label="Active Projects" value={projectStats.active} icon={FaClock} color="text-[#2ee6a6]" sub="In progress" />
          <StatCard label="Completed Projects" value={projectStats.completed} icon={FaCheckCircle} color="text-yellow-400" sub="All time" />
        </div>
      </div>

      {/* Earnings Stats */}
      <div>
        <SectionTitle><FaWallet className="text-yellow-400" /> Earnings Statistics</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <StatCard label="Total Earned" value={`₹${earningsStats.totalEarned.toLocaleString()}`} color="text-[#2ee6a6]" sub="Released earnings" />
          <StatCard label="Pending Earnings" value={`₹${earningsStats.pendingEarnings.toLocaleString()}`} color="text-yellow-400" sub="Awaiting release" />
          <StatCard label="Withdrawn" value={`₹${earningsStats.withdrawnEarnings.toLocaleString()}`} color="text-[#9b6dff]" sub="Paid out" />
        </div>
        {monthlyEarnings.some((m) => m.amount > 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyEarnings} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" name="₹ Earned" fill="#2ee6a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[#8b8ba3] text-sm text-center py-6">No earnings data yet.</p>
        )}
      </div>

      {/* Proposal Trend */}
      <div>
        <SectionTitle><FaChartBar className="text-[#9b6dff]" /> Proposal Submission Trend</SectionTitle>
        {proposalTrend.some((m) => m.proposals > 0) ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={proposalTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="proposals" name="Proposals" stroke="#9b6dff" strokeWidth={2} dot={{ fill: "#9b6dff", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[#8b8ba3] text-sm text-center py-6">No proposal history yet.</p>
        )}
      </div>

      {/* Pie Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Work Distribution */}
        <div>
          <SectionTitle>Proposal Distribution</SectionTitle>
          {workDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={workDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {workDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#8b8ba3" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#8b8ba3] text-sm text-center py-6">No proposals yet.</p>
          )}
        </div>

        {/* Category Distribution */}
        <div>
          <SectionTitle>Category Distribution</SectionTitle>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#8b8ba3" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#8b8ba3] text-sm text-center py-6">No category data yet.</p>
          )}
        </div>
      </div>

      {/* Project Distribution Bar */}
      {projectDistribution.length > 0 && (
        <div>
          <SectionTitle><FaBriefcase className="text-[#2ee6a6]" /> Project Status Breakdown</SectionTitle>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={projectDistribution} layout="vertical" margin={{ top: 0, right: 4, left: 10, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Projects" radius={[0, 4, 4, 0]}>
                {projectDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Upcoming Deadlines */}
      <div>
        <SectionTitle><FaCalendarAlt className="text-[#ff6b6b]" /> Upcoming Deadlines</SectionTitle>
        {upcomingDeadlines.length === 0 ? (
          <p className="text-[#8b8ba3] text-sm">No deadlines in the next 30 days.</p>
        ) : (
          <div className="space-y-2">
            {upcomingDeadlines.map((d, i) => {
              const daysLeft = Math.ceil((new Date(d.deadline) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <p className="text-sm font-medium">{d.title}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#8b8ba3]">{new Date(d.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 3 ? "bg-[#ff6b6b]/15 text-[#ff6b6b]" : daysLeft <= 7 ? "bg-yellow-400/15 text-yellow-400" : "bg-[#2ee6a6]/15 text-[#2ee6a6]"}`}>
                      {daysLeft}d left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerAnalytics;
