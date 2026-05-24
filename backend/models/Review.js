const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "" },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent duplicate reviews: one reviewer per project per reviewee
reviewSchema.index({ project: 1, reviewer: 1, reviewee: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
