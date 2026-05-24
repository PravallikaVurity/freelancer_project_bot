import api from "./api";

export const getMyProposals = () => api.get("/proposals/my");
export const getFreelancerAnalytics = () => api.get("/proposals/analytics");
export const updateProposalStatus = (id, status) => api.put(`/proposals/${id}/status`, { status });
export const withdrawProposal = (id) => api.put(`/proposals/${id}/withdraw`);
export const uploadVoiceProposal = (id, formData) => api.post(`/proposals/${id}/voice`, formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
