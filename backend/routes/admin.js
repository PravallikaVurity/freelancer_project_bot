const express = require("express");
const router = express.Router();
const { getStats, getUsers, toggleUserStatus, getDisputes, resolveDispute, getSkills, createSkill, deleteSkill, getAnalytics } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUserStatus);
router.get("/disputes", getDisputes);
router.put("/disputes/:id/resolve", resolveDispute);
router.get("/skills", getSkills);
router.post("/skills", createSkill);
router.delete("/skills/:id", deleteSkill);
router.get("/analytics", getAnalytics);

module.exports = router;
