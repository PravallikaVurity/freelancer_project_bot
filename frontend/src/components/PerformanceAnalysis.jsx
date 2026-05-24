import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from "recharts";
import { FaChartBar, FaChevronDown, FaUserCheck, FaClock, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { getProjectAnalytics } from "../services/analyticsApi";

const MINT = "#2ee6a6";
const VIOLET = "#9b6dff";
const CORAL = "#ff6b6b";
const MUTED = "rgba(139,139,163,0.25)";

const tooltipStyle = {
  contentStyle: { background: "#161622", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e8e8f0", fontSize: 12 },
  itemStyle: { color: "#e8e8f0" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

const MetricCard = ({ label, value, sub, color = "text-[#2ee6a6]" }) => (
  <div className="glass-light rounded-xl p-4 text-center">
    <p className="text-[#8b8ba3] text-xs mb-1">{label}</p>
    <p className={`font-bold text-lg ${color}`}>{value}</p>
    {sub && <p className="text-[#8b8ba3] text-xs mt-0.5">{sub}</p>}
  </div>
);

const SectionTitle = ({ children }) => (
  <p className="text-xs font-semibold text-[#8b8ba3] uppercase tracking-wider mb-3">{children}</p>
);

const EmptyState = () => (
  <div className="text-center py-10 text-[#8b8ba3] text-sm">
    No analytics data available for this project yet.
  </div>
);

const PerformanceAnalysis = ({ projects }) => {
  const assignedProjects = projects.filter((p) => p.status === "assigned" || p.status === "in_progress" || p.status === "completed");
  const [selectedId, setSelectedId] = useState(assignedProjects[0]?._id || "");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (assignedProjects.length && !selectedId) setSelectedId(assignedProjects[0]._id);
  }, [projects]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError(null);
    setAnalytics(null);
    getProjectAnalytics(selectedId)
      .then(({ data }) => setAnalytics(data.analytics))
      .catch((err) => setError(err.response?.data?.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (assignedProjects.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
          <FaChartBar className="text-[#2ee6a6]" /> Performance Analysis
        </h2>
        <p className="text-[#8b8ba3] text-sm py-4">No assigned projects yet. Select a freelancer for a project to view performance analytics.</p>
      </div>
    );
  }

  const m = analytics?.metrics;
  const c = analytics?.charts;

  return (
    <div className="glass rounded-2xl p-6 space-y-6">
      {/* Header + project selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <FaChartBar className="text-[#2ee6a6]" /> Performance Analysis
        </h2>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="input-field !pl-4 !pr-8 !py-2 text-sm appearance-auto cursor-pointer min-w-[200px]"
          >
            {assignedProjects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Freelancer info */}
      {analytics?.freelancer && (
        <div className="flex items-center gap-3 px-4 py-3 glass-light rounded-xl border border-[#9b6dff]/20">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm shrink-0">
            {analytics.freelancer.name?.[0]}
          </div>
          <div>
            <p className="font-medium text-sm flex items-center gap-1.5">
              <FaUserCheck className="text-[#9b6dff] text-xs" /> {analytics.freelancer.name}
            </p>
            <p className="text-xs text-[#8b8ba3]">
              ⭐ {analytics.freelancer.rating || "—"} · {analytics.freelancer.completedProjects || 0} projects done
            </p>
          </div>
          {m?.isOverdue && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#ff6b6b] font-medium">
              <FaExclamationTriangle /> Overdue
            </span>
          )}
        </div>
      )}

      {loading && (
        <div className="py-10 text-center text-[#8b8ba3] text-sm animate-pulse">Loading analytics...</div>
      )}

      {error && (
        <div className="py-6 text-center text-[#ff6b6b] text-sm">{error}</div>
      )}

      {!loading && !error && analytics && (
        <>
          {/* E. Performance Metrics Cards */}
          <div>
            <SectionTitle>Performance Metrics</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard label="Total Milestones" value={m.totalTasks} color="text-[#e8e8f0]" />
              <MetricCard label="Completed" value={m.completedTasks} color="text-[#2ee6a6]" />
              <MetricCard label="Pending" value={m.pendingTasks} color="text-[#9b6dff]" />
              <MetricCard
                label="Deadline Status"
                value={m.isOverdue ? "Overdue" : `${m.remainingDays}d left`}
                color={m.isOverdue ? "text-[#ff6b6b]" : "text-[#2ee6a6]"}
              />
              <MetricCard
                label="Response Time"
                value={m.avgResponseHours != null ? `~${m.avgResponseHours}h` : "—"}
                color="text-[#e8e8f0]"
                sub="avg between messages"
              />
              <MetricCard
                label="Completion"
                value={`${m.completionPct}%`}
                color={m.completionPct >= 75 ? "text-[#2ee6a6]" : m.completionPct >= 40 ? "text-yellow-400" : "text-[#9b6dff]"}
                sub={`${m.elapsedDays}/${m.totalDays} days`}
              />
            </div>
          </div>

          {/* A. Project Progress — donut + milestone bar side by side */}
          <div>
            <SectionTitle>Project Progress</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Donut */}
              <div className="glass-light rounded-xl p-4">
                <p className="text-xs text-[#8b8ba3] mb-2">Completion %</p>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={c.progressDonut} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                      {c.progressDonut.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`]} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-2xl font-bold text-[#2ee6a6] -mt-2">{m.completionPct}%</p>
              </div>
              {/* Milestone bar */}
              <div className="glass-light rounded-xl p-4">
                <p className="text-xs text-[#8b8ba3] mb-2">Milestones</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={c.milestoneBar} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {c.milestoneBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* B. Task Completion Trend */}
          <div>
            <SectionTitle>Activity Trend (Last 14 Days)</SectionTitle>
            <div className="glass-light rounded-xl p-4">
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={c.activityTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: "#8b8ba3", fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Messages"]} />
                  <Line type="monotone" dataKey="count" stroke={MINT} strokeWidth={2} dot={{ fill: MINT, r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* C. Work Distribution Pie */}
          <div>
            <SectionTitle>Work Distribution</SectionTitle>
            <div className="glass-light rounded-xl p-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={c.workDistribution} cx="50%" cy="50%" outerRadius={75} dataKey="value" label={({ name, percent }) => percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""} labelLine={false}>
                    {c.workDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#8b8ba3" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* D. Productivity — daily + weekly */}
          <div>
            <SectionTitle>Productivity (Message Activity)</SectionTitle>
            <div className="glass-light rounded-xl p-4">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={c.weeklyActivity} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="week" tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8b8ba3", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Messages"]} />
                  <Bar dataKey="count" fill={VIOLET} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Extra: bid & deadline info */}
          {(m.bidAmount || m.deliveryTime) && (
            <div className="grid sm:grid-cols-2 gap-3">
              {m.bidAmount && (
                <div className="glass-light rounded-xl p-3 flex items-center gap-3">
                  <FaCheckCircle className="text-[#2ee6a6] shrink-0" />
                  <div>
                    <p className="text-xs text-[#8b8ba3]">Agreed Bid</p>
                    <p className="font-bold text-[#2ee6a6]">${m.bidAmount}</p>
                  </div>
                </div>
              )}
              {m.deliveryTime && (
                <div className="glass-light rounded-xl p-3 flex items-center gap-3">
                  <FaClock className="text-[#9b6dff] shrink-0" />
                  <div>
                    <p className="text-xs text-[#8b8ba3]">Delivery Timeline</p>
                    <p className="font-bold text-[#9b6dff]">{m.deliveryTime} days</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !error && !analytics && <EmptyState />}
    </div>
  );
};

export default PerformanceAnalysis;
