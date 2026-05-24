const User = require("../models/User");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const Dispute = require("../models/Dispute");
const Skill = require("../models/Skill");
const Earning = require("../models/Earning");
const ContactInfo = require("../models/ContactInfo");

exports.getStats = async (req, res, next) => {
  try {
    const [users, projects, proposals, disputes, earnings] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Proposal.countDocuments(),
      Dispute.countDocuments({ status: "open" }),
      Earning.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);
    const freelancers = await User.countDocuments({ role: "freelancer" });
    const clients = await User.countDocuments({ role: "client" });
    res.json({ success: true, stats: { users, freelancers, clients, projects, proposals, openDisputes: disputes, totalEarnings: earnings[0]?.total || 0 } });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ success: true, total, users });
  } catch (err) { next(err); }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.getDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find()
      .populate("project", "title")
      .populate("raisedBy", "name email")
      .populate("against", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, disputes });
  } catch (err) { next(err); }
};

exports.resolveDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", resolution: req.body.resolution, resolvedBy: req.user._id },
      { new: true }
    );
    res.json({ success: true, dispute });
  } catch (err) { next(err); }
};

exports.getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ category: 1, name: 1 });
    res.json({ success: true, skills });
  } catch (err) { next(err); }
};

exports.createSkill = async (req, res, next) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, skill });
  } catch (err) { next(err); }
};

exports.deleteSkill = async (req, res, next) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Skill deleted" });
  } catch (err) { next(err); }
};

exports.getContactInfo = async (req, res, next) => {
  try {
    let info = await ContactInfo.findOne();
    if (!info) info = await ContactInfo.create({});
    res.json({ success: true, contactInfo: info });
  } catch (err) { next(err); }
};

exports.updateContactInfo = async (req, res, next) => {
  try {
    const allowed = ["email", "phone", "address", "website", "twitter", "linkedin", "supportInfo"];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (!Object.keys(updates).length)
      return res.status(400).json({ message: "No valid fields provided" });
    updates.updatedBy = req.user._id;
    let info = await ContactInfo.findOne();
    if (!info) info = await ContactInfo.create({ ...updates });
    else {
      Object.assign(info, updates);
      await info.save();
    }
    res.json({ success: true, contactInfo: info });
  } catch (err) { next(err); }
};

exports.getAllProposals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Proposal.countDocuments();
    const proposals = await Proposal.find()
      .populate("freelancer", "name email avatar")
      .populate("project", "title budget status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, proposals });
  } catch (err) { next(err); }
};

exports.getAllProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Project.countDocuments();
    const projects = await Project.find()
      .populate("client", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, projects });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const monthly = await Earning.aggregate([
      { $group: { _id: { $month: "$createdAt" }, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { "_id": 1 } },
    ]);
    const topFreelancers = await User.find({ role: "freelancer" }).sort({ totalEarnings: -1 }).limit(5).select("name avatar totalEarnings completedProjects rating");
    const projectsByCategory = await Project.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, monthly, topFreelancers, projectsByCategory });
  } catch (err) { next(err); }
};
