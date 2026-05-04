import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

/**
 * Inline call to sign in shown by routes that require an authenticated user.
 * Avoids hard redirecting from inside render so the deep-link the user typed
 * is preserved in history if they cancel.
 */
export function SignInPrompt(): ReactNode {
  const { signIn } = useAuth();
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
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => void signIn()}
      >
        Sign in
      </button>
    </div>
  );
}
