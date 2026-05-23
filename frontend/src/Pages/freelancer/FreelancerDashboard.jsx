import { useState, useEffect } from "react";
import { FaBriefcase, FaFileAlt, FaWallet, FaStar } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import Badge from "../../components/Badge";
import { CardSkeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { getMyProposals } from "../../services/bidApi";
import { getDashboardStats } from "../../services/authApi";

const FreelancerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [stats, setStats] = useState({ activeProposals: 0, completedJobs: 0, totalEarnings: 0, rating: 0, reviewCount: 0 });

  const fetchAll = async () => {
    try {
      const [proposalsRes, statsRes] = await Promise.all([getMyProposals(), getDashboardStats()]);
      const list = proposalsRes.data.proposals || [];
      setProposals(list.slice(0, 5));
      if (statsRes.data.stats) setStats(statsRes.data.stats);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally { setLoadingProposals(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    const sock = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { userId: user?._id },
    });
    sock.on("newProposal", () => fetchAll());
    return () => sock.disconnect();
  }, [user]);

  return (
    <DashboardPage title={`Welcome back, ${user?.name?.split(" ")[0]} 👋`} description="Here's what's happening with your freelance work.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="cursor-pointer" onClick={() => navigate("/freelancer/proposals")}>
          <StatsCard label="Active Proposals" value={stats.activeProposals} icon={FaFileAlt} color="text-[#9b6dff]" sub="Pending & accepted" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/freelancer/proposals")}>
          <StatsCard label="Jobs Completed" value={stats.completedJobs} icon={FaBriefcase} color="text-[#2ee6a6]" sub="All time" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/freelancer/earnings")}>
          <StatsCard label="Total Earnings" value={`₹${stats.totalEarnings.toLocaleString()}`} icon={FaWallet} color="text-yellow-400" sub="Lifetime" />
        </div>
        <div className="cursor-pointer" onClick={() => navigate("/freelancer/profile")}>
          <StatsCard label="Rating" value={stats.rating > 0 ? `⭐ ${stats.rating}` : "—"} icon={FaStar} color="text-[#ff6b6b]" sub={`${stats.reviewCount} reviews`} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-lg font-bold">Recent Proposals</h2>
            <Link to="/freelancer/proposals" className="text-sm text-[#2ee6a6] hover:underline">View all</Link>
          </div>

          {loadingProposals ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
          ) : proposals.length === 0 ? (
            <p className="text-[#8b8ba3] text-sm py-4">No proposals submitted yet. <Link to="/freelancer/jobs" className="text-[#2ee6a6] hover:underline">Browse jobs</Link> to get started.</p>
          ) : (
            <div className="space-y-3">
              {proposals.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{p.project?.title || "—"}</p>
                    <p className="text-xs text-[#8b8ba3]">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#2ee6a6] text-sm font-semibold">₹{p.bidAmount}</span>
                    <Badge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/freelancer/jobs" className="btn-primary w-full text-sm">Browse Jobs</Link>
            <Link to="/freelancer/profile" className="btn-ghost w-full text-sm">Update Profile</Link>
            <Link to="/freelancer/earnings" className="btn-ghost w-full text-sm">View Earnings</Link>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default FreelancerDashboard;
