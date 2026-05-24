const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const { uploadToCloudinary } = require("../config/cloudinary");

exports.submitProposal = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.status !== "open") return res.status(400).json({ message: "Project is not open" });
    const existing = await Proposal.findOne({ project: req.params.projectId, freelancer: req.user._id });
    if (existing) return res.status(400).json({ message: "Already submitted a proposal" });
    const proposal = await Proposal.create({ ...req.body, project: req.params.projectId, freelancer: req.user._id });
    project.proposals.push(proposal._id);
    await project.save();
    res.status(201).json({ success: true, proposal });
  } catch (err) { next(err); }
};

exports.getProposals = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    const proposals = await Proposal.find({ project: req.params.projectId })
      .populate("freelancer", "name avatar rating skills completedProjects hourlyRate");
    res.json({ success: true, proposals });
  } catch (err) { next(err); }
};

exports.updateProposalStatus = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate("project");
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (proposal.project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    proposal.status = req.body.status;
    await proposal.save();
    if (req.body.status === "accepted") {
      await Project.findByIdAndUpdate(proposal.project._id, {
        status: "in_progress",
        selectedFreelancer: proposal.freelancer,
      });
    }
    res.json({ success: true, proposal });
  } catch (err) { next(err); }
};

exports.withdrawProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (proposal.freelancer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    proposal.status = "withdrawn";
    await proposal.save();
    res.json({ success: true, proposal });
  } catch (err) { next(err); }
};

exports.getMyProposals = async (req, res, next) => {
  try {
    const proposals = await Proposal.find({ freelancer: req.user._id })
      .populate("project", "title budget status client")
      .sort({ createdAt: -1 });
    res.json({ success: true, proposals });
  } catch (err) { next(err); }
};

exports.getFreelancerAnalytics = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const Project = require("../models/Project");
    const Earning = require("../models/Earning");

    const [proposals, assignedProjects, earnings] = await Promise.all([
      Proposal.find({ freelancer: uid })
        .populate("project", "title budget status deadline category createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      Project.find({ selectedFreelancer: uid })
        .select("title status category deadline budget createdAt")
        .lean(),
      Earning.find({ freelancer: uid })
        .select("amount status createdAt")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    // Proposal status breakdown
    const proposalStats = {
      total: proposals.length,
      pending: proposals.filter((p) => p.status === "pending").length,
      accepted: proposals.filter((p) => p.status === "accepted").length,
      rejected: proposals.filter((p) => p.status === "rejected").length,
      withdrawn: proposals.filter((p) => p.status === "withdrawn").length,
    };

    // Project stats
    const projectStats = {
      total: assignedProjects.length,
      active: assignedProjects.filter((p) => p.status === "in_progress").length,
      completed: assignedProjects.filter((p) => p.status === "completed").length,
      open: assignedProjects.filter((p) => p.status === "open").length,
    };

    // Upcoming deadlines (next 30 days)
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const upcomingDeadlines = assignedProjects
      .filter((p) => p.deadline && new Date(p.deadline) >= now && new Date(p.deadline) <= in30)
      .map((p) => ({ title: p.title, deadline: p.deadline, status: p.status }))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Earnings summary
    const totalEarned = earnings.filter((e) => e.status !== "pending").reduce((s, e) => s + e.amount, 0);
    const pendingEarnings = earnings.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0);
    const withdrawnEarnings = earnings.filter((e) => e.status === "withdrawn").reduce((s, e) => s + e.amount, 0);

    // Monthly earnings trend (last 6 months)
    const monthlyEarnings = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const amount = earnings
        .filter((e) => {
          const ed = new Date(e.createdAt);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear() && e.status !== "pending";
        })
        .reduce((s, e) => s + e.amount, 0);
      monthlyEarnings.push({ month: label, amount });
    }

    // Proposal submission trend (last 6 months)
    const proposalTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      const count = proposals.filter((p) => {
        const pd = new Date(p.createdAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      }).length;
      proposalTrend.push({ month: label, proposals: count });
    }

    // Category distribution from proposals
    const categoryMap = {};
    proposals.forEach((p) => {
      const cat = p.project?.category || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Average bid amount
    const avgBid = proposals.length
      ? Math.round(proposals.reduce((s, p) => s + (p.bidAmount || 0), 0) / proposals.length)
      : 0;

    res.json({
      success: true,
      proposalStats,
      projectStats,
      upcomingDeadlines,
      earningsStats: { totalEarned, pendingEarnings, withdrawnEarnings },
      monthlyEarnings,
      proposalTrend,
      categoryDistribution,
      avgBid,
      recentProposals: proposals.slice(0, 5),
    });
  } catch (err) { next(err); }
};

exports.uploadVoiceProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (proposal.freelancer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    if (!req.file) return res.status(400).json({ message: "No audio file provided" });

    const result = await uploadToCloudinary(req.file.buffer, "voice-proposals");
    proposal.voiceFile = { url: result.secure_url, duration: req.body.duration ? Number(req.body.duration) : null };
    await proposal.save();
    res.json({ success: true, voiceFile: proposal.voiceFile });
  } catch (err) { next(err); }
};
