import { useState, useEffect } from "react";
import { FaEnvelope, FaMapMarkerAlt, FaTwitter, FaLinkedin, FaPhone, FaGlobe, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { getContactInfo, updateContactInfo } from "../../services/adminApi";
import toast from "react-hot-toast";

const Contact = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const [info, setInfo] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContactInfo()
      .then(({ data }) => {
        setInfo(data.contactInfo);
        setEditForm(data.contactInfo);
      })
      .catch(() => {
        // Fallback to defaults if backend unreachable
        const defaults = { email: "hello@freelancerboard.com", phone: "", address: "Remote · Worldwide", website: "", twitter: "", linkedin: "", supportInfo: "" };
        setInfo(defaults);
        setEditForm(defaults);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateContactInfo(editForm);
      setInfo(data.contactInfo);
      setEditing(false);
      toast.success("Contact information updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save changes");
    } finally { setSaving(false); }
  };

  const set = (k) => (e) => setEditForm({ ...editForm, [k]: e.target.value });

  const contactItems = info ? [
    info.email && { icon: FaEnvelope, label: "Email", value: info.email, color: "text-[#2ee6a6]", key: "email" },
    info.phone && { icon: FaPhone, label: "Phone", value: info.phone, color: "text-[#9b6dff]", key: "phone" },
    info.address && { icon: FaMapMarkerAlt, label: "Location", value: info.address, color: "text-[#9b6dff]", key: "address" },
    info.website && { icon: FaGlobe, label: "Website", value: info.website, color: "text-[#2ee6a6]", key: "website" },
    info.supportInfo && { icon: FaEnvelope, label: "Support", value: info.supportInfo, color: "text-yellow-400", key: "supportInfo" },
  ].filter(Boolean) : [];

  return (
    <div className="text-[#e8e8f0] py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="font-display text-5xl font-bold mb-4">Get in <span className="text-gradient">touch</span></h1>
          <p className="text-[#8b8ba3] text-lg">Have a question or want to partner with us?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact form — unchanged */}
          <div className="glass rounded-2xl p-8 space-y-6 animate-fade-up">
            <h2 className="font-display text-2xl font-bold">Send a message</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[{ label: "Name", key: "name", type: "text", placeholder: "Your name" },
                { label: "Email", key: "email", type: "email", placeholder: "you@example.com" }].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[#e8e8f0] mb-2">{label}</label>
                  <input type={type} required value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder} className="input-field !pl-4" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Message</label>
                <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help..." className="input-field !pl-4 resize-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>

          {/* Contact info panel */}
          <div className="space-y-6 animate-fade-up delay-1">
            {/* Admin edit controls */}
            {isAdmin && (
              <div className="flex justify-end gap-2">
                {editing ? (
                  <>
                    <button type="button" onClick={handleSave} disabled={saving}
                      className="flex items-center gap-1.5 text-sm text-[#2ee6a6] hover:underline">
                      <FaSave /> {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" onClick={() => { setEditing(false); setEditForm(info); }}
                      className="flex items-center gap-1.5 text-sm text-[#8b8ba3] hover:text-[#e8e8f0]">
                      <FaTimes /> Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 text-sm text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                    <FaEdit /> Edit Contact Info
                  </button>
                )}
              </div>
            )}

            {/* Contact info cards */}
            {contactItems.map(({ icon: Icon, label, value, color, key }) => (
              <div key={label} className="glass rounded-2xl p-6 flex items-center gap-4">
                <span className={`p-3 rounded-xl bg-white/5 ${color}`}><Icon className="text-xl" /></span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#8b8ba3] uppercase tracking-wider">{label}</p>
                  {editing && isAdmin ? (
                    <input
                      type="text"
                      value={editForm[key] || ""}
                      onChange={set(key)}
                      className="input-field !pl-2 !py-1 text-sm mt-1 w-full"
                    />
                  ) : (
                    <p className="font-medium truncate">{value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Admin: show empty fields for editing too */}
            {editing && isAdmin && (
              <div className="glass rounded-2xl p-6 space-y-3">
                <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-3">All Fields</p>
                {[
                  { key: "email", label: "Email", placeholder: "hello@freelancerboard.com" },
                  { key: "phone", label: "Phone", placeholder: "+1 234 567 8900" },
                  { key: "address", label: "Address / Location", placeholder: "Remote · Worldwide" },
                  { key: "website", label: "Website", placeholder: "https://freelancerboard.com" },
                  { key: "twitter", label: "Twitter handle", placeholder: "@freelancerboard" },
                  { key: "linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/company/..." },
                  { key: "supportInfo", label: "Support Info", placeholder: "support@freelancerboard.com" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs text-[#8b8ba3] mb-1">{label}</label>
                    <input
                      type="text"
                      value={editForm[key] || ""}
                      onChange={set(key)}
                      placeholder={placeholder}
                      className="input-field !pl-3 !py-1.5 text-sm w-full"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Social links */}
            {(info?.twitter || info?.linkedin) && !editing && (
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-[#8b8ba3] mb-4">Follow us</p>
                <div className="flex gap-3">
                  {info.twitter && (
                    <a href={info.twitter.startsWith("http") ? info.twitter : `https://twitter.com/${info.twitter.replace("@", "")}`}
                      target="_blank" rel="noreferrer"
                      className="p-3 glass-light rounded-xl text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaTwitter className="text-xl" />
                    </a>
                  )}
                  {info.linkedin && (
                    <a href={info.linkedin.startsWith("http") ? info.linkedin : `https://linkedin.com/company/${info.linkedin}`}
                      target="_blank" rel="noreferrer"
                      className="p-3 glass-light rounded-xl text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                      <FaLinkedin className="text-xl" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Non-admin notice */}
            {!isAdmin && (
              <p className="text-xs text-[#8b8ba3] text-center">Contact information is managed by the platform admin.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
