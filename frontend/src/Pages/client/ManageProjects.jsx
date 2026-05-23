import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaTrash, FaEye, FaFire } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import Badge from "../../components/Badge";
import { CardSkeleton } from "../../components/Skeleton";
import { getMyProjects, deleteProject } from "../../services/projectApi";
import toast from "react-hot-toast";

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const { data } = await getMyProjects();
      setProjects(data.projects || []);
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
