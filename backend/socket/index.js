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

    socket.on("sendMessage", async ({ conversationId, senderId, text, file }) => {
      try {
        const message = await Message.create({ conversation: conversationId, sender: senderId, text, file });
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: message._id });
        await message.populate("sender", "name avatar");
        io.to(conversationId).emit("newMessage", message);
      } catch (err) {
        socket.emit("error", err.message);
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
