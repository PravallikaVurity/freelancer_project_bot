import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

const StarRating = ({ rating = 0, size = "text-sm" }) => {
  return (
    <div className={`flex items-center gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="text-yellow-400">
          {rating >= i ? <FaStar /> : rating >= i - 0.5 ? <FaStarHalfAlt /> : <FaRegStar />}
        </span>
      ))}
      <span className="ml-1 text-[#8b8ba3] text-xs">({rating})</span>
    </div>
  );
};

export default StarRating;
