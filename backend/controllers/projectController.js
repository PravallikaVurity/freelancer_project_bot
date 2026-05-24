const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const ScamReport = require("../models/ScamReport");
const analyzeProject = require("../config/scamDetector");
const { notifyFreelancers, notifyFreelancerSelection } = require("../services/notificationService");

exports.getProjects = async (req, res, next) => {
  try {
    const { search, category, budgetMin, budgetMax, type, status = "open", page = 1, limit = 10 } = req.query;
    const query = { status };
    if (search) query.title = { $regex: search, $options: "i" };
    if (category) query.category = category;
    if (type) query["budget.type"] = type;
    if (budgetMin) query["budget.min"] = { $gte: Number(budgetMin) };
    if (budgetMax) query["budget.max"] = { $lte: Number(budgetMax) };
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .populate("client", "name avatar rating location")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    console.log(`getProjects: found ${projects.length} of ${total} total`);
    res.json({ success: true, total, pages: Math.ceil(total / limit), projects });
  } catch (err) { next(err); }
};

exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("client", "name avatar rating location completedProjects phone email instagram twitter linkedin showContact")
      .populate({ path: "proposals", populate: { path: "freelancer", select: "name avatar rating skills" } });
    if (!project) return res.status(404).json({ message: "Project not found" });
    project.views += 1;
    await project.save();
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

exports.createProject = async (req, res, next) => {
  try {
    console.log("createProject called by user:", req.user?._id, req.user?.role);
    console.log("createProject payload:", req.body);
    const project = await Project.create({ ...req.body, client: req.user._id });
    console.log("Project created:", project._id, project.title);
    // Run scam detection asynchronously — does not block project creation
    analyzeProject(project).catch((err) => console.error("Scam detection error:", err));
    // Notify matching freelancers asynchronously — does not block response
    const io = req.app.get("io");
    notifyFreelancers(project, io).catch((err) => console.error("Notification error:", err));
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

exports.getScamReport = async (req, res, next) => {
  try {
    const report = await ScamReport.findOne({ project: req.params.id });
    res.json({ success: true, report: report || null });
  } catch (err) { next(err); }
};

exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== "admin")
      return res.status(403).json({ message: "Not authorized" });
    await project.deleteOne();
    res.json({ success: true, message: "Project deleted" });
  } catch (err) { next(err); }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ client: req.user._id })
      .populate("proposals")
      .populate("selectedFreelancer", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (err) { next(err); }
};

exports.saveJob = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.savedJobs.indexOf(req.params.id);
    if (idx > -1) user.savedJobs.splice(idx, 1);
    else user.savedJobs.push(req.params.id);
    await user.save();
    res.json({ success: true, savedJobs: user.savedJobs });
  } catch (err) { next(err); }
};

exports.getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("savedJobs");
    res.json({ success: true, savedJobs: user.savedJobs });
  } catch (err) { next(err); }
};

exports.selectFreelancer = async (req, res, next) => {
  try {
    const { proposalId } = req.body;
    if (!proposalId) return res.status(400).json({ message: "proposalId is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (project.status === "assigned")
      return res.status(400).json({ message: "A freelancer is already assigned" });

    const proposal = await Proposal.findById(proposalId).populate("freelancer", "name");
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (proposal.project.toString() !== project._id.toString())
      return res.status(400).json({ message: "Proposal does not belong to this project" });

    const freelancer = await User.findById(proposal.freelancer._id);
    if (!freelancer) return res.status(404).json({ message: "Freelancer not found" });

    // Update project
    project.status = "assigned";
    project.selectedFreelancer = freelancer._id;
    project.selectedAt = new Date();
    project.selectedBy = req.user._id;
    await project.save();

    // Update selected proposal
    proposal.status = "accepted";
    await proposal.save();

    // Reject all other pending proposals
    await Proposal.updateMany(
      { project: project._id, _id: { $ne: proposalId }, status: "pending" },
      { status: "rejected" }
    );

    // Notify all applicants
    const io = req.app.get("io");
    await notifyFreelancerSelection(project, freelancer._id, io).catch(() => {});

    res.json({ success: true, project });
  } catch (err) { next(err); }
};
