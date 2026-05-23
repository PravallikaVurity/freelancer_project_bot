const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "released", "withdrawn"], default: "pending" },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Earning", earningSchema);
