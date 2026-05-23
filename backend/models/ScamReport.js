const mongoose = require("mongoose");

const scamReportSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    reasons: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ScamReport", scamReportSchema);
