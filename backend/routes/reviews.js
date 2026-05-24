const express = require("express");
const router = express.Router();
const { createReview, getUserReviews, getMyReviews, checkReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/auth");

router.post("/", protect, createReview);
router.get("/my", protect, getMyReviews);
router.get("/check", protect, checkReview);
router.get("/user/:userId", getUserReviews);

module.exports = router;
