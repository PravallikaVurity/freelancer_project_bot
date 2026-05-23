import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Public pages
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import About from "./Pages/public/About";
import Contact from "./Pages/public/Contact";
import ForgotPassword from "./Pages/public/ForgotPassword";
import BrowseJobs from "./Pages/BrowseJobs";

// Freelancer pages
import FreelancerDashboard from "./Pages/freelancer/FreelancerDashboard";
import JobFeed from "./Pages/freelancer/JobFeed";
import JobDetail from "./Pages/freelancer/JobDetail";
import SavedJobs from "./Pages/freelancer/SavedJobs";
import MyProposals from "./Pages/MyProposals";
import EarningsDashboard from "./Pages/Earnings";
import FreelancerProfile from "./Pages/freelancer/FreelancerProfile";
import FreelancerMessages from "./Pages/Messages";

// Client pages
import ClientDashboard from "./Pages/client/ClientDashboard";
import PostProject from "./Pages/client/PostProject";
import ManageProjects from "./Pages/client/ManageProjects";
import ViewProposals from "./Pages/client/ViewProposals";
import ClientProfile from "./Pages/client/ClientProfile";
import ClientMessages from "./Pages/Messages";
import BattleRoom from "./Pages/client/BattleRoom";

// Admin pages
import AdminDashboard from "./Pages/admin/AdminDashboard";
import ManageUsers from "./Pages/admin/ManageUsers";
import ManageSkills from "./Pages/admin/ManageSkills";
import Disputes from "./Pages/admin/Disputes";
import Analytics from "./Pages/admin/Analytics";

function PageBackdrop() {
  return (
    <div className="page-bg" aria-hidden="true">
      <div className="orb orb-mint" />
      <div className="orb orb-violet" />
      <div className="orb orb-coral" />
    </div>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "client") return <Navigate to="/client/dashboard" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/freelancer/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <PageBackdrop />
      <Toaster position="top-right" toastOptions={{ style: { background: "#161622", color: "#e8e8f0", border: "1px solid rgba(255,255,255,0.1)" } }} />
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/browse-jobs" element={<BrowseJobs />} />
        </Route>

        {/* Role redirect after login */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* Freelancer */}
        <Route element={<ProtectedRoute role="freelancer" />}>
          <Route element={<DashboardLayout role="freelancer" />}>
            <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
            <Route path="/freelancer/jobs" element={<JobFeed />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route path="/freelancer/saved" element={<SavedJobs />} />
            <Route path="/freelancer/proposals" element={<MyProposals />} />
            <Route path="/freelancer/earnings" element={<EarningsDashboard />} />
            <Route path="/freelancer/messages" element={<FreelancerMessages />} />
            <Route path="/freelancer/profile" element={<FreelancerProfile />} />
          </Route>
        </Route>

        {/* Client */}
        <Route element={<ProtectedRoute role="client" />}>
          <Route element={<DashboardLayout role="client" />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/post-project" element={<PostProject />} />
            <Route path="/client/projects" element={<ManageProjects />} />
            <Route path="/client/projects/:id/proposals" element={<ViewProposals />} />
            <Route path="/client/projects/:id/battle" element={<BattleRoom />} />
            <Route path="/client/messages" element={<ClientMessages />} />
            <Route path="/client/profile" element={<ClientProfile />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute role="admin" />}>
          <Route element={<DashboardLayout role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/skills" element={<ManageSkills />} />
            <Route path="/admin/disputes" element={<Disputes />} />
            <Route path="/admin/analytics" element={<Analytics />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
