import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@ajs/ui/primitives";
import { useAuth } from "../auth/AuthContext";
import { hasRole, isEditorial, type RealmRole } from "../auth/roles";
import { PageHeader } from "../components/PageHeader";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

interface ActionCard {
  to: string;
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  when: (roles: RealmRole[]) => boolean;
}

const CARDS: ActionCard[] = [
  {
    to: "/author/submissions",
    icon: "fileText",
    eyebrow: "Authoring",
    title: "Pick up a submission",
    description: "Continue a draft, check status on a submitted manuscript, or review feedback from editors.",
    when: (r) => hasRole(r, "AUTHOR"),
  },
  {
    to: "/author/submissions/new",
    icon: "plus",
    eyebrow: "Authoring",
    title: "Start something new",
    description: "Begin a fresh submission — title, abstract, files, contributors.",
    when: (r) => hasRole(r, "AUTHOR"),
  },
  {
    to: "/reviewer/assignments",
    icon: "badgeCheck",
    eyebrow: "Reviewing",
    title: "Respond to review invitations",
    description: "Accept, decline, or complete the reviews you&rsquo;re assigned to.",
    when: (r) => hasRole(r, "REVIEWER"),
  },
  {
    to: "/editor/queue",
    icon: "inbox",
    eyebrow: "Editorial",
    title: "Triage the editorial queue",
    description: "Look at newly submitted manuscripts and route them into peer review.",
    when: isEditorial,
  },
  {
    to: "/editor/submissions",
    icon: "layers",
    eyebrow: "Editorial",
    title: "Browse all submissions",
    description: "Search across stages and statuses, filter by section or section editor.",
    when: isEditorial,
  },
  {
    to: "/admin/users",
    icon: "users",
    eyebrow: "Administration",
    title: "Manage users",
    description: "Activate, disable, or update user accounts mirrored from Keycloak.",
    when: (r) => hasRole(r, "ADMIN"),
  },
  {
    to: "/admin/journal",
    icon: "settings",
    eyebrow: "Administration",
    title: "Journal settings",
    description: "Sections, masthead, submission policies — the journal&rsquo;s configuration.",
    when: (r) => hasRole(r, "ADMIN"),
  },
  {
    to: "/notifications",
    icon: "bell",
    eyebrow: "Account",
    title: "Check your notifications",
    description: "Recent activity that needs your attention.",
    when: () => true,
  },
  {
    to: "/profile",
    icon: "user",
    eyebrow: "Account",
    title: "Review your profile",
    description: "Confirm your details and see which roles you currently hold.",
    when: () => true,
  },
];

function Dashboard(): ReactNode {
  const { user, roles, loading, signIn } = useAuth();

  if (loading) {
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  }

  if (!user) {
    return <UnauthenticatedDashboard signIn={signIn} />;
  }

  const greeting =
    (user.profile.given_name as string | undefined) ??
    user.profile.preferred_username ??
    "there";
  const visibleCards = CARDS.filter((c) => c.when(roles));

  return (
    <>
      <PageHeader
        eyebrow={roles.length > 0 ? `Signed in as ${roles.map(formatRole).join(" · ")}` : "Signed in"}
        title={`Hello, ${greeting}.`}
        description="What can you do today? The cards below adapt to the roles you hold in this journal."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 14,
        }}
      >
        {visibleCards.map((card) => (
          <ActionCardLink key={card.to} card={card} />
        ))}
      </div>
    </>
  );
}

function ActionCardLink({ card }: { card: ActionCard }): ReactNode {
  return (
    <Link
      to={card.to}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2)",
        padding: "18px 18px 16px",
        transition: "border-color 120ms, background 120ms",
      }}
      activeProps={{ style: { borderColor: "var(--cobalt)" } }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: "var(--r-1)",
            background: "var(--cobalt-soft)",
            color: "var(--cobalt-deep)",
          }}
        >
          <Icon name={card.icon} size={15} />
        </span>
        <Icon name="arrowUpRight" size={14} color="var(--muted)" />
      </div>
      <p
        className="sc"
        style={{ color: "var(--muted)", marginBottom: 4 }}
      >
        {card.eyebrow}
      </p>
      <p
        style={{
          fontFamily: "var(--serif-display)",
          fontSize: 17,
          fontWeight: 500,
          margin: "0 0 6px",
          color: "var(--fg)",
          letterSpacing: "-0.005em",
        }}
      >
        {card.title}
      </p>
      <p
        style={{
          fontFamily: "var(--serif-body)",
          fontSize: 14,
          lineHeight: 1.55,
          color: "var(--fg-2)",
          margin: 0,
        }}
      >
        {card.description}
      </p>
    </Link>
  );
}

function UnauthenticatedDashboard({ signIn }: { signIn: () => Promise<void> }): ReactNode {
  return (
    <div style={{ maxWidth: 540 }}>
      <p className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
        Editorial workbench
      </p>
      <h1
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: 36,
          letterSpacing: "-0.015em",
          margin: "0 0 14px",
        }}
      >
        Sign in to continue
      </h1>
      <p
        style={{
          fontFamily: "var(--serif-body)",
          fontSize: 17,
          color: "var(--fg-2)",
          lineHeight: 1.65,
          marginBottom: 22,
        }}
      >
        Authenticate with the journal&rsquo;s identity provider to access submissions, reviews, and editorial workflows.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => void signIn()}>
        Sign in with Keycloak
      </button>
    </div>
  );
}

function formatRole(r: RealmRole): string {
  return r.replace(/_/g, " ").toLowerCase();
}
