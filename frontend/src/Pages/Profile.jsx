import DashboardPage from "../components/DashboardPage";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

const Profile = () => {
  return (
    <DashboardPage
      title="Profile"
      description="Manage your account and public freelancer profile."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass rounded-2xl p-8 text-center card-glow">
          <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-[#2ee6a6] to-[#9b6dff] flex items-center justify-center text-3xl text-[#07070d] font-bold mb-4">
            JD
          </div>
          <h2 className="font-display text-xl font-bold">Jane Doe</h2>
          <p className="text-[#8b8ba3] text-sm mt-1">Freelancer · UI/UX Design</p>
          <button type="button" className="btn-primary text-sm mt-6 w-full">
            Edit photo
          </button>
        </div>

        <div className="lg:col-span-2 glass rounded-2xl p-8 space-y-6">
          <h2 className="font-display text-lg font-bold">Account details</h2>

          {[
            { icon: FaUser, label: "Full name", value: "Jane Doe" },
            { icon: FaEnvelope, label: "Email", value: "jane@example.com" },
            { icon: FaPhone, label: "Phone", value: "+1 234 567 8900" },
            { icon: FaMapMarkerAlt, label: "Location", value: "Remote · UTC-5" },
          ].map((field) => (
            <div key={field.label} className="flex items-start gap-4">
              <field.icon className="text-[#8b8ba3] mt-1 shrink-0" />
              <div>
                <p className="text-xs text-[#8b8ba3] uppercase tracking-wider mb-1">
                  {field.label}
                </p>
                <p className="font-medium">{field.value}</p>
              </div>
            </div>
          ))}

          <div className="pt-4 flex gap-3">
            <button type="button" className="btn-primary text-sm">
              Save changes
            </button>
            <button type="button" className="btn-ghost text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default Profile;
