const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../config/email");

const OTP_EXPIRY_MS = 5 * 60 * 1000;       // 5 minutes
const MAX_ATTEMPTS = 5;                      // max wrong OTP tries
const MAX_RESENDS = 3;                       // max resends per 10 min window
const RESEND_WINDOW_MS = 10 * 60 * 1000;    // 10 minute resend window

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

/** Generate a 6-digit OTP */
function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/** POST /api/auth/send-otp */
exports.sendOtp = async (req, res, next) => {
  try {
    const raw = req.body.identifier?.trim();
    console.log(`[OTP] sendOtp request received, identifier: ${raw ? raw.replace(/.(?=.{4})/g, "*") : "(empty)"}`);
    if (!raw) return res.status(400).json({ message: "Email or phone number is required" });

    // Determine if email or phone
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const isPhone = /^\+?[\d\s\-()]{7,15}$/.test(raw);

    if (!isEmail && !isPhone)
      return res.status(400).json({ message: "Invalid email or phone number" });

    // Find user
    const query = isEmail
      ? { email: raw.toLowerCase() }
      : { phone: { $regex: raw.replace(/\D/g, ""), $options: "i" } };

    const user = await User.findOne(query).select(
      "+otpHash +otpExpire +otpAttempts +otpResendCount +otpResendResetAt"
    );

    if (!user) {
      console.log(`[OTP] Account not found for identifier: ${raw}`);
      return res.status(404).json({ message: "Account not found" });
    }
    if (!user.isActive) return res.status(403).json({ message: "Account has been suspended" });
    console.log(`[OTP] User found: ${user._id}`);

    // Resend rate limiting — reset window if expired
    const now = Date.now();
    if (!user.otpResendResetAt || now > new Date(user.otpResendResetAt).getTime()) {
      user.otpResendCount = 0;
      user.otpResendResetAt = new Date(now + RESEND_WINDOW_MS);
    }

    if (user.otpResendCount >= MAX_RESENDS)
      return res.status(429).json({ message: "Too many OTP requests. Please wait 10 minutes before trying again." });

    // Generate OTP
    const otp = generateOtp();
    const hash = await bcrypt.hash(otp, 10);
    console.log(`[OTP] Generated for user ${user._id} via ${isEmail ? "email" : "phone"}`);

    user.otpHash = hash;
    user.otpExpire = new Date(now + OTP_EXPIRY_MS);
    user.otpAttempts = 0;
    user.otpResendCount += 1;
    await user.save({ validateBeforeSave: false });

    // Send OTP
    if (isEmail) {
      try {
        await sendEmail({
          to: user.email,
          subject: "Your Freelancer Board Login OTP",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#2ee6a6">Your Login OTP</h2>
              <p>Hi ${user.name},</p>
              <p>Use the OTP below to log in to your Freelancer Board account:</p>
              <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#2ee6a6;margin:24px 0">${otp}</div>
              <p style="color:#888">This OTP expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
              <p style="color:#888;font-size:12px">If you did not request this, please ignore this email.</p>
            </div>`,
        });
        console.log(`[OTP] Generated and emailed to ${user.email}`);
        return res.json({ success: true, message: "OTP sent to your registered email address", via: "email" });
      } catch (emailErr) {
        console.error(`[OTP] Email send failed for ${user.email}:`, emailErr.message);
        return res.status(emailErr.statusCode || 503).json({ message: emailErr.message || "Email service unavailable" });
      }
    }

    // SMS — log to console if no SMS provider configured
    // Replace this block with your SMS provider (Twilio, MSG91, etc.)
    console.log(`[OTP] Generated for phone ${user.phone} | OTP: ${otp}`);
    return res.json({ success: true, message: "OTP sent to your registered mobile number", via: "phone" });

  } catch (err) {
    console.error("[OTP] sendOtp error:", err.message);
    next(err);
  }
};

/** POST /api/auth/verify-otp */
exports.verifyOtp = async (req, res, next) => {
  try {
    const raw = req.body.identifier?.trim();
    const otp = req.body.otp?.trim();

    if (!raw || !otp) return res.status(400).json({ message: "Identifier and OTP are required" });
    if (!/^\d{6}$/.test(otp)) return res.status(400).json({ message: "OTP must be a 6-digit number" });

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const query = isEmail
      ? { email: raw.toLowerCase() }
      : { phone: { $regex: raw.replace(/\D/g, ""), $options: "i" } };

    const user = await User.findOne(query).select(
      "+otpHash +otpExpire +otpAttempts"
    );

    if (!user) return res.status(404).json({ message: "Account not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account has been suspended" });

    // Brute-force protection
    if (user.otpAttempts >= MAX_ATTEMPTS)
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });

    // Expiry check
    if (!user.otpExpire || Date.now() > new Date(user.otpExpire).getTime()) {
      user.otpHash = undefined;
      user.otpExpire = undefined;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    const isMatch = await bcrypt.compare(otp, user.otpHash || "");
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      const remaining = MAX_ATTEMPTS - user.otpAttempts;
      return res.status(400).json({
        message: remaining > 0
          ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many failed attempts. Please request a new OTP.",
      });
    }

    // OTP valid — clear it to prevent reuse
    user.otpHash = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.otpResendCount = 0;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        currentStatus: user.currentStatus,
        statusUpdatedAt: user.statusUpdatedAt,
      },
    });
  } catch (err) { next(err); }
};
