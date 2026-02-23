import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import Layout from "./components/Layout";
import QuizPage from "./pages/QuizPage";
import ReviewPage from "./pages/ReviewPage";
import DashboardPage from "./pages/DashboardPage";
import type { ReactNode } from "react";

function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-6 text-lab-muted font-mono-lab text-sm">AUTHENTICATING...</div>;
  if (!user) return <div className="p-6 text-lab-pink font-mono-lab text-sm">AUTHENTICATION FAILED</div>;
  if (roles && !roles.includes(user.role)) return <Navigate to="/quiz" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <Routes>
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/quiz" element={<QuizPage />} />
        <Route
          path="/review"
          element={
            <ProtectedRoute roles={["reviewer", "admin"]}>
              <ReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/quiz" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
