const express = require("express");
const router = express.Router();
const { getConversations, getOrCreateConversation, getMessages, sendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.get("/conversations", protect, getConversations);
router.post("/conversations", protect, getOrCreateConversation);
router.get("/conversations/:conversationId", protect, getMessages);
router.post("/conversations/:conversationId", protect, upload.single("file"), sendMessage);

module.exports = router;
