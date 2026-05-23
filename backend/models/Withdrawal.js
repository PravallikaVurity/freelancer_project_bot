const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["rupay", "upi", "bank_transfer", "debit_card", "credit_card"], required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
