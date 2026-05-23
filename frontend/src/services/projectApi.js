import api from "./api";

export const getProjects = (params) => api.get("/projects", { params });
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post("/projects", data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getMyProjects = () => api.get("/projects/my");
export const saveJob = (id) => api.post(`/projects/${id}/save`);
export const getSavedJobs = () => api.get("/projects/saved");
export const submitProposal = (projectId, data) => api.post(`/projects/${projectId}/proposals`, data);
export const getProposals = (projectId) => api.get(`/projects/${projectId}/proposals`);
export const getScamReport = (id) => api.get(`/projects/${id}/scam-report`);
