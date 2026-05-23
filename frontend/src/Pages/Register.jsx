import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "freelancer", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    if (!form.name.trim()) { toast.error("Full name is required"); return false; }
    if (!form.email.trim()) { toast.error("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error("Enter a valid email address"); return false; }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return false; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register(payload);
      toast.success("Registration successful! Please sign in.");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-80px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-0 glass rounded-3xl card-glow animate-fade-up">
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#161622] to-[#0f0f18]">
          <div className="absolute top-1/4 left-0 w-56 h-56 bg-[#9b6dff]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-40 h-40 bg-[#2ee6a6]/15 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm uppercase tracking-widest text-[#8b8ba3] mb-4">Join the network</p>
            <h1 className="font-display text-4xl font-bold leading-tight mb-4">
              Your skills deserve a <span className="text-gradient">bigger stage</span>
            </h1>
            <p className="text-[#8b8ba3] leading-relaxed">Create an account to access your dashboard.</p>
          </div>
          <img src="https://illustrations.popsy.co/violet/digital-nomad.svg" alt="" className="relative w-full max-w-xs mx-auto opacity-90" />
        </div>

        <div className="p-8 md:p-10 bg-[#0f0f18]/80 max-h-[90vh] overflow-y-auto rounded-r-3xl">
          <h2 className="font-display text-3xl font-bold mb-1">Create account</h2>
          <p className="text-[#8b8ba3] mb-6">Fill in your information</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Full name</label>
              <div className="input-wrap">
                <FaUser className="input-icon" />
                <input type="text" required value={form.name} onChange={set("name")} placeholder="Jane Doe" className="input-field" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Email</label>
                <div className="input-wrap">
                  <FaEnvelope className="input-icon" />
                  <input type="email" required value={form.email} onChange={set("email")} placeholder="you@example.com" className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Phone</label>
                <div className="input-wrap">
                  <FaPhone className="input-icon" />
                  <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 234 567 8900" className="input-field" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Register as</label>
              <select className="input-field !pl-4 cursor-pointer" value={form.role} onChange={set("role")}>
                <option value="freelancer">Freelancer</option>
                <option value="client">Client</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Password</label>
              <div className="input-wrap">
                <FaLock className="input-icon" />
                <input type={showPassword ? "text" : "password"} required value={form.password} onChange={set("password")} placeholder="Min. 6 characters" className="input-field pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8ba3] hover:text-[#e8e8f0] p-1" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Confirm password</label>
              <div className="input-wrap">
                <FaLock className="input-icon" />
                <input type={showConfirm ? "text" : "password"} required value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Re-enter password" className="input-field pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8ba3] hover:text-[#e8e8f0] p-1" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Creating account..." : "Create account"} <FaArrowRight className="text-sm" />
            </button>
          </form>

          <p className="text-center mt-6 text-[#8b8ba3] text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2ee6a6] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
