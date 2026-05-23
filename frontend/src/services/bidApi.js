import api from "./api";

export const getMyProposals = () => api.get("/proposals/my");
export const updateProposalStatus = (id, status) => api.put(`/proposals/${id}/status`, { status });
export const withdrawProposal = (id) => api.put(`/proposals/${id}/withdraw`);
