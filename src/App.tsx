import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./features/auth/AuthContext";
import { RootLayout } from "./layouts/RootLayout";
import { PortalLayout } from "./layouts/PortalLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Pages
import { LoginPage } from "./pages/LoginPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { ApplicationFormPage } from "./pages/ApplicationFormPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { CorrectionPage } from "./pages/CorrectionPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminApplicationReviewPage } from "./pages/AdminApplicationReviewPage";
import { SuperAdminDashboard } from "./pages/SuperAdminDashboard";

/**
 * Root index route — resolves to role-specific dashboard or /login.
 * Direct entry route `/` immediately routes to the user's role-specific dashboard
 * if already authenticated, or cleanly redirects to `/login`.
 * (No marketing landing page, per institutional mandate).
 */
const IndexRoute: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Verifying institutional session...</p>
        </div>
      </div>
    );
  }

  if (currentUser) {
    if (currentUser.role === "super_admin") return <Navigate to="/superadmin/dashboard" replace />;
    if (currentUser.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* -- Student / portal routes — PortalLayout (Brightspace-style chrome) -- */}
          <Route element={<PortalLayout />}>
            {/* Primary Entry Point */}
            <Route path="/" element={<IndexRoute />} />

            {/* Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/login" element={<Navigate to="/login" replace />} />

            {/* Deprecated Workspace Route: Smooth Redirect to Student Dashboard */}
            <Route path="/workspace" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/new"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <ApplicationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id"
              element={
                <ProtectedRoute>
                  <ApplicationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <ApplicationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id/corrections"
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <CorrectionPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* -- Admin routes — RootLayout UNCHANGED; renders exactly as before -- */}
          <Route element={<RootLayout />}>
            {/* Authenticated Coordinator (Admin) Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/applications/:id"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminApplicationReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/superadmin"
              element={
                <ProtectedRoute allowedRoles={["super_admin"]}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Catch-all redirect to index */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
