require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/error");

connectDB().then(async () => {
  // Auto-seed demo data if database has no projects
  try {
    const Project = require("./models/Project");
    const User = require("./models/User");
    const Skill = require("./models/Skill");
    const count = await Project.countDocuments();
    if (count === 0) {
      console.log("Database empty — seeding demo data...");

      const skills = [
        { name: "React", category: "Frontend" }, { name: "Vue.js", category: "Frontend" },
        { name: "Angular", category: "Frontend" }, { name: "TypeScript", category: "Frontend" },
        { name: "Node.js", category: "Backend" }, { name: "Python", category: "Backend" },
        { name: "Django", category: "Backend" }, { name: "PHP", category: "Backend" },
        { name: "MongoDB", category: "Database" }, { name: "PostgreSQL", category: "Database" },
        { name: "Figma", category: "Design" }, { name: "UI/UX Design", category: "Design" },
        { name: "Photoshop", category: "Design" }, { name: "Illustrator", category: "Design" },
        { name: "WordPress", category: "CMS" }, { name: "SEO", category: "Marketing" },
        { name: "Docker", category: "DevOps" }, { name: "Git", category: "DevOps" },
      ];
      await Skill.insertMany(skills).catch(() => {});

      let client = await User.findOne({ email: "client@fb.com" });
      if (!client) {
        client = await User.create({
          name: "Sarah Chen", email: "client@fb.com", password: "Client@123",
          role: "client", location: "Mumbai, India", bio: "Product Manager at TechCorp",
          phone: "+91 98765 43210",
        });
      }

      let client2 = await User.findOne({ email: "client2@fb.com" });
      if (!client2) {
        client2 = await User.create({
          name: "Rahul Sharma", email: "client2@fb.com", password: "Client@123",
          role: "client", location: "Delhi, India", bio: "Startup Founder",
          phone: "+91 91234 56789",
        });
      }

      let freelancer = await User.findOne({ email: "freelancer@fb.com" });
      if (!freelancer) {
        freelancer = await User.create({
          name: "Marcus Webb", email: "freelancer@fb.com", password: "Free@123",
          role: "freelancer", skills: ["React", "Node.js", "MongoDB", "TypeScript"],
          hourlyRate: 45, bio: "Full-stack developer with 5 years experience",
          rating: 4.8, reviewCount: 12, completedProjects: 18, location: "Bangalore, India",
        });
      }

      let admin = await User.findOne({ email: "admin@fb.com" });
      if (!admin) {
        admin = await User.create({ name: "Admin User", email: "admin@fb.com", password: "Admin@123", role: "admin" });
      }

      await Project.create([
        {
          title: "Build React E-commerce Website",
          description: "Need a responsive React frontend with authentication, product listing, cart, and checkout pages. Must integrate with REST APIs and support mobile devices. Experience with Redux and Tailwind CSS preferred.",
          client: client._id, category: "Web Development",
          skills: ["React", "TypeScript", "Git"],
          budget: { type: "fixed", min: 15000, max: 25000 }, status: "open",
          deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), isFeatured: true,
        },
        {
          title: "Node.js REST API Developer",
          description: "Need REST API development with MongoDB integration for a SaaS platform. Must handle authentication (JWT), file uploads, and real-time notifications via Socket.IO. 3+ years Node.js experience required.",
          client: client._id, category: "Web Development",
          skills: ["Node.js", "MongoDB", "Docker", "Git"],
          budget: { type: "fixed", min: 20000, max: 35000 }, status: "open",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Mobile App UI Designer (Delivery App)",
          description: "Design mobile screens for a food delivery application. Need complete UI kit including onboarding, home, search, cart, order tracking, and profile screens. Figma prototypes required with handoff-ready assets.",
          client: client2._id, category: "Design",
          skills: ["Figma", "UI/UX Design"],
          budget: { type: "fixed", min: 8000, max: 12000 }, status: "open",
          deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
        {
          title: "WordPress Website Bug Fix & Speed Optimization",
          description: "Need bug fixes and performance optimization for an existing WordPress site. Issues include slow load times, broken plugins, and mobile responsiveness problems. Must achieve 90+ PageSpeed score.",
          client: client2._id, category: "Web Development",
          skills: ["WordPress", "PHP", "SEO"],
          budget: { type: "fixed", min: 6000, max: 10000 }, status: "open",
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Remote Software Engineer (JavaScript/TypeScript)",
          description: "Looking for experienced software engineers to work on LLM training and evaluation systems. You will build tooling, data pipelines, and evaluation frameworks. Strong JavaScript/TypeScript skills required. Remote, contract position.",
          client: client._id, category: "Web Development",
          skills: ["TypeScript", "Node.js", "Docker", "Git"],
          budget: { type: "hourly", min: 50, max: 80 }, status: "open",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), isFeatured: true,
        },
        {
          title: "Python Data Analysis & Visualization",
          description: "We need a Python developer to write data analysis scripts for processing large CSV datasets and generating visual reports using matplotlib and pandas. Experience with Jupyter notebooks preferred.",
          client: client2._id, category: "Data",
          skills: ["Python", "MongoDB"],
          budget: { type: "fixed", min: 12000, max: 18000 }, status: "open",
          deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Logo & Brand Identity Design",
          description: "Need a creative designer to create a professional logo and complete brand identity kit for a fintech startup. Deliverables: logo (all formats), color palette, typography guide, business card, and letterhead.",
          client: client._id, category: "Design",
          skills: ["Photoshop", "Illustrator", "Figma"],
          budget: { type: "fixed", min: 5000, max: 8000 }, status: "open",
          deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        },
        {
          title: "SEO & Content Marketing Strategy",
          description: "Looking for an SEO expert to audit our website, perform keyword research, optimize on-page content, and create a 3-month content calendar. Must have proven track record of improving organic rankings.",
          client: client2._id, category: "Marketing",
          skills: ["SEO"],
          budget: { type: "hourly", min: 25, max: 40 }, status: "open",
        },
        {
          title: "Full Stack Developer — EdTech Platform",
          description: "Build a complete EdTech platform with React frontend and Node.js backend. Features: user authentication, course management, video streaming, quizzes, and payment integration. 6-month contract.",
          client: client._id, category: "Web Development",
          skills: ["React", "Node.js", "MongoDB", "TypeScript"],
          budget: { type: "fixed", min: 80000, max: 120000 }, status: "open",
          deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), isFeatured: true,
        },
        {
          title: "Angular Developer for Banking Dashboard",
          description: "Need an Angular developer to build a responsive banking dashboard with charts, transaction history, account management, and real-time notifications. Must follow WCAG accessibility standards.",
          client: client2._id, category: "Web Development",
          skills: ["Angular", "TypeScript", "Git"],
          budget: { type: "hourly", min: 40, max: 65 }, status: "open",
          deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
      ]);

      console.log("\u2705 Auto-seed complete — 10 projects created");
      console.log("   Client:     client@fb.com / Client@123");
      console.log("   Client 2:   client2@fb.com / Client@123");
      console.log("   Freelancer: freelancer@fb.com / Free@123");
      console.log("   Admin:      admin@fb.com / Admin@123");
    }
  } catch (seedErr) {
    console.error("Auto-seed error:", seedErr.message);
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL, methods: ["GET", "POST"] },
});

require("./socket")(io);
app.set("io", io);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projects"));
app.use("/api/proposals", require("./routes/proposals"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/earnings", require("./routes/earnings"));
app.use("/api/battle", require("./routes/battle"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
