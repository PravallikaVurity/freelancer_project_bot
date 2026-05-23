import { createContext, useContext, useState, useEffect } from "react";
import * as authApi from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("fb_token");
    const stored = localStorage.getItem("fb_user");
    if (token && stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
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
        // Backend offline — try mock session
        const stored = localStorage.getItem("fb_mock_" + credentials.email);
        if (stored) {
          const mock = JSON.parse(stored);
          if (mock.password === credentials.password) {
            const { password, ...u } = mock;
            localStorage.setItem("fb_token", "mock_token");
            localStorage.setItem("fb_user", JSON.stringify(u));
            setUser(u);
            console.warn("Mock session active — backend is offline. Protected actions (post project, proposals) require the backend to be running.");
            window.__fbAdminLog?.({ type: "login", message: `${u.name} (${u.role}) signed in [mock]` });
            return u;
          }
        }
        throw new Error("Backend is offline. Please start the server and try again.");
      }
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const { data } = await authApi.register(formData);
      window.__fbAdminLog?.({ type: "register", message: `New ${data.user.role} registered: ${data.user.name} (${data.user.email})` });
      return data.user;
    } catch (err) {
      if (!err.response) {
        const mockUser = {
          _id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role || "freelancer",
          avatar: "",
        };
        localStorage.setItem(
          "fb_mock_" + formData.email,
          JSON.stringify({ ...mockUser, password: formData.password })
        );
        window.__fbAdminLog?.({ type: "register", message: `New ${mockUser.role} registered: ${mockUser.name} [mock]` });
        return mockUser;
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
