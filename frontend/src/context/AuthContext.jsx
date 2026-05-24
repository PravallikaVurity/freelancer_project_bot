import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import * as authApi from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fb_token");
    const stored = localStorage.getItem("fb_user");
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Re-hydrate full user from server to pick up any fields missing from stored session
        authApi.getMe().then(({ data }) => {
          if (data.user) {
            localStorage.setItem("fb_user", JSON.stringify(data.user));
            setUser(data.user);
          }
        }).catch(() => { /* token may be expired — leave stored user as-is */ });
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      const { data } = await authApi.login(credentials);
      // Clear any stale mock session before storing real token
      localStorage.removeItem("fb_mock_" + credentials.email);
      localStorage.setItem("fb_token", data.token);
      localStorage.setItem("fb_user", JSON.stringify(data.user));
      setUser(data.user);
      window.__fbAdminLog?.({ type: "login", message: `${data.user.name} (${data.user.role}) signed in` });
      return data.user;
    } catch (err) {
      if (!err.response) {
        throw new Error("Server connection failed. Please check your connection and try again.");
      }
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 401) throw new Error(msg || "Invalid email or password.");
      if (status === 403) throw new Error(msg || "Account has been suspended.");
      if (status === 500) throw new Error("Database connection error. Please try again later.");
      throw new Error(msg || "Authentication failed. Please try again.");
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await authApi.register(formData);
      window.__fbAdminLog?.({ type: "register", message: `New ${data.user.role} registered: ${data.user.name} (${data.user.email})` });
      return data.user;
    } catch (err) {
      if (!err.response) {
        throw new Error("Server connection failed. Please check your connection and try again.");
      }
      throw err;
    }
  };

  const logout = () => {
    const u = user;
    localStorage.removeItem("fb_token");
    localStorage.removeItem("fb_user");
    setUser(null);
    if (u) window.__fbAdminLog?.({ type: "logout", message: `${u.name} signed out` });
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem("fb_user", JSON.stringify(updated));
    setUser(updated);
  };

  // Listen for real-time status changes from other users (and self from other tabs)
  useEffect(() => {
    if (!user) return;
    const sock = io(
      import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5002",
      { auth: { userId: user._id } }
    );
    sock.on("userStatusChanged", ({ userId, currentStatus, statusUpdatedAt }) => {
      if (userId?.toString() === user._id?.toString()) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, currentStatus, statusUpdatedAt };
          localStorage.setItem("fb_user", JSON.stringify(updated));
          return updated;
        });
      }
    });
    return () => sock.disconnect();
  }, [user?._id]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
