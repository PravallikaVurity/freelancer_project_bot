import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login({ email, password });
      toast.success(`Welcome back, ${user.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-80px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-0 glass rounded-3xl card-glow animate-fade-up">
        <div className="hidden md:flex flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-[#161622] to-[#0f0f18]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#2ee6a6]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#9b6dff]/20 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-sm uppercase tracking-widest text-[#8b8ba3] mb-4">Welcome back</p>
            <h1 className="font-display text-4xl font-bold leading-tight mb-4">
              Pick up where you <span className="text-gradient">left off</span>
            </h1>
            <p className="text-[#8b8ba3] leading-relaxed">Log in to access your dashboard.</p>
          </div>
          <img src="https://illustrations.popsy.co/violet/team-work.svg" alt="" className="relative w-full max-w-xs mx-auto opacity-90" />
        </div>

        <div className="p-8 md:p-12 bg-[#0f0f18]/80 rounded-r-3xl">
          <h2 className="font-display text-3xl font-bold mb-1">Sign in</h2>
          <p className="text-[#8b8ba3] mb-8">Enter your account details</p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Email</label>
              <div className="input-wrap">
                <FaEnvelope className="input-icon" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Password</label>
              <div className="input-wrap">
                <FaLock className="input-icon" />
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-field pr-12" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b8ba3] hover:text-[#e8e8f0] p-1" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-xs text-[#8b8ba3] hover:text-[#2ee6a6] transition">Forgot password?</Link>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? "Signing in..." : "Sign in"} <FaArrowRight className="text-sm" />
            </button>
          </form>

          <p className="text-center mt-8 text-[#8b8ba3] text-sm">
            New here?{" "}
            <Link to="/register" className="text-[#2ee6a6] font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
