const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Earning = require("../models/Earning");

exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("selectedFreelancer", "name avatar rating completedProjects")
      .populate("proposals");

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const acceptedProposal = project.proposals.find((p) => p.status === "accepted");

    const now = new Date();
    const selectedAt = project.selectedAt ? new Date(project.selectedAt) : new Date(project.createdAt);
    const deadline = project.deadline ? new Date(project.deadline) : null;
    const deliveryDays = acceptedProposal?.deliveryTime || 30;
    const totalDays = deadline
      ? Math.max(1, Math.ceil((deadline - selectedAt) / (1000 * 60 * 60 * 24)))
      : deliveryDays;
    const elapsedDays = Math.max(0, Math.ceil((now - selectedAt) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const completionPct = Math.min(100, Math.round((elapsedDays / totalDays) * 100));
    const isOverdue = deadline ? now > deadline && project.status !== "completed" : false;

    // Message activity (proxy for productivity)
    const conversations = await Conversation.find({ project: project._id }).select("_id");
    const convIds = conversations.map((c) => c._id);
    const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const messages = convIds.length
      ? await Message.find({ conversation: { $in: convIds }, createdAt: { $gte: fourteenDaysAgo } }).select("createdAt")
      : [];

    // Daily activity last 14 days
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      dailyMap[key] = 0;
    }
    messages.forEach((m) => {
      const key = new Date(m.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      if (dailyMap[key] !== undefined) dailyMap[key]++;
    });
    const activityTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

    // Weekly rollup last 4 weeks
    const weeklyMap = { "Wk 1": 0, "Wk 2": 0, "Wk 3": 0, "Wk 4": 0 };
    messages.forEach((m) => {
      const daysAgo = Math.floor((now - new Date(m.createdAt)) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) weeklyMap["Wk 4"]++;
      else if (daysAgo < 14) weeklyMap["Wk 3"]++;
      else if (daysAgo < 21) weeklyMap["Wk 2"]++;
      else weeklyMap["Wk 1"]++;
    });
    const weeklyActivity = Object.entries(weeklyMap).map(([week, count]) => ({ week, count }));

    // Milestones: split deliveryTime into 4 equal checkpoints
    const MILESTONE_COUNT = 4;
    const milestoneDays = Math.ceil(totalDays / MILESTONE_COUNT);
    const milestonesCompleted = Math.min(MILESTONE_COUNT, Math.floor(elapsedDays / milestoneDays));
    const milestonesPending = MILESTONE_COUNT - milestonesCompleted;

    const completedTasks = milestonesCompleted;
    const delayedTasks = isOverdue ? 1 : 0;
    const pendingTasks = Math.max(0, milestonesPending - delayedTasks);

    // Avg response time
    let avgResponseHours = null;
    if (messages.length >= 2) {
      const sorted = [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      let total = 0, gaps = 0;
      for (let i = 1; i < sorted.length; i++) {
        const gap = (new Date(sorted[i].createdAt) - new Date(sorted[i - 1].createdAt)) / (1000 * 60 * 60);
        if (gap < 48) { total += gap; gaps++; }
      }
      avgResponseHours = gaps > 0 ? Math.round(total / gaps) : null;
    }

    const earning = await Earning.findOne({ project: project._id }).lean();

    res.json({
      success: true,
      analytics: {
        project: { _id: project._id, title: project.title, status: project.status, deadline: project.deadline, selectedAt: project.selectedAt },
        freelancer: project.selectedFreelancer,
        metrics: {
          totalDays, elapsedDays, remainingDays, completionPct, isOverdue,
          totalTasks: MILESTONE_COUNT, completedTasks, pendingTasks, delayedTasks,
          milestonesCompleted, milestonesPending,
          totalMessages: messages.length, avgResponseHours,
          bidAmount: acceptedProposal?.bidAmount || null,
          deliveryTime: acceptedProposal?.deliveryTime || null,
          earningStatus: earning?.status || null,
        },
        charts: {
          progressDonut: [
            { name: "Completed", value: completionPct, fill: "#2ee6a6" },
            { name: "Remaining", value: 100 - completionPct, fill: "rgba(139,139,163,0.2)" },
          ],
          milestoneBar: [
            { name: "Completed", value: milestonesCompleted, fill: "#2ee6a6" },
            { name: "Pending", value: milestonesPending, fill: "#9b6dff" },
          ],
          workDistribution: [
            { name: "Completed", value: Math.max(completedTasks, 1), fill: "#2ee6a6" },
            { name: "Pending", value: Math.max(pendingTasks, 0), fill: "#9b6dff" },
            { name: "Delayed", value: delayedTasks, fill: "#ff6b6b" },
          ],
          activityTrend,
          weeklyActivity,
        },
      },
    });
  } catch (err) { next(err); }
};
