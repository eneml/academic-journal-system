import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../auth/AuthContext";
import {
  AuthError,
  AuthField,
  AuthLayout,
  PasswordField,
} from "../components/AuthLayout";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
});

const KEYCLOAK_ISSUER =
  (import.meta.env.VITE_KEYCLOAK_ISSUER as string | undefined) ?? "";
const KEYCLOAK_CLIENT_ID =
  (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined) ?? "";

function LoginPage(): ReactNode {
  const { user, loading: authLoading, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };
  const redirectTo = sanitizeRedirect(search.redirect ?? "/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            search={{
              redirect: redirectTo === "/" ? undefined : redirectTo,
            }}
            className="font-medium text-cobalt no-underline hover:underline"
          >
            Create an account →
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <AuthField label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.org"
          />
        </AuthField>
        <AuthField label="Password" htmlFor="password">
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </AuthField>
        {error ? <AuthError>{error}</AuthError> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Signing in…" : "Sign in"}
        </Button>
        <p className="mt-4 text-center text-[12px] text-muted">
          Forgot your password?{" "}
          <a
            href={`${KEYCLOAK_ISSUER}/login-actions/reset-credentials?client_id=${KEYCLOAK_CLIENT_ID}`}
            className="text-cobalt no-underline hover:underline"
          >
            Reset it →
          </a>
        </p>
      </form>
    </AuthLayout>
  );
}

function sanitizeRedirect(raw: string): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}
