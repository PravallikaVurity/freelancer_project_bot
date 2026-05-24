import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaTrash, FaEye, FaFire, FaStar } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import Badge from "../../components/Badge";
import { CardSkeleton } from "../../components/Skeleton";
import ReviewModal from "../../components/ReviewModal";
import { getMyProjects, deleteProject } from "../../services/projectApi";
import toast from "react-hot-toast";

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewed, setReviewed] = useState({});

  const fetchProjects = async () => {
    try {
      const { data } = await getMyProjects();
      const list = data.projects || [];
      setProjects(list);
      const reviewedMap = {};
      list.forEach((p) => { if (p.status === "completed") reviewedMap[p._id] = false; });
      setReviewed(reviewedMap);
    } catch (err) {
      console.error("Load projects error:", err);
      toast.error("Unable to load projects");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      toast.success("Project deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <DashboardPage title="My Projects" description="Manage all your posted projects.">
      {reviewTarget && (
        <ReviewModal
          projectId={reviewTarget.projectId}
          revieweeId={reviewTarget.revieweeId}
          revieweeName={reviewTarget.revieweeName}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => setReviewed((prev) => ({ ...prev, [reviewTarget.projectId]: true }))}
        />
      )}
      <div className="flex justify-end mb-6">
        <Link to="/client/post-project" className="btn-primary text-sm flex items-center gap-2"><FaPlus /> Post Project</Link>
      </div>

      {loading ? (
        <div className="space-y-4">{Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : projects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-[#8b8ba3] mb-4">No projects yet.</p>
          <Link to="/client/post-project" className="btn-primary text-sm">Post your first project</Link>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/10 text-xs font-medium text-[#8b8ba3] uppercase tracking-wider">
            <span className="col-span-2">Project</span><span>Budget</span><span>Proposals</span><span>Status</span>
          </div>
          {projects.map((p) => (
            <div key={p._id} className="grid md:grid-cols-5 gap-3 px-6 py-5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition items-center">
              <div className="md:col-span-2">
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-[#8b8ba3]">{p.category}</p>
              </div>
              <p className="text-[#2ee6a6] font-semibold text-sm">${p.budget?.min}–${p.budget?.max}</p>
              <p className="text-sm text-[#8b8ba3]">{p.proposals?.length || 0} proposals</p>
              <div className="flex items-center gap-2">
                <Badge status={p.status} />
                <Link to={`/client/projects/${p._id}/proposals`} className="p-1.5 glass-light rounded-lg text-[#8b8ba3] hover:text-[#2ee6a6] transition" title="View Proposals"><FaEye /></Link>
                {p.proposals?.length > 0 && (
                  <Link to={`/client/projects/${p._id}/battle`} className="p-1.5 glass-light rounded-lg text-[#8b8ba3] hover:text-orange-400 transition" title="Battle Mode">
                    <FaFire />
                  </Link>
                )}
                {p.status === "completed" && p.selectedFreelancer && !reviewed[p._id] && (
                  <button
                    type="button"
                    onClick={() => setReviewTarget({ projectId: p._id, revieweeId: p.selectedFreelancer._id || p.selectedFreelancer, revieweeName: p.selectedFreelancer?.name || "Freelancer" })}
                    className="p-1.5 glass-light rounded-lg text-yellow-400 hover:text-yellow-300 transition"
                    title="Leave Review"
                  >
                    <FaStar />
                  </button>
                )}
                {reviewed[p._id] && (
                  <span className="text-xs text-[#2ee6a6] px-1">✓</span>
                )}
                <button type="button" onClick={() => handleDelete(p._id)} className="p-1.5 glass-light rounded-lg text-[#8b8ba3] hover:text-[#ff6b6b] transition"><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default ManageProjects;
