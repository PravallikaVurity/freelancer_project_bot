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
