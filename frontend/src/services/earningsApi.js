import api from "./api";

export const getMyEarnings = () => api.get("/earnings");
export const getWithdrawals = () => api.get("/earnings/withdrawals");
export const requestWithdrawal = (data) => api.post("/earnings/withdraw", data);
export const completeWithdrawal = (id) => api.put(`/earnings/withdrawals/${id}/complete`);

// Client
export const getClientWithdrawalRequests = () => api.get("/earnings/client/withdrawal-requests");
export const approveWithdrawal = (id) => api.put(`/earnings/client/withdrawals/${id}/approve`);
export const rejectWithdrawal = (id, reason) => api.put(`/earnings/client/withdrawals/${id}/reject`, { reason });
