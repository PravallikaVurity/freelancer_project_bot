import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaDollarSign, FaArrowLeft, FaEnvelope, FaPhone, FaInstagram, FaTwitter, FaLinkedin, FaPaperclip, FaTimes } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import Badge from "../../components/Badge";
import StarRating from "../../components/StarRating";
import LoadingSpinner from "../../components/LoadingSpinner";
import VoiceRecorder from "../../components/VoiceRecorder";
import { getProject, submitProposal, getScamReport } from "../../services/projectApi";
import { getOrCreateConversation } from "../../services/chatApi";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposal, setProposal] = useState({ coverLetter: "", bidAmount: "", deliveryTime: "" });
  const [files, setFiles] = useState([]);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [submittedProposal, setSubmittedProposal] = useState(null);
  const [submittedProposalId, setSubmittedProposalId] = useState(null);

  const [scamReport, setScamReport] = useState(null);

  useEffect(() => {
    getProject(id)
      .then(({ data }) => {
        setProject(data.project);
        const existing = data.project?.proposals?.find(
          (p) => p.freelancer?._id === user?._id || p.freelancer === user?._id
        );
        if (existing) setAlreadyApplied(true);
        // Fetch scam report after project loads
        getScamReport(id).then(({ data: r }) => setScamReport(r.report)).catch(() => {});
      })
      .catch(() => toast.error("Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (files.length + selected.length > 3) { toast.error("Max 3 files allowed"); return; }
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("coverLetter", proposal.coverLetter);
      formData.append("bidAmount", proposal.bidAmount);
      formData.append("deliveryTime", proposal.deliveryTime);
      files.forEach((f) => formData.append("attachments", f));

      // Submit as JSON (file upload is optional enhancement — backend accepts both)
      const payload = {
        coverLetter: proposal.coverLetter,
        bidAmount: Number(proposal.bidAmount),
        deliveryTime: Number(proposal.deliveryTime),
      };
      const { data } = await submitProposal(id, payload);
      setSubmittedProposalId(data.proposal?._id || null);

      // Auto-create conversation with client
      if (project?.client?._id) {
        await getOrCreateConversation({ userId: project.client._id, projectId: id }).catch(() => {});
      }

      // Broadcast via socket
      try {
        const sock = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001", { auth: { userId: user?._id } });
        sock.emit("broadcastProposal", { projectId: id, projectTitle: project?.title, freelancerName: user?.name });
        setTimeout(() => sock.disconnect(), 2000);
      } catch { /* non-critical */ }

      window.__fbAdminLog?.({ type: "proposal", message: `New proposal submitted on "${project?.title}"` });
      setAlreadyApplied(true);
      setSubmittedProposal({ ...proposal, projectTitle: project?.title, files: files.map((f) => f.name) });
      toast.success("Proposal submitted! Redirecting to My Proposals...");
      setShowForm(false);
      setTimeout(() => navigate("/freelancer/proposals"), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit proposal");
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!project) return <div className="text-center text-[#8b8ba3] py-20">Project not found.</div>;

  const { title, description, budget, category, skills, status, client, deadline, createdAt } = project;

  return (
    <DashboardPage title="">
      <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#e8e8f0] text-sm mb-6 transition">
        <FaArrowLeft /> Back to jobs
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scam Risk Badge */}
          {scamReport && scamReport.riskLevel !== "low" && (
            <div className={`rounded-xl px-4 py-3 mb-4 border text-sm ${
              scamReport.riskLevel === "high"
                ? "bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]"
                : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
            }`}>
              <p className="font-semibold mb-1">
                {scamReport.riskLevel === "high" ? "🔴 High Risk" : "🟡 Medium Risk"} — Suspicious Activity Detected
              </p>
              <ul className="space-y-0.5 text-xs opacity-90">
                {scamReport.reasons.map((r, i) => <li key={i}>⚠ {r}</li>)}
              </ul>
            </div>
          )}

          {/* Project info */}
          <div className="glass rounded-2xl p-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2"><Badge status={status} /><span className="text-xs text-[#8b8ba3]">{category}</span></div>
                <h1 className="font-display text-2xl font-bold">{title}</h1>
              </div>
              <span className="text-[#2ee6a6] font-bold text-xl shrink-0">
                {budget?.type === "hourly" ? `$${budget.min}–$${budget.max}/hr` : `$${budget?.min}–$${budget?.max}`}
              </span>
            </div>
            <p className="text-[#8b8ba3] leading-relaxed mb-6">{description}</p>
            <div className="flex flex-wrap gap-2">
              {skills?.map((s) => <span key={s} className="px-3 py-1 rounded-full glass-light text-xs text-[#e8e8f0]">{s}</span>)}
            </div>
          </div>

          {/* Submitted proposal detail */}
          {alreadyApplied && submittedProposal && (
            <div className="glass rounded-2xl p-8 border border-[#2ee6a6]/20">
              <h2 className="font-display text-xl font-bold mb-4 text-[#2ee6a6]">✓ Proposal Submitted</h2>
              <div className="space-y-3 text-sm">
                <div><span className="text-[#8b8ba3]">Project:</span> <span className="font-medium ml-2">{submittedProposal.projectTitle}</span></div>
                <div><span className="text-[#8b8ba3]">Bid Amount:</span> <span className="font-medium text-[#2ee6a6] ml-2">${submittedProposal.bidAmount}</span></div>
                <div><span className="text-[#8b8ba3]">Timeline:</span> <span className="font-medium ml-2">{submittedProposal.deliveryTime} days</span></div>
                <div><span className="text-[#8b8ba3]">Status:</span> <span className="ml-2 px-2.5 py-1 rounded-full bg-yellow-400/15 text-yellow-400 text-xs font-medium">Pending</span></div>
                <div>
                  <span className="text-[#8b8ba3]">Description:</span>
                  <p className="mt-1 text-[#e8e8f0] leading-relaxed">{submittedProposal.coverLetter}</p>
                </div>
                {submittedProposal.files?.length > 0 && (
                  <div>
                    <span className="text-[#8b8ba3]">Uploaded Files:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {submittedProposal.files.map((f) => (
                        <span key={f} className="px-2.5 py-1 glass-light rounded-lg text-xs flex items-center gap-1">
                          <FaPaperclip className="text-[#9b6dff]" />{f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proposal form */}
          {showForm && (
            <div className="glass rounded-2xl p-8">
              <h2 className="font-display text-xl font-bold mb-6">Apply Now</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Auto-filled project name */}
                <div>
                  <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Project</label>
                  <div className="input-field !pl-4 text-[#8b8ba3] cursor-not-allowed bg-white/[0.02]">{title}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Your Bid ($)</label>
                    <input type="number" required value={proposal.bidAmount} onChange={(e) => setProposal({ ...proposal, bidAmount: e.target.value })} placeholder="500" className="input-field !pl-4" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Delivery (days)</label>
                    <input type="number" required value={proposal.deliveryTime} onChange={(e) => setProposal({ ...proposal, deliveryTime: e.target.value })} placeholder="7" className="input-field !pl-4" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Cover Letter</label>
                  <textarea required rows={6} value={proposal.coverLetter} onChange={(e) => setProposal({ ...proposal, coverLetter: e.target.value })}
                    placeholder="Explain why you're the best fit..." className="input-field !pl-4 resize-none" />
                </div>
                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Attach Files (optional, max 3)</label>
                  <label className="flex items-center gap-2 px-4 py-2.5 glass-light rounded-xl border border-white/10 cursor-pointer hover:border-white/20 transition text-sm text-[#8b8ba3] w-fit">
                    <FaPaperclip className="text-[#9b6dff]" /> Choose files
                    <input type="file" multiple accept=".pdf,.doc,.docx,.zip,.png,.jpg" onChange={handleFileChange} className="sr-only" />
                  </label>
                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {files.map((f, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1 glass-light rounded-lg text-xs">
                          <FaPaperclip className="text-[#9b6dff]" />{f.name}
                          <button type="button" onClick={() => removeFile(i)} className="text-[#8b8ba3] hover:text-[#ff6b6b] ml-1"><FaTimes /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {/* Voice Proposal */}
                <VoiceRecorder proposalId={submittedProposalId} />

                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Submitting..." : "Submit Proposal"}</button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Project details + submit button */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-bold mb-4">Project Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-[#8b8ba3]"><FaDollarSign className="text-[#2ee6a6]" /><span>Budget: <strong className="text-[#e8e8f0]">{budget?.type}</strong></span></div>
              {deadline && <div className="flex items-center gap-2 text-[#8b8ba3]"><FaClock className="text-[#9b6dff]" /><span>Deadline: <strong className="text-[#e8e8f0]">{new Date(deadline).toLocaleDateString()}</strong></span></div>}
              <div className="flex items-center gap-2 text-[#8b8ba3]"><FaClock /><span>Posted: <strong className="text-[#e8e8f0]">{new Date(createdAt).toLocaleDateString()}</strong></span></div>
            </div>
            {!showForm && status === "open" && !alreadyApplied && (
              <button type="button" onClick={() => setShowForm(true)} className="btn-primary w-full mt-6 text-sm">Apply Now</button>
            )}
            {alreadyApplied && (
              <p className="text-center text-sm text-[#2ee6a6] mt-6 font-medium">✓ You have already applied for this project</p>
            )}
          </div>

          {/* Client info */}
          {client && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-display font-bold mb-4">Posted By</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm shrink-0">
                  {client.name?.[0]}
                </div>
                <div>
                  <p className="font-medium">{client.name}</p>
                  {client.location && <p className="text-xs text-[#8b8ba3] flex items-center gap-1"><FaMapMarkerAlt />{client.location}</p>}
                </div>
              </div>
              <StarRating rating={client.rating} />

              {/* Contact details — only if client opted to share */}
              {client.showContact && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2 text-sm">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaEnvelope className="text-[#2ee6a6] shrink-0" />{client.email}
                    </a>
                  )}
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaPhone className="text-[#9b6dff] shrink-0" />{client.phone}
                    </a>
                  )}
                  {client.instagram && (
                    <a href={`https://instagram.com/${client.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaInstagram className="text-[#ff6b6b] shrink-0" />{client.instagram}
                    </a>
                  )}
                  {client.twitter && (
                    <a href={`https://twitter.com/${client.twitter.replace("@", "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaTwitter className="text-[#9b6dff] shrink-0" />{client.twitter}
                    </a>
                  )}
                  {client.linkedin && (
                    <a href={client.linkedin.startsWith("http") ? client.linkedin : `https://${client.linkedin}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaLinkedin className="text-[#2ee6a6] shrink-0" />{client.linkedin}
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default JobDetail;
