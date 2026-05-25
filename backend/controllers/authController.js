const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../config/email");
const { uploadToCloudinary } = require("../config/cloudinary");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

exports.register = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password, role, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Name, email and password are required" });

    console.log("Register attempt:", { name, email, role });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({ name, email, password, role: role || "freelancer", phone });
    console.log("User created:", user._id, user.email);

    const token = signToken(user._id);
    res.status(201).json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, currentStatus: user.currentStatus, statusUpdatedAt: user.statusUpdatedAt },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email) return res.status(400).json({ message: "Email required" });
    if (!password) return res.status(400).json({ message: "Password required" });

    console.log("Login attempt:", { email });

    const user = await User.findOne({ email }).select("+password");
    console.log("User found:", user ? user.email : "not found");

    if (!user) return res.status(401).json({ message: "User not found" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account has been suspended" });

    const token = signToken(user._id);
    res.json({
      success: true, token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, currentStatus: user.currentStatus, statusUpdatedAt: user.statusUpdatedAt },
    });
  } catch (err) { next(err); }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "No user with that email" });
    const token = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    try {
      await sendEmail({
        to: user.email,
        subject: "Password Reset – Freelancer Board",
        html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>Expires in 10 minutes.</p>`,
      });
      res.json({ success: true, message: "Reset email sent" });
    } catch {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired token" });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const token = signToken(user._id);
    res.json({ success: true, token });
  } catch (err) { next(err); }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const Proposal = require("../models/Proposal");
    const Project = require("../models/Project");
    const Earning = require("../models/Earning");
    const Review = require("../models/Review");
    const mongoose = require("mongoose");

    const [activeProposals, completedJobs, earningsData, reviewsData] = await Promise.all([
      Proposal.countDocuments({ freelancer: userId, status: { $in: ["pending", "accepted"] } }),
      Project.countDocuments({ selectedFreelancer: userId, status: "completed" }),
      Earning.aggregate([
        { $match: { freelancer: new mongoose.Types.ObjectId(userId), status: "released" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Review.find({ reviewee: userId }).select("rating"),
    ]);

    const totalEarnings = earningsData[0]?.total || 0;
    const avgRating = reviewsData.length
      ? (reviewsData.reduce((s, r) => s + r.rating, 0) / reviewsData.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats: {
        activeProposals,
        completedJobs,
        totalEarnings,
        rating: avgRating,
        reviewCount: reviewsData.length,
      },
    });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { currentStatus } = req.body;
    const allowed = ["available", "busy", "deep_work", "break", "offline"];
    if (!allowed.includes(currentStatus))
      return res.status(400).json({ message: "Invalid status" });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { currentStatus, statusUpdatedAt: new Date() },
      { new: true }
    );
    // Broadcast to all connected clients via socket
    if (req.app.get("io")) {
      req.app.get("io").emit("userStatusChanged", {
        userId: user._id,
        currentStatus: user.currentStatus,
        statusUpdatedAt: user.statusUpdatedAt,
      });
    }
    res.json({ success: true, currentStatus: user.currentStatus, statusUpdatedAt: user.statusUpdatedAt });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fields = ["name", "bio", "phone", "location", "skills", "hourlyRate", "portfolio"];
    const updates = {};
    fields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      updates.avatar = result.secure_url;
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
};
