import { useState } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import StarRating from "../../components/StarRating";
import { StatusDisplay, StatusSelector } from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/authApi";
import toast from "react-hot-toast";

const FreelancerProfile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", phone: user?.phone || "", location: user?.location || "", hourlyRate: user?.hourlyRate || "", skills: user?.skills?.join(", ") || "" });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { ...form, skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean) };
      const { data } = await updateProfile(payload);
      updateUser(data.user);
      toast.success("Profile updated!");
      setEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <DashboardPage title="My Profile" description="Manage your freelancer profile.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass rounded-2xl p-8 text-center card-glow">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-3xl text-[#07070d] font-bold mb-4">
            {user?.name?.[0]}
          </div>
          <h2 className="font-display text-xl font-bold">{user?.name}</h2>
          <p className="text-[#8b8ba3] text-sm mt-1 capitalize">{user?.role}</p>
          <div className="mt-2">
            <StatusDisplay status={user?.currentStatus} updatedAt={user?.statusUpdatedAt} />
          </div>
          <div className="mt-3"><StarRating rating={user?.rating || 0} /></div>
          <p className="text-xs text-[#8b8ba3] mt-1">{user?.reviewCount || 0} reviews · {user?.completedProjects || 0} projects</p>
          {user?.hourlyRate > 0 && <p className="text-[#2ee6a6] font-semibold mt-3">${user.hourlyRate}/hr</p>}
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-8">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <h2 className="font-display text-lg font-bold">Account Details</h2>
            <StatusSelector />
            <button type="button" onClick={() => editing ? handleSave() : setEditing(true)} disabled={loading}
              className="flex items-center gap-2 text-sm text-[#2ee6a6] hover:underline">
              {editing ? <><FaSave /> {loading ? "Saving..." : "Save"}</> : <><FaEdit /> Edit</>}
            </button>
          </div>

          <div className="space-y-5">
            {[
              { icon: FaUser, label: "Full Name", key: "name", type: "text" },
              { icon: FaPhone, label: "Phone", key: "phone", type: "tel" },
              { icon: FaMapMarkerAlt, label: "Location", key: "location", type: "text" },
            ].map(({ icon: Icon, label, key, type }) => (
              <div key={key} className="flex items-start gap-4">
                <Icon className="text-[#8b8ba3] mt-3 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-1">{label}</p>
                  {editing ? <input type={type} value={form[key]} onChange={set(key)} className="input-field !pl-4" />
                    : <p className="font-medium">{form[key] || "—"}</p>}
                </div>
              </div>
            ))}

            <div className="flex items-start gap-4">
              <FaEnvelope className="text-[#8b8ba3] mt-1 shrink-0" />
              <div><p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-1">Email</p><p className="font-medium">{user?.email}</p></div>
            </div>

            <div>
              <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-2">Bio</p>
              {editing ? <textarea rows={3} value={form.bio} onChange={set("bio")} className="input-field !pl-4 resize-none w-full" />
                : <p className="text-[#8b8ba3] text-sm">{form.bio || "No bio yet."}</p>}
            </div>

            <div>
              <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-2">Skills (comma separated)</p>
              {editing ? <input type="text" value={form.skills} onChange={set("skills")} className="input-field !pl-4" placeholder="React, Node.js, Figma" />
                : <div className="flex flex-wrap gap-2">{user?.skills?.map((s) => <span key={s} className="px-3 py-1 rounded-full glass-light text-xs">{s}</span>) || <span className="text-[#8b8ba3] text-sm">No skills added.</span>}</div>}
            </div>

            <div>
              <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-2">Hourly Rate ($)</p>
              {editing ? <input type="number" value={form.hourlyRate} onChange={set("hourlyRate")} className="input-field !pl-4 w-40" />
                : <p className="font-medium">{user?.hourlyRate ? `$${user.hourlyRate}/hr` : "—"}</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default FreelancerProfile;
