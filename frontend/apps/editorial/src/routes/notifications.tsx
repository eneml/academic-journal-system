import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { SignInPrompt } from "../components/SignInPrompt";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

interface Notification {
  id: number;
  type: string;
  level?: string;
  title: string;
  body?: string;
  href?: string;
  readAt?: string | null;
  createdAt: string;
}

function NotificationsPage(): ReactNode {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    (async () => {
      const data = await api<Notification[]>("/api/v1/notifications");
      if (cancelled) return;
      setItems(data);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }

  const unread = items?.filter((n) => !n.readAt).length ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description={
          fetching
            ? "Loading…"
            : items
              ? `${items.length} recent · ${unread} unread`
              : "Notifications could not be loaded."
        }
      />

      {!fetching && items && items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="You&rsquo;re all caught up"
          description="When something happens that needs your attention — a review request, a decision, a discussion thread — it&rsquo;ll show up here."
        />
      ) : null}

      {items && items.length > 0 ? (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((n, idx) => (
              <NotificationRow key={n.id} item={n} divider={idx < items.length - 1} />
            ))}
          </ul>
        </Card>
      ) : null}

      {!fetching && items === null ? (
        <EmptyState
          icon="alert"
          title="Notifications service unavailable"
          description="The backend didn&rsquo;t return notifications. Check that the API is reachable and that you&rsquo;re signed in with a valid token."
        />
      ) : null}
    </>
  );
}

function NotificationRow({
  item,
  divider,
}: {
  item: Notification;
  divider: boolean;
}): ReactNode {
  const unread = !item.readAt;
  return (
    <li
      style={{
        padding: "14px 20px",
        borderBottom: divider ? "1px solid var(--border)" : "none",
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        background: unread ? "var(--cobalt-soft)" : "transparent",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          marginTop: 7,
          flex: "none",
          background: unread ? "var(--cobalt)" : "var(--border-strong)",
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "baseline",
          }}
        >
          <p
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 15,
              fontWeight: unread ? 600 : 500,
              color: "var(--fg)",
              margin: 0,
            }}
          >
            {item.title}
          </p>
          <span
            className="tnum"
            style={{
              fontSize: 11,
              color: "var(--muted)",
              flex: "none",
              fontFamily: "var(--mono)",
            }}
          >
            {formatRelative(item.createdAt)}
          </span>
        </div>
        {item.body ? (
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 14,
              color: "var(--fg-2)",
              margin: "4px 0 0",
              lineHeight: 1.55,
            }}
          >
            {item.body}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
          <span className="chip chip-mono">{item.type}</span>
          {item.level && item.level !== "INFO" ? (
            <span className={`chip ${chipForLevel(item.level)}`}>
              {item.level.toLowerCase()}
            </span>
          ) : null}
          {item.href ? (
            <a
              href={item.href}
              style={{
                fontSize: 12,
                color: "var(--cobalt)",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Open →
            </a>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function chipForLevel(level: string): string {
  const l = level.toUpperCase();
  if (l === "WARN" || l === "WARNING") return "chip-amber";
  if (l === "ERROR" || l === "DANGER") return "chip-red";
  if (l === "SUCCESS") return "chip-green";
  return "chip-cobalt";
}

function formatRelative(iso: string): string {
  try {
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return "";
    const diff = Date.now() - ts;
    const m = Math.round(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.round(h / 24);
    if (d < 30) return `${d}d`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}
