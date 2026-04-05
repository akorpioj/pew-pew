import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Wraps protected routes. While auth state is resolving, renders nothing
 * (avoids a flash redirect to /login). Once resolved:
 * - Signed in → renders child routes via <Outlet />
 * - Signed out → redirects to /login, preserving the intended URL
 *
 * Usage in the router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/wiki" element={<WikiLayout />} />
 *   </Route>
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
