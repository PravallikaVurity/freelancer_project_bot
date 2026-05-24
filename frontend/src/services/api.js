import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5002/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || "";
    const method = err.config?.method || "";
    const isAuthRoute = url.includes("/auth/login") || url.includes("/auth/register");
    // Do not redirect on optional routes or on write operations (POST/PUT/DELETE)
    // — let the calling component handle the error and show a proper message
    const isOptionalRoute =
      url.includes("/projects/saved") ||
      url.includes("/projects/my") ||
      url.includes("/earnings") ||
      url.includes("/proposals/my");
    const isWriteOperation = ["post", "put", "patch", "delete"].includes(method);
    if (err.response?.status === 401 && !isAuthRoute && !isOptionalRoute && !isWriteOperation) {
      localStorage.removeItem("fb_token");
      localStorage.removeItem("fb_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
