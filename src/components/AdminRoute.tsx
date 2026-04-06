import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Route guard that allows only ADMIN role.
 * Unauthenticated users are redirected to /login.
 * Authenticated non-admins are redirected to /wiki.
 */
export default function AdminRoute() {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/wiki" replace />;
  }

  return <Outlet />;
}
