import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/dois")({
  component: DoisAdminPage,
});

type DoiStatus = "NOT_REGISTERED" | "SUBMITTED" | "REGISTERED" | "ERROR" | "STALE";

interface DoiRow {
  id: number;
  doi: string;
  status: DoiStatus;
  registeredAt: string | null;
  errorMessage: string | null;
  updatedAt: string;
}

function DoisAdminPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="DOI manager" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="The DOI manager is restricted to editors and administrators."
        />
      </>
    );
  }
  return <DoisAdmin />;
}

function DoisAdmin(): ReactNode {
  const [rows, setRows] = useState<DoiRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"" | DoiStatus>("");
  const [busy, setBusy] = useState(false);

  const reload = async (): Promise<void> => {
    setBusy(true);
    const url = statusFilter
      ? `/api/v1/admin/dois?status=${statusFilter}`
      : "/api/v1/admin/dois";
    const data = await api<DoiRow[]>(url);
    setBusy(false);
    setRows(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, [statusFilter]);

  const redeposit = async (id: number): Promise<void> => {
    const result = await api<DoiRow>(`/api/v1/admin/dois/${id}/redeposit`, {
      method: "POST",
    });
    if (result) {
      toast.success("DOI flagged for re-deposit on the next dispatch.");
      void reload();
    } else {
      toast.error("Couldn't queue the re-deposit.");
    }
  };

  const markStale = async (id: number): Promise<void> => {
    const result = await api<DoiRow>(`/api/v1/admin/dois/${id}/mark-stale`, {
      method: "POST",
    });
    if (result) {
      toast.success("Marked STALE.");
      void reload();
    } else {
      toast.error("Couldn't mark stale.");
    }
  };

  const counts = (rows ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="DOI manager"
        description={
          rows == null
            ? "Loading…"
            : `${rows.length} DOIs — ${counts.STALE ?? 0} stale, ${counts.ERROR ?? 0} errored, ${counts.REGISTERED ?? 0} registered, ${counts.NOT_REGISTERED ?? 0} not yet registered`
        }
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void reload()}
            disabled={busy}
          >
            <RefreshCw />
            {busy ? "Loading…" : "Refresh"}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["", "All"],
            ["STALE", "Stale"],
            ["ERROR", "Errored"],
            ["REGISTERED", "Registered"],
            ["SUBMITTED", "Submitted"],
            ["NOT_REGISTERED", "Not registered"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value as DoiStatus | "")}
            className={cn(
              "rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider",
              statusFilter === value
                ? "border-cobalt bg-cobalt-soft text-cobalt-deep"
                : "border-border bg-white text-fg-2 hover:bg-bg-tint",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {rows == null ? (
        <p className="text-muted">Loading DOIs…</p>
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="No DOIs match"
            description="The journal hasn't minted any DOIs in this status."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <div className="grid grid-cols-[1fr_140px_160px_220px] items-center gap-3 border-b border-border px-5 py-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            <span>DOI</span>
            <span>Status</span>
            <span>Registered</span>
            <span className="text-right">Actions</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_140px_160px_220px] items-start gap-3 border-b border-border px-5 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="m-0 truncate font-mono text-[12.5px] text-fg">
                  {r.doi}
                </p>
                {r.errorMessage ? (
                  <p
                    className="m-0 mt-0.5 truncate font-mono text-[11px] text-danger"
                    title={r.errorMessage}
                  >
                    <AlertTriangle className="inline size-3 mr-1" />
                    {r.errorMessage}
                  </p>
                ) : null}
              </div>
              <span
                className={cn(
                  "inline-flex items-center self-start rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.04em]",
                  toneFor(r.status),
                )}
              >
                {r.status}
              </span>
              <span className="font-mono text-[11px] text-muted">
                {r.registeredAt
                  ? new Date(r.registeredAt).toLocaleDateString()
                  : "—"}
              </span>
              <div className="flex justify-end gap-2">
                {r.status !== "NOT_REGISTERED" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void redeposit(r.id)}
                  >
                    Re-deposit
                  </Button>
                ) : null}
                {r.status === "REGISTERED" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void markStale(r.id)}
                  >
                    Mark stale
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

function toneFor(status: DoiStatus): string {
  switch (status) {
    case "REGISTERED":
      return "bg-success-soft text-success-deep";
    case "STALE":
      return "bg-amber-soft text-amber-deep";
    case "ERROR":
      return "bg-danger-soft text-danger-deep";
    case "SUBMITTED":
      return "bg-cobalt-soft text-cobalt-deep";
    default:
      return "bg-bg-tint text-muted";
  }
}
