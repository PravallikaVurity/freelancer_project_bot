const Project = require("../models/Project");
const Proposal = require("../models/Proposal");
const User = require("../models/User");
const { getAIAnswer } = require("../services/aiService");

exports.chat = async (req, res, next) => {
  try {
    const { message, projectId, history = [] } = req.body;

    // Validate message
    if (!message?.trim()) {
      return res.json({ success: true, answer: "Please type a question and I'll do my best to help!" });
    }

    console.log(`[AI Controller] User: ${req.user._id} | Message: "${message.slice(0, 80)}" | ProjectId: ${projectId || "none"}`);

    // Load full user profile
    const fullUser = await User.findById(req.user._id)
      .select("name role skills bio rating completedProjects hourlyRate location")
      .lean();

    const ctx = { user: fullUser || req.user };

    // Load project context if projectId provided
    if (projectId) {
      try {
        const project = await Project.findById(projectId)
          .populate("client", "name rating completedProjects location")
          .lean();

        if (project) {
          ctx.project = project;
          console.log(`[AI Controller] Project context loaded: "${project.title}"`);

          if (req.user.role === "freelancer") {
            ctx.myProposal = await Proposal.findOne({
              project: projectId,
              freelancer: req.user._id,
            }).lean();
          }
        } else {
          console.warn(`[AI Controller] Project not found: ${projectId}`);
        }
      } catch (err) {
        console.error(`[AI Controller] Failed to load project context: ${err.message}`);
        // Non-critical — continue without project context
      }
    }

    // Sanitize history — keep last 20 messages, strip timestamps, limit text length
    const safeHistory = Array.isArray(history)
      ? history
          .filter((m) => (m.from === "user" || m.from === "bot") && m.text?.trim())
          .slice(-20)
          .map((m) => ({ from: m.from, text: String(m.text).slice(0, 500) }))
      : [];

    console.log(`[AI Controller] History length: ${safeHistory.length}`);

    const answer = await getAIAnswer(message, ctx, safeHistory);

    if (!answer?.trim()) {
      console.error("[AI Controller] Empty answer returned — sending fallback");
      return res.json({ success: true, answer: "I couldn't generate a response. Please try rephrasing your question." });
    }

    console.log(`[AI Controller] Answer sent: "${answer.slice(0, 80)}..."`);
    res.json({ success: true, answer });

  } catch (err) {
    console.error("[AI Controller] Unhandled error:", err.message);
    next(err);
  }
};
