import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/api";
import { cn } from "../lib/cn";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { SignInPrompt } from "../components/SignInPrompt";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

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

type FilterMode = "all" | "unread";

function NotificationsPage(): ReactNode {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [mode, setMode] = useState<FilterMode>("all");

  const reload = async (): Promise<void> => {
    setFetching(true);
    const data = await api<Notification[]>("/api/v1/notifications?limit=50");
    setItems(data);
    setFetching(false);
  };

  useEffect(() => {
    if (!user) return;
    void reload();
  }, [user]);

  const markAll = async (): Promise<void> => {
    const result = await api<{ updated: number }>(
      "/api/v1/notifications/read-all",
      { method: "POST" },
    );
    if (result == null) {
      toast.error("Couldn't mark them as read.");
      return;
    }
    toast.success(`Marked ${result.updated ?? "all"} as read.`);
    void reload();
  };

  if (authLoading) return <p className="text-muted text-sm">Loading session…</p>;
  if (!user) return <SignInPrompt />;

  const unread = items?.filter((n) => !n.readAt).length ?? 0;
  const visible =
    mode === "unread" ? items?.filter((n) => !n.readAt) ?? [] : items ?? [];

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
        actions={
          unread > 0 ? (
            <Button variant="secondary" size="sm" onClick={markAll}>
              <CheckCheck />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-1.5 mb-4">
        <Button
          type="button"
          variant={mode === "all" ? "default" : "secondary"}
          size="sm"
          onClick={() => setMode("all")}
          className="rounded-full"
        >
          All
          <Badge variant={mode === "all" ? "outline" : "default"} className="ml-1">
            {items?.length ?? 0}
          </Badge>
        </Button>
        <Button
          type="button"
          variant={mode === "unread" ? "default" : "secondary"}
          size="sm"
          onClick={() => setMode("unread")}
          className="rounded-full"
        >
          Unread
          <Badge variant={mode === "unread" ? "outline" : "amber"} className="ml-1">
            {unread}
          </Badge>
        </Button>
      </div>

      {!fetching && items && visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-tint/40 px-8 py-14 text-center">
          <Bell className="size-8 text-cobalt mx-auto mb-3" />
          <h3 className="font-serif-display text-[18px] font-semibold text-fg">
            {mode === "unread" ? "Nothing unread" : "You're all caught up"}
          </h3>
          <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
            When something happens that needs your attention — a review
            request, a decision, a discussion thread — it&rsquo;ll show up here.
          </p>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <ul className="divide-y divide-border">
            {visible.map((n) => (
              <NotificationRow key={n.id} item={n} onMarkedRead={reload} />
            ))}
          </ul>
        </div>
      ) : null}

      {!fetching && items === null ? (
        <EmptyState
          icon="alert"
          title="Notifications service unavailable"
          description="The backend didn’t return notifications. Check that the API is reachable and that you’re signed in with a valid token."
        />
      ) : null}
    </>
  );
}

function NotificationRow({
  item,
  onMarkedRead,
}: {
  item: Notification;
  onMarkedRead: () => void;
}): ReactNode {
  const unread = !item.readAt;
  const Icon = iconForLevel(item.level ?? "INFO");
  const tone = toneForLevel(item.level ?? "INFO");

  const Content = (
    <div className="flex gap-3 p-4 group">
      <div className={cn("size-9 rounded-md grid place-items-center flex-none", tone)}>
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-3 items-baseline">
          <p
            className={cn(
              "font-serif-display text-[15px] m-0 text-fg",
              unread ? "font-semibold" : "font-medium",
            )}
          >
            {item.title}
          </p>
          <span className="tnum tabular-nums text-[11px] text-muted flex-none font-mono">
            {formatRelative(item.createdAt)}
          </span>
        </div>
        {item.body ? (
          <p className="font-serif-body text-[14px] text-fg-2 mt-1 leading-relaxed">
            {item.body}
          </p>
        ) : null}
        <div className="flex gap-1.5 mt-2 items-center flex-wrap">
          <Badge variant="ghost" className="font-mono normal-case">
            {item.type}
          </Badge>
          {item.level && item.level !== "INFO" ? (
            <Badge variant={badgeForLevel(item.level)}>
              {item.level.toLowerCase()}
            </Badge>
          ) : null}
          {unread ? (
            <span className="size-1.5 rounded-full bg-cobalt" aria-hidden />
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <li className={cn(unread ? "bg-cobalt-soft/30" : "")}>
      {item.href ? (
        <Link
          to={item.href}
          onClick={() => {
            void api(`/api/v1/notifications/${item.id}/read`, { method: "POST" });
            onMarkedRead();
          }}
          className="block hover:bg-bg-tint/60 transition-colors no-underline text-inherit"
        >
          {Content}
        </Link>
      ) : (
        Content
      )}
    </li>
  );
}

function iconForLevel(level: string) {
  const l = level.toUpperCase();
  if (l === "ERROR" || l === "URGENT") return ShieldAlert;
  if (l === "WARN" || l === "WARNING") return CircleAlert;
  return Info;
}

function toneForLevel(level: string): string {
  const l = level.toUpperCase();
  if (l === "ERROR" || l === "URGENT") return "bg-[#fff5f5] text-[#b91c1c]";
  if (l === "WARN" || l === "WARNING") return "bg-amber-soft text-amber-deep";
  return "bg-cobalt-soft text-cobalt-deep";
}

function badgeForLevel(level: string): "amber" | "danger" | "success" | "cobalt" {
  const l = level.toUpperCase();
  if (l === "WARN" || l === "WARNING") return "amber";
  if (l === "ERROR" || l === "DANGER") return "danger";
  if (l === "SUCCESS") return "success";
  return "cobalt";
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
