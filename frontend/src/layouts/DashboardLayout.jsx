import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import HamburgerButton from "../components/HamburgerButton";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ role }) => {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setSidebarOpen(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [pathname]);

  const pageTitle = pathname.split("/").pop().replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Dashboard";

  return (
    <div className="flex min-h-[100svh] text-[#e8e8f0]">
      {sidebarOpen && (
        <button type="button" className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
      )}

      <aside className={`fixed md:relative z-50 top-0 left-0 h-[100svh] shrink-0 glass border-r border-white/10 transition-all duration-300 ease-out overflow-hidden ${sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-0 md:translate-x-0 md:border-0"}`}>
        <Sidebar role={role} onNavigate={() => { if (window.innerWidth < 768) setSidebarOpen(false); }} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <header className="glass sticky top-0 z-30 border-b border-white/10 h-14 shrink-0 flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <HamburgerButton open={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />
            <h1 className="font-display font-bold text-lg truncate capitalize">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:block text-sm text-[#8b8ba3] truncate max-w-[160px]">{user?.name}</span>
            <span className="hidden sm:block text-xs px-2 py-1 rounded-full glass-light text-[#2ee6a6] capitalize">{user?.role}</span>
            <button type="button" onClick={handleLogout} className="text-sm text-[#8b8ba3] hover:text-[#ff6b6b] transition">Logout</button>
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
