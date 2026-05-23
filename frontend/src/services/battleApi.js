import api from "./api";

export const getActiveBattles = () => api.get("/battle/active");
export const getBattleRoom = (projectId) => api.get(`/battle/${projectId}`);
export const hireFreelancer = (projectId, proposalId) =>
  api.post(`/battle/${projectId}/hire/${proposalId}`);
