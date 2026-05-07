import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Inbox,
  Info,
  ShieldAlert,
} from "lucide-react";
import type { components } from "@ajs/api-client/schema";
import { api } from "../lib/api";
import { Button } from "@ajs/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ajs/ui";
import { ScrollArea } from "./ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ajs/ui";

type Notification = components["schemas"]["NotificationResponse"];

/**
 * Bell button + dropdown listing the most recent in-app notifications.
 * Loads on first open (rather than on shell mount) to keep the cold path
 * cheap; the unread-count badge is fetched eagerly so the bell can
 * advertise pending work without waiting for a click.
 */
export function NotificationsBell(): ReactNode {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState<number>(0);

  const loadList = useCallback(async (): Promise<void> => {
    setLoading(true);
    const data = await api<Notification[]>("/api/v1/notifications?limit=15");
    setItems(data ?? []);
    setLoading(false);
  }, []);

  const loadUnread = useCallback(async (): Promise<void> => {
    const data = await api<{ unread: number }>(
      "/api/v1/notifications/unread-count",
    );
    if (data && typeof data.unread === "number") setUnread(data.unread);
  }, []);

  // Eager unread-count fetch; refresh on a slow heartbeat so a user who
  // leaves a tab open still sees recent activity without a manual reload.
  useEffect(() => {
    void loadUnread();
    const t = window.setInterval(loadUnread, 60_000);
    return () => window.clearInterval(t);
  }, [loadUnread]);

  // Lazy list fetch — only when the dropdown opens for the first time
  // (or after a markAllRead, where the list contents change).
  useEffect(() => {
    if (open && items == null) void loadList();
  }, [open, items, loadList]);

  const markAll = async (): Promise<void> => {
    const ok = await api<{ updated: number }>(
      "/api/v1/notifications/read-all",
      { method: "POST" },
    );
    if (ok != null) {
      setUnread(0);
      // Also flip the in-memory list so the UI updates without a refetch.
      setItems((prev) =>
        prev
          ? prev.map((n) =>
              n.readAt ? n : { ...n, readAt: new Date().toISOString() },
            )
          : prev,
      );
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-amber text-[9px] font-semibold text-white grid place-items-center font-mono tnum tabular-nums"
                  aria-label={`${unread} unread`}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <div className="text-[13px] font-semibold text-fg">
              Notifications
            </div>
            <div className="text-[11px] text-muted">
              {unread > 0
                ? `${unread} unread`
                : items == null
                  ? "Loading…"
                  : "All caught up"}
            </div>
          </div>
          {unread > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                void markAll();
              }}
              className="gap-1.5 text-[11.5px]"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <NotificationsList
          items={items}
          loading={loading}
          onItemClick={() => setOpen(false)}
        />
        <div className="border-t border-border px-2 py-2">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block w-full text-center text-[12px] text-cobalt hover:text-cobalt-deep py-1.5 rounded-md hover:bg-bg-tint"
          >
            See all notifications →
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationsList({
  items,
  loading,
  onItemClick,
}: {
  items: Notification[] | null;
  loading: boolean;
  onItemClick: () => void;
}): ReactNode {
  if (loading || items == null) {
    return (
      <div className="px-4 py-8 text-center text-[12px] text-muted">
        Loading notifications…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <Inbox className="size-7 mx-auto text-muted-2 mb-2" />
        <div className="text-[12px] text-muted">No notifications yet.</div>
        <div className="text-[11px] text-muted-2 mt-1">
          We&rsquo;ll let you know when something needs your attention.
        </div>
      </div>
    );
  }
  return (
    <ScrollArea className="max-h-[420px]">
      <ul className="py-1">
        {items.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onClick={onItemClick}
          />
        ))}
      </ul>
    </ScrollArea>
  );
}

function NotificationItem({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}): ReactNode {
  const unread = n.readAt == null;
  const Icon = iconForLevel(n.level ?? "INFO");
  const tone = toneForLevel(n.level ?? "INFO");
  const body = (
    <div className="flex gap-3 px-3 py-2.5">
      <div
        className={`size-7 rounded-md grid place-items-center flex-none ${tone}`}
      >
        <Icon className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-[12.5px] leading-snug truncate ${unread ? "font-semibold text-fg" : "text-fg-2"}`}
          >
            {n.title || "Notification"}
          </span>
          {unread ? (
            <span
              aria-hidden
              className="size-1.5 rounded-full bg-cobalt flex-none mt-1.5"
            />
          ) : null}
        </div>
        {n.body ? (
          <p className="text-[11.5px] text-muted leading-snug mt-0.5 line-clamp-2">
            {n.body}
          </p>
        ) : null}
        <div className="text-[10.5px] text-muted-2 mt-1 font-mono">
          {formatRelative(n.createdAt)}
        </div>
      </div>
    </div>
  );

  if (n.href) {
    return (
      <li>
        <Link
          to={n.href}
          onClick={() => {
            void api(`/api/v1/notifications/${n.id}/read`, { method: "POST" });
            onClick();
          }}
          className={`block hover:bg-bg-tint rounded-md mx-1 ${unread ? "bg-cobalt-soft/40" : ""}`}
        >
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li
      className={`mx-1 rounded-md ${unread ? "bg-cobalt-soft/40" : ""}`}
    >
      {body}
    </li>
  );
}

/* ─── helpers ─── */

function iconForLevel(level: string) {
  switch (level) {
    case "ERROR":
    case "URGENT":
      return ShieldAlert;
    case "WARN":
    case "WARNING":
      return CircleAlert;
    default:
      return Info;
  }
}

function toneForLevel(level: string): string {
  switch (level) {
    case "ERROR":
    case "URGENT":
      return "bg-[#fff5f5] text-[#b91c1c]";
    case "WARN":
    case "WARNING":
      return "bg-amber-soft text-amber-deep";
    default:
      return "bg-cobalt-soft text-cobalt-deep";
  }
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}
