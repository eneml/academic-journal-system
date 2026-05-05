"use client";

import { useEffect } from "react";
import { getUserManager } from "@/lib/oidc";

/**
 * Hidden iframe target used by oidc-client-ts during silent SSO. Just hand
 * the URL back to the manager via signinSilentCallback() and exit; the
 * parent window is the one that resolves the awaited promise.
 */
export default function SilentCallback() {
  useEffect(() => {
    void getUserManager()
      .signinSilentCallback()
      .catch((err) => {
        // login_required / interaction_required are expected when the user
        // doesn't have a Keycloak session — swallow them quietly.
        const msg = String(err?.message ?? err ?? "");
        if (!/login_required|interaction_required/.test(msg)) {
          console.warn("Silent callback failed:", err);
        }
      });
  }, []);
  return null;
}
