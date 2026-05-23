import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingSpinner size="lg" className="min-h-[100svh]" />;

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  if (role && user?.role !== role) return <Navigate to="/dashboard" replace />;

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
