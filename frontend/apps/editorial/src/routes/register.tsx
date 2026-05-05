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

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (s) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
});

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface RegisterPayload {
  email: string;
  password: string;
  givenName: string;
  familyName: string;
}

function RegisterPage(): ReactNode {
  const { user, loading: authLoading, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/register" }) as { redirect?: string };
  const redirectTo = sanitizeRedirect(search.redirect ?? "/");

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      void navigate({ to: redirectTo as never, replace: true });
    }
  }, [authLoading, user, navigate, redirectTo]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);

    const payload: RegisterPayload = {
      email: email.trim().toLowerCase(),
      password,
      givenName: givenName.trim(),
      familyName: familyName.trim(),
    };
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const message = await readErrorMessage(res);
        setError(message);
        setBusy(false);
        return;
      }
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setBusy(false);
      return;
    }

    // Auto-login the freshly-created account so the user lands signed in.
    try {
      await loginWithPassword(payload.email, payload.password);
      void navigate({ to: redirectTo as never, replace: true });
    } catch (err) {
      // Account was created but auto-login failed — send them to /login
      // with their email pre-filled would require state plumbing; for now
      // just give a friendly message.
      setError(
        err instanceof Error
          ? `Account created, but sign-in failed: ${err.message}`
          : "Account created. Please sign in.",
      );
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Editorial Workbench"
      title="Create your account"
      description="Authors register here to submit manuscripts. Editor and reviewer roles are assigned by an administrator after registration."
      footer={
        <span>
          Already have an account?{" "}
          <Link
            to="/login"
            search={{ redirect: redirectTo === "/" ? undefined : redirectTo }}
            style={{ color: "var(--cobalt)", textDecoration: "none", fontWeight: 500 }}
          >
            Sign in →
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <label htmlFor="given" style={labelStyle}>First name</label>
            <input
              id="given"
              name="given_name"
              autoComplete="given-name"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              required
              maxLength={80}
              style={fieldStyle}
            />
          </div>
          <div>
            <label htmlFor="family" style={labelStyle}>Last name</label>
            <input
              id="family"
              name="family_name"
              autoComplete="family-name"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              required
              maxLength={80}
              style={fieldStyle}
            />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="email" style={labelStyle}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={fieldStyle}
            placeholder="you@example.org"
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="password" style={labelStyle}>Password</label>
          <input
            id="password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={fieldStyle}
            placeholder="At least 8 characters"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="confirm" style={labelStyle}>Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            style={fieldStyle}
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
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p
          style={{
            fontSize: 11.5,
            color: "var(--muted)",
            margin: "14px 0 0",
            lineHeight: 1.55,
            textAlign: "center",
          }}
        >
          By creating an account you agree to be contacted about submissions
          you make to the journal.
        </p>
      </form>
    </AuthLayout>
  );
}

async function readErrorMessage(res: Response): Promise<string> {
  let body: { error?: string; detail?: string; message?: string } | null = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON */
  }
  if (res.status === 409) {
    return body?.detail ?? "An account with that email already exists.";
  }
  if (res.status === 400) {
    return body?.detail ?? body?.message ?? "Check the form and try again.";
  }
  return body?.detail ?? body?.message ?? `Sign-up failed (HTTP ${res.status}).`;
}

function sanitizeRedirect(raw: string): string {
  if (!raw) return "/";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/";
}
