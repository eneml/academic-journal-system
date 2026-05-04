import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth/AuthContext";
import { AppShell } from "../components/AppShell";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout(): ReactNode {
  const location = useLocation();
  // OIDC callback routes need to render bare — without the shell — so the
  // redirect-handling component owns the page during token exchange.
  const bare = location.pathname.startsWith("/auth/");

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
