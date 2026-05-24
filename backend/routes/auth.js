const express = require("express");
const router = express.Router();
const { register, login, getMe, forgotPassword, resetPassword, updateProfile, getDashboardStats, updateStatus } = require("../controllers/authController");
const { sendOtp, verifyOtp } = require("../controllers/otpController");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.post("/register", register);
router.post("/login", login);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", protect, getMe);
router.get("/dashboard-stats", protect, getDashboardStats);
router.put("/status", protect, updateStatus);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.put("/profile", protect, upload.single("avatar"), updateProfile);

module.exports = router;
