import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Filter, Plus, Search, Users } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge, Button, OrcidBadge } from "@ajs/ui";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

interface UserRow {
  id: number;
  email: string;
  username: string;
  givenName?: string;
  familyName?: string;
  status?: string;
  affiliation?: string;
  orcidId?: string;
  realmRoles?: string[];
}

const ROLE_FILTERS = [
  { id: "all", label: "All" },
  { id: "EDITOR", label: "Editors" },
  { id: "REVIEWER", label: "Reviewers" },
  { id: "AUTHOR", label: "Authors" },
  { id: "ADMIN", label: "Admins" },
] as const;

type RoleFilter = (typeof ROLE_FILTERS)[number]["id"];

function AdminUsersPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [page, setPage] = useState<Page<UserRow> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const allowed = hasRole(roles, "ADMIN");

  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);
    (async () => {
      const data = await api<Page<UserRow>>("/api/v1/users?size=100");
      if (cancelled) return;
      if (data) setPage(data);
      else setErrored(true);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, allowed]);

  const users = page?.content ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all") {
        if (!u.realmRoles?.some((r) => r === roleFilter)) return false;
      }
      if (!q) return true;
      const name = `${u.givenName ?? ""} ${u.familyName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.orcidId ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const counts = useMemo(() => {
    const c: Record<RoleFilter, number> = {
      all: users.length,
      EDITOR: 0,
      REVIEWER: 0,
      AUTHOR: 0,
      ADMIN: 0,
    };
    users.forEach((u) => {
      u.realmRoles?.forEach((r) => {
        if (r in c) c[r as RoleFilter] = (c[r as RoleFilter] ?? 0) + 1;
      });
    });
    return c;
  }, [users]);

  if (authLoading) {
    return <p className="text-sm text-muted">Loading session…</p>;
  }
  if (!user) return <SignInPrompt />;
  if (!allowed) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Users" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="This area is restricted to ADMIN role holders."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description={
          fetching
            ? "Loading…"
            : `${users.length} record${users.length === 1 ? "" : "s"}`
        }
        actions={
          <>
            <Button type="button" variant="secondary" size="sm" disabled>
              <Download /> Export CSV
            </Button>
            <Button type="button" size="sm" disabled>
              <Plus /> Invite user
            </Button>
          </>
        }
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
        <div className="flex max-w-[360px] flex-1 items-center gap-2 rounded-md border border-border-strong bg-white px-3 py-1.5">
          <Search className="size-3.5 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, username, or ORCID…"
            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
          />
        </div>
        {ROLE_FILTERS.map((f) => {
          const active = roleFilter === f.id;
          const count = counts[f.id];
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setRoleFilter(f.id)}
              className={`chip ${active ? "chip-cobalt chip-dot" : ""}`}
            >
              {f.label} {count}
            </button>
          );
        })}
        <div className="flex-1" />
        <Button type="button" variant="secondary" size="sm" disabled>
          <Filter />
        </Button>
      </div>

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn't load users"
          description="The /api/v1/users endpoint didn't respond."
        />
      ) : null}

      {!fetching && !errored && filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-bg-tint/40 px-8 py-12 text-center">
          <Users className="mx-auto mb-3 size-8 text-cobalt" />
          <h3 className="font-serif-display text-[18px] font-semibold text-ink">
            {users.length === 0 ? "No users yet" : "No matching users"}
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            {users.length === 0
              ? "Local user records will appear here as Keycloak identities sign in for the first time."
              : "Try a different search term or clear the filter chip."}
          </p>
        </div>
      ) : null}

      {!fetching && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="grid grid-cols-[44px_1fr_220px_220px_120px_100px_32px] gap-3 border-b border-border bg-surface px-3.5 py-2.5 sc text-muted">
            <span></span>
            <span>Name</span>
            <span>Roles</span>
            <span>Affiliation</span>
            <span>ORCID</span>
            <span>Status</span>
            <span></span>
          </div>
          <ul className="m-0 list-none divide-y divide-border p-0">
            {filtered.map((u) => (
              <UserRowItem key={u.id} user={u} />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function UserRowItem({ user }: { user: UserRow }): ReactNode {
  const fullName = [user.givenName, user.familyName].filter(Boolean).join(" ") || "—";
  const initials = computeInitials(user.givenName ?? "", user.familyName ?? "", user.username);
  return (
    <li className="grid grid-cols-[44px_1fr_220px_220px_120px_100px_32px] items-center gap-3 px-3.5 py-2.5">
      <span
        className="grid size-8 place-items-center rounded-full border border-cobalt/20 bg-cobalt-soft font-mono text-[10.5px] font-semibold text-cobalt-deep"
        aria-hidden
      >
        {initials}
      </span>
      <div>
        <div className="text-[13px] font-medium text-ink">{fullName}</div>
        <div className="font-mono text-[10.5px] text-muted">{user.email}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {(user.realmRoles ?? []).map((r) => (
          <Badge key={r} variant="default">
            {r.replace(/_/g, " ").toLowerCase()}
          </Badge>
        ))}
        {(user.realmRoles ?? []).length === 0 ? (
          <span className="text-[11px] text-muted-2">—</span>
        ) : null}
      </div>
      <span className="font-serif-body text-[12px] italic text-fg-2 truncate">
        {user.affiliation ?? "—"}
      </span>
      <span>
        {user.orcidId ? (
          <OrcidBadge id={user.orcidId} asText />
        ) : (
          <span className="font-mono text-[11px] text-muted-2">—</span>
        )}
      </span>
      <span>
        {user.status === "ACTIVE" ? (
          <Badge variant="success" withDot>Active</Badge>
        ) : user.status === "INVITED" ? (
          <Badge variant="amber" withDot>Invited</Badge>
        ) : user.status ? (
          <Badge variant="ghost">{user.status.toLowerCase()}</Badge>
        ) : (
          <span className="text-[11px] text-muted">—</span>
        )}
      </span>
      <span className="text-right text-muted-2" aria-hidden>
        ⋯
      </span>
    </li>
  );
}

function computeInitials(g: string, f: string, username: string): string {
  const fromName = ((g.charAt(0) || "") + (f.charAt(0) || "")).toUpperCase();
  if (fromName) return fromName;
  return (username.charAt(0) || "?").toUpperCase();
}
