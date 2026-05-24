const Earning = require("../models/Earning");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");

exports.getMyEarnings = async (req, res, next) => {
  try {
    const earnings = await Earning.find({ freelancer: req.user._id })
      .populate("project", "title")
      .populate("client", "name")
      .sort({ createdAt: -1 });

    const available = earnings
      .filter((e) => e.status === "released")
      .reduce((sum, e) => sum + e.amount, 0);

    const thisMonth = earnings
      .filter((e) => {
        const d = new Date(e.createdAt);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, e) => sum + e.amount, 0);

    const total = await User.findById(req.user._id).select("totalEarnings");

    res.json({ success: true, earnings, available, thisMonth, total: total?.totalEarnings || 0 });
  } catch (err) { next(err); }
};

exports.getWithdrawals = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ userId: req.user._id })
      .populate("client", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (err) { next(err); }
};

// Freelancer submits withdrawal request — status: pending_approval
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, details, clientId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Payment method required" });

    // Check available balance
    const earnings = await Earning.find({ freelancer: req.user._id, status: "released" });
    const available = earnings.reduce((sum, e) => sum + e.amount, 0);

    // Subtract already pending/approved withdrawals
    const pendingWithdrawals = await Withdrawal.find({
      userId: req.user._id,
      status: { $in: ["pending_approval", "approved"] },
    });
    const pendingTotal = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const effectiveAvailable = available - pendingTotal;

    if (amount > effectiveAvailable)
      return res.status(400).json({ message: `Insufficient balance. Available: ₹${effectiveAvailable}` });

    // Find the client from the most recent released earning if not provided
    let resolvedClientId = clientId;
    if (!resolvedClientId) {
      const latestEarning = await Earning.findOne({ freelancer: req.user._id, status: "released" }).sort({ createdAt: -1 });
      resolvedClientId = latestEarning?.client;
    }

    const withdrawal = await Withdrawal.create({
      userId: req.user._id,
      client: resolvedClientId || null,
      amount,
      method,
      details: details || "",
      status: "pending_approval",
    });

    await withdrawal.populate("client", "name");

    // Notify client via socket
    if (req.app.get("io") && resolvedClientId) {
      req.app.get("io").emit("withdrawalRequest", {
        clientId: resolvedClientId.toString(),
        withdrawal,
        freelancerName: req.user.name,
      });
    }

    res.status(201).json({ success: true, withdrawal });
  } catch (err) { next(err); }
};

// Client: get all pending withdrawal requests for their freelancers
exports.getClientWithdrawalRequests = async (req, res, next) => {
  try {
    const withdrawals = await Withdrawal.find({ client: req.user._id })
      .populate("userId", "name avatar")
      .sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (err) { next(err); }
};

// Client approves withdrawal
exports.approveWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.client?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (withdrawal.status !== "pending_approval")
      return res.status(400).json({ message: "Withdrawal is not pending approval" });

    withdrawal.status = "approved";
    await withdrawal.save();

    // Notify freelancer via socket
    if (req.app.get("io")) {
      req.app.get("io").emit("withdrawalStatusChanged", {
        withdrawalId: withdrawal._id,
        userId: withdrawal.userId.toString(),
        status: "approved",
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) { next(err); }
};

// Client rejects withdrawal
exports.rejectWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.client?.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (withdrawal.status !== "pending_approval")
      return res.status(400).json({ message: "Withdrawal is not pending approval" });

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = req.body.reason || "";
    await withdrawal.save();

    if (req.app.get("io")) {
      req.app.get("io").emit("withdrawalStatusChanged", {
        withdrawalId: withdrawal._id,
        userId: withdrawal.userId.toString(),
        status: "rejected",
        reason: withdrawal.rejectionReason,
      });
    }

    res.json({ success: true, withdrawal });
  } catch (err) { next(err); }
};

// Freelancer completes an approved withdrawal
exports.completeWithdrawal = async (req, res, next) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ message: "Withdrawal not found" });
    if (withdrawal.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (withdrawal.status !== "approved")
      return res.status(400).json({ message: "Withdrawal must be approved before completing" });

    withdrawal.status = "withdrawn";
    await withdrawal.save();

    // Mark earnings as withdrawn up to the amount
    let remaining = withdrawal.amount;
    const releasedEarnings = await Earning.find({ freelancer: req.user._id, status: "released" }).sort({ createdAt: 1 });
    for (const earning of releasedEarnings) {
      if (remaining <= 0) break;
      if (earning.amount <= remaining) {
        earning.status = "withdrawn";
        remaining -= earning.amount;
        await earning.save();
      }
    }

    res.json({ success: true, withdrawal });
  } catch (err) { next(err); }
};
