const BattleRoom = require("../models/BattleRoom");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");

// GET /api/battle/active — all active battle rooms for the logged-in client
exports.getActiveBattles = async (req, res, next) => {
  try {
    // Find all projects owned by this client that have at least one proposal
    const clientProjects = await Project.find({
      client: req.user._id,
      status: { $in: ["open", "in_progress"] },
    }).select("_id proposals");

    const projectsWithProposals = clientProjects.filter((p) => p.proposals?.length > 0);
    const projectIds = projectsWithProposals.map((p) => p._id);

    // Auto-create battle rooms using upsert to avoid duplicate key errors
    await Promise.all(
      projectIds.map((pid) =>
        BattleRoom.findOneAndUpdate(
          { project: pid },
          { $setOnInsert: { project: pid, freelancers: [], status: "active" } },
          { upsert: true, new: true }
        )
      )
    );

    // Fetch all active rooms for this client's projects
    const rooms = await BattleRoom.find({
      project: { $in: projectIds },
      status: "active",
    })
      .populate("project", "title status proposals")
      .lean();

    res.json({ success: true, battles: rooms });
  } catch (err) { next(err); }
};

/**
 * Calculate a 0–100 match score for a freelancer against a project.
 * Factors: skill match, rating, completed projects, bid competitiveness, cover letter length.
 */
function calcMatchScore(freelancer, proposal, projectSkills, allBids) {
  let score = 0;

  // Skill match — 35 pts
  const fSkills = (freelancer.skills || []).map((s) => s.toLowerCase());
  const pSkills = (projectSkills || []).map((s) => s.toLowerCase());
  const matched = pSkills.filter((s) => fSkills.includes(s)).length;
  score += pSkills.length > 0 ? (matched / pSkills.length) * 35 : 20;

  // Rating — 25 pts (rating is 0–5)
  score += ((freelancer.rating || 0) / 5) * 25;

  // Experience (completedProjects) — 20 pts, capped at 20 projects
  score += Math.min((freelancer.completedProjects || 0) / 20, 1) * 20;

  // Bid competitiveness — 10 pts (lower bid relative to others = higher score)
  if (allBids.length > 1) {
    const minBid = Math.min(...allBids);
    const maxBid = Math.max(...allBids);
    const range = maxBid - minBid || 1;
    score += ((maxBid - proposal.bidAmount) / range) * 10;
  } else {
    score += 5;
  }

  // Proposal quality (cover letter length) — 10 pts
  const words = (proposal.coverLetter || "").split(/\s+/).filter(Boolean).length;
  score += Math.min(words / 100, 1) * 10;

  return Math.round(Math.min(score, 100));
}

// GET /api/battle/:projectId — fetch or create battle room
exports.getBattleRoom = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const proposals = await Proposal.find({
      project: req.params.projectId,
      status: { $in: ["pending", "accepted"] },
    }).populate("freelancer", "name avatar rating skills completedProjects hourlyRate bio");

    // Guard: filter out proposals whose freelancer account was deleted
    const validProposals = proposals.filter((p) => p.freelancer != null);
    const allBids = validProposals.map((p) => p.bidAmount);

    // Upsert battle room
    let room = await BattleRoom.findOne({ project: req.params.projectId });
    if (!room) {
      room = await BattleRoom.create({
        project: req.params.projectId,
        freelancers: validProposals.map((p) => ({
          user: p.freelancer._id,
          proposal: p._id,
          matchScore: calcMatchScore(p.freelancer, p, project.skills, allBids),
        })),
      });
    } else {
      // Sync any new proposals into the room
      const existingIds = room.freelancers.map((f) => f.proposal.toString());
      const newEntries = validProposals
        .filter((p) => !existingIds.includes(p._id.toString()))
        .map((p) => ({
          user: p.freelancer._id,
          proposal: p._id,
          matchScore: calcMatchScore(p.freelancer, p, project.skills, allBids),
        }));
      if (newEntries.length) {
        room.freelancers.push(...newEntries);
        await room.save();
      }
    }

    // Build enriched response
    const enriched = validProposals.map((p) => {
      const entry = room.freelancers.find((f) => f.proposal.toString() === p._id.toString());
      return {
        proposalId: p._id,
        freelancer: p.freelancer,
        coverLetter: p.coverLetter,
        bidAmount: p.bidAmount,
        deliveryTime: p.deliveryTime,
        status: p.status,
        voiceFile: p.voiceFile,
        matchScore: entry?.matchScore ?? 0,
      };
    });

    // Sort by matchScore desc
    enriched.sort((a, b) => b.matchScore - a.matchScore);

    res.json({ success: true, project, battleRoom: { _id: room._id, status: room.status }, freelancers: enriched });
  } catch (err) { next(err); }
};

// POST /api/battle/:projectId/hire/:proposalId — client selects winner
exports.hireFreelancer = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.client.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const winnerProposal = await Proposal.findById(req.params.proposalId).populate("freelancer", "name");
    if (!winnerProposal) return res.status(404).json({ message: "Proposal not found" });

    // Accept winner, reject all others
    await Proposal.updateMany(
      { project: req.params.projectId, _id: { $ne: req.params.proposalId }, status: "pending" },
      { status: "rejected" }
    );
    winnerProposal.status = "accepted";
    await winnerProposal.save();

    // Update project
    project.status = "in_progress";
    project.selectedFreelancer = winnerProposal.freelancer._id;
    await project.save();

    // Close battle room
    await BattleRoom.findOneAndUpdate({ project: req.params.projectId }, { status: "closed" });

    // Broadcast via socket
    if (req.app.get("io")) {
      req.app.get("io").emit("battleHire", {
        projectId: req.params.projectId,
        winnerId: winnerProposal.freelancer._id,
        winnerName: winnerProposal.freelancer.name,
      });
    }

    res.json({ success: true, message: `${winnerProposal.freelancer.name} hired successfully` });
  } catch (err) { next(err); }
};
