import { useState, useEffect, useRef } from "react";
import { FaSearch, FaSync } from "react-icons/fa";
import { io } from "socket.io-client";
import DashboardPage from "../../components/DashboardPage";
import ProjectCard from "../../components/ProjectCard";
import { CardSkeleton } from "../../components/Skeleton";
import { getProjects, saveJob, getSavedJobs } from "../../services/projectApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const categories = ["All", "Web Development", "Design", "Mobile", "Marketing", "Content", "Data"];

// Fallback jobs shown when backend is unreachable — keeps UI functional
const FALLBACK_PROJECTS = [
  {
    _id: "fallback-1", title: "Remote Software Engineer (JavaScript)", category: "Web Development",
    description: "Build and maintain software projects and contribute to AI engineering workflows. Strong JavaScript/TypeScript skills required. Remote, contract position.",
    skills: ["JavaScript", "TypeScript", "Git", "Docker"],
    budget: { type: "fixed", min: 50000, max: 80000 }, status: "open",
    client: { name: "Turing", location: "Delhi, India", rating: 4.8 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "fallback-2", title: "Frontend React Developer", category: "Web Development",
    description: "Develop responsive frontend pages and API integrations for a fast-growing SaaS product. Experience with React hooks and REST APIs required.",
    skills: ["React", "CSS", "TypeScript"],
    budget: { type: "fixed", min: 30000, max: 60000 }, status: "open",
    client: { name: "TechNova", location: "Remote", rating: 4.5 },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "fallback-3", title: "Backend Node.js Developer", category: "Web Development",
    description: "Build backend APIs and optimize database performance for a high-traffic platform. Must have experience with MongoDB and Express.",
    skills: ["Node.js", "MongoDB", "Express"],
    budget: { type: "fixed", min: 40000, max: 70000 }, status: "open",
    client: { name: "CodeSphere", location: "Remote", rating: 4.6 },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "fallback-4", title: "Mobile App UI Designer", category: "Design",
    description: "Design mobile screens for a food delivery application. Need complete UI kit with Figma prototypes and handoff-ready assets.",
    skills: ["Figma", "UI/UX Design"],
    budget: { type: "fixed", min: 8000, max: 12000 }, status: "open",
    client: { name: "DeliverEase", location: "Bangalore, India", rating: 4.3 },
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "fallback-5", title: "Python Data Analysis & Visualization", category: "Data",
    description: "Write data analysis scripts for processing large CSV datasets and generating visual reports using matplotlib and pandas.",
    skills: ["Python", "MongoDB"],
    budget: { type: "fixed", min: 12000, max: 18000 }, status: "open",
    client: { name: "DataInsights", location: "Mumbai, India", rating: 4.7 },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: "fallback-6", title: "SEO & Content Marketing Strategy", category: "Marketing",
    description: "Audit website, perform keyword research, optimize on-page content, and create a 3-month content calendar.",
    skills: ["SEO"],
    budget: { type: "hourly", min: 25, max: 40 }, status: "open",
    client: { name: "GrowthHQ", location: "Remote", rating: 4.4 },
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const JobFeed = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const toastShown = useRef(false);
  const searchRef = useRef(search);
  searchRef.current = search;

  // Real-time: listen for new projects posted by clients
  useEffect(() => {
    const sock = io(import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001", {
      auth: { userId: user?._id },
    });
    sock.on("newProject", () => {
      fetchProjects(1, "All", "");
      toast("New job posted!", { icon: "🆕" });
    });
    return () => sock.disconnect();
  }, [user]);

  const fetchProjects = async (currentPage, currentCategory, currentSearch) => {
    setLoading(true);
    setFetchError(false);
    setUsingFallback(false);
    try {
      const params = { page: currentPage, limit: 9 };
      if (currentSearch) params.search = currentSearch;
      if (currentCategory !== "All") params.category = currentCategory;
      const { data } = await getProjects(params);
      console.log("Jobs fetched:", data.total, "total,", data.projects?.length, "on this page");
      const fetched = data.projects || [];
      if (fetched.length === 0 && !currentSearch && currentCategory === "All" && currentPage === 1) {
        // DB returned empty — show fallback so page is never blank
        setProjects(FALLBACK_PROJECTS);
        setTotal(FALLBACK_PROJECTS.length);
        setUsingFallback(true);
      } else {
        setProjects(fetched);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Jobs fetch error:", err);
      // Backend unreachable — show fallback jobs so page is never blank
      setProjects(FALLBACK_PROJECTS);
      setTotal(FALLBACK_PROJECTS.length);
      setUsingFallback(true);
      setFetchError(true);
      if (!toastShown.current) {
        toastShown.current = true;
        toast.error("Could not reach server — showing sample jobs");
      }
    } finally { setLoading(false); }
  };

  const handleRetry = () => {
    toastShown.current = false;
    fetchProjects(page, category, searchRef.current);
  };

  const fetchSaved = async () => {
    try {
      const { data } = await getSavedJobs();
      setSavedIds(data.savedJobs.map((j) => j._id || j));
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchProjects(page, category, searchRef.current); }, [page, category]);
  useEffect(() => { fetchSaved(); }, []);

  const handleSave = async (id) => {
    if (id.startsWith("fallback-")) { toast("Connect to server to save jobs"); return; }
    try {
      const { data } = await saveJob(id);
      setSavedIds(data.savedJobs);
      toast.success(savedIds.includes(id) ? "Removed from saved" : "Job saved!");
    } catch { toast.error("Failed to save job"); }
  };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchProjects(1, category, search); };

  // Filter fallback projects by category/search when using fallback
  const displayProjects = usingFallback
    ? FALLBACK_PROJECTS.filter((p) => {
        const matchCat = category === "All" || p.category === category;
        const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
        return matchCat && matchSearch;
      })
    : projects;

  return (
    <DashboardPage title="Browse Jobs" description="Discover projects that match your skills.">
      <form onSubmit={handleSearch} className="glass rounded-2xl p-4 mb-6 flex items-center gap-3">
        <FaSearch className="text-[#8b8ba3] ml-1 shrink-0" />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, skill, or keyword..." className="flex-1 bg-transparent outline-none text-[#e8e8f0] placeholder:text-[#8b8ba3]" />
        <button type="submit" className="btn-primary text-sm py-2 px-4 shrink-0">Search</button>
      </form>

      <div className="flex gap-2 flex-wrap mb-6">
        {categories.map((c) => (
          <button key={c} type="button" onClick={() => { setCategory(c); setPage(1); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${category === c ? "bg-[#2ee6a6] text-[#07070d]" : "glass-light text-[#8b8ba3] hover:text-[#e8e8f0]"}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Server warning banner — only shown when using fallback */}
      {fetchError && (
        <div className="glass rounded-2xl px-5 py-3 mb-4 flex items-center justify-between gap-3 border border-yellow-400/20">
          <p className="text-sm text-yellow-400">Backend server is offline. Showing sample jobs — start your backend to see live data.</p>
          <button type="button" onClick={handleRetry} className="flex items-center gap-1.5 text-sm text-[#2ee6a6] hover:underline shrink-0">
            <FaSync className="text-xs" /> Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : displayProjects.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">No jobs available currently.</div>
      ) : (
        <>
          <p className="text-sm text-[#8b8ba3] mb-4">
            {usingFallback ? `${displayProjects.length} sample jobs` : `${total} jobs found`}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayProjects.map((p) => <ProjectCard key={p._id} project={p} onSave={handleSave} isSaved={savedIds.includes(p._id)} />)}
          </div>
          {!usingFallback && (
            <div className="flex justify-center gap-2 mt-8">
              {Array(Math.ceil(total / 9)).fill(0).map((_, i) => (
                <button key={i} type="button" onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition ${page === i + 1 ? "bg-[#2ee6a6] text-[#07070d]" : "glass-light text-[#8b8ba3] hover:text-[#e8e8f0]"}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardPage>
  );
};

export default JobFeed;
