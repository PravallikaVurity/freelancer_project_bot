import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import DashboardPage from "../../components/DashboardPage";
import { getSkills, createSkill, deleteSkill } from "../../services/adminApi";
import toast from "react-hot-toast";

const ManageSkills = () => {
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ name: "", category: "" });
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    try { const { data } = await getSkills(); setSkills(data.skills); } catch { toast.error("Failed to load skills"); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await createSkill(form);
      setSkills((prev) => [...prev, data.skill]);
      setForm({ name: "", category: "" });
      toast.success("Skill added");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to add skill"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s._id !== id));
      toast.success("Skill deleted");
    } catch { toast.error("Failed to delete skill"); }
  };

  const grouped = skills.reduce((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});

  return (
    <DashboardPage title="Manage Skills" description="Add and remove platform skills.">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6">
          <h2 className="font-display text-lg font-bold mb-4">Add Skill</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Skill Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. React" className="input-field !pl-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#e8e8f0] mb-2">Category</label>
              <input required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Frontend" className="input-field !pl-4" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm flex items-center justify-center gap-2">
              <FaPlus /> {loading ? "Adding..." : "Add Skill"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="glass rounded-2xl p-6">
              <h3 className="font-display font-bold text-[#8b8ba3] text-sm uppercase tracking-wider mb-3">{cat}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((s) => (
                  <div key={s._id} className="flex items-center gap-2 px-3 py-1.5 glass-light rounded-full text-sm">
                    <span>{s.name}</span>
                    <button type="button" onClick={() => handleDelete(s._id)} className="text-[#8b8ba3] hover:text-[#ff6b6b] transition"><FaTrash className="text-xs" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardPage>
  );
};

export default ManageSkills;
