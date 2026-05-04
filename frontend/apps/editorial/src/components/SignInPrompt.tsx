import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";

/**
 * Fallback prompt for routes that render before AppShell's redirect-to-login
 * fires (or when the gate is bypassed). Now an inline link to /login rather
 * than a button kicking the OIDC redirect, since we own the login UI.
 */
export function SignInPrompt(): ReactNode {
  const location = useLocation();
  const dest = `${location.pathname}${location.search ?? ""}`;
  return (
    <div style={{ maxWidth: 540 }}>
      <p className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
        Sign in required
      </p>
      <h1
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: "-0.01em",
          margin: "0 0 10px",
        }}
      >
        Authenticate to continue
      </h1>
      <p
        style={{
          fontFamily: "var(--serif-body)",
          fontSize: 16,
          lineHeight: 1.6,
          color: "var(--fg-2)",
          marginBottom: 20,
        }}
      >
        This area of the workbench is gated by the journal&rsquo;s identity provider.
      </p>
      <Link
        to="/login"
        search={dest === "/" ? undefined : ({ redirect: dest } as never)}
        className="btn btn-primary"
        style={{ textDecoration: "none" }}
      >
        Sign in
      </Link>
    </div>
  );
}
