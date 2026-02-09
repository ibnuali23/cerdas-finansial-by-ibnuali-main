import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function NavItem({ to, label, testId }) {
  return (
    <NavLink
      data-testid={testId}
      to={to}
      className={({ isActive }) =>
        cn(
          "rounded-xl px-3 py-2 text-sm font-medium",
          "transition-colors",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground/80 hover:bg-secondary",
        )
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div data-testid="app-shell" className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/app/dashboard"
              data-testid="app-shell-logo-link"
              className="flex items-center gap-2"
            >
              <div
                data-testid="app-shell-logo"
                className="grid h-10 w-10 place-items-center rounded-2xl bg-[hsl(var(--accent))] text-[hsl(170_25%_10%)] shadow-sm"
              >
                <span className="text-lg font-black">💰</span>
              </div>
              <div className="leading-tight">
                <div data-testid="app-shell-title" className="text-sm font-semibold">
                  Cerdas Finansial
                </div>
                <div
                  data-testid="app-shell-subtitle"
                  className="text-xs text-muted-foreground"
                >
                  Keuangan islami & profesional
                </div>
              </div>
            </Link>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <NavItem to="/app/dashboard" label="Dashboard" testId="nav-dashboard" />
            <NavItem to="/app/reports" label="Laporan" testId="nav-reports" />
            <NavItem to="/app/transactions" label="Transaksi" testId="nav-transactions" />
            <NavItem to="/app/profile" label="Profil" testId="nav-profile" />
            {user?.role === "admin" ? (
              <NavItem to="/app/admin" label="Admin" testId="nav-admin" />
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div data-testid="header-greeting" className="text-sm font-semibold">
                {user?.role === "admin"
                  ? `Selamat Datang, ${user?.name || "Presiden Mubarak"} 👑`
                  : `Selamat Datang, ${user?.name || "Pengguna"} 👋`}
              </div>
              <div data-testid="header-email" className="text-xs text-muted-foreground">
                {user?.email}
              </div>
            </div>
            <Button
              data-testid="header-logout-button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-2 px-3 py-2">
          <NavItem to="/app/dashboard" label="Dashboard" testId="bottomnav-dashboard" />
          <NavItem to="/app/reports" label="Laporan" testId="bottomnav-reports" />
          <NavItem to="/app/transactions" label="Transaksi" testId="bottomnav-transactions" />
          <NavItem to="/app/profile" label="Profil" testId="bottomnav-profile" />
        </div>
      </nav>

      <div className="h-16 md:hidden" />
    </div>
  );
}
