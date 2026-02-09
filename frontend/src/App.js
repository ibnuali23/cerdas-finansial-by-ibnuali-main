import React from "react";
import "@/App.css";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AuthPage from "@/pages/AuthPage";
import AppShell from "@/components/AppShell";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminPage from "@/pages/AdminPage";
import { Toaster } from "@/components/ui/toaster";

function ProtectedRoute({ children }) {
  const { isAuthed, loading } = useAuth();

  if (loading) {
    return (
      <div data-testid="app-loading" className="min-h-screen p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border bg-background p-6">
          <div data-testid="app-loading-title" className="text-sm font-semibold">
            Memuat...
          </div>
          <div data-testid="app-loading-desc" className="mt-2 text-sm text-muted-foreground">
            Menyiapkan data akun Anda.
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <div data-testid="app-root">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/login" element={<AuthPage />} />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="admin"
                element={
                  <AdminOnly>
                    <AdminPage />
                  </AdminOnly>
                }
              />
              <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
