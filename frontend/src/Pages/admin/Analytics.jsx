import { useEffect, useState } from "react";
import { FaTrophy } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getAnalytics } from "../../services/adminApi";
import toast from "react-hot-toast";

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(({ data }) => setData(data)).catch(() => toast.error("Failed to load analytics")).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  const maxEarning = Math.max(...(data?.monthly?.map((m) => m.total) || [1]));

  return (
    <DashboardPage title="Analytics" description="Platform performance and insights.">
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-6">Monthly Earnings</h2>
          <div className="flex items-end gap-2 h-40">
            {data?.monthly?.map((m) => (
              <div key={m._id} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-[#8b8ba3]">${m.total}</span>
                <div className="w-full bg-gradient-to-t from-[#2ee6a6] to-[#9b6dff] rounded-t-lg transition-all" style={{ height: `${(m.total / maxEarning) * 100}%`, minHeight: "4px" }} />
                <span className="text-xs text-[#8b8ba3]">{months[m._id - 1]}</span>
              </div>
            ))}
            {(!data?.monthly?.length) && <p className="text-[#8b8ba3] text-sm m-auto">No data yet</p>}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-4">Projects by Category</h2>
          <div className="space-y-3">
            {data?.projectsByCategory?.map((c) => (
              <div key={c._id} className="flex items-center gap-3">
                <span className="text-sm text-[#e8e8f0] w-32 truncate">{c._id}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#2ee6a6] to-[#9b6dff] rounded-full" style={{ width: `${(c.count / (data.projectsByCategory[0]?.count || 1)) * 100}%` }} />
                </div>
                <span className="text-xs text-[#8b8ba3] w-6 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2"><FaTrophy className="text-yellow-400" /> Top Freelancers</h2>
        <div className="space-y-3">
          {data?.topFreelancers?.map((f, i) => (
            <div key={f._id} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
              <span className="text-lg font-bold text-[#8b8ba3] w-6">#{i + 1}</span>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold shrink-0">{f.name?.[0]}</div>
              <div className="flex-1">
                <p className="font-medium">{f.name}</p>
                <StarRating rating={f.rating} />
              </div>
              <div className="text-right">
                <p className="text-[#2ee6a6] font-semibold">${f.totalEarnings?.toLocaleString()}</p>
                <p className="text-xs text-[#8b8ba3]">{f.completedProjects} projects</p>
              </div>
            </div>
          ))}
          {!data?.topFreelancers?.length && <p className="text-[#8b8ba3] text-sm">No data yet.</p>}
        </div>
      </div>
    </DashboardPage>
  );
};

export default Analytics;
