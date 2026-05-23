const express = require("express");
const router = express.Router();
const { getActiveBattles, getBattleRoom, hireFreelancer } = require("../controllers/battleController");
const { protect, authorize } = require("../middleware/auth");

router.get("/active", protect, authorize("client"), getActiveBattles);
router.get("/:projectId", protect, authorize("client"), getBattleRoom);
router.post("/:projectId/hire/:proposalId", protect, authorize("client"), hireFreelancer);

module.exports = router;
