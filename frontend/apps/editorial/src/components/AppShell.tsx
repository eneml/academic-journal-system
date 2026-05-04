import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Icon, type IconName } from "@ajs/ui/primitives";
import { useAuth } from "../auth/AuthContext";
import { hasRole, isEditorial, type RealmRole } from "../auth/roles";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Predicate against current roles. Items with no `when` are always visible. */
  when?: (roles: RealmRole[]) => boolean;
}

interface NavGroup {
  /** Optional group title shown above the items in small caps. */
  title?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ to: "/", label: "Dashboard", icon: "home" }],
  },
  {
    title: "Authoring",
    items: [
      {
        to: "/author/submissions",
        label: "My submissions",
        icon: "fileText",
        when: (r) => hasRole(r, "AUTHOR"),
      },
      {
        to: "/author/submissions/new",
        label: "New submission",
        icon: "plus",
        when: (r) => hasRole(r, "AUTHOR"),
      },
    ],
  },
  {
    title: "Reviewing",
    items: [
      {
        to: "/reviewer/assignments",
        label: "My review assignments",
        icon: "badgeCheck",
        when: (r) => hasRole(r, "REVIEWER"),
      },
    ],
  },
  {
    title: "Editorial",
    items: [
      {
        to: "/editor/queue",
        label: "Editorial queue",
        icon: "inbox",
        when: isEditorial,
      },
      {
        to: "/editor/submissions",
        label: "All submissions",
        icon: "layers",
        when: isEditorial,
      },
      {
        to: "/editor/issues",
        label: "Issues",
        icon: "calendar",
        when: isEditorial,
      },
      {
        to: "/editor/deposits",
        label: "DOI / ORCID deposits",
        icon: "arrowUpRight",
        when: isEditorial,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        to: "/admin/announcements",
        label: "Announcements",
        icon: "flag",
        when: isEditorial,
      },
      {
        to: "/admin/users",
        label: "Users",
        icon: "users",
        when: (r) => hasRole(r, "ADMIN"),
      },
      {
        to: "/admin/journal",
        label: "Journal settings",
        icon: "settings",
        when: (r) => hasRole(r, "ADMIN"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: "user" },
      { to: "/notifications", label: "Notifications", icon: "bell" },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: "32px 36px", minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}

function Sidebar(): ReactNode {
  const { roles, user } = useAuth();
  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        padding: "20px 14px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 600,
          fontSize: 17,
          color: "var(--fg)",
          letterSpacing: "-0.01em",
          padding: "0 8px 16px",
          borderBottom: "1px solid var(--border)",
          marginBottom: 6,
        }}
      >
        Academic Journal
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {NAV_GROUPS.map((group, idx) => {
          // Hide a whole group if every item is gated and the user has none.
          const visible = group.items.filter((it) => !it.when || it.when(roles));
          // Show "Account" group even when unauthenticated so the layout stays
          // consistent; but skip empty groups otherwise.
          if (visible.length === 0) return null;
          // Skip groups whose only items require roles the user lacks unless
          // the user is signed in (we still want Profile/Notifications visible
          // to all signed-in users; for unauth users we suppress everything
          // except Dashboard).
          if (!user && group.title) return null;
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {group.title ? (
                <div
                  className="sc"
                  style={{ color: "var(--muted-2)", padding: "6px 8px 4px" }}
                >
                  {group.title}
                </div>
              ) : null}
              {visible.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }): ReactNode {
  const location = useLocation();
  // Active when on the exact route, or for non-root routes when the path
  // begins with the link target (so /editor/queue/123 keeps Editorial queue lit).
  const active =
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

  return (
    <Link
      to={item.to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 8px",
        borderRadius: "var(--r-2)",
        color: active ? "var(--cobalt-deep)" : "var(--fg-2)",
        background: active ? "var(--cobalt-soft)" : "transparent",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        lineHeight: 1.2,
      }}
    >
      <Icon name={item.icon} size={15} />
      <span>{item.label}</span>
    </Link>
  );
}

function Topbar(): ReactNode {
  const { user, loading, signIn, signOut } = useAuth();
  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
      }}
    >
      <div className="sc" style={{ color: "var(--muted)" }}>
        Editorial workbench
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {loading ? (
          <span style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</span>
        ) : user ? (
          <>
            <span
              style={{
                fontSize: 13,
                color: "var(--fg-2)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                className="avatar"
                style={{ background: "var(--cobalt-soft)", color: "var(--cobalt-deep)" }}
              >
                {initials(user.profile.given_name, user.profile.family_name, user.profile.preferred_username)}
              </span>
              <span>
                {(user.profile.given_name as string | undefined) ??
                  user.profile.preferred_username ??
                  "Signed in"}
              </span>
            </span>
            <button type="button" className="btn btn-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void signIn()}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

function initials(
  given: string | undefined,
  family: string | undefined,
  username: string | undefined,
): string {
  const g = (given ?? "").trim();
  const f = (family ?? "").trim();
  if (g || f) {
    return `${g.charAt(0)}${f.charAt(0)}`.toUpperCase() || "?";
  }
  const u = (username ?? "").trim();
  return (u.charAt(0) || "?").toUpperCase();
}
