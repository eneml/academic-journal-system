import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/audit-log")({
  component: AuditLogPage,
});

interface EventLogEntry {
  id: number;
  eventType: string;
  submissionId: number | null;
  actorUserId: number | null;
  payload: Record<string, unknown>;
  occurredAt: string;
}

const REFRESH_MS = 15_000;

function AuditLogPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Audit log" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="The audit log is visible to editors and administrators."
        />
      </>
    );
  }
  return <AuditLogAdmin />;
}

function AuditLogAdmin(): ReactNode {
  const [entries, setEntries] = useState<EventLogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  async function refresh(): Promise<void> {
    const data = await api<EventLogEntry[]>(
      "/api/v1/admin/audit-log?limit=200",
    );
    if (data) {
      setEntries(data);
      setFetchedAt(Date.now());
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => void refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const hay = `${e.eventType} ${e.actorUserId ?? ""} ${e.submissionId ?? ""} ${JSON.stringify(e.payload)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, filter]);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Audit log"
        description={`Immutable system event log · ${entries.length.toLocaleString()} events loaded${fetchedAt ? ` · refreshed ${ago(fetchedAt)}` : ""}`}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void refresh()}
            >
              <RefreshCw />
              Refresh
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event type, user, or submission…"
            className="pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-[12px] text-muted">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="size-4 rounded border-border accent-cobalt"
          />
          Auto-refresh
          <span
            className={cn(
              "size-1.5 rounded-full",
              autoRefresh ? "bg-success animate-pulse" : "bg-muted",
            )}
            aria-hidden
          />
        </label>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="No events match"
            description={
              entries.length === 0
                ? "The journal hasn't recorded any events yet — or the API is returning an empty list."
                : "Adjust the filter to see entries."
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="grid grid-cols-[180px_1fr_140px_120px] items-center gap-3 border-b border-border px-5 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Timestamp</span>
            <span>Event</span>
            <span>Actor</span>
            <span className="text-right">Submission</span>
          </div>
          {filtered.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[180px_1fr_140px_120px] items-start gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <span className="font-mono text-[11.5px] text-muted">
                {formatStamp(e.occurredAt)}
              </span>
              <div className="min-w-0">
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em]",
                    toneFor(e.eventType),
                  )}
                >
                  {e.eventType}
                </span>
                {summarizePayload(e.payload) ? (
                  <p className="mt-1 truncate font-sans text-[12.5px] text-fg-2">
                    {summarizePayload(e.payload)}
                  </p>
                ) : null}
              </div>
              <span className="font-mono text-[11px] text-muted">
                {e.actorUserId == null ? "system" : `#${e.actorUserId}`}
              </span>
              <span className="text-right font-mono text-[11px] text-muted">
                {e.submissionId == null ? "—" : `#${e.submissionId}`}
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function ago(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  return `${Math.round(s / 3600)}h ago`;
}

function summarizePayload(payload: Record<string, unknown>): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidates = [
    "summary",
    "detail",
    "message",
    "decision",
    "decisionType",
    "title",
    "doi",
    "recipient",
    "fileName",
  ];
  for (const k of candidates) {
    const v = payload[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function toneFor(eventType: string): string {
  const t = eventType.toUpperCase();
  if (t.includes("FAIL") || t.includes("ERROR") || t.includes("REJECT")) {
    return "bg-danger-soft text-danger-deep";
  }
  if (t.includes("DECISION") || t.includes("ACCEPT") || t.includes("PUBLISH")) {
    return "bg-success-soft text-success-deep";
  }
  if (t.includes("INVITE") || t.includes("WARN") || t.includes("REMIND")) {
    return "bg-amber-soft text-amber-deep";
  }
  return "bg-cobalt-soft text-cobalt-deep";
}
