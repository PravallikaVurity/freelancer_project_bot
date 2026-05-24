const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    notificationType: { type: String, enum: ["email", "sms", "linkedin", "socket"], required: true },
    status: { type: String, enum: ["pending", "sent", "failed", "read"], default: "pending" },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate notifications for same user + project + type
notificationSchema.index({ userId: 1, projectId: 1, notificationType: 1 }, { unique: true });

module.exports = mongoose.model("Notification", notificationSchema);
