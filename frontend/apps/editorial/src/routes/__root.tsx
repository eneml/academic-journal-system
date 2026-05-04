import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout(): ReactNode {
  const location = useLocation();
  // Routes that render full-page without the editorial shell:
  //   /auth/*    — OIDC code-exchange handlers
  //   /login     — custom Direct-Grant login page
  //   /register  — custom self-registration page
  const bare =
    location.pathname.startsWith("/auth/") ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--sans)",
      }}
    >
      <AuthProvider>{bare ? <Outlet /> : <AppShell><Outlet /></AppShell>}</AuthProvider>
    </div>
  );
}
