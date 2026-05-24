const mongoose = require("mongoose");

const contactInfoSchema = new mongoose.Schema(
  {
    email: { type: String, default: "hello@freelancerboard.com" },
    phone: { type: String, default: "" },
    address: { type: String, default: "Remote · Worldwide" },
    website: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    supportInfo: { type: String, default: "" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
