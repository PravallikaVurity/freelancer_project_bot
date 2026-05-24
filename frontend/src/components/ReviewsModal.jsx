import { useEffect, useState } from "react";
import { FaTimes, FaStar, FaRegStar } from "react-icons/fa";
import { getUserReviews } from "../services/reviewApi";
import LoadingSpinner from "./LoadingSpinner";

const Stars = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) =>
      i <= Math.round(rating)
        ? <FaStar key={i} className="text-yellow-400 text-xs" />
        : <FaRegStar key={i} className="text-[#8b8ba3] text-xs" />
    )}
  </div>
);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const ReviewsModal = ({ userId, userName, userRole, userRating, userReviewCount, userCompletedProjects, userSkills, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (!userId) return;
    getUserReviews(userId)
      .then(({ data }) => setReviews(data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const sorted = [...reviews].sort((a, b) => {
    if (sort === "highest") return b.rating - a.rating;
    if (sort === "lowest") return a.rating - b.rating;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : userRating || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 shrink-0">
          <div>
            <h2 className="font-display font-bold text-lg">
              {userRole === "client" ? "Client Reviews" : "Freelancer Reviews"}
            </h2>
            <p className="text-xs text-[#8b8ba3] mt-0.5">{userName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-[#8b8ba3] hover:text-[#e8e8f0] transition p-1">
            <FaTimes />
          </button>
        </div>

        {/* Stats bar */}
        <div className="px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-bold text-yellow-400">{avgRating}</span>
              <div>
                <Stars rating={avgRating} />
                <p className="text-xs text-[#8b8ba3] mt-0.5">{userReviewCount ?? reviews.length} reviews</p>
              </div>
            </div>
            <div className="glass-light rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-[#8b8ba3]">Completed Projects</p>
              <p className="font-bold text-[#2ee6a6]">{userCompletedProjects ?? 0}</p>
            </div>
            {userRole === "freelancer" && userSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {userSkills.slice(0, 5).map((s) => (
                  <span key={s} className="text-xs px-2.5 py-1 glass-light rounded-full text-[#e8e8f0]">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sort */}
        {reviews.length > 1 && (
          <div className="px-6 py-3 border-b border-white/10 shrink-0 flex items-center gap-2">
            <span className="text-xs text-[#8b8ba3]">Sort:</span>
            {[["newest", "Newest"], ["highest", "Highest Rating"], ["lowest", "Lowest Rating"]].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setSort(val)}
                className={`text-xs px-3 py-1.5 rounded-full transition ${sort === val ? "bg-[#2ee6a6] text-[#07070d] font-medium" : "glass-light text-[#8b8ba3] hover:text-[#e8e8f0]"}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <LoadingSpinner size="md" className="min-h-[150px]" />
          ) : sorted.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#8b8ba3] text-sm">No reviews available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sorted.map((r) => (
                <div key={r._id} className="glass-light rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-xs shrink-0">
                        {r.reviewer?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.reviewer?.name || "Anonymous"}</p>
                        <Stars rating={r.rating} />
                      </div>
                    </div>
                    <span className="text-xs text-[#8b8ba3] shrink-0">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.title && <p className="font-semibold text-sm text-[#e8e8f0] mb-1">{r.title}</p>}
                  <p className="text-sm text-[#8b8ba3] leading-relaxed">{r.comment}</p>
                  {r.project?.title && (
                    <p className="text-xs text-[#9b6dff] mt-2 flex items-center gap-1">
                      <span className="opacity-60">Project:</span> {r.project.title}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
