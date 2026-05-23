import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { FaArrowLeft, FaTrophy, FaStar, FaClock, FaWallet, FaFire } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import LoadingSpinner from "../../components/LoadingSpinner";
import StarRating from "../../components/StarRating";
import Badge from "../../components/Badge";
import { getBattleRoom, hireFreelancer } from "../../services/battleApi";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const ScoreBar = ({ score }) => (
  <div className="w-full bg-white/10 rounded-full h-2 mt-1">
    <div
      className="h-2 rounded-full transition-all duration-700"
      style={{
        width: `${score}%`,
        background: score >= 80 ? "#2ee6a6" : score >= 60 ? "#f59e0b" : "#ff6b6b",
      }}
    />
  </div>
);

const FreelancerCard = ({ entry, rank, onHire, hiring, projectClosed }) => {
  const { freelancer, proposalId, bidAmount, deliveryTime, coverLetter, matchScore, status } = entry;
  const isTop = rank === 0;

  return (
    <div className={`glass rounded-2xl p-6 flex flex-col gap-4 relative ${isTop ? "border border-[#2ee6a6]/40 card-glow" : ""}`}>
      {isTop && (
        <span className="absolute -top-3 left-4 flex items-center gap-1 bg-[#2ee6a6] text-[#07070d] text-xs font-bold px-3 py-1 rounded-full">
          <FaTrophy className="text-xs" /> Top Match
        </span>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-[#07070d] font-bold text-lg shrink-0">
          {freelancer?.name?.[0]}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold truncate">{freelancer?.name}</p>
          <StarRating rating={freelancer?.rating || 0} />
        </div>
        <Badge status={status} />
      </div>

      {/* Match Score */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-[#8b8ba3] flex items-center gap-1"><FaFire className="text-orange-400" /> AI Match Score</span>
          <span className="font-bold" style={{ color: matchScore >= 80 ? "#2ee6a6" : matchScore >= 60 ? "#f59e0b" : "#ff6b6b" }}>
            {matchScore}%
          </span>
        </div>
        <ScoreBar score={matchScore} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="glass-light rounded-xl p-3 text-center">
          <p className="text-[#8b8ba3] text-xs mb-1 flex items-center justify-center gap-1"><FaWallet /> Bid</p>
          <p className="font-bold text-[#2ee6a6]">₹{bidAmount?.toLocaleString()}</p>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <p className="text-[#8b8ba3] text-xs mb-1 flex items-center justify-center gap-1"><FaClock /> Delivery</p>
          <p className="font-bold">{deliveryTime} days</p>
        </div>
      </div>

      {/* Skills */}
      {freelancer?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {freelancer.skills.slice(0, 5).map((s) => (
            <span key={s} className="px-2.5 py-1 rounded-full glass-light text-xs">{s}</span>
          ))}
        </div>
      )}

      {/* Extra stats */}
      <div className="flex gap-4 text-xs text-[#8b8ba3]">
        <span>⭐ {freelancer?.rating || 0} rating</span>
        <span>✅ {freelancer?.completedProjects || 0} projects</span>
        {freelancer?.hourlyRate > 0 && <span>💰 ${freelancer.hourlyRate}/hr</span>}
      </div>

      {/* Cover letter */}
      <div>
        <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-1">Proposal</p>
        <p className="text-sm text-[#c8c8d8] line-clamp-3">{coverLetter}</p>
      </div>

      {/* Hire button */}
      {!projectClosed && status === "pending" && (
        <button
          type="button"
          onClick={() => onHire(proposalId, freelancer?.name)}
          disabled={hiring}
          className="btn-primary text-sm mt-auto disabled:opacity-50"
        >
          {hiring ? "Hiring..." : "⚡ Hire This Freelancer"}
        </button>
      )}
      {status === "accepted" && (
        <div className="mt-auto text-center text-sm font-bold text-[#2ee6a6]">✅ Hired</div>
      )}
    </div>
  );
};

const BattleRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState(false);
  const socketRef = useRef(null);

  const fetchRoom = async () => {
    try {
      const { data: res } = await getBattleRoom(id);
      setData(res);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load battle room");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();

    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5001",
      { auth: { userId: user?._id } }
    );
    socketRef.current.emit("joinBattleRoom", id);

    socketRef.current.on("battleNewApplicant", () => {
      toast("New freelancer joined the battle! 🥊", { icon: "⚔️" });
      fetchRoom();
    });

    socketRef.current.on("battleHire", ({ projectId, winnerName }) => {
      if (projectId === id) {
        toast.success(`${winnerName} was hired!`);
        fetchRoom();
      }
    });

    return () => socketRef.current?.disconnect();
  }, [id]);

  const handleHire = async (proposalId, name) => {
    if (!confirm(`Hire ${name}? All other proposals will be rejected.`)) return;
    setHiring(true);
    try {
      const { data: res } = await hireFreelancer(id, proposalId);
      toast.success(res.message);
      fetchRoom();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to hire");
    } finally {
      setHiring(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  const { project, battleRoom, freelancers = [] } = data || {};
  const isClosed = battleRoom?.status === "closed" || project?.status !== "open";

  return (
    <DashboardPage
      title="⚔️ Battle Room"
      description={project?.title || "Compare freelancers and pick the best match."}
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8b8ba3] hover:text-[#e8e8f0] text-sm mb-6 transition"
      >
        <FaArrowLeft /> Back to projects
      </button>

      {/* Status banner */}
      {isClosed && (
        <div className="glass rounded-2xl px-5 py-3 mb-6 border border-[#2ee6a6]/20 text-sm text-[#2ee6a6]">
          ✅ Battle closed — a freelancer has been hired for this project.
        </div>
      )}

      {/* Summary bar */}
      <div className="glass rounded-2xl px-6 py-4 mb-6 flex flex-wrap gap-6 items-center">
        <div>
          <p className="text-xs text-[#8b8ba3] uppercase tracking-wider">Applicants</p>
          <p className="font-bold text-lg">{freelancers.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#8b8ba3] uppercase tracking-wider">Project Budget</p>
          <p className="font-bold text-[#2ee6a6]">
            ₹{project?.budget?.min?.toLocaleString()}–₹{project?.budget?.max?.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#8b8ba3] uppercase tracking-wider">Required Skills</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {project?.skills?.map((s) => (
              <span key={s} className="px-2 py-0.5 rounded-full glass-light text-xs">{s}</span>
            ))}
          </div>
        </div>
        <div className="ml-auto">
          <Badge status={battleRoom?.status === "closed" ? "completed" : "open"} />
        </div>
      </div>

      {freelancers.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">
          No proposals yet. Share your project to attract freelancers.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {freelancers.map((entry, i) => (
            <FreelancerCard
              key={entry.proposalId}
              entry={entry}
              rank={i}
              onHire={handleHire}
              hiring={hiring}
              projectClosed={isClosed}
            />
          ))}
        </div>
      )}
    </DashboardPage>
  );
};

export default BattleRoom;
