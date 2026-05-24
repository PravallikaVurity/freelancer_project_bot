const express = require("express");
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, getMyProjects, saveJob, getSavedJobs, getScamReport, selectFreelancer } = require("../controllers/projectController");
const { submitProposal, getProposals } = require("../controllers/proposalController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", getProjects);
router.get("/my", protect, getMyProjects);
router.get("/saved", protect, getSavedJobs);
router.post("/", protect, authorize("client"), createProject);
router.get("/:id", getProject);
router.get("/:id/scam-report", protect, getScamReport);
router.put("/:id", protect, authorize("client"), updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/save", protect, saveJob);
router.post("/:projectId/proposals", protect, authorize("freelancer"), submitProposal);
router.get("/:projectId/proposals", protect, authorize("client"), getProposals);
router.post("/:id/select-freelancer", protect, authorize("client"), selectFreelancer);

module.exports = router;
