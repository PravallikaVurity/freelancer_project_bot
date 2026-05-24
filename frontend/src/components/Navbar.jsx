import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const linkClass = (path) => `nav-link ${pathname === path ? "active" : ""}`;
  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate("/", { replace: true });
  };

  const dashPath = user?.role === "client" ? "/client/dashboard" : user?.role === "admin" ? "/admin/dashboard" : "/freelancer/dashboard";

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] text-[#07070d] text-sm font-extrabold">FB</span>
            <span className="text-gradient">Freelancer Board</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={linkClass("/")}>Home</Link>
            <Link to="/about" className={linkClass("/about")}>About</Link>
            <Link to="/contact" className={linkClass("/contact")}>Contact</Link>
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link to="/admin/dashboard" className={linkClass("/admin/dashboard")}>Admin Panel</Link>
                )}
                <Link to={dashPath} className={linkClass(dashPath)}>Dashboard</Link>
                <button type="button" onClick={handleLogout} className="nav-link">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className={linkClass("/login")}>Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2.5 px-5">Get Started</Link>
              </>
            )}
          </div>

          <button type="button" className="md:hidden text-xl text-[#e8e8f0] p-2 rounded-lg hover:bg-white/5 transition"
            onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden flex flex-col gap-5 mt-6 pt-6 border-t border-white/10 animate-fade-up">
            {[{ to: "/", label: "Home" }, { to: "/about", label: "About" }, { to: "/contact", label: "Contact" }].map(({ to, label }) => (
              <Link key={to} to={to} onClick={close} className={linkClass(to)}>{label}</Link>
            ))}
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link to="/admin/dashboard" onClick={close} className={linkClass("/admin/dashboard")}>Admin Panel</Link>
                )}
                <Link to={dashPath} onClick={close} className={linkClass(dashPath)}>Dashboard</Link>
                <button type="button" onClick={handleLogout} className="nav-link text-left">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={close} className={linkClass("/login")}>Login</Link>
                <Link to="/register" onClick={close} className="btn-primary w-fit">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
