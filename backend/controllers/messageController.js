const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

exports.getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "name avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });
    res.json({ success: true, conversations });
  } catch (err) { next(err); }
};

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId, projectId } = req.body;
    let conv = await Conversation.findOne({ participants: { $all: [req.user._id, userId] } });
    if (!conv) conv = await Conversation.create({ participants: [req.user._id, userId], project: projectId });
    await conv.populate("participants", "name avatar");
    res.json({ success: true, conversation: conv });
  } catch (err) { next(err); }
};

exports.getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "name avatar")
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
    const message = await Message.create({
      conversation: req.params.conversationId,
      sender: req.user._id,
      text: req.body.text,
      file: req.file ? { url: req.file.path, name: req.file.originalname, type: req.file.mimetype } : undefined,
    });
    await Conversation.findByIdAndUpdate(req.params.conversationId, { lastMessage: message._id });
    await message.populate("sender", "name avatar");
    res.status(201).json({ success: true, message });
  } catch (err) { next(err); }
};
