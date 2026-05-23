import { useEffect, useState } from "react";
import { FaSearch, FaBan, FaCheck } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import { CardSkeleton } from "../../components/Skeleton";
import { getAdminUsers, toggleUserStatus } from "../../services/adminApi";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await getAdminUsers({ search, role });
      setUsers(data.users);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [role]);

  const handleToggle = async (id) => {
    try {
      const { data } = await toggleUserStatus(id);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isActive: data.user.isActive } : u));
      const target = users.find((u) => u._id === id);
      window.__fbAdminLog?.({
        type: data.user.isActive ? "unban" : "ban",
        message: `Admin ${data.user.isActive ? "unbanned" : "banned"} user: ${target?.name || id}`,
      });
      toast.success("User status updated");
    } catch { toast.error("Failed to update user"); }
  };

  return (
    <DashboardPage title="Manage Users" description="View and manage all platform users.">
      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={(e) => { e.preventDefault(); fetch(); }} className="flex-1 glass rounded-xl flex items-center gap-2 px-4 py-2 min-w-[200px]">
          <FaSearch className="text-[#8b8ba3]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="bg-transparent outline-none flex-1 text-sm text-[#e8e8f0] placeholder:text-[#8b8ba3]" />
        </form>
        <div className="flex gap-2">
          {["", "freelancer", "client", "admin"].map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition capitalize ${role === r ? "bg-[#2ee6a6] text-[#07070d]" : "glass-light text-[#8b8ba3] hover:text-[#e8e8f0]"}`}>
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array(5).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/10 text-xs font-medium text-[#8b8ba3] uppercase tracking-wider">
            <span className="col-span-2">User</span><span>Role</span><span>Joined</span><span>Status</span>
          </div>
          {users.map((u) => (
            <div key={u._id} className="grid md:grid-cols-5 gap-3 px-6 py-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition items-center">
              <div className="md:col-span-2 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-sm shrink-0">{u.name?.[0]}</div>
                <div><p className="font-medium text-sm">{u.name}</p><p className="text-xs text-[#8b8ba3]">{u.email}</p></div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full glass-light capitalize w-fit">{u.role}</span>
              <p className="text-xs text-[#8b8ba3]">{new Date(u.createdAt).toLocaleDateString()}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full ${u.isActive ? "text-[#2ee6a6] bg-[#2ee6a6]/15" : "text-[#ff6b6b] bg-[#ff6b6b]/15"}`}>
                  {u.isActive ? "Active" : "Banned"}
                </span>
                <button type="button" onClick={() => handleToggle(u._id)}
                  className={`p-1.5 glass-light rounded-lg transition ${u.isActive ? "text-[#8b8ba3] hover:text-[#ff6b6b]" : "text-[#8b8ba3] hover:text-[#2ee6a6]"}`}>
                  {u.isActive ? <FaBan /> : <FaCheck />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default ManageUsers;
