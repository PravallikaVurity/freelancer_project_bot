import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaBookmark, FaRegBookmark } from "react-icons/fa";
import Badge from "./Badge";

const ProjectCard = ({ project, onSave, isSaved }) => {
  const { _id, title, description, budget, category, skills, status, client, createdAt } = project;
  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <article className="glass rounded-2xl p-6 card-glow hover:border-white/15 transition group">
      <div className="flex justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge status={status} />
            <span className="text-xs text-[#8b8ba3]">{category}</span>
          </div>
          <Link to={`/jobs/${_id}`} className="font-display text-lg font-bold hover:text-[#2ee6a6] transition line-clamp-1">
            {title}
          </Link>
        </div>
        <button type="button" onClick={() => onSave?.(_id)} className="text-[#8b8ba3] hover:text-[#2ee6a6] transition shrink-0 mt-1">
          {isSaved ? <FaBookmark className="text-[#2ee6a6]" /> : <FaRegBookmark />}
        </button>
      </div>

      <p className="text-[#8b8ba3] text-sm line-clamp-2 mb-4">{description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {skills?.slice(0, 4).map((s) => (
          <span key={s} className="px-2.5 py-1 rounded-full glass-light text-xs text-[#e8e8f0]">{s}</span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-[#8b8ba3]">
          {client?.location && (
            <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-[#9b6dff]" />{client.location}</span>
          )}
          <span className="flex items-center gap-1"><FaClock />{timeAgo(createdAt)}</span>
        </div>
        <span className="text-[#2ee6a6] font-semibold text-sm">
          {budget?.type === "hourly" ? `$${budget.min}–$${budget.max}/hr` : `$${budget?.min}–$${budget?.max}`}
        </span>
      </div>

      {status === "open" && (
        <Link to={`/jobs/${_id}`} className="btn-primary w-full text-sm mt-4 text-center block">
          Apply Now
        </Link>
      )}
    </article>
  );
};

export default ProjectCard;
