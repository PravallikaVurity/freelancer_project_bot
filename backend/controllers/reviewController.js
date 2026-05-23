const Review = require("../models/Review");
const User = require("../models/User");

exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create({ ...req.body, reviewer: req.user._id });
    const reviews = await Review.find({ reviewee: req.body.reviewee });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(req.body.reviewee, { rating: avg.toFixed(1), reviewCount: reviews.length });
    res.status(201).json({ success: true, review });
  } catch (err) { next(err); }
};

exports.getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate("reviewer", "name avatar")
      .populate("project", "title")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) { next(err); }
};
