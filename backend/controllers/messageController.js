const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "name avatar role currentStatus")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "name" } })
      .sort({ updatedAt: -1 });
    res.json({ success: true, conversations });
  } catch (err) { next(err); }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId, projectId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const otherUser = await User.findById(userId);
    if (!otherUser) return res.status(404).json({ message: "User not found" });
    let conv = await Conversation.findOne({ participants: { $all: [req.user._id, userId] } });
    if (!conv) conv = await Conversation.create({ participants: [req.user._id, userId], project: projectId || null });
    await conv.populate("participants", "name avatar role currentStatus");
    res.json({ success: true, conversation: conv });
  } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    const isParticipant = conv.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "name avatar role")
      .sort({ createdAt: 1 });
    await Message.updateMany(
      { conversation: req.params.conversationId, sender: { $ne: req.user._id }, read: false },
      { read: true }
    );
    res.json({ success: true, messages });
  } catch (err) { next(err); }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text?.trim() && !req.file) return res.status(400).json({ message: "Message cannot be empty" });
    const conv = await Conversation.findById(req.params.conversationId);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });
    const isParticipant = conv.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });
    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user._id,
      text: text?.trim() || "",
      file: req.file ? { url: req.file.path, name: req.file.originalname, type: req.file.mimetype } : undefined,
    });
    await Conversation.findByIdAndUpdate(req.params.conversationId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });
    await message.populate("sender", "name avatar role");
    // Emit to all participants via socket
    const io = req.app.get("io");
    if (io) io.to(req.params.conversationId).emit("newMessage", message);
    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};
