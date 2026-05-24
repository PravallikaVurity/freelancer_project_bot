const express = require("express");
const router = express.Router();
const {
  getMyEarnings, getWithdrawals, requestWithdrawal,
  getClientWithdrawalRequests, approveWithdrawal, rejectWithdrawal, completeWithdrawal,
} = require("../controllers/earningsController");
const { protect, authorize } = require("../middleware/auth");

// Freelancer routes
router.get("/", protect, authorize("freelancer"), getMyEarnings);
router.get("/withdrawals", protect, authorize("freelancer"), getWithdrawals);
router.post("/withdraw", protect, authorize("freelancer"), requestWithdrawal);
router.put("/withdrawals/:id/complete", protect, authorize("freelancer"), completeWithdrawal);

// Client routes
router.get("/client/withdrawal-requests", protect, authorize("client"), getClientWithdrawalRequests);
router.put("/client/withdrawals/:id/approve", protect, authorize("client"), approveWithdrawal);
router.put("/client/withdrawals/:id/reject", protect, authorize("client"), rejectWithdrawal);

module.exports = router;
