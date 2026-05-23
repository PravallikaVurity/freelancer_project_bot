const express = require("express");
const router = express.Router();
const { updateProposalStatus, withdrawProposal, getMyProposals } = require("../controllers/proposalController");
const { protect, authorize } = require("../middleware/auth");

router.get("/my", protect, getMyProposals);
router.put("/:id/status", protect, authorize("client"), updateProposalStatus);
router.put("/:id/withdraw", protect, authorize("freelancer"), withdrawProposal);

module.exports = router;
