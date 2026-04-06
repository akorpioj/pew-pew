import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AUTH_PORTAL_URL = import.meta.env.VITE_AUTH_PORTAL_URL as string;

/**
 * Wraps protected routes. While auth state is resolving, renders nothing
 * (avoids a flash redirect to login). Once resolved:
 * - Signed in → renders child routes via <Outlet />
 * - Signed out → redirects to the Auth Portal login page, preserving the intended URL
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
    const returnTo = encodeURIComponent(location.pathname + location.search);
    window.location.href = `${AUTH_PORTAL_URL}/login?returnTo=${returnTo}`;
    return null;
  }

  return <Outlet />;
}
