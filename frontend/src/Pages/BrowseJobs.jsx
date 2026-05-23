import { useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt, FaClock, FaArrowRight } from "react-icons/fa";
import DashboardPage from "../components/DashboardPage";

const allJobs = [
  { id: 1, title: "Community Website Redesign", budget: "$1,200", type: "Fixed", location: "Remote", posted: "2h ago", category: "Web Development", skills: ["React", "UI/UX"] },
  { id: 2, title: "Nonprofit Social Media Kit", budget: "$45/hr", type: "Hourly", location: "Remote", posted: "5h ago", category: "Design", skills: ["Figma", "Canva"] },
  { id: 3, title: "Mobile App UI for Education NGO", budget: "$2,500", type: "Fixed", location: "Hybrid", posted: "1d ago", category: "Mobile", skills: ["React Native", "Figma"] },
  { id: 4, title: "SEO & Content Strategy", budget: "$30/hr", type: "Hourly", location: "Remote", posted: "3h ago", category: "Marketing", skills: ["SEO", "Copywriting"] },
  { id: 5, title: "WordPress Site for Local Clinic", budget: "$800", type: "Fixed", location: "Remote", posted: "2d ago", category: "Web Development", skills: ["WordPress", "PHP"] },
  { id: 6, title: "Annual Report Design", budget: "$600", type: "Fixed", location: "Remote", posted: "4h ago", category: "Design", skills: ["Figma", "InDesign"] },
];

const BrowseJobs = () => {
  const [search, setSearch] = useState("");

  const filtered = allJobs.filter((j) =>
    !search.trim() ||
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
    j.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardPage title="Browse Jobs" description="Discover projects that match your skills and mission.">
      <form onSubmit={(e) => e.preventDefault()} className="glass rounded-2xl p-4 mb-6 flex items-center gap-3">
        <FaSearch className="text-[#8b8ba3] ml-1 shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs by title, skill, or keyword..."
          className="flex-1 bg-transparent outline-none text-[#e8e8f0] placeholder:text-[#8b8ba3]"
        />
        <button type="submit" className="btn-primary text-sm py-2 px-4 shrink-0">Search</button>
      </form>

      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">No jobs match your search.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((job) => (
            <article key={job.id} className="glass rounded-2xl p-6 card-glow hover:border-white/15 transition">
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div>
                  <span className="text-xs text-[#8b8ba3] mb-1 block">{job.category}</span>
                  <h3 className="font-display text-xl font-bold">{job.title}</h3>
                </div>
                <span className="text-[#2ee6a6] font-semibold self-start">{job.budget}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skills.map((s) => (
                  <span key={s} className="px-2.5 py-1 rounded-full glass-light text-xs text-[#e8e8f0]">{s}</span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 text-sm text-[#8b8ba3]">
                  <span className="px-3 py-1 rounded-full glass-light">{job.type}</span>
                  <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[#9b6dff]" />{job.location}</span>
                  <span className="flex items-center gap-1"><FaClock />{job.posted}</span>
                </div>
                <Link to="/register" className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
                  Apply now <FaArrowRight className="text-xs" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 glass rounded-2xl p-8 text-center">
        <p className="text-[#8b8ba3] mb-4">Sign up to access all jobs, submit proposals, and track your work.</p>
        <Link to="/register" className="btn-primary">Get started free <FaArrowRight className="text-sm" /></Link>
      </div>
    </DashboardPage>
  );
};

export default BrowseJobs;
