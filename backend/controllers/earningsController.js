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
    const withdrawals = await Withdrawal.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, withdrawals });
  } catch (err) { next(err); }
};

exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, details } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: "Invalid amount" });
    if (!method) return res.status(400).json({ message: "Payment method required" });

    console.log("Withdrawal request:", { userId: req.user._id, amount, method });

    const withdrawal = await Withdrawal.create({ userId: req.user._id, amount, method, details: details || "" });
    res.status(201).json({ success: true, withdrawal });
  } catch (err) { next(err); }
};
