import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import { forgotPassword } from "../../services/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset link sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-80px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md glass rounded-3xl p-10 card-glow animate-fade-up">
        <Link to="/login" className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#e8e8f0] text-sm mb-8 transition">
          <FaArrowLeft /> Back to login
        </Link>
        {sent ? (
          <div className="text-center">
            <div className="h-16 w-16 rounded-full bg-[#2ee6a6]/15 flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-2xl text-[#2ee6a6]" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2">Check your email</h2>
            <p className="text-[#8b8ba3]">We sent a password reset link to <strong className="text-[#e8e8f0]">{email}</strong></p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-3xl font-bold mb-2">Forgot password?</h2>
            <p className="text-[#8b8ba3] mb-8">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Email</label>
                <div className="input-wrap">
                  <FaEnvelope className="input-icon" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com" className="input-field" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
