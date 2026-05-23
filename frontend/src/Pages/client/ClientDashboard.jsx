import { FaList, FaFileAlt, FaUsers, FaCheckCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import DashboardPage from "../../components/DashboardPage";
import StatsCard from "../../components/StatsCard";
import Badge from "../../components/Badge";
import { useAuth } from "../../context/AuthContext";

const recentProjects = [
  { title: "Community Website Redesign", status: "open", proposals: 4, budget: "$1,200" },
  { title: "Nonprofit Social Media Kit", status: "in_progress", proposals: 7, budget: "$45/hr" },
  { title: "Mobile App UI", status: "completed", proposals: 12, budget: "$2,500" },
];

const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardPage title={`Welcome, ${user?.name?.split(" ")[0]} 👋`} description="Manage your projects and find great talent.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Projects" value="2" icon={FaList} color="text-[#2ee6a6]" />
        <StatsCard label="Total Proposals" value="23" icon={FaFileAlt} color="text-[#9b6dff]" />
        <StatsCard label="Hired Freelancers" value="5" icon={FaUsers} color="text-yellow-400" />
        <StatsCard label="Completed" value="3" icon={FaCheckCircle} color="text-[#ff6b6b]" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-lg font-bold">Recent Projects</h2>
            <Link to="/client/projects" className="text-sm text-[#2ee6a6] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentProjects.map((p) => (
              <div key={p.title} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-medium text-sm">{p.title}</p>
                  <p className="text-xs text-[#8b8ba3]">{p.proposals} proposals · {p.budget}</p>
                </div>
                <Badge status={p.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/client/post-project" className="btn-primary w-full text-sm">Post a Project</Link>
            <Link to="/client/projects" className="btn-ghost w-full text-sm">Manage Projects</Link>
            <Link to="/client/messages" className="btn-ghost w-full text-sm">Messages</Link>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default ClientDashboard;
