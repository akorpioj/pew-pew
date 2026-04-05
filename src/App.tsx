import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import WikiLayout from "@/layouts/WikiLayout";
import ArticleListPage from "@/pages/ArticleListPage";
import ArticleViewPage from "@/pages/ArticleViewPage";
import ArticleEditorPage from "@/pages/ArticleEditorPage";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Redirect root to wiki */}
        <Route path="/" element={<Navigate to="/wiki" replace />} />

        {/* Protected wiki routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<WikiLayout />}>
            <Route path="/wiki" element={<Navigate to="/wiki/home" replace />} />
            <Route path="/wiki/home" element={<ArticleListPage />} />
            <Route path="/wiki/category/:categoryId" element={<ArticleListPage />} />
            <Route path="/wiki/article/:slug" element={<ArticleViewPage />} />
            <Route path="/wiki/edit" element={<ArticleEditorPage />} />
            <Route path="/wiki/edit/:slug" element={<ArticleEditorPage />} />
          </Route>
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/wiki" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
