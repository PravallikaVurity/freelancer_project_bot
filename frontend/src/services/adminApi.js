import api from "./api";

export const getAdminStats = () => api.get("/admin/stats");
export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/toggle`);
export const getDisputes = () => api.get("/admin/disputes");
export const resolveDispute = (id, resolution) => api.put(`/admin/disputes/${id}/resolve`, { resolution });
export const getSkills = () => api.get("/admin/skills");
export const createSkill = (data) => api.post("/admin/skills", data);
export const deleteSkill = (id) => api.delete(`/admin/skills/${id}`);
export const getAnalytics = () => api.get("/admin/analytics");
export const getContactInfo = () => api.get("/admin/contact-info");
export const updateContactInfo = (data) => api.put("/admin/contact-info", data);
export const getAdminProposals = (params) => api.get("/admin/proposals", { params });
export const getAdminProjects = (params) => api.get("/admin/projects", { params });
