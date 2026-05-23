const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    skills: [{ type: String }],
    budget: {
      type: { type: String, enum: ["fixed", "hourly"], default: "fixed" },
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "completed", "cancelled"],
      default: "open",
    },
    attachments: [{ url: String, name: String }],
    proposals: [{ type: mongoose.Schema.Types.ObjectId, ref: "Proposal" }],
    selectedFreelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

projectSchema.index({ title: "text", description: "text", skills: "text" });

module.exports = mongoose.model("Project", projectSchema);
