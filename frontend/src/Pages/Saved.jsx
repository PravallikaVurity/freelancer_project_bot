import DashboardPage from "../components/DashboardPage";
import { FaBookmark } from "react-icons/fa";

const savedJobs = [
  "UX Research for Health Clinic",
  "Annual Report Design — Wildlife Trust",
  "WordPress Maintenance Retainer",
];

const Saved = () => {
  return (
    <DashboardPage
      title="Saved"
      description="Jobs you've bookmarked for later."
    >
      {savedJobs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center text-[#8b8ba3]">
          No saved jobs yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {savedJobs.map((title) => (
            <li
              key={title}
              className="glass rounded-2xl p-5 flex items-center justify-between gap-4 card-glow"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaBookmark className="text-[#9b6dff] shrink-0" />
                <span className="font-medium truncate">{title}</span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" className="btn-ghost text-sm py-2 px-4">
                  View
                </button>
                <button
                  type="button"
                  className="text-sm text-[#8b8ba3] hover:text-[#ff6b6b] px-2"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPage>
  );
};

export default Saved;
