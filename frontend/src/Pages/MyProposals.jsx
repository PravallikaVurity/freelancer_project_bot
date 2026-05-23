import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { FaPlus, FaTimes } from "react-icons/fa";
import DashboardPage from "../components/DashboardPage";
import Badge from "../components/Badge";
import { CardSkeleton } from "../components/Skeleton";
import { getMyProposals, withdrawProposal } from "../services/bidApi";
import { getProjects, submitProposal } from "../services/projectApi";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const CreateProposalModal = ({ onClose, onCreated }) => {
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ projectId: "", coverLetter: "", bidAmount: "", deliveryTime: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getProjects({ limit: 50, status: "open" })
      .then(({ data }) => setProjects(data.projects || []))
      .catch(() => toast.error("Unable to load projects"));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.projectId) { toast.error("Please select a project"); return; }
    setSubmitting(true);
    try {
      await submitProposal(form.projectId, {
        coverLetter: form.coverLetter,
        bidAmount: Number(form.bidAmount),
        deliveryTime: Number(form.deliveryTime),
      });
      toast.success("Proposal submitted!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit proposal");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-lg p-8 relative animate-fade-up">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#8b8ba3] hover:text-[#e8e8f0] transition">
          <FaTimes />
        </button>
        <h2 className="font-display text-xl font-bold mb-6">Create Proposal</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Select Project *</label>
            <select required value={form.projectId} onChange={set("projectId")} className="input-field !pl-4 !appearance-auto cursor-pointer">
              <option value="">— Choose a project —</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Bid Amount ($) *</label>
              <input type="number" required min="1" value={form.bidAmount} onChange={set("bidAmount")} placeholder="500" className="input-field !pl-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Delivery (days) *</label>
              <input type="number" required min="1" value={form.deliveryTime} onChange={set("deliveryTime")} placeholder="7" className="input-field !pl-4" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Proposal Description *</label>
            <textarea required rows={5} value={form.coverLetter} onChange={set("coverLetter")}
              placeholder="Describe your approach, relevant experience, and why you're the best fit..."
              className="input-field !pl-4 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit Proposal"}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MyProposals = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const toastShown = useRef(false);

  const fetchProposals = async () => {
    try {
      const { data } = await getMyProposals();
      setProposals(data.proposals || []);
    } catch (err) {
      console.error("Proposal fetch error:", err);
      setProposals([]);
      if (!toastShown.current) {
        toastShown.current = true;
        toast.error("Failed to load proposals");
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProposals(); }, []);

  // Real-time: refresh when a new proposal is broadcast
  useEffect(() => {
    const sock = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000", {
      auth: { userId: user?._id },
    });
    sock.on("newProposal", () => fetchProposals());
    return () => sock.disconnect();
  }, [user]);

  const handleWithdraw = async (id) => {
    try {
      await withdrawProposal(id);
      setProposals((prev) => prev.map((p) => p._id === id ? { ...p, status: "withdrawn" } : p));
      toast.success("Proposal withdrawn");
    } catch { toast.error("Failed to withdraw"); }
  };

  return (
    <>
      {showModal && (
        <CreateProposalModal
          onClose={() => setShowModal(false)}
          onCreated={fetchProposals}
        />
      )}

      <DashboardPage
        title="My Proposals"
        description="Track proposals you've submitted to clients."
        action={
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary text-sm flex items-center gap-2">
            <FaPlus className="text-xs" /> Create Proposal
          </button>
        }
      >
        {loading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : proposals.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">
            <p className="mb-3">No proposals submitted yet.</p>
            <button type="button" onClick={() => setShowModal(true)} className="btn-primary text-sm inline-flex items-center gap-2">
              <FaPlus className="text-xs" /> Create your first proposal
            </button>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/10 text-xs font-medium text-[#8b8ba3] uppercase tracking-wider">
              <span className="col-span-2">Job</span><span>Bid</span><span>Status</span>
            </div>
            {proposals.map((p) => (
              <div key={p._id} className="grid md:grid-cols-4 gap-3 px-6 py-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition items-center">
                <div className="md:col-span-2">
                  <p className="font-medium">{p.project?.title}</p>
                  <p className="text-xs text-[#8b8ba3]">{new Date(p.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-[#2ee6a6] font-semibold">${p.bidAmount}</p>
                <div className="flex items-center gap-2">
                  <Badge status={p.status} />
                  {p.status === "pending" && (
                    <button type="button" onClick={() => handleWithdraw(p._id)} className="text-xs text-[#8b8ba3] hover:text-[#ff6b6b] transition">Withdraw</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardPage>
    </>
  );
};

export default MyProposals;
