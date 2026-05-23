import api from "./api";

export const getMyEarnings = () => api.get("/earnings");
export const getWithdrawals = () => api.get("/earnings/withdrawals");
export const requestWithdrawal = (data) => api.post("/earnings/withdraw", data);
