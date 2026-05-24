const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    }

    socket.on("joinConversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("joinBattleRoom", (projectId) => {
      socket.join(`battle:${projectId}`);
    });

    socket.on("broadcastProposal", (data) => {
      // Notify all connected clients about a new proposal
      io.emit("newProposal", data);
      // Also notify the battle room for this project
      if (data.projectId) io.to(`battle:${data.projectId}`).emit("battleNewApplicant", data);
    });

    socket.on("broadcastProject", (data) => {
      // Notify all connected clients about a new project
      io.emit("newProject", data);
    });

    socket.on("sendMessage", async ({ conversationId, text, file }) => {
      try {
        if (!userId) return socket.emit("messageError", "Not authenticated");
        if (!text?.trim() && !file) return socket.emit("messageError", "Message cannot be empty");
        const conv = await Conversation.findById(conversationId);
        if (!conv) return socket.emit("messageError", "Conversation not found");
        const isParticipant = conv.participants.some((p) => p.toString() === userId.toString());
        if (!isParticipant) return socket.emit("messageError", "Not authorized");
        const message = await Message.create({ conversation: conversationId, sender: userId, text: text?.trim() || "", file });
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id, updatedAt: new Date() });
        await message.populate("sender", "name avatar role");
        io.to(conversationId).emit("newMessage", message);
      } catch (err) {
        socket.emit("messageError", err.message);
      }
    });

    socket.on("typing", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing", { userId });
    });

    socket.on("stopTyping", ({ conversationId }) => {
      socket.to(conversationId).emit("stopTyping");
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });
  });
};
