const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

// GET /api/notifications — fetch current user's notifications
router.get("/", protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .populate("projectId", "title category skills budget deadline")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, notifications });
  } catch (err) { next(err); }
});

// PATCH /api/notifications/:id/read — mark a notification as read
router.patch("/:id/read", protect, async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status: "read" }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
