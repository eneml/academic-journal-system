import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "oidc-client-ts";
import { getUserManager } from "../../auth/oidc";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

// Module-scoped promise so React StrictMode's double-effect doesn't run the
// token exchange twice — the second call would hit Keycloak with the same
// `?code=` and get rejected as "code already used".
let inflight: Promise<User | void> | null = null;

function AuthCallback(): ReactNode {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const manager = getUserManager();
    let cancelled = false;

    async function run(): Promise<void> {
      try {
        if (!inflight) {
          inflight = manager.signinRedirectCallback();
        }
        await inflight;
        if (!cancelled) {
          // Token exchange done; bounce to the dashboard. The AuthProvider's
          // userLoaded listener has already updated context state.
          await navigate({ to: "/", replace: true });
        }
      } catch (err) {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error("OIDC callback failed:", err);
          setError(err instanceof Error ? err.message : "Sign-in failed");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 32,
        fontFamily: "var(--sans)",
      }}
    >
      {error ? (
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            className="sc"
            style={{ color: "var(--danger)", marginBottom: 6 }}
          >
            Sign-in error
          </p>
          <h1
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: 26,
              margin: "0 0 10px",
            }}
          >
            Couldn&rsquo;t complete sign-in
          </h1>
          <p style={{ color: "var(--fg-2)", lineHeight: 1.6, fontSize: 14 }}>{error}</p>
          <a
            href="/"
            className="btn btn-sm"
            style={{ marginTop: 16, display: "inline-flex" }}
          >
            Back to dashboard
          </a>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--muted)" }}>
          <p className="sc" style={{ marginBottom: 4 }}>
            One moment
          </p>
          <p style={{ fontFamily: "var(--serif-body)", fontSize: 18 }}>
            Completing sign-in&hellip;
          </p>
        </div>
      )}
    </div>
  );
}
