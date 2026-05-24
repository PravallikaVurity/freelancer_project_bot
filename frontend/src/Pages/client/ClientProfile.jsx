import { useState, useEffect } from "react";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaSave } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import StarRating from "../../components/StarRating";
import { useAuth } from "../../context/AuthContext";
import { updateProfile } from "../../services/authApi";
import { getUserReviews } from "../../services/reviewApi";
import toast from "react-hot-toast";

const ClientProfile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || "", bio: user?.bio || "", phone: user?.phone || "", location: user?.location || "" });
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (user?._id) {
      getUserReviews(user._id).then(({ data }) => setReviews(data.reviews || [])).catch(() => {});
    }
  }, [user?._id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await updateProfile(form);
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
    <DashboardPage title="My Profile" description="Manage your client account.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass rounded-2xl p-8 text-center card-glow">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-[#9b6dff] to-[#2ee6a6] flex items-center justify-center text-3xl text-[#07070d] font-bold mb-4">
            {user?.name?.[0]}
          </div>
          <h2 className="font-display text-xl font-bold">{user?.name}</h2>
          <p className="text-[#8b8ba3] text-sm mt-1 capitalize">{user?.role}</p>
          {(user?.rating > 0) && (
            <div className="mt-3">
              <StarRating rating={user.rating} />
              <p className="text-xs text-[#8b8ba3] mt-1">{user.reviewCount || 0} reviews</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-lg font-bold">Account Details</h2>
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
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="lg:col-span-3 glass rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold mb-4">Reviews ({reviews.length})</h2>
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r._id} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#9b6dff] to-[#2ee6a6] flex items-center justify-center text-[#07070d] font-bold text-xs shrink-0">
                        {r.reviewer?.name?.[0]}
                      </div>
                      <span className="text-sm font-medium">{r.reviewer?.name}</span>
                      <span className="text-xs text-[#8b8ba3] capitalize">{r.reviewer?.role}</span>
                    </div>
                    <StarRating rating={r.rating} size="text-xs" />
                  </div>
                  {r.title && <p className="text-sm font-semibold text-[#e8e8f0] mt-1">{r.title}</p>}
                  <p className="text-sm text-[#8b8ba3] mt-1">{r.comment}</p>
                  <p className="text-xs text-[#8b8ba3] mt-1">{r.project?.title} · {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardPage>
  );
};

export default ClientProfile;
