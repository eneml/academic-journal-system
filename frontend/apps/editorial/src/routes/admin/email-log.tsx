import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { api, type Page } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/email-log")({
  component: EmailLogPage,
});

interface EmailLogEntry {
  id: number;
  templateKey: string | null;
  recipient: string;
  subject: string;
  status: "SENT" | "FAILED" | "SKIPPED";
  errorMessage: string | null;
  userId: number | null;
  notificationId: number | null;
  sentAt: string;
}

const PAGE_SIZE = 50;

function EmailLogPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!hasRole(roles, "ADMIN")) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Email log" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="The email log is restricted to ADMIN role holders."
        />
      </>
    );
  }
  return <EmailLogAdmin />;
}

function EmailLogAdmin(): ReactNode {
  const [entries, setEntries] = useState<EmailLogEntry[]>([]);
  const [recipientFilter, setRecipientFilter] = useState("");
  const [templateFilter, setTemplateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh(): Promise<void> {
    setBusy(true);
    const params = new URLSearchParams();
    params.set("size", String(PAGE_SIZE));
    if (recipientFilter.trim()) params.set("recipient", recipientFilter.trim());
    if (templateFilter.trim()) params.set("templateKey", templateFilter.trim());
    if (statusFilter) params.set("status", statusFilter);
    const data = await api<Page<EmailLogEntry>>(`/api/v1/email-log?${params.toString()}`);
    setBusy(false);
    if (data) {
      setEntries(data.content ?? []);
      setFetchedAt(Date.now());
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  // Local in-memory filter on top of server-side filtering — lets the user
  // narrow further by subject without firing another request.
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => {
      const hay = `${e.subject} ${e.recipient} ${e.templateKey ?? ""} ${e.errorMessage ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, searchQuery]);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Email log"
        description={`${entries.length.toLocaleString()} most recent attempts${
          fetchedAt ? ` · refreshed ${ago(fetchedAt)}` : ""
        }`}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void refresh()}
            disabled={busy}
          >
            <RefreshCw />
            {busy ? "Loading…" : "Refresh"}
          </Button>
        }
      />

      <Card padded={false} className="mb-4">
        <div className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_180px_auto]">
          <Input
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            placeholder="Recipient (exact match)…"
          />
          <Input
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            placeholder="Template key (e.g. review.request)…"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          >
            <option value="">Any status</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="SKIPPED">Skipped</option>
          </select>
          <Button type="button" onClick={() => void refresh()} disabled={busy}>
            Apply
          </Button>
        </div>
      </Card>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 min-w-[260px]">
          <Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick filter (subject, error message)…"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="No email attempts match"
            description={
              entries.length === 0
                ? "The journal hasn't sent any emails yet — or the filters returned nothing."
                : "Loosen the filter to see entries."
            }
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="grid grid-cols-[170px_120px_1fr_220px_140px] items-center gap-3 border-b border-border px-5 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>Sent</span>
            <span>Status</span>
            <span>Subject</span>
            <span>Recipient</span>
            <span>Template</span>
          </div>
          {filtered.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[170px_120px_1fr_220px_140px] items-start gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <span className="font-mono text-[11.5px] text-muted">
                {formatStamp(e.sentAt)}
              </span>
              <span className={cn("inline-flex items-center", "")}>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em]",
                    e.status === "SENT" && "bg-success-soft text-success-deep",
                    e.status === "FAILED" && "bg-danger-soft text-danger-deep",
                    e.status === "SKIPPED" && "bg-bg-tint text-muted",
                  )}
                >
                  {e.status}
                </span>
              </span>
              <div className="min-w-0">
                <p className="m-0 truncate font-sans text-[13px] text-fg">
                  {e.subject}
                </p>
                {e.errorMessage ? (
                  <p
                    className="m-0 mt-0.5 truncate font-mono text-[11px] text-danger"
                    title={e.errorMessage}
                  >
                    {e.errorMessage}
                  </p>
                ) : null}
              </div>
              <span className="truncate font-mono text-[11.5px] text-fg-2">
                {e.recipient}
              </span>
              <span className="truncate font-mono text-[11px] text-muted">
                {e.templateKey ?? "—"}
              </span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function formatStamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function ago(t: number): string {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}
