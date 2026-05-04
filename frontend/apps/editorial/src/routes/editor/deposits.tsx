import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { hasAnyRole } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/editor/deposits")({
  component: DepositsPage,
  validateSearch: (raw): { publicationId?: number } => {
    const candidate = (raw as Record<string, unknown>).publicationId;
    if (candidate == null || candidate === "") return {};
    const parsed = Number(candidate);
    if (!Number.isFinite(parsed) || parsed <= 0) return {};
    return { publicationId: Math.trunc(parsed) };
  },
});

type DepositTarget = "CROSSREF" | "ORCID";
type DepositStatus = "PENDING" | "SENT" | "ACCEPTED" | "FAILED" | "SKIPPED";

interface DepositSummary {
  id: number;
  target: DepositTarget;
  subjectType: "PUBLICATION" | "GALLEY" | "ISSUE";
  subjectId: number;
  externalRef: string | null;
  status: DepositStatus;
  attempts: number;
  lastAttemptAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
}

function DepositsPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const search = useSearch({ from: "/editor/deposits" });
  const [pubIdInput, setPubIdInput] = useState<string>(
    search.publicationId ? String(search.publicationId) : "",
  );
  const [activeId, setActiveId] = useState<number | null>(search.publicationId ?? null);
  const [items, setItems] = useState<DepositSummary[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async (publicationId: number): Promise<void> => {
    setItems(null);
    const data = await api<DepositSummary[]>(
      `/api/v1/integration/publications/${publicationId}/deposits`,
    );
    setItems(data ?? []);
  };

  useEffect(() => {
    if (activeId && user) void load(activeId);
  }, [activeId, user]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["EDITOR", "ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="Deposit history" />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="Only EDITOR or ADMIN role holders can inspect deposits."
        />
      </>
    );
  }

  const enqueue = async (target: DepositTarget): Promise<void> => {
    if (!activeId) return;
    setBusy(true);
    await api<DepositSummary>(
      `/api/v1/integration/publications/${activeId}/deposits/${target}`,
      { method: "POST" },
    );
    await load(activeId);
    setBusy(false);
  };

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Deposit history"
        description="Track CrossRef DOI deposits and ORCID work pushes for a published publication."
      />

      <Card style={{ marginBottom: 16 }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = Number.parseInt(pubIdInput, 10);
            if (Number.isFinite(parsed)) setActiveId(parsed);
          }}
          style={{ display: "flex", gap: 8, alignItems: "center" }}
        >
          <label
            htmlFor="pub-id"
            style={{
              fontSize: 12,
              fontFamily: "var(--sans)",
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            Publication id
          </label>
          <input
            id="pub-id"
            type="number"
            min="1"
            value={pubIdInput}
            onChange={(e) => setPubIdInput(e.target.value)}
            style={{
              padding: "8px 11px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-2)",
              fontFamily: "var(--mono)",
              fontSize: 13,
              width: 120,
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              background: "var(--cobalt)",
              color: "white",
              border: "none",
              borderRadius: "var(--r-2)",
              fontFamily: "var(--sans)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Load
          </button>
          {activeId ? (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button
                type="button"
                disabled={busy}
                onClick={() => enqueue("CROSSREF")}
                style={btnSecondary}
              >
                Enqueue CrossRef
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => enqueue("ORCID")}
                style={btnSecondary}
              >
                Enqueue ORCID
              </button>
            </div>
          ) : null}
        </form>
      </Card>

      {!activeId ? (
        <EmptyState
          icon="badgeCheck"
          title="Pick a publication"
          description="Enter a publication id above to see its outbound CrossRef / ORCID deposit history."
        />
      ) : items === null ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading deposits&hellip;</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="badgeCheck"
          title="No deposits yet"
          description="No CrossRef or ORCID deposits have been queued for this publication. Enqueue one above."
        />
      ) : (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((d, idx) => (
              <li
                key={d.id}
                style={{
                  padding: "14px 22px",
                  borderBottom:
                    idx < items.length - 1 ? "1px solid var(--border)" : "none",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                }}
              >
                <span
                  className="marginalia-num tnum"
                  style={{ width: 32, marginTop: 4, flex: "none" }}
                >
                  #{d.id}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "baseline",
                      flexWrap: "wrap",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontWeight: 600,
                        fontSize: 15,
                        margin: 0,
                      }}
                    >
                      {d.target}
                    </p>
                    <StatusChip status={d.status} />
                    {d.attempts > 0 ? (
                      <span className="chip" style={{ fontSize: 10 }}>
                        attempt #{d.attempts}
                      </span>
                    ) : null}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 8,
                      flexWrap: "wrap",
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      color: "var(--muted)",
                    }}
                  >
                    {d.lastAttemptAt ? (
                      <span>last attempt {new Date(d.lastAttemptAt).toLocaleString()}</span>
                    ) : null}
                    {d.completedAt ? (
                      <span>completed {new Date(d.completedAt).toLocaleString()}</span>
                    ) : null}
                    {d.externalRef ? (
                      <span style={{ color: "var(--fg-2)" }}>
                        ref: <code>{d.externalRef}</code>
                      </span>
                    ) : null}
                  </div>
                  {d.errorMessage ? (
                    <p
                      style={{
                        marginTop: 8,
                        padding: "8px 10px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-1)",
                        fontFamily: "var(--mono)",
                        fontSize: 12,
                        color: "var(--fg-2)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {d.errorMessage}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

const btnSecondary = {
  padding: "8px 14px",
  background: "white",
  color: "var(--fg-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 12,
  cursor: "pointer",
};
