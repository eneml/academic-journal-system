import { createFileRoute } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { getUserManager } from "../../auth/oidc";

export const Route = createFileRoute("/auth/silent-callback")({
  component: SilentCallback,
});

function SilentCallback(): ReactNode {
  useEffect(() => {
    // Hidden iframe path used by oidc-client-ts for automaticSilentRenew.
    // Just hand the URL back to the manager and exit; nothing to render.
    void getUserManager()
      .signinSilentCallback()
       
      .catch((err) => console.warn("Silent callback failed:", err));
  }, []);
  return null;
}
