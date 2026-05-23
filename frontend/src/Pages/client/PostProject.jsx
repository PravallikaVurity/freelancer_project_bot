import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import DashboardPage from "../../components/DashboardPage";
import { createProject, getScamReport } from "../../services/projectApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const categories = ["Web Development", "Design", "Mobile", "Marketing", "Content", "Data", "Other"];

const PostProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [scamWarning, setScamWarning] = useState(null);
  const [form, setForm] = useState({
    title: "", description: "", category: "Web Development",
    skills: "", budgetType: "fixed", budgetMin: "", budgetMax: "",
    deadline: "", status: "open",
  });

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Detect mock/invalid session before hitting the backend
    const token = localStorage.getItem("fb_token");
    if (!token || token === "mock_token") {
      toast.error("Your session is not valid. Please log out and log in again with the backend running.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        budget: { type: form.budgetType, min: Number(form.budgetMin), max: Number(form.budgetMax) },
        deadline: form.deadline || undefined, status: form.status,
      };

      console.log("Posting project:", payload);
      const { data } = await createProject(payload);
      console.log("Project created:", data.project?._id, data.project?.title);

      // Check scam report after a short delay (detection runs async on backend)
      setTimeout(async () => {
        try {
          const { data: r } = await getScamReport(data.project._id);
          if (r.report && r.report.riskLevel !== "low") setScamWarning(r.report);
        } catch { /* non-critical */ }
      }, 1500);

      // Broadcast new project to all connected freelancers in real-time
      try {
        const sock = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001", { auth: { userId: user?._id } });
        sock.emit("broadcastProject", { title: form.title });
        setTimeout(() => sock.disconnect(), 2000);
      } catch { /* non-critical */ }

      window.__fbAdminLog?.({ type: "project", message: `New project posted: "${form.title}"` });
      toast.success("Project created successfully!");
      navigate("/client/projects");
    } catch (err) {
      console.error("Project posting error:", err);
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401) {
        toast.error("Session expired. Please log out and log in again.");
      } else if (status === 403) {
        toast.error("Only client accounts can post projects.");
      } else if (!err.response) {
        toast.error("Cannot reach server. Make sure the backend is running on port 5000.");
      } else {
        toast.error(msg || "Unable to create project");
      }
    } finally { setLoading(false); }
  };

  return (
    <DashboardPage title="Post a Project" description="Describe your project to attract the best freelancers.">
      <div className="max-w-3xl">
        {/* Scam Warning Banner */}
        {scamWarning && (
          <div className={`rounded-xl px-5 py-4 mb-6 border text-sm ${
            scamWarning.riskLevel === "high"
              ? "bg-[#ff6b6b]/10 border-[#ff6b6b]/30 text-[#ff6b6b]"
              : "bg-yellow-400/10 border-yellow-400/30 text-yellow-400"
          }`}>
            <p className="font-semibold mb-2">
              {scamWarning.riskLevel === "high" ? "🔴 High Risk Detected" : "🟡 Medium Risk Detected"} — Your project was flagged
            </p>
            <ul className="space-y-1 text-xs opacity-90">
              {scamWarning.reasons.map((r, i) => <li key={i}>⚠ {r}</li>)}
            </ul>
            <p className="text-xs mt-2 opacity-70">Your project was still posted. Please review the above concerns.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Project Title *</label>
            <input type="text" required value={form.title} onChange={set("title")} placeholder="e.g. Community Website Redesign" className="input-field !pl-4" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Description *</label>
            <textarea required rows={6} value={form.description} onChange={set("description")}
              placeholder="Describe your project in detail..." className="input-field !pl-4 resize-none" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Category *</label>
              <select value={form.category} onChange={set("category")} className="input-field !pl-4 !appearance-auto cursor-pointer">
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Status</label>
              <select value={form.status} onChange={set("status")} className="input-field !pl-4 !appearance-auto cursor-pointer">
                <option value="open">Open</option>
                <option value="draft">Save as Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Required Skills (comma separated)</label>
            <input type="text" value={form.skills} onChange={set("skills")} placeholder="React, Node.js, Figma" className="input-field !pl-4" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Budget Type</label>
            <div className="flex gap-3">
              {["fixed", "hourly"].map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, budgetType: t })}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition capitalize ${form.budgetType === t ? "bg-[#2ee6a6] text-[#07070d]" : "glass-light text-[#8b8ba3] hover:text-[#e8e8f0]"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Min Budget ($) *</label>
              <input type="number" required value={form.budgetMin} onChange={set("budgetMin")} placeholder="500" className="input-field !pl-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Max Budget ($) *</label>
              <input type="number" required value={form.budgetMax} onChange={set("budgetMax")} placeholder="1500" className="input-field !pl-4" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Deadline (optional)</label>
            <input type="date" value={form.deadline} onChange={set("deadline")} className="input-field !pl-4" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">{loading ? "Posting..." : "Post Project"}</button>
            <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </DashboardPage>
  );
};

export default PostProject;
