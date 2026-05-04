import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";

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
}

function AdminUsersPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [page, setPage] = useState<Page<UserRow> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

  const allowed = hasRole(roles, "ADMIN");

  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);
    (async () => {
      const data = await api<Page<UserRow>>("/api/v1/users?size=50");
      if (cancelled) return;
      if (data) setPage(data);
      else setErrored(true);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, allowed]);

  if (authLoading) {
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
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

  const users = page?.content ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Local user records mirroring Keycloak identities."
      />

      {fetching ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading users&hellip;</p>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn&rsquo;t load users"
          description="The /api/v1/users endpoint didn&rsquo;t respond."
        />
      ) : null}

      {!fetching && !errored && users.length === 0 ? (
        <EmptyState icon="users" title="No users yet" />
      ) : null}

      {!fetching && users.length > 0 ? (
        <Card padded={false}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <Th>Username</Th>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th width={120}>Status</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: idx < users.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  <Td>
                    <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                      {u.username}
                    </span>
                  </Td>
                  <Td>
                    {[u.givenName, u.familyName].filter(Boolean).join(" ") || "—"}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>{u.status ? <StatusChip status={u.status} /> : "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </>
  );
}

function Th({ children, width }: { children: ReactNode; width?: number }): ReactNode {
  return (
    <th
      className="sc"
      style={{
        textAlign: "left",
        padding: "12px 18px",
        color: "var(--muted)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        fontWeight: 600,
        width,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }): ReactNode {
  return <td style={{ padding: "12px 18px", verticalAlign: "middle" }}>{children}</td>;
}
