const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["rupay", "upi", "bank_transfer", "debit_card", "credit_card"], required: true },
    status: {
      type: String,
      enum: ["pending_approval", "approved", "rejected", "withdrawn"],
      default: "pending_approval",
    },
    details: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
