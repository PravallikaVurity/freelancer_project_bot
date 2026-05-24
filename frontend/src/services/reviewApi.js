import api from "./api";

export const createReview = (data) => api.post("/reviews", data);
export const getUserReviews = (userId) => api.get(`/reviews/user/${userId}`);
export const getMyReviews = () => api.get("/reviews/my");
export const checkReview = (projectId, revieweeId) =>
  api.get("/reviews/check", { params: { projectId, revieweeId } });
