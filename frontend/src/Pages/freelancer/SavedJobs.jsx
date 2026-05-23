import { useEffect, useState } from "react";
import { FaBookmark } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import ProjectCard from "../../components/ProjectCard";
import { CardSkeleton } from "../../components/Skeleton";
import { getSavedJobs, saveJob } from "../../services/projectApi";
import toast from "react-hot-toast";

const SavedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const { data } = await getSavedJobs();
      setJobs(data.savedJobs);
    } catch { toast.error("Failed to load saved jobs"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleRemove = async (id) => {
    try {
      await saveJob(id);
      setJobs((prev) => prev.filter((j) => j._id !== id));
      toast.success("Removed from saved");
    } catch { toast.error("Failed to remove"); }
  };

  return (
    <DashboardPage title="Saved Jobs" description="Jobs you've bookmarked for later.">
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{Array(4).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : jobs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <FaBookmark className="text-4xl text-[#8b8ba3] mx-auto mb-4" />
          <p className="text-[#8b8ba3]">No saved jobs yet. Browse jobs and bookmark ones you like.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((job) => <ProjectCard key={job._id} project={job} onSave={handleRemove} isSaved />)}
        </div>
      )}
    </DashboardPage>
  );
};

export default SavedJobs;
