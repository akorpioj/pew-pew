import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import WikiLayout from "@/layouts/WikiLayout";
import ArticleListPage from "@/pages/ArticleListPage";
import ArticleViewPage from "@/pages/ArticleViewPage";
import ArticleEditorPage from "@/pages/ArticleEditorPage";
import NotFoundPage from "@/pages/NotFoundPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ExpertRoute from "@/components/ExpertRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

const AUTH_PORTAL_URL = import.meta.env.VITE_AUTH_PORTAL_URL;

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Navigate to={AUTH_PORTAL_URL + "/login"} replace />} />

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
            </Route>
          </Route>

          {/* T26: 404 for unknown routes */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
