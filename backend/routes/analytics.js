const express = require("express");
const router = express.Router();
const { getProjectAnalytics } = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

router.get("/project/:id", protect, authorize("client"), getProjectAnalytics);

module.exports = router;
