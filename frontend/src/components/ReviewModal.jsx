import { useState } from "react";
import { FaTimes, FaStar } from "react-icons/fa";
import { createReview } from "../services/reviewApi";
import toast from "react-hot-toast";

const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        className={`text-2xl transition ${i <= value ? "text-yellow-400" : "text-[#8b8ba3] hover:text-yellow-400"}`}
      >
        <FaStar />
      </button>
    ))}
    <span className="ml-2 text-sm text-[#8b8ba3]">{value ? `${value}/5` : "Select rating"}</span>
  </div>
);

const ReviewModal = ({ projectId, revieweeId, revieweeName, onClose, onSubmitted }) => {
  const [form, setForm] = useState({ rating: 0, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { toast.error("Please select a rating"); return; }
    if (!form.comment.trim()) { toast.error("Please write a review comment"); return; }
    setSubmitting(true);
    try {
      await createReview({
        projectId,
        revieweeId,
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
      });
      toast.success("Review submitted!");
      onSubmitted?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md p-8 relative animate-fade-up">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-[#8b8ba3] hover:text-[#e8e8f0] transition">
          <FaTimes />
        </button>
        <h2 className="font-display text-xl font-bold mb-1">Leave a Review</h2>
        <p className="text-sm text-[#8b8ba3] mb-6">Reviewing: <span className="text-[#e8e8f0] font-medium">{revieweeName}</span></p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Rating *</label>
            <StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Review Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Great work, highly recommend"
              className="input-field !pl-4"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Review *</label>
            <textarea
              required
              rows={4}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Share your experience working on this project..."
              className="input-field !pl-4 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
