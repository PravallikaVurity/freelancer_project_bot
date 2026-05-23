const express = require("express");
const router = express.Router();
const { getMyEarnings, getWithdrawals, requestWithdrawal } = require("../controllers/earningsController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect, authorize("freelancer"));

router.get("/", getMyEarnings);
router.get("/withdrawals", getWithdrawals);
router.post("/withdraw", requestWithdrawal);

module.exports = router;
