const express = require("express");
const router = express.Router();
const { getStats, getUsers, toggleUserStatus, getDisputes, resolveDispute, getSkills, createSkill, deleteSkill, getAnalytics, getContactInfo, updateContactInfo, getAllProposals, getAllProjects } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// Public — anyone can read contact info
router.get("/contact-info", getContactInfo);

// All routes below require admin
router.use(protect, authorize("admin"));

router.put("/contact-info", updateContactInfo);
router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/toggle", toggleUserStatus);
router.get("/disputes", getDisputes);
router.put("/disputes/:id/resolve", resolveDispute);
router.get("/skills", getSkills);
router.post("/skills", createSkill);
router.delete("/skills/:id", deleteSkill);
router.get("/analytics", getAnalytics);
router.get("/proposals", getAllProposals);
router.get("/projects", getAllProjects);

module.exports = router;
