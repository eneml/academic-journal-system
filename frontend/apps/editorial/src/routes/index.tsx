import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "oidc-client-ts";
import { getUserManager, signIn, signOut } from "../auth/oidc";
import { StageStepper, Icon } from "@ajs/ui/primitives";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard(): ReactNode {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const manager = getUserManager();

    async function bootstrap(): Promise<void> {
      // Handle the redirect leg of an in-progress login.
      if (window.location.search.includes("code=")) {
        try {
          const u = await manager.signinRedirectCallback();
          if (!cancelled) setUser(u);
          // Clean ?code, &state from the URL.
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (err) {
          console.error("OIDC callback failed", err);
        }
      } else {
        const existing = await manager.getUser();
        if (!cancelled) setUser(existing && !existing.expired ? existing : null);
      }
      if (!cancelled) setLoading(false);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} loading={loading} />
        <main className="flex-1 p-8">
          <DashboardBody user={user} loading={loading} />
        </main>
      </div>
    </div>
  );
}

function Sidebar(): ReactNode {
  return (
    <aside
      style={{
        width: 220,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "20px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 600,
          fontSize: 16,
          color: "var(--fg)",
          padding: "0 8px 18px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 14,
        }}
      >
        Academic Journal
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 13 }}>
        <SidebarLink icon="home" label="Dashboard" active />
        <SidebarLink icon="inbox" label="Submissions" />
        <SidebarLink icon="users" label="People" />
        <SidebarLink icon="bookOpen" label="Issues" />
        <SidebarLink icon="settings" label="Settings" />
      </nav>
    </aside>
  );
}

function SidebarLink({
  icon,
  label,
  active = false,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  active?: boolean;
}): ReactNode {
  return (
    <a
      href="#"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 8px",
        borderRadius: "var(--r-2)",
        color: active ? "var(--cobalt-deep)" : "var(--fg-2)",
        background: active ? "var(--cobalt-soft)" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
      }}
    >
      <Icon name={icon} size={15} />
      {label}
    </a>
  );
}

function Topbar({ user, loading }: { user: User | null; loading: boolean }): ReactNode {
  return (
    <header
      style={{
        height: 52,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}
    >
      <div className="sc" style={{ color: "var(--muted)" }}>
        Editorial workbench
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {loading ? (
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Loading...</span>
        ) : user ? (
          <>
            <span style={{ fontSize: 13, color: "var(--fg-2)" }}>
              Hello {(user.profile.given_name as string | undefined) ?? user.profile.preferred_username ?? "there"}
            </span>
            <button type="button" className="btn btn-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => void signIn()}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

function DashboardBody({ user, loading }: { user: User | null; loading: boolean }): ReactNode {
  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Loading session...</p>;
  }
  if (!user) {
    return (
      <div style={{ maxWidth: 540 }}>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 500,
            fontSize: 32,
            letterSpacing: "-0.01em",
          }}
        >
          Sign in to continue
        </h1>
        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 16,
            color: "var(--fg-2)",
            lineHeight: 1.6,
            marginTop: 12,
          }}
        >
          Authenticate with the journal&rsquo;s identity provider to access submissions, reviews,
          and editorial workflows.
        </p>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 720 }}>
      <h1
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: 32,
          letterSpacing: "-0.01em",
        }}
      >
        Hello {(user.profile.given_name as string | undefined) ?? "there"}
      </h1>
      <p
        style={{
          fontFamily: "var(--serif-body)",
          fontSize: 16,
          color: "var(--fg-2)",
          lineHeight: 1.6,
          marginTop: 8,
        }}
      >
        Placeholder dashboard. Submission queues, review tasks, and metrics will populate here.
      </p>

      <section style={{ marginTop: 32 }}>
        <p
          className="sc"
          style={{ color: "var(--muted)", marginBottom: 8 }}
        >
          Workflow
        </p>
        <StageStepper stage={1} size="lg" showLabels />
      </section>
    </div>
  );
}
