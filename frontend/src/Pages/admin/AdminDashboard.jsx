import { useEffect, useState, useCallback } from "react";
import {
  FaUsers, FaBriefcase, FaFileAlt, FaExclamationTriangle,
  FaUserTie, FaCircle, FaSync, FaEye, FaTimes,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getAdminStats, getAdminUsers, getDisputes, getAdminProposals, getAdminProjects } from "../../services/adminApi";
import { getProjects } from "../../services/projectApi";
import toast from "react-hot-toast";

const ACTIVITY_KEY = "fb_admin_activity";
const getActivity = () => { try { return JSON.parse(sessionStorage.getItem(ACTIVITY_KEY) || "[]"); } catch { return []; } };
const pushActivity = (entry) => {
  const list = getActivity();
  list.unshift({ ...entry, id: Date.now(), time: new Date().toISOString() });
  sessionStorage.setItem(ACTIVITY_KEY, JSON.stringify(list.slice(0, 50)));
};
window.__fbAdminLog = pushActivity;

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const activityColor = {
  register: "text-[#2ee6a6]", login: "text-[#9b6dff]", logout: "text-[#8b8ba3]",
  project: "text-yellow-400", proposal: "text-[#ff6b6b]", ban: "text-[#ff6b6b]", unban: "text-[#2ee6a6]",
};

// ── Detail Modal ──────────────────────────────────────────────────────────────
const DetailModal = ({ type, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        if (type === "users" || type === "freelancers" || type === "clients") {
          const role = type === "users" ? "" : type === "freelancers" ? "freelancer" : "client";
          const { data: res } = await getAdminUsers({ role, limit: 50 });
          setData(res.users || []);
        } else if (type === "projects") {
          const { data: res } = await getAdminProjects({ limit: 50 });
          setData(res.projects || []);
        } else if (type === "proposals") {
          const { data: res } = await getAdminProposals({ limit: 50 });
          setData(res.proposals || []);
        } else if (type === "disputes") {
          const { data: res } = await getDisputes();
          setData(res.disputes || []);
        }
      } catch { toast.error("Failed to load details"); }
      finally { setLoading(false); }
    };
    load();
  }, [type]);

  const titles = {
    users: "All Users", freelancers: "All Freelancers", clients: "All Clients",
    projects: "All Projects", proposals: "All Proposals", disputes: "Open Disputes",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <h2 className="font-display font-bold text-lg">{titles[type]}</h2>
          <button type="button" onClick={onClose} className="text-[#8b8ba3] hover:text-[#e8e8f0] transition p-1">
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <LoadingSpinner size="md" className="min-h-[200px]" />
          ) : data.length === 0 ? (
            <p className="text-[#8b8ba3] text-sm text-center py-12">No records found.</p>
          ) : (
            <>
              {/* Users / Freelancers / Clients */}
              {(type === "users" || type === "freelancers" || type === "clients") && (
                <div className="space-y-2">
                  {data.map((u) => (
                    <div key={u._id} className="flex items-center justify-between py-3 px-4 glass-light rounded-xl">
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
                        <span className="text-xs text-[#8b8ba3]">{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects */}
              {type === "projects" && (
                <div className="space-y-2">
                  {data.map((p) => (
                    <div key={p._id} className="py-3 px-4 glass-light rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">{p.title}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 capitalize ${
                          p.status === "open" ? "text-[#2ee6a6] bg-[#2ee6a6]/10" :
                          p.status === "in_progress" ? "text-yellow-400 bg-yellow-400/10" :
                          "text-[#8b8ba3] bg-white/5"
                        }`}>{p.status?.replace("_", " ")}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8b8ba3]">
                        <span>{p.category}</span>
                        <span>·</span>
                        <span>₹{p.budget?.min}–₹{p.budget?.max}</span>
                        <span>·</span>
                        <span>by {p.client?.name || "—"}</span>
                        <span className="ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Proposals */}
              {type === "proposals" && (
                <div className="space-y-2">
                  {data.map((p) => (
                    <div key={p._id} className="py-3 px-4 glass-light rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm line-clamp-1">{p.project?.title || "—"}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 capitalize ${
                          p.status === "pending" ? "text-yellow-400 bg-yellow-400/10" :
                          p.status === "accepted" ? "text-[#2ee6a6] bg-[#2ee6a6]/10" :
                          p.status === "rejected" ? "text-[#ff6b6b] bg-[#ff6b6b]/10" :
                          "text-[#8b8ba3] bg-white/5"
                        }`}>{p.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#8b8ba3]">
                        <span>by {p.freelancer?.name || "—"}</span>
                        <span>·</span>
                        <span>{p.freelancer?.email || "—"}</span>
                        {p.bidAmount && <><span>·</span><span className="text-[#2ee6a6]">₹{p.bidAmount}</span></>}
                        <span className="ml-auto">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Disputes */}
              {type === "disputes" && (
                <div className="space-y-2">
                  {data.map((d) => (
                    <div key={d._id} className="py-3 px-4 glass-light rounded-xl">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-sm">{d.project?.title || "—"}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full shrink-0 capitalize ${d.status === "open" ? "text-[#ff6b6b] bg-[#ff6b6b]/10" : "text-[#2ee6a6] bg-[#2ee6a6]/10"}`}>
                          {d.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b8ba3]">
                        {d.raisedBy?.name} vs {d.against?.name} · {d.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [activity, setActivity] = useState(getActivity());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState(null); // "users" | "freelancers" | "clients" | "projects" | "proposals" | "disputes"

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
      if (!silent && statsRes.status === "rejected") toast.error("Failed to load dashboard");
    } catch {
      if (!silent) toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => setActivity(getActivity()), 5000);
    return () => clearInterval(t);
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <DashboardPage title="Admin Dashboard" description="Full platform overview — users, projects, activity.">
      {modal && <DetailModal type={modal} onClose={() => setModal(null)} />}

      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button type="button" onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 text-sm text-[#8b8ba3] hover:text-[#2ee6a6] transition">
          <FaSync className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats — all clickable */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard label="Total Users" value={stats?.users ?? "—"} icon={FaUsers} color="text-[#2ee6a6]"
          sub={`${stats?.freelancers ?? 0} freelancers · ${stats?.clients ?? 0} clients`}
          onClick={() => setModal("users")} />
        <StatsCard label="Total Projects" value={stats?.projects ?? "—"} icon={FaBriefcase} color="text-yellow-400"
          onClick={() => setModal("projects")} />
        <StatsCard label="Total Proposals" value={stats?.proposals ?? "—"} icon={FaFileAlt} color="text-[#9b6dff]"
          onClick={() => setModal("proposals")} />
        <StatsCard label="Freelancers" value={stats?.freelancers ?? "—"} icon={FaUserTie} color="text-[#9b6dff]"
          onClick={() => setModal("freelancers")} />
        <StatsCard label="Clients" value={stats?.clients ?? "—"} icon={FaUsers} color="text-yellow-400"
          onClick={() => setModal("clients")} />
        <StatsCard label="Open Disputes" value={stats?.openDisputes ?? "—"} icon={FaExclamationTriangle} color="text-[#ff6b6b]"
          onClick={() => setModal("disputes")} />
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
            <p className="text-[#8b8ba3] text-sm">No users found.</p>
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
