import { useEffect, useState, useCallback } from "react";
import {
  FaUsers, FaBriefcase, FaFileAlt, FaExclamationTriangle,
  FaUserTie, FaCircle, FaSync, FaEye,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CardSkeleton } from "../../components/Skeleton";
import { getAdminStats, getAdminUsers, getAnalytics } from "../../services/adminApi";
import { getProjects } from "../../services/projectApi";
import toast from "react-hot-toast";

// Local activity log stored in sessionStorage so it persists across navigations
const ACTIVITY_KEY = "fb_admin_activity";

const getActivity = () => {
  try { return JSON.parse(sessionStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; }
};

const pushActivity = (entry) => {
  const list = getActivity();
  list.unshift({ ...entry, id: Date.now(), time: new Date().toISOString() });
  sessionStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 50)));
};

// Expose globally so AuthContext can call it
window.__fbAdminLog = pushActivity;

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const activityColor = {
  register: "text-[#2ee6a6]",
  login: "text-[#9b6dff]",
  logout: "text-[#8b8ba3]",
  project: "text-yellow-400",
  proposal: "text-[#ff6b6b]",
  ban: "text-[#ff6b6b]",
  unban: "text-[#2ee6a6]",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [activity, setActivity] = useState(getActivity());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const [statsRes, usersRes, projectsRes] = await Promise.allSettled([
        getAdminStats(),
        getAdminUsers({ limit: 5 }),
        getProjects({ limit: 5, status: "open" }),
      ]);
      if (statsRes.status === "fulfilled") setStats(statsRes.value.data.stats);
      if (usersRes.status === "fulfilled") setRecentUsers(usersRes.value.data.users || []);
      if (projectsRes.status === "fulfilled") setRecentProjects(projectsRes.value.data.projects || []);
    } catch {
      if (!silent) toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh activity every 5s
  useEffect(() => {
    const t = setInterval(() => setActivity(getActivity()), 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <DashboardPage title="Admin Dashboard" description="Full platform overview — users, projects, activity.">
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 text-sm text-[#8b8ba3] hover:text-[#2ee6a6] transition">
          <FaSync className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard label="Total Users" value={stats?.users ?? "—"} icon={FaUsers} color="text-[#2ee6a6]" sub={`${stats?.freelancers ?? 0} freelancers · ${stats?.clients ?? 0} clients`} />
        <StatsCard label="Total Projects" value={stats?.projects ?? "—"} icon={FaBriefcase} color="text-yellow-400" />
        <StatsCard label="Total Proposals" value={stats?.proposals ?? "—"} icon={FaFileAlt} color="text-[#9b6dff]" />
        <StatsCard label="Freelancers" value={stats?.freelancers ?? "—"} icon={FaUserTie} color="text-[#9b6dff]" />
        <StatsCard label="Clients" value={stats?.clients ?? "—"} icon={FaUsers} color="text-yellow-400" />
        <StatsCard label="Open Disputes" value={stats?.openDisputes ?? "—"} icon={FaExclamationTriangle} color="text-[#ff6b6b]" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Activity Feed */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold">Live Activity</h2>
            <span className="flex items-center gap-1 text-xs text-[#2ee6a6]">
              <FaCircle className="text-[8px] animate-pulse" /> Live
            </span>
          </div>
          {activity.length === 0 ? (
            <p className="text-[#8b8ba3] text-sm">No activity yet. Actions like register, login, and project posts will appear here.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <FaCircle className={`text-[8px] mt-1.5 shrink-0 ${activityColor[a.type] || "text-[#8b8ba3]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e8e8f0] leading-snug">{a.message}</p>
                    <p className="text-xs text-[#8b8ba3] mt-0.5">{timeAgo(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold">Recent Users</h2>
            <Link to="/admin/users" className="text-xs text-[#2ee6a6] hover:underline">View all</Link>
          </div>
          {recentUsers.length === 0 ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : (
            <div className="space-y-2">
              {recentUsers.map((u) => (
                <div key={u._id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-[#8b8ba3]">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full glass-light capitalize">{u.role}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full ${u.isActive ? "text-[#2ee6a6] bg-[#2ee6a6]/10" : "text-[#ff6b6b] bg-[#ff6b6b]/10"}`}>
                      {u.isActive ? "Active" : "Banned"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Projects */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold">Recent Projects</h2>
          <Link to="/admin/users" className="text-xs text-[#2ee6a6] hover:underline">Manage users</Link>
        </div>
        {recentProjects.length === 0 ? (
          <p className="text-[#8b8ba3] text-sm">No projects yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {recentProjects.map((p) => (
              <div key={p._id} className="glass-light rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-sm line-clamp-1">{p.title}</p>
                  <span className="text-[#2ee6a6] text-xs font-semibold shrink-0">${p.budget?.min}–${p.budget?.max}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8b8ba3]">
                  <span className="px-2 py-0.5 rounded-full bg-white/5">{p.category}</span>
                  <span>{p.proposals?.length || 0} proposals</span>
                  <span className="ml-auto flex items-center gap-1"><FaEye className="text-[10px]" />{p.views || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Earnings */}
      <div className="glass rounded-2xl p-6 mt-6">
        <h2 className="font-display text-lg font-bold mb-1">Platform Earnings</h2>
        <p className="font-display text-4xl font-bold text-gradient">${stats?.totalEarnings?.toLocaleString() || 0}</p>
        <p className="text-[#8b8ba3] text-sm mt-1">Total processed through platform</p>
      </div>
    </DashboardPage>
  );
};

export default AdminDashboard;
