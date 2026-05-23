import { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";
import DashboardPage from "../components/DashboardPage";
import { CardSkeleton } from "../components/Skeleton";
import { getMyEarnings, getWithdrawals, requestWithdrawal } from "../services/earningsApi";
import toast from "react-hot-toast";

const METHODS = [
  { value: "rupay", label: "RuPay" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "debit_card", label: "Debit Card" },
  { value: "credit_card", label: "Credit Card" },
];

const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-400/15 text-yellow-400",
    completed: "bg-[#2ee6a6]/15 text-[#2ee6a6]",
    failed: "bg-[#ff6b6b]/15 text-[#ff6b6b]",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

const Earnings = () => {
  const [summary, setSummary] = useState({ available: 0, thisMonth: 0, total: 0 });
  const [earnings, setEarnings] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [form, setForm] = useState({ amount: "", method: "upi", details: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [earningsRes, withdrawalsRes] = await Promise.all([getMyEarnings(), getWithdrawals()]);
      const { available, thisMonth, total, earnings: list } = earningsRes.data;
      setSummary({ available: available || 0, thisMonth: thisMonth || 0, total: total || 0 });
      setEarnings(list || []);
      setWithdrawals(withdrawalsRes.data.withdrawals || []);
    } catch (err) {
      console.error("Earnings fetch error:", err);
      toast.error("Unable to load earnings");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }
    if (Number(form.amount) > summary.available) { toast.error("Amount exceeds available balance"); return; }
    setSubmitting(true);
    try {
      const { data } = await requestWithdrawal({ amount: Number(form.amount), method: form.method, details: form.details });
      setWithdrawals((prev) => [data.withdrawal, ...prev]);
      setSummary((prev) => ({ ...prev, available: prev.available - Number(form.amount) }));
      toast.success("Withdrawal request submitted!");
      setForm({ amount: "", method: "upi", details: "" });
      setShowWithdraw(false);
    } catch (err) {
      console.error("Withdrawal error:", err);
      toast.error(err.response?.data?.message || "Unable to process withdrawal");
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardPage title="Earnings" description="Overview of your income and payout history.">
      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Available balance", value: `$${summary.available.toLocaleString()}` },
          { label: "This month", value: `$${summary.thisMonth.toLocaleString()}` },
          { label: "Total earned", value: `$${summary.total.toLocaleString()}` },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6 card-glow">
            <p className="text-sm text-[#8b8ba3] mb-2">{stat.label}</p>
            <p className="font-display text-3xl font-bold text-gradient">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal Section */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-lg font-bold">Withdraw Funds</h2>
          <button type="button" onClick={() => setShowWithdraw((v) => !v)} className="btn-primary text-sm py-2 px-4">
            {showWithdraw ? "Cancel" : "Withdraw"}
          </button>
        </div>

        <p className="text-sm text-[#8b8ba3] mb-4">
          Available Balance: <span className="text-[#2ee6a6] font-semibold">${summary.available.toLocaleString()}</span>
        </p>

        {showWithdraw && (
          <form onSubmit={handleWithdraw} className="space-y-4 border-t border-white/10 pt-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Amount ($)</label>
              <input
                type="number" required min="1" max={summary.available}
                value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="Enter amount" className="input-field !pl-4 w-48"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-3">Withdrawal Method</label>
              <div className="flex flex-wrap gap-3">
                {METHODS.map((m) => (
                  <label key={m.value} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition text-sm ${form.method === m.value ? "border-[#2ee6a6] bg-[#2ee6a6]/10 text-[#2ee6a6]" : "border-white/10 glass-light text-[#8b8ba3] hover:border-white/20"}`}>
                    <input type="radio" name="method" value={m.value} checked={form.method === m.value}
                      onChange={(e) => setForm({ ...form, method: e.target.value })} className="sr-only" />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">
                {form.method === "upi" ? "UPI ID" : form.method === "bank_transfer" ? "Account Details" : "Card / Details (optional)"}
              </label>
              <input
                type="text" value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder={form.method === "upi" ? "yourname@upi" : form.method === "bank_transfer" ? "Account number & IFSC" : "Optional details"}
                className="input-field !pl-4"
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary text-sm">
              {submitting ? "Processing..." : "Withdraw Funds"}
            </button>
          </form>
        )}
      </div>

      {/* Withdrawal History */}
      {withdrawals.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="font-display text-lg font-bold mb-4">Withdrawal History</h2>
          <ul className="space-y-3">
            {withdrawals.map((w) => (
              <li key={w._id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-medium text-sm capitalize">{w.method.replace("_", " ")}</p>
                  <p className="text-xs text-[#8b8ba3]">{new Date(w.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#ff6b6b] font-semibold flex items-center gap-1 text-sm">
                    <FaArrowDown className="text-xs" />${w.amount}
                  </span>
                  <StatusBadge status={w.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Payouts */}
      <div className="glass rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold mb-6">Recent Payouts</h2>
        {loading ? (
          <div className="space-y-3">{Array(3).fill(0).map((_, i) => <CardSkeleton key={i} />)}</div>
        ) : earnings.length === 0 ? (
          <p className="text-[#8b8ba3] text-sm text-center py-6">No earnings yet.</p>
        ) : (
          <ul className="space-y-4">
            {earnings.slice(0, 10).map((e) => (
              <li key={e._id} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                <div>
                  <p className="font-medium">{e.project?.title || "Project"}</p>
                  <p className="text-sm text-[#8b8ba3]">{e.client?.name} · {new Date(e.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-[#2ee6a6] font-semibold flex items-center gap-1">
                  <FaArrowUp className="text-xs" />${e.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardPage>
  );
};

export default Earnings;
