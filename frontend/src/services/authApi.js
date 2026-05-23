import api from "./api";

export const register = (data) => api.post("/auth/register", data);
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const getDashboardStats = () => api.get("/auth/dashboard-stats");
export const forgotPassword = (email) => api.post("/auth/forgot-password", { email });
export const resetPassword = (token, password) => api.put(`/auth/reset-password/${token}`, { password });
export const updateProfile = (data) => api.put("/auth/profile", data);
