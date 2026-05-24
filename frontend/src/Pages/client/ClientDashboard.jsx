import { useEffect, useState, useRef } from "react";
import { FaList, FaFileAlt, FaCheckCircle, FaFire, FaWallet } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import Badge from "../../components/Badge";
import { StatusSelector } from "../../components/StatusBadge";
import PerformanceAnalysis from "../../components/PerformanceAnalysis";
import { getActiveBattles } from "../../services/battleApi";
import { getMyProjects } from "../../services/projectApi";
import { getClientWithdrawalRequests, approveWithdrawal, rejectWithdrawal } from "../../services/earningsApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ClientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [battles, setBattles] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingBattles, setLoadingBattles] = useState(true);
  const [processingWithdrawal, setProcessingWithdrawal] = useState(null);

  const fetchBattles = () => {
    getActiveBattles()
      .then(({ data }) => setBattles(data.battles || []))
      .catch(() => {})
      .finally(() => setLoadingBattles(false));
  };

  const fetchProjects = () => {
    getMyProjects()
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  };

  const fetchWithdrawalRequests = () => {
    getClientWithdrawalRequests()
      .then(({ data }) => setWithdrawalRequests(data.withdrawals || []))
      .catch(() => {});
  };

  const handleApprove = async (id) => {
    setProcessingWithdrawal(id);
    try {
      await approveWithdrawal(id);
      setWithdrawalRequests((prev) => prev.map((w) => w._id === id ? { ...w, status: "approved" } : w));
      toast.success("Withdrawal approved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally { setProcessingWithdrawal(null); }
  };

  const handleReject = async (id) => {
    const reason = prompt("Rejection reason (optional):") ?? "";
    setProcessingWithdrawal(id);
    try {
      await rejectWithdrawal(id, reason);
      setWithdrawalRequests((prev) => prev.map((w) => w._id === id ? { ...w, status: "rejected", rejectionReason: reason } : w));
      toast.success("Withdrawal rejected.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally { setProcessingWithdrawal(null); }
  };

  useEffect(() => {
    fetchProjects();
    fetchBattles();
    fetchWithdrawalRequests();

    const sock = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001",
      { auth: { userId: user?._id } }
    );
    sock.on("newProposal", () => { fetchProjects(); fetchBattles(); });
    sock.on("battleHire", () => { fetchProjects(); fetchBattles(); });
    sock.on("withdrawalRequest", ({ clientId }) => {
      if (clientId === user?._id) fetchWithdrawalRequests();
    });
    return () => sock.disconnect();
  }, [user?._id]);

  const activeCount = projects.filter((p) => p.status === "open" || p.status === "in_progress").length;
  const totalProposals = projects.reduce((sum, p) => sum + (p.proposals?.length || 0), 0);
  const completedCount = projects.filter((p) => p.status === "completed").length;

  return (
    <DashboardPage title={`Welcome, ${user?.name?.split(" ")[0]} 👋`} description="Manage your projects and find great talent.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="cursor-pointer" onClick={() => navigate("/client/projects")}>
          <StatsCard label="Active Projects" value={loadingProjects ? "..." : activeCount} icon={FaList} color="text-[#2ee6a6]" sub="Open & in progress" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/client/projects")}>
          <StatsCard label="Total Proposals" value={loadingProjects ? "..." : totalProposals} icon={FaFileAlt} color="text-[#9b6dff]" sub="Across all projects" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/client/projects")}>
          <StatsCard label="Active Battles" value={loadingBattles ? "..." : battles.length} icon={FaFire} color="text-orange-400" sub="Compare freelancers" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/client/projects")}>
          <StatsCard label="Completed" value={loadingProjects ? "..." : completedCount} icon={FaCheckCircle} color="text-[#ff6b6b]" sub="All time" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Projects */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-bold">Recent Projects</h2>
              <Link to="/client/projects" className="text-sm text-[#2ee6a6] hover:underline">View all</Link>
            </div>
            {loadingProjects ? (
              <p className="text-[#8b8ba3] text-sm">Loading...</p>
            ) : projects.length === 0 ? (
              <p className="text-[#8b8ba3] text-sm">No projects yet. <Link to="/client/post-project" className="text-[#2ee6a6] hover:underline">Post one</Link>.</p>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{p.title}</p>
                      <p className="text-xs text-[#8b8ba3]">{p.proposals?.length || 0} proposals · ${p.budget?.min}–${p.budget?.max}</p>
                      {p.status === "assigned" && p.selectedFreelancer && (
                        <p className="text-xs text-[#9b6dff] mt-0.5">Selected Freelancer: {p.selectedFreelancer?.name || "Assigned"}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={p.status} />
                      {p.proposals?.length > 0 && (
                        <Link to={`/client/projects/${p._id}/battle`} className="p-1 glass-light rounded-lg text-[#8b8ba3] hover:text-orange-400 transition" title="Battle Mode">
                          <FaFire className="text-xs" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Battles */}
          <div className="glass rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <FaFire className="text-orange-400" /> Active Battles
              </h2>
              <Link to="/client/projects" className="text-sm text-[#2ee6a6] hover:underline">All projects</Link>
            </div>
            {loadingBattles ? (
              <p className="text-[#8b8ba3] text-sm">Loading...</p>
            ) : battles.length === 0 ? (
              <p className="text-[#8b8ba3] text-sm py-2">No active battles. Post a project and wait for proposals to start a battle.</p>
            ) : (
              <div className="space-y-3">
                {battles.map((b) => (
                  <div key={b._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{b.project?.title}</p>
                      <p className="text-xs text-[#8b8ba3]">{b.freelancers?.length || 0} competitors</p>
                    </div>
                    <Link
                      to={`/client/projects/${b.project?._id}/battle`}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <FaFire className="text-orange-400" /> Compare Freelancers
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Withdrawal Requests */}
          {withdrawalRequests.filter((w) => w.status === "pending_approval").length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4">
                <FaWallet className="text-yellow-400" /> Withdrawal Requests
              </h2>
              <div className="space-y-3">
                {withdrawalRequests.filter((w) => w.status === "pending_approval").map((w) => (
                  <div key={w._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{w.userId?.name}</p>
                      <p className="text-xs text-[#8b8ba3] capitalize">{w.method.replace("_", " ")} · {new Date(w.createdAt).toLocaleDateString()}</p>
                      {w.details && <p className="text-xs text-[#8b8ba3]">{w.details}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#2ee6a6] font-semibold text-sm">₹{w.amount}</span>
                      <button
                        type="button"
                        onClick={() => handleApprove(w._id)}
                        disabled={processingWithdrawal === w._id}
                        className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(w._id)}
                        disabled={processingWithdrawal === w._id}
                        className="btn-ghost text-xs py-1.5 px-3 hover:border-[#ff6b6b]/50 hover:text-[#ff6b6b] disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Analysis */}
          {!loadingProjects && <PerformanceAnalysis projects={projects} />}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-4">Quick Actions</h2>
          <div className="mb-5 pb-4 border-b border-white/10">
            <StatusSelector />
            <p className="text-xs text-[#8b8ba3] mt-1.5">
              Updated: {user?.statusUpdatedAt ? new Date(user.statusUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
            </p>
          </div>
          <div className="space-y-3">
            <Link to="/client/post-project" className="btn-primary w-full text-sm">Post a Project</Link>
            <Link to="/client/projects" className="btn-ghost w-full text-sm">Manage Projects</Link>
            <Link to="/client/messages" className="btn-ghost w-full text-sm">Messages</Link>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default ClientDashboard;
