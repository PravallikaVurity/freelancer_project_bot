const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["freelancer", "client", "admin"], default: "freelancer" },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    skills: [{ type: String }],
    portfolio: [{ title: String, url: String, image: String }],
    hourlyRate: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    completedProjects: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
    // Social/contact fields — only shown if user opts to share
    showContact: { type: Boolean, default: false },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    // OTP login
    otpHash: { type: String, select: false },
    otpExpire: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
    otpResendCount: { type: Number, default: 0, select: false },
    otpResendResetAt: { type: Date, select: false },
    currentStatus: {
      type: String,
      enum: ["available", "busy", "deep_work", "break", "offline"],
      default: "available",
    },
    statusUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
