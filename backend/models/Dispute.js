const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    against: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "under_review", "resolved", "closed"], default: "open" },
    resolution: { type: String },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);
