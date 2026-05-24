const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/auth");

// POST /api/ai/chat — freelancers and clients
router.post("/chat", protect, authorize("freelancer", "client"), chat);

module.exports = router;
