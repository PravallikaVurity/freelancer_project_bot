import api from "./api";

export const getConversations = () => api.get("/messages/conversations");
export const getOrCreateConversation = (data) => api.post("/messages/conversations", data);
export const getMessages = (conversationId) => api.get(`/messages/conversations/${conversationId}`);
export const sendMessage = (conversationId, data) => api.post(`/messages/conversations/${conversationId}`, data);
