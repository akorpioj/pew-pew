import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import RequestAccessPage from "@/pages/RequestAccessPage";
import AcceptInvitePage from "@/pages/AcceptInvitePage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import WikiLayout from "@/layouts/WikiLayout";
import UserManagementPage from "@/pages/UserManagementPage";
import AdminRoute from "@/components/AdminRoute";
import ArticleListPage from "@/pages/ArticleListPage";
import ArticleViewPage from "@/pages/ArticleViewPage";
import ArticleEditorPage from "@/pages/ArticleEditorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ExpertRoute from "@/components/ExpertRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/request-access" element={<RequestAccessPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Redirect root to wiki */}
          <Route path="/" element={<Navigate to="/wiki" replace />} />

          {/* Protected wiki routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<WikiLayout />}>
              <Route path="/wiki" element={<Navigate to="/wiki/home" replace />} />
              <Route path="/wiki/home" element={<ArticleListPage />} />
              <Route path="/wiki/category/:categoryId" element={<ArticleListPage />} />
              <Route path="/wiki/article/:slug" element={<ArticleViewPage />} />

              {/* T27: editor routes — EXPERT / ADMIN only */}
              <Route element={<ExpertRoute />}>
                <Route path="/wiki/edit" element={<ArticleEditorPage />} />
                <Route path="/wiki/edit/:slug" element={<ArticleEditorPage />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          {/* T26: 404 for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
