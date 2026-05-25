require("dotenv").config();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const Skill = require("../models/Skill");

const skills = [
  { name: "React", category: "Frontend" }, { name: "Vue.js", category: "Frontend" },
  { name: "Node.js", category: "Backend" }, { name: "Python", category: "Backend" },
  { name: "MongoDB", category: "Database" }, { name: "PostgreSQL", category: "Database" },
  { name: "UI/UX Design", category: "Design" }, { name: "Figma", category: "Design" },
  { name: "WordPress", category: "CMS" }, { name: "SEO", category: "Marketing" },
  { name: "Copywriting", category: "Content" }, { name: "Video Editing", category: "Media" },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany(); await Project.deleteMany(); await Skill.deleteMany();

  await Skill.insertMany(skills);

  const admin = await User.create({ name: "Admin User", email: "admin@fb.com", password: "Admin@123", role: "admin" });
  const client = await User.create({ name: "Sarah Chen", email: "client@fb.com", password: "Client@123", role: "client", location: "New York", bio: "NGO Director" });
  const freelancer = await User.create({ name: "Marcus Webb", email: "freelancer@fb.com", password: "Free@123", role: "freelancer", skills: ["React", "Node.js", "MongoDB"], hourlyRate: 45, bio: "Full-stack developer", rating: 4.8, reviewCount: 12, completedProjects: 18 });

  await Project.create([
    { title: "Community Website Redesign", description: "We need a modern website for our NGO.", client: client._id, category: "Web Development", skills: ["React", "UI/UX Design"], budget: { type: "fixed", min: 1000, max: 1500 }, status: "open" },
    { title: "Nonprofit Social Media Kit", description: "Design social media templates.", client: client._id, category: "Design", skills: ["Figma", "UI/UX Design"], budget: { type: "hourly", min: 40, max: 60 }, status: "open" },
    { title: "Mobile App UI for Education NGO", description: "Design and develop a mobile app UI.", client: client._id, category: "Mobile", skills: ["React", "Figma"], budget: { type: "fixed", min: 2000, max: 3000 }, status: "open" },
  ]);

  console.log("✅ Seed complete");
  console.log("Admin: admin@fb.com / Admin@123");
  console.log("Client: client@fb.com / Client@123");
  console.log("Freelancer: freelancer@fb.com / Free@123");
  process.exit();
};

seed().catch((e) => { console.error(e); process.exit(1); });
