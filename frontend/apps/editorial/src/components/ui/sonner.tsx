import { Toaster as SonnerToaster } from "sonner";
import type { ReactNode } from "react";

/**
 * Sonner-backed toast container. Mounted once at the root of the editorial
 * shell — call `toast.success(...)` / `toast.error(...)` from anywhere.
 *
 * Tokens are pulled from our cobalt/warm-white palette so the toasts
 * read as part of the journal UI rather than vanilla shadcn defaults.
 */
export function Toaster(): ReactNode {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "var(--sans)",
          borderRadius: "var(--r-2)",
          border: "1px solid var(--border)",
          background: "white",
          color: "var(--fg)",
          fontSize: 13,
          boxShadow:
            "0 8px 24px rgba(15,23,42,0.08), 0 0 0 1px var(--border)",
        },
      }}
    />
  );
}
