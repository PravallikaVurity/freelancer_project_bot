const express = require("express");
const router = express.Router();
const { getProjects, getProject, createProject, updateProject, deleteProject, getMyProjects, saveJob, getSavedJobs } = require("../controllers/projectController");
const { submitProposal, getProposals, updateProposalStatus, withdrawProposal, getMyProposals } = require("../controllers/proposalController");
const { protect, authorize } = require("../middleware/auth");

router.get("/", getProjects);
router.get("/my", protect, getMyProjects);
router.get("/saved", protect, getSavedJobs);
router.post("/", protect, authorize("client"), createProject);
router.get("/:id", getProject);
router.put("/:id", protect, authorize("client"), updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/save", protect, saveJob);
router.post("/:projectId/proposals", protect, authorize("freelancer"), submitProposal);
router.get("/:projectId/proposals", protect, authorize("client"), getProposals);

module.exports = router;
