import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import StarRating from "../../components/StarRating";
import Badge from "../../components/Badge";
import LoadingSpinner from "../../components/LoadingSpinner";
import { getProposals } from "../../services/projectApi";
import { updateProposalStatus } from "../../services/bidApi";
import toast from "react-hot-toast";

const ViewProposals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProposals(id).then(({ data }) => setProposals(data.proposals)).catch(() => toast.error("Failed to load proposals")).finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (proposalId, status) => {
    try {
      const { data } = await updateProposalStatus(proposalId, status);
      setProposals((prev) => prev.map((p) => p._id === proposalId ? { ...p, status: data.proposal.status } : p));
      toast.success(`Proposal ${status}`);
    } catch { toast.error("Failed to update proposal"); }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <DashboardPage title="Proposals" description={`${proposals.length} proposals received`}>
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#e8e8f0] text-sm mb-6 transition">
        <FaArrowLeft /> Back to projects
      </button>

      {proposals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">No proposals yet.</div>
      ) : (
        <div className="space-y-4">
          {proposals.map((p) => (
            <div key={p._id} className="glass rounded-2xl p-6 card-glow">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold">
                    {p.freelancer?.name?.[0]}
                  </div>
                  <div>
                    <p className="font-display font-bold">{p.freelancer?.name}</p>
                    <StarRating rating={p.freelancer?.rating || 0} />
                  </div>
                </div>
                <Badge status={p.status} />
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-4 text-sm">
                <div className="glass-light rounded-xl p-3 text-center">
                  <p className="text-[#8b8ba3] text-xs mb-1">Bid Amount</p>
                  <p className="font-bold text-[#2ee6a6]">${p.bidAmount}</p>
                </div>
                <div className="glass-light rounded-xl p-3 text-center">
                  <p className="text-[#8b8ba3] text-xs mb-1">Delivery</p>
                  <p className="font-bold">{p.deliveryTime} days</p>
                </div>
                <div className="glass-light rounded-xl p-3 text-center">
                  <p className="text-[#8b8ba3] text-xs mb-1">Projects Done</p>
                  <p className="font-bold">{p.freelancer?.completedProjects || 0}</p>
                </div>
              </div>

              <p className="text-[#8b8ba3] text-sm mb-4 line-clamp-3">{p.coverLetter}</p>

              {p.status === "pending" && (
                <div className="flex gap-3">
                  <button type="button" onClick={() => handleStatus(p._id, "accepted")} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><FaCheck /> Accept</button>
                  <button type="button" onClick={() => handleStatus(p._id, "rejected")} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2 hover:border-[#ff6b6b]/50 hover:text-[#ff6b6b]"><FaTimes /> Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default ViewProposals;
