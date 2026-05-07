import { type ReactNode, useEffect, useState, type ComponentType } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  Bell,
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Flag,
  Globe,
  Home,
  Inbox,
  Layers,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { hasRole, isEditorial, type RealmRole } from "../auth/roles";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { Badge } from "@ajs/ui";
import { Button } from "@ajs/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ajs/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ajs/ui";
import { NotificationsBell } from "./NotificationsBell";

/**
 * Editorial app shell — premium workbench layout.
 *
 * - 244px sticky sidebar: brand cube, command-K affordance, role-aware nav
 *   with live badge counters, user avatar pinned to the bottom (now a
 *   real DropdownMenu).
 * - 56px top bar: breadcrumb on the left, locale switcher + working
 *   notifications dropdown + sign-in CTA on the right.
 * - Main: page header + content. Background uses the warm-white tint so
 *   surface cards inside pop with their flat shadow.
 */

type IconComponent = ComponentType<{ className?: string }>;

interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
  /** Predicate against current roles. Items with no `when` are always visible. */
  when?: (roles: RealmRole[]) => boolean;
  /** Optional badge source — fetched once per shell mount. */
  badgeSource?: BadgeSource;
}

interface NavGroup {
  /** Section heading shown above the items in small caps. */
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
    items: [{ to: "/", label: "Dashboard", icon: Home }],
  },
  {
    title: "Authoring",
    items: [
      {
        to: "/author/submissions",
        label: "My submissions",
        icon: FileText,
        when: (r) => hasRole(r, "AUTHOR"),
        badgeSource: "MY_SUBMISSIONS",
      },
      {
        to: "/author/submissions/new",
        label: "New submission",
        icon: Plus,
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
        icon: BadgeCheck,
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
        icon: Inbox,
        when: isEditorial,
        badgeSource: "EDITOR_QUEUE",
      },
      {
        to: "/editor/submissions",
        label: "All submissions",
        icon: Layers,
        when: isEditorial,
      },
      {
        to: "/editor/issues",
        label: "Issues",
        icon: BookOpen,
        when: isEditorial,
      },
      {
        to: "/editor/deposits",
        label: "Deposits",
        icon: ArrowUpRight,
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
        icon: Flag,
        when: isEditorial,
      },
      {
        to: "/admin/users",
        label: "Users",
        icon: Users,
        when: (r) => hasRole(r, "ADMIN"),
      },
      {
        to: "/admin/journal",
        label: "Journal config",
        icon: Settings,
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
        icon: Bell,
        badgeSource: "NOTIFICATIONS",
      },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

// --------------------------------------------------------------------------
// Shell
// --------------------------------------------------------------------------

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route guard: every authenticated route lives inside AppShell, so doing
  // the gate here covers them all in one shot. Auth resolution is async on
  // mount — hold the page until {loading} clears so we don't bounce a
  // signed-in user to /login on the first render.
  useEffect(() => {
    if (!loading && !user) {
      const dest =
        location.pathname === "/" ? "/" : `${location.pathname}${location.search ? "" : ""}`;
      void navigate({
        to: "/login",
        search: { redirect: dest === "/" ? undefined : dest },
        replace: true,
      });
    }
  }, [loading, user, navigate, location.pathname, location.search]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-tint text-muted font-sans text-[13px]">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 animate-pulse text-cobalt" />
          Loading session…
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[244px_1fr] min-h-screen bg-bg-tint font-sans text-fg">
      <Sidebar />
      <div className="flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-6 py-6 pb-12 min-w-0 bg-bg-tint">
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
  const badges = useBadgeCounts(user != null, roles);

  return (
    <aside className="bg-white border-r border-border flex flex-col sticky top-0 h-screen">
      {/* Brand block */}
      <div className="px-3 pt-4 pb-3 border-b border-border">
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-3 px-2 py-1 rounded-md hover:bg-bg-tint transition-colors"
        >
          <span className="size-7 rounded-md bg-gradient-to-br from-cobalt to-cobalt-deep text-white flex items-center justify-center font-serif-display font-semibold text-[15px] flex-none shadow-[0_1px_0_0_rgba(255,255,255,0.15)_inset]">
            AJ
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-tight text-fg truncate">
              The Academic Journal
            </span>
            <span className="block text-[10.5px] text-muted font-mono">
              Editorial workbench
            </span>
          </span>
        </Link>

        {/* Quick-find chip — placeholder, hooks into ⌘K palette later. */}
        <button
          type="button"
          aria-label="Quick find"
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-bg-tint/60 text-[12px] text-muted hover:border-border-strong hover:bg-bg-tint hover:text-fg-2 transition-colors"
        >
          <Search className="size-3.5" />
          <span className="flex-1 text-left">Quick find…</span>
          <kbd className="text-[9.5px] font-mono px-1 py-0.5 rounded bg-white border border-border text-muted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2.5 flex flex-col gap-px overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(
            (it) => !it.when || it.when(roles),
          );
          if (visibleItems.length === 0) return null;
          if (!user && group.title !== "Home") return null;
          return (
            <div key={group.title} className="flex flex-col gap-px mb-1">
              <div className="px-2 pt-2 pb-1 text-[9.5px] uppercase tracking-[0.08em] text-muted-2 font-semibold">
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
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={cn(
        "group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
        active
          ? "bg-cobalt-soft/60 text-cobalt-deep font-medium"
          : "text-fg-2 hover:bg-bg-tint hover:text-fg",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active ? "text-cobalt" : "text-muted group-hover:text-fg-2",
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badge != null && badge > 0 ? (
        <span
          className={cn(
            "tnum tabular-nums text-[10.5px] font-semibold px-1.5 rounded min-w-[18px] text-center",
            active
              ? "bg-cobalt text-white"
              : "bg-amber-soft text-amber-deep",
          )}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function UserBadge(): ReactNode {
  const { user, roles, signOut } = useAuth();

  if (!user) {
    return (
      <div className="p-3 border-t border-border">
        <Button asChild className="w-full">
          <Link to="/login" search={{ redirect: undefined }}>Sign in</Link>
        </Button>
      </div>
    );
  }

  const given = (user.profile.given_name as string | undefined) ?? "";
  const family = (user.profile.family_name as string | undefined) ?? "";
  const username =
    (user.profile.preferred_username as string | undefined) ?? "user";
  const email = (user.profile.email as string | undefined) ?? username;
  const fullName = `${given} ${family}`.trim() || username;
  const initials = computeInitials(given, family, username);
  const roleLabel = formatPrimaryRole(roles);

  return (
    <div className="p-2 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-bg-tint transition-colors text-left"
          >
            <span className="size-8 rounded-full bg-cobalt-soft text-cobalt-deep border border-cobalt/15 grid place-items-center font-semibold text-[11.5px] flex-none">
              {initials}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[12.5px] font-medium text-fg truncate">
                {fullName}
              </span>
              <span className="block text-[10.5px] text-muted truncate">
                {roleLabel}
              </span>
            </span>
            <ChevronDown className="size-3.5 text-muted shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-[228px]">
          <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
          <div className="px-2.5 pb-2">
            <div className="text-[12.5px] font-medium text-fg truncate">
              {fullName}
            </div>
            <div className="text-[11px] text-muted truncate font-mono">
              {email}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <UserCog />
              Profile settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/notifications">
              <Bell />
              Notifications
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void signOut()}
            className="text-[#b91c1c] focus:text-[#b91c1c] focus:bg-[#fff5f5] [&_svg]:text-[#b91c1c]"
          >
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// --------------------------------------------------------------------------
// Topbar
// --------------------------------------------------------------------------

function Topbar(): ReactNode {
  const { user, loading } = useAuth();
  const router = useRouter();
  const breadcrumb = useBreadcrumb();

  return (
    <header className="flex items-center gap-3 px-6 h-14 border-b border-border bg-white/80 backdrop-blur sticky top-0 z-40">
      <nav
        className="flex items-center gap-1.5 text-[12.5px] text-muted min-w-0"
        aria-label="Breadcrumb"
      >
        {breadcrumb.map((crumb, i) => (
          <BreadcrumbCrumb
            key={`${crumb.label}-${i}`}
            crumb={crumb}
            last={i === breadcrumb.length - 1}
          />
        ))}
      </nav>
      <div className="flex-1" />
      {loading ? (
        <span className="text-muted text-[13px]">Loading…</span>
      ) : user ? (
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <LocaleSwitcher />
        </div>
      ) : (
        <Button asChild size="sm">
          <Link to="/login" search={{ redirect: undefined }}>Sign in</Link>
        </Button>
      )}
      <span className="hidden" aria-hidden>
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
      className={cn(
        last ? "text-fg font-medium" : "text-muted",
        "truncate max-w-[180px]",
      )}
    >
      {crumb.label}
    </span>
  );
  return (
    <>
      {crumb.href && !last ? (
        <Link
          to={crumb.href}
          className="hover:text-fg-2 transition-colors text-inherit"
        >
          {text}
        </Link>
      ) : (
        text
      )}
      {!last ? (
        <ChevronRight className="size-3 text-border-strong" />
      ) : null}
    </>
  );
}

function LocaleSwitcher(): ReactNode {
  const [locale, setLocale] = useState<"en" | "ro">("en");
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[11.5px] uppercase tracking-wider"
            >
              <Globe className="size-3.5" />
              {locale}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Interface language</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setLocale("en")}>
          🇬🇧 English {locale === "en" ? <Badge variant="cobalt" className="ml-auto">on</Badge> : null}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("ro")}>
          🇷🇴 Română {locale === "ro" ? <Badge variant="cobalt" className="ml-auto">on</Badge> : null}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  publications: "Publications",
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

function useBadgeCounts(
  authenticated: boolean,
  roles: RealmRole[],
): Record<BadgeSource, number | undefined> {
  const [state, setState] = useState<Record<BadgeSource, number | undefined>>({
    MY_SUBMISSIONS: undefined,
    MY_REVIEWS: undefined,
    EDITOR_QUEUE: undefined,
    NOTIFICATIONS: undefined,
  });
  const rolesKey = roles.slice().sort().join(",");
  useEffect(() => {
    if (!authenticated) return;
    let cancelled = false;
    const runs: Array<[BadgeSource, string]> = [];
    if (hasRole(roles, "AUTHOR")) {
      runs.push(["MY_SUBMISSIONS", "/api/v1/submissions/me?size=1"]);
    }
    if (hasRole(roles, "REVIEWER")) {
      runs.push(["MY_REVIEWS", "/api/v1/reviewer/assignments?size=1"]);
    }
    if (isEditorial(roles)) {
      runs.push(["EDITOR_QUEUE", "/api/v1/submissions?status=QUEUED&size=1"]);
    }
    runs.push(["NOTIFICATIONS", "/api/v1/notifications/unread-count"]);
    void Promise.all(
      runs.map(async ([key, url]) => {
        const data = await api<{
          totalElements?: number;
          total?: number;
          unread?: number;
        }>(url);
        if (cancelled) return;
        const total = data?.totalElements ?? data?.total ?? data?.unread;
        if (typeof total === "number") {
          setState((prev) => ({ ...prev, [key]: total }));
        }
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [authenticated, rolesKey]);
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
