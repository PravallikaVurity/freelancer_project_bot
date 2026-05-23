import { Link, useLocation } from "react-router-dom";
import {
  FaBriefcase, FaFileAlt, FaWallet, FaComments, FaBookmark,
  FaUser, FaHome, FaPlus, FaList, FaUsers, FaTools,
  FaExclamationTriangle, FaChartBar, FaTachometerAlt,
} from "react-icons/fa";

const navMap = {
  freelancer: [
    { path: "/freelancer/dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { path: "/freelancer/jobs", label: "Browse Jobs", icon: FaBriefcase },
    { path: "/freelancer/proposals", label: "My Proposals", icon: FaFileAlt },
    { path: "/freelancer/saved", label: "Saved Jobs", icon: FaBookmark },
    { path: "/freelancer/earnings", label: "Earnings", icon: FaWallet },
    { path: "/freelancer/messages", label: "Messages", icon: FaComments },
    { path: "/freelancer/profile", label: "Profile", icon: FaUser },
  ],
  client: [
    { path: "/client/dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { path: "/client/post-project", label: "Post Project", icon: FaPlus },
    { path: "/client/projects", label: "My Projects", icon: FaList },
    { path: "/client/messages", label: "Messages", icon: FaComments },
    { path: "/client/profile", label: "Profile", icon: FaUser },
  ],
  admin: [
    { path: "/admin/dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { path: "/admin/users", label: "Manage Users", icon: FaUsers },
    { path: "/admin/skills", label: "Manage Skills", icon: FaTools },
    { path: "/admin/disputes", label: "Disputes", icon: FaExclamationTriangle },
    { path: "/admin/analytics", label: "Analytics", icon: FaChartBar },
  ],
};

const Sidebar = ({ role = "freelancer", onNavigate }) => {
  const { pathname } = useLocation();
  const items = navMap[role] || navMap.freelancer;

  return (
    <aside className="flex flex-col h-full">
      <div className="p-5 border-b border-white/10">
        <Link to="/" onClick={onNavigate} className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] text-[#07070d] text-sm font-extrabold shrink-0">FB</span>
          <span className="text-gradient truncate">Freelancer Board</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="text-xs uppercase tracking-widest text-[#8b8ba3] px-3 mb-3">Menu</p>
        {items.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <Link key={path} to={path} onClick={onNavigate}
              className={`sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${active ? "sidebar-link-active" : ""}`}>
              <Icon className={`text-lg shrink-0 ${active ? "text-[#2ee6a6]" : "text-[#8b8ba3]"}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <Link to="/" onClick={onNavigate} className="sidebar-link flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-[#8b8ba3] hover:text-[#e8e8f0]">
          <FaHome className="text-lg shrink-0" />
          <span>Back to Home</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
