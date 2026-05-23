import { useEffect, useState } from "react";
import DashboardPage from "../../components/DashboardPage";
import Badge from "../../components/Badge";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getDisputes, resolveDispute } from "../../services/adminApi";
import toast from "react-hot-toast";

const Disputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(null);
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    getDisputes().then(({ data }) => setDisputes(data.disputes)).catch(() => toast.error("Failed to load disputes")).finally(() => setLoading(false));
  }, []);

  const handleResolve = async (id) => {
    if (!resolution.trim()) return toast.error("Enter a resolution");
    try {
      const { data } = await resolveDispute(id, resolution);
      setDisputes((prev) => prev.map((d) => d._id === id ? data.dispute : d));
      setResolving(null);
      setResolution("");
      toast.success("Dispute resolved");
    } catch { toast.error("Failed to resolve dispute"); }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <DashboardPage title="Disputes" description="Review and resolve platform disputes.">
      {disputes.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">No disputes found.</div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <div key={d._id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="font-display font-bold">{d.project?.title}</p>
                  <p className="text-xs text-[#8b8ba3] mt-1">Raised by <strong className="text-[#e8e8f0]">{d.raisedBy?.name}</strong> against <strong className="text-[#e8e8f0]">{d.against?.name}</strong></p>
                </div>
                <Badge status={d.status} />
              </div>
              <p className="text-sm font-medium mb-1">{d.reason}</p>
              <p className="text-[#8b8ba3] text-sm mb-4">{d.description}</p>
              {d.resolution && <p className="text-xs text-[#2ee6a6] bg-[#2ee6a6]/10 rounded-xl px-4 py-2 mb-4">Resolution: {d.resolution}</p>}
              {d.status === "open" && (
                resolving === d._id ? (
                  <div className="flex gap-3">
                    <input value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Enter resolution..." className="input-field !pl-4 flex-1" />
                    <button type="button" onClick={() => handleResolve(d._id)} className="btn-primary text-sm py-2 px-4">Resolve</button>
                    <button type="button" onClick={() => setResolving(null)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setResolving(d._id)} className="btn-primary text-sm py-2 px-4">Resolve Dispute</button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default Disputes;
