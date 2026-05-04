import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { Icon, type IconName } from "@ajs/ui/primitives";
import { useAuth } from "../auth/AuthContext";
import { hasRole, isEditorial, type RealmRole } from "../auth/roles";
import { api } from "../lib/api";

/**
 * Editorial app shell modeled on the design handoff:
 *
 * - 232px sidebar (fixed): logo cube + journal name + version line, quick-find
 *   chip, role label, role-aware nav items with badge counts on the live
 *   queues, user avatar pinned to the bottom.
 * - 48px top bar: breadcrumb derived from the current pathname, locale
 *   switcher, sign in / sign out + bell.
 * - Main column: hosts the page (PageHeader+content). Children render under
 *   the topbar; horizontal padding is the page's responsibility.
 */

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Predicate against current roles. Items with no `when` are always visible. */
  when?: (roles: RealmRole[]) => boolean;
  /** Optional badge source — fetched once per shell mount. */
  badgeSource?: BadgeSource;
}

interface NavGroup {
  /** Section heading shown above the items in small caps. Becomes the role label. */
  title: string;
  items: NavItem[];
}

type BadgeSource =
  | "MY_SUBMISSIONS"
  | "MY_REVIEWS"
  | "EDITOR_QUEUE"
  | "NOTIFICATIONS";

// --------------------------------------------------------------------------
// Nav layout
// --------------------------------------------------------------------------

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Home",
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
        badgeSource: "MY_SUBMISSIONS",
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
        label: "My reviews",
        icon: "badgeCheck",
        when: (r) => hasRole(r, "REVIEWER"),
        badgeSource: "MY_REVIEWS",
      },
    ],
  },
  {
    title: "Editorial",
    items: [
      {
        to: "/editor/queue",
        label: "Submissions",
        icon: "inbox",
        when: isEditorial,
        badgeSource: "EDITOR_QUEUE",
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
        icon: "bookOpen",
        when: isEditorial,
      },
      {
        to: "/editor/deposits",
        label: "Deposits",
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
        label: "Journal config",
        icon: "settings",
        when: (r) => hasRole(r, "ADMIN"),
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        to: "/notifications",
        label: "Notifications",
        icon: "bell",
        badgeSource: "NOTIFICATIONS",
      },
      { to: "/profile", label: "Profile", icon: "user" },
    ],
  },
];

// --------------------------------------------------------------------------
// Shell
// --------------------------------------------------------------------------

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "232px 1fr",
        minHeight: "100vh",
        background: "var(--bg-tint)",
        fontFamily: "var(--sans)",
        color: "var(--fg)",
      }}
    >
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main
          style={{
            flex: 1,
            padding: "20px 24px 48px",
            minWidth: 0,
            background: "var(--bg-tint)",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sidebar
// --------------------------------------------------------------------------

function Sidebar(): ReactNode {
  const { roles, user } = useAuth();
  const badges = useBadgeCounts(user != null);

  return (
    <aside
      style={{
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      {/* Brand block */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: "var(--cobalt)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 15,
              flex: "none",
            }}
          >
            AJ
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              The Academic Journal
            </span>
            <span
              style={{
                display: "block",
                fontSize: 10.5,
                color: "var(--muted)",
                fontFamily: "var(--mono)",
              }}
            >
              Editorial workbench
            </span>
          </span>
        </Link>
        <Link
          to="/editor/submissions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 8px",
            border: "1px solid var(--border)",
            borderRadius: 5,
            fontSize: 12,
            color: "var(--muted)",
            textDecoration: "none",
            cursor: "pointer",
          }}
          aria-label="Quick find"
        >
          <Icon name="search" size={13} />
          <span style={{ flex: 1 }}>Quick find&hellip;</span>
          <span
            className="chip chip-mono"
            style={{ fontSize: 9, height: 14, padding: "0 4px" }}
          >
            ⌘K
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          overflowY: "auto",
        }}
      >
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (it) => !it.when || it.when(roles),
          );
          // Hide groups whose only items require a role the user lacks.
          if (visibleItems.length === 0) return null;
          // Suppress role-gated groups for unauthenticated users.
          if (!user && group.title !== "Home") return null;
          return (
            <div
              key={group.title}
              style={{ display: "flex", flexDirection: "column", gap: 1 }}
            >
              <div
                className="sc"
                style={{
                  color: "var(--muted-2)",
                  padding: "8px 8px 4px",
                  fontSize: 9.5,
                }}
              >
                {group.title}
              </div>
              {visibleItems.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  badge={
                    item.badgeSource ? badges[item.badgeSource] : undefined
                  }
                />
              ))}
            </div>
          );
        })}
      </nav>

      {/* User card */}
      <UserBadge />
    </aside>
  );
}

function SidebarLink({
  item,
  badge,
}: {
  item: NavItem;
  badge: number | undefined;
}): ReactNode {
  const location = useLocation();
  const active =
    item.to === "/"
      ? location.pathname === "/"
      : location.pathname === item.to ||
        location.pathname.startsWith(`${item.to}/`);

  return (
    <Link
      to={item.to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 9px",
        borderRadius: 5,
        fontSize: 13,
        color: active ? "var(--fg)" : "var(--fg-2)",
        fontWeight: active ? 500 : 400,
        background: active ? "var(--surface)" : "transparent",
        textDecoration: "none",
        boxShadow: active ? "inset 0 0 0 1px var(--border)" : "none",
      }}
    >
      <Icon
        name={item.icon}
        size={15}
        color={active ? "var(--cobalt)" : "var(--muted)"}
      />
      <span style={{ flex: 1 }}>{item.label}</span>
      {badge != null && badge > 0 ? (
        <span
          className="tnum"
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            background: active ? "var(--cobalt)" : "var(--surface-2)",
            color: active ? "white" : "var(--muted)",
            padding: "1px 5px",
            borderRadius: 3,
            minWidth: 16,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function UserBadge(): ReactNode {
  const { user, roles, signIn, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div style={{ padding: 10, borderTop: "1px solid var(--border)" }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      </div>
    );
  }

  const given = (user.profile.given_name as string | undefined) ?? "";
  const family = (user.profile.family_name as string | undefined) ?? "";
  const username =
    (user.profile.preferred_username as string | undefined) ?? "user";
  const fullName = `${given} ${family}`.trim() || username;
  const initials = computeInitials(given, family, username);
  const roleLabel = formatPrimaryRole(roles);

  return (
    <div
      style={{
        padding: 8,
        borderTop: "1px solid var(--border)",
        position: "relative",
      }}
    >
      {open ? (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 8,
            right: 8,
            background: "var(--bg)",
            border: "1px solid var(--border-strong)",
            borderRadius: 5,
            padding: 6,
            boxShadow: "0 4px 16px oklch(20% 0.02 270 / 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            zIndex: 5,
          }}
        >
          <Link
            to="/profile"
            style={{
              padding: "7px 10px",
              fontSize: 12.5,
              color: "var(--fg-2)",
              textDecoration: "none",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => setOpen(false)}
          >
            <Icon name="user" size={13} color="var(--muted)" /> Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            style={{
              padding: "7px 10px",
              fontSize: 12.5,
              color: "var(--fg-2)",
              background: "transparent",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="arrowUpRight" size={13} color="var(--muted)" /> Sign out
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px",
          borderRadius: 5,
          background: open ? "var(--surface)" : "transparent",
          border: "none",
          width: "100%",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          className="avatar"
          style={{
            width: 26,
            height: 26,
            fontSize: 11,
            background: "var(--cobalt-soft)",
            color: "var(--cobalt-deep)",
            borderColor: "oklch(85% 0.06 255)",
          }}
        >
          {initials}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {fullName}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 10,
              color: "var(--muted)",
            }}
          >
            {roleLabel}
          </span>
        </span>
        <Icon name="moreH" size={14} color="var(--muted)" />
      </button>
    </div>
  );
}

// --------------------------------------------------------------------------
// Topbar
// --------------------------------------------------------------------------

function Topbar(): ReactNode {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const breadcrumb = useBreadcrumb();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 24px",
        height: 48,
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12.5,
          color: "var(--muted)",
        }}
      >
        {breadcrumb.map((crumb, i) => (
          <BreadcrumbCrumb
            key={`${crumb.label}-${i}`}
            crumb={crumb}
            last={i === breadcrumb.length - 1}
          />
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {loading ? (
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</span>
      ) : user ? (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Link
            to="/notifications"
            className="btn btn-ghost btn-sm"
            style={{ padding: 6, textDecoration: "none" }}
            aria-label="Notifications"
          >
            <Icon name="bell" size={14} />
          </Link>
          <LocaleSwitcher />
        </div>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => void signIn()}
        >
          Sign in
        </button>
      )}
      {/* Reference router so devtools-route-aware features have a chance to
          mount, even when the topbar itself doesn't navigate. */}
      <span style={{ display: "none" }} aria-hidden>
        {router.state.status}
      </span>
    </header>
  );
}

function BreadcrumbCrumb({
  crumb,
  last,
}: {
  crumb: { label: string; href?: string };
  last: boolean;
}): ReactNode {
  const text = (
    <span
      style={{
        color: last ? "var(--fg)" : "var(--muted)",
        fontWeight: last ? 500 : 400,
      }}
    >
      {crumb.label}
    </span>
  );
  return (
    <>
      {crumb.href && !last ? (
        <Link
          to={crumb.href}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {text}
        </Link>
      ) : (
        text
      )}
      {!last ? <Icon name="chevronRight" size={11} color="var(--border-strong)" /> : null}
    </>
  );
}

function LocaleSwitcher(): ReactNode {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "3px 7px",
        fontSize: 11,
        color: "var(--fg-2)",
        cursor: "pointer",
        fontFamily: "var(--sans)",
      }}
    >
      <Icon name="globe" size={11} color="var(--muted)" />
      <span style={{ fontWeight: 600 }}>EN</span>
      <Icon name="chevronDown" size={10} color="var(--muted)" />
    </span>
  );
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const BREADCRUMB_LABELS: Record<string, string> = {
  "": "Home",
  author: "Author",
  reviewer: "Reviewer",
  editor: "Editor",
  admin: "Admin",
  submissions: "Submissions",
  new: "New",
  assignments: "Assignments",
  queue: "Queue",
  issues: "Issues",
  deposits: "Deposits",
  announcements: "Announcements",
  users: "Users",
  journal: "Journal",
  notifications: "Notifications",
  profile: "Profile",
};

function useBreadcrumb(): Array<{ label: string; href?: string }> {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return [{ label: "Dashboard", href: "/" }];
  }
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Dashboard", href: "/" },
  ];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    const isNumeric = /^[0-9]+$/.test(seg);
    const label = isNumeric
      ? `#${seg}`
      : BREADCRUMB_LABELS[seg] ??
        seg.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
    crumbs.push({ label, href: path });
  }
  return crumbs;
}

/**
 * Lightweight badge counter — fires four optional API calls on shell mount,
 * each non-blocking and best-effort. A failed call leaves the badge
 * undefined (no number shown). Re-runs only when the user changes (sign in /
 * sign out), not on every navigation.
 */
function useBadgeCounts(authenticated: boolean): Record<BadgeSource, number | undefined> {
  const [state, setState] = useState<Record<BadgeSource, number | undefined>>({
    MY_SUBMISSIONS: undefined,
    MY_REVIEWS: undefined,
    EDITOR_QUEUE: undefined,
    NOTIFICATIONS: undefined,
  });
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const runs: Array<[BadgeSource, string]> = [
      ["MY_SUBMISSIONS", "/api/v1/submissions/me?size=1"],
      ["MY_REVIEWS", "/api/v1/reviewer/assignments?size=1"],
      ["EDITOR_QUEUE", "/api/v1/submissions?status=QUEUED&size=1"],
      ["NOTIFICATIONS", "/api/v1/notifications?unread=true&size=1"],
    ];
    void Promise.all(
      runs.map(async ([key, url]) => {
        const data = await api<{ totalElements?: number; total?: number }>(url);
        if (cancelled) return;
        const total = data?.totalElements ?? data?.total;
        if (typeof total === "number") {
          setState((prev) => ({ ...prev, [key]: total }));
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [authenticated]);
  return state;
}

function computeInitials(given: string, family: string, username: string): string {
  const g = given.trim();
  const f = family.trim();
  if (g || f) return (g.charAt(0) + f.charAt(0)).toUpperCase() || "?";
  return (username.trim().charAt(0) || "?").toUpperCase();
}

function formatPrimaryRole(roles: RealmRole[]): string {
  if (roles.length === 0) return "Signed in";
  // Prefer the highest-privilege one for the user-card subtitle.
  const order: RealmRole[] = [
    "ADMIN",
    "EDITOR",
    "SECTION_EDITOR",
    "REVIEWER",
    "PRODUCTION_STAFF",
    "AUTHOR",
  ];
  for (const r of order) {
    if (roles.includes(r)) return prettyRole(r);
  }
  return prettyRole(roles[0]!);
}

function prettyRole(r: RealmRole): string {
  switch (r) {
    case "ADMIN": return "Administrator";
    case "EDITOR": return "Editor";
    case "SECTION_EDITOR": return "Section Editor";
    case "AUTHOR": return "Author";
    case "REVIEWER": return "Reviewer";
    case "PRODUCTION_STAFF": return "Production";
    default: return r;
  }
}
