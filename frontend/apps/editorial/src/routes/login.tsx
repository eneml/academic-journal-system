import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthContext";
import {
  AuthLayout,
  errorBoxStyle,
  fieldStyle,
  labelStyle,
} from "../components/AuthLayout";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
});

function LoginPage(): ReactNode {
  const { user, loading: authLoading, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };
  const redirectTo = sanitizeRedirect(search.redirect ?? "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we're already signed in (e.g. revisited /login from a bookmark),
  // jump straight to the requested destination.
  useEffect(() => {
    if (!authLoading && user) {
      void navigate({ to: redirectTo as never, replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await loginWithPassword(email.trim().toLowerCase(), password);
      void navigate({ to: redirectTo as never, replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Editorial Workbench"
      title="Welcome back"
      description="Sign in to manage submissions, reviews, and editorial workflows."
      footer={
        <span>
          New here?{" "}
          <Link
            to="/register"
            search={{ redirect: redirectTo === "/" ? undefined : redirectTo }}
            style={{ color: "var(--cobalt)", textDecoration: "none", fontWeight: 500 }}
          >
            Create an account →
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={fieldStyle}
            placeholder="you@example.org"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={fieldStyle}
            placeholder="••••••••"
          />
        </div>
        {error ? <div style={errorBoxStyle}>{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          className="btn btn-primary"
          style={{
            width: "100%",
            justifyContent: "center",
            fontSize: 14,
            padding: "10px 14px",
            opacity: busy ? 0.7 : 1,
            cursor: busy ? "wait" : "pointer",
          }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p
          style={{
            fontSize: 12,
            color: "var(--muted)",
            margin: "14px 0 0",
            textAlign: "center",
          }}
        >
          Forgot your password?{" "}
          <a
            href={`${import.meta.env.VITE_KEYCLOAK_ISSUER ?? ""}/login-actions/reset-credentials?client_id=${import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? ""}`}
            style={{ color: "var(--cobalt)", textDecoration: "none" }}
          >
            Reset it →
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}

/** Only allow internal redirects; never let an attacker bounce us off-site. */
function sanitizeRedirect(raw: string): string {
  if (!raw) return "/";
  try {
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  } catch {
    /* fall through */
  }
  return "/";
}
