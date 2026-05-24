import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AIChatBox from "./components/AIChatBox";
import "./index.css";

function FreelancerAI() {
  const { user } = useAuth();
  if (user?.role !== "freelancer") return null;
  return <AIChatBox />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <FreelancerAI />
    </AuthProvider>
  </React.StrictMode>
);
