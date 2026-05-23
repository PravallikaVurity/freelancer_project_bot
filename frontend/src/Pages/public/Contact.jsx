import { useState } from "react";
import { FaEnvelope, FaMapMarkerAlt, FaTwitter, FaLinkedin } from "react-icons/fa";
import toast from "react-hot-toast";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
    setLoading(false);
  };

  return (
    <div className="text-[#e8e8f0] py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 animate-fade-up">
          <h1 className="font-display text-5xl font-bold mb-4">Get in <span className="text-gradient">touch</span></h1>
          <p className="text-[#8b8ba3] text-lg">Have a question or want to partner with us?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
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

          <div className="space-y-6 animate-fade-up delay-1">
            {[{ icon: FaEnvelope, label: "Email", value: "hello@freelancerboard.com", color: "text-[#2ee6a6]" },
              { icon: FaMapMarkerAlt, label: "Location", value: "Remote · Worldwide", color: "text-[#9b6dff]" }].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="glass rounded-2xl p-6 flex items-center gap-4">
                <span className={`p-3 rounded-xl bg-white/5 ${color}`}><Icon className="text-xl" /></span>
                <div><p className="text-xs text-[#8b8ba3] uppercase tracking-wider">{label}</p><p className="font-medium">{value}</p></div>
              </div>
            ))}
            <div className="glass rounded-2xl p-6">
              <p className="text-sm text-[#8b8ba3] mb-4">Follow us</p>
              <div className="flex gap-3">
                {[{ icon: FaTwitter, label: "Twitter" }, { icon: FaLinkedin, label: "LinkedIn" }].map(({ icon: Icon, label }) => (
                  <button key={label} type="button" className="p-3 glass-light rounded-xl text-[#8b8ba3] hover:text-[#2ee6a6] transition">
                    <Icon className="text-xl" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
