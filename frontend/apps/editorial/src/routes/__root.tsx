import { Outlet, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout(): ReactNode {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--fg)",
        fontFamily: "var(--sans)",
      }}
    >
      <Outlet />
    </div>
  );
}
