const express = require("express");
const router = express.Router();
const { updateProposalStatus, withdrawProposal, getMyProposals, uploadVoiceProposal } = require("../controllers/proposalController");
const { protect, authorize } = require("../middleware/auth");
const { audioUpload } = require("../config/cloudinary");

router.get("/my", protect, getMyProposals);
router.put("/:id/status", protect, authorize("client"), updateProposalStatus);
router.put("/:id/withdraw", protect, authorize("freelancer"), withdrawProposal);
router.post("/:id/voice", protect, authorize("freelancer"), audioUpload.single("audio"), uploadVoiceProposal);

module.exports = router;
