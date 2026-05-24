import api from "./api";

export const getProjectAnalytics = (projectId) => api.get(`/analytics/project/${projectId}`);
