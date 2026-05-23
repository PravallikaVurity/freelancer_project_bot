const mongoose = require("mongoose");

const battleRoomSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, unique: true },
    freelancers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        proposal: { type: mongoose.Schema.Types.ObjectId, ref: "Proposal" },
        matchScore: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BattleRoom", battleRoomSchema);
