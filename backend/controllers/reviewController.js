const Review = require("../models/Review");
const User = require("../models/User");
const Project = require("../models/Project");

exports.createReview = async (req, res, next) => {
  try {
    const { projectId, revieweeId, rating, title, comment } = req.body;

    if (!projectId || !revieweeId || !rating || !comment?.trim())
      return res.status(400).json({ message: "projectId, revieweeId, rating and comment are required" });

    if (Number(rating) < 1 || Number(rating) > 5)
      return res.status(400).json({ message: "Rating must be between 1 and 5" });

    // Prevent self-review
    if (req.user._id.toString() === revieweeId.toString())
      return res.status(400).json({ message: "You cannot review yourself" });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Only allow reviews on completed projects
    if (project.status !== "completed")
      return res.status(400).json({ message: "Reviews can only be submitted after the project is completed" });

    // Validate reviewer is involved: must be client or selected freelancer
    const isClient = project.client.toString() === req.user._id.toString();
    const isFreelancer = project.selectedFreelancer?.toString() === req.user._id.toString();
    if (!isClient && !isFreelancer)
      return res.status(403).json({ message: "You are not involved in this project" });

    // Validate reviewee is the other party
    const expectedReviewee = isClient
      ? project.selectedFreelancer?.toString()
      : project.client.toString();
    if (revieweeId.toString() !== expectedReviewee)
      return res.status(403).json({ message: "Invalid reviewee for this project" });

    // Prevent duplicate
    const existing = await Review.findOne({ project: projectId, reviewer: req.user._id, reviewee: revieweeId });
    if (existing) return res.status(400).json({ message: "You have already reviewed this project" });

    const review = await Review.create({
      project: projectId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: Number(rating),
      title: title?.trim() || "",
      comment: comment.trim(),
    });

    // Update reviewee's average rating and count
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1);
    await User.findByIdAndUpdate(revieweeId, { rating: avg, reviewCount: allReviews.length });

    await review.populate("reviewer", "name avatar role");
    await review.populate("project", "title");

    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "You have already reviewed this project" });
    next(err);
  }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name avatar role")
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.user._id })
      .populate("reviewer", "name avatar role")
      .populate("project", "title")
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};

// Check if current user has already reviewed a specific project/reviewee
exports.checkReview = async (req, res, next) => {
  try {
    const { projectId, revieweeId } = req.query;
    const existing = await Review.findOne({ project: projectId, reviewer: req.user._id, reviewee: revieweeId });
    res.json({ success: true, hasReviewed: !!existing });
  } catch (err) { next(err); }
};
