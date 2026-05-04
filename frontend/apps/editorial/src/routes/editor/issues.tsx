import { createFileRoute } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/editor/issues")({
  component: IssuesAdminPage,
});

type IssueResponse = components["schemas"]["IssueResponse"];

function IssuesAdminPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [issues, setIssues] = useState<IssueResponse[] | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const list = await api<IssueResponse[]>("/api/v1/issues");
    setIssues(list ?? []);
  }, []);

  useEffect(() => {
    if (user && isEditorial(roles)) void reload();
  }, [user, roles, reload]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="Issues" />
        <EmptyState icon="alert" title="Editor access required" description="" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Issues"
        description="Volumes and numbers grouping published articles. Create one ahead of publication; publish when articles are ready."
      />

      <div style={{ marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          style={btnPrimary}
        >
          {creating ? "Cancel" : "+ New issue"}
        </button>
      </div>

      {creating ? (
        <IssueForm
          initial={null}
          onSaved={() => {
            setCreating(false);
            void reload();
          }}
          onCancel={() => setCreating(false)}
        />
      ) : null}

      {issues == null ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading issues&hellip;</p>
      ) : issues.length === 0 ? (
        <EmptyState
          icon="layers"
          title="No issues yet"
          description="Create your first volume + number above. Articles get assigned to issues from the publication editor."
        />
      ) : (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {issues
              .slice()
              .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
              .map((i, idx) => (
                <IssueRow
                  key={i.id}
                  issue={i}
                  divider={idx < issues.length - 1}
                  onChanged={() => void reload()}
                />
              ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function IssueRow({
  issue,
  divider,
  onChanged,
}: {
  issue: IssueResponse;
  divider: boolean;
  onChanged: () => void;
}): ReactNode {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  if (editing) {
    return (
      <li style={{ borderBottom: divider ? "1px solid var(--border)" : "none" }}>
        <div style={{ padding: "12px 22px" }}>
          <IssueForm
            initial={issue}
            onSaved={() => {
              setEditing(false);
              onChanged();
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </li>
    );
  }

  const publish = async (): Promise<void> => {
    if (!confirm(`Publish "${labelOf(issue)}"? Assigned articles become public.`)) return;
    setBusy(true);
    await api(`/api/v1/issues/${issue.id}/publish`, { method: "POST" });
    setBusy(false);
    onChanged();
  };

  const unpublish = async (): Promise<void> => {
    if (!confirm("Unpublish — readers lose access. Continue?")) return;
    setBusy(true);
    await api(`/api/v1/issues/${issue.id}/unpublish`, { method: "POST" });
    setBusy(false);
    onChanged();
  };

  const remove = async (): Promise<void> => {
    if (issue.published) {
      alert("Unpublish before deleting.");
      return;
    }
    if (!confirm(`Delete "${labelOf(issue)}"? Cannot be undone.`)) return;
    setBusy(true);
    await api(`/api/v1/issues/${issue.id}`, { method: "DELETE" });
    setBusy(false);
    onChanged();
  };

  return (
    <li
      style={{
        padding: "14px 22px",
        borderBottom: divider ? "1px solid var(--border)" : "none",
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: 16,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {labelOf(issue)}
        </p>
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {issue.published ? (
            <span className="chip chip-cobalt">published</span>
          ) : (
            <span className="chip">draft</span>
          )}
          <StatusChip status={issue.accessStatus} />
          {issue.datePublished ? (
            <span
              style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}
            >
              {new Date(issue.datePublished).toLocaleDateString()}
            </span>
          ) : null}
          {issue.urlPath ? (
            <a
              href={`${import.meta.env.VITE_PUBLIC_SITE_URL ?? "http://localhost:3000"}/issues/${encodeURIComponent(issue.urlPath)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 11,
                color: "var(--cobalt)",
                fontFamily: "var(--mono)",
                textDecoration: "none",
              }}
            >
              /issues/{issue.urlPath} ↗
            </a>
          ) : null}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flex: "none" }}>
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={busy}
          style={btnSecondary}
        >
          Edit
        </button>
        {issue.published ? (
          <button type="button" onClick={unpublish} disabled={busy} style={btnSecondary}>
            Unpublish
          </button>
        ) : (
          <button
            type="button"
            onClick={publish}
            disabled={busy}
            style={{ ...btnSecondary, color: "var(--cobalt)" }}
          >
            Publish
          </button>
        )}
        <button
          type="button"
          onClick={remove}
          disabled={busy || issue.published}
          style={{
            ...btnSecondary,
            color: "#b91c1c",
            borderColor: "#fca5a5",
            opacity: issue.published ? 0.4 : 1,
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function IssueForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: IssueResponse | null;
  onSaved: () => void;
  onCancel: () => void;
}): ReactNode {
  const [volume, setVolume] = useState(initial?.volume ? String(initial.volume) : "");
  const [number, setNumber] = useState(initial?.number ?? "");
  const [year, setYear] = useState(
    initial?.year ? String(initial.year) : String(new Date().getFullYear()),
  );
  const [title, setTitle] = useState(initial?.title?.en ?? "");
  const [description, setDescription] = useState(initial?.description?.en ?? "");
  const [urlPath, setUrlPath] = useState(initial?.urlPath ?? "");
  const [accessStatus, setAccessStatus] = useState<"OPEN" | "RESTRICTED">(
    (initial?.accessStatus as "OPEN" | "RESTRICTED") ?? "OPEN",
  );
  const [showVolume, setShowVolume] = useState(initial?.showVolume ?? true);
  const [showNumber, setShowNumber] = useState(initial?.showNumber ?? true);
  const [showYear, setShowYear] = useState(initial?.showYear ?? true);
  const [showTitle, setShowTitle] = useState(initial?.showTitle ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api<IssueResponse>(
      initial ? `/api/v1/issues/${initial.id}` : "/api/v1/issues",
      {
        method: initial ? "PUT" : "POST",
        body: {
          volume: volume ? Number.parseInt(volume, 10) : null,
          number: number || null,
          year: year ? Number.parseInt(year, 10) : null,
          title: title ? { en: title } : {},
          description: description ? { en: description } : {},
          urlPath: urlPath.trim() || null,
          coverImagePath: null,
          showVolume,
          showNumber,
          showYear,
          showTitle,
          accessStatus,
        },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Save failed. The url-path may already be taken.");
    } else {
      onSaved();
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>{initial ? `Edit issue #${initial.id}` : "New issue"}</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            Volume
            <input
              type="number"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            Number
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={lblStyle}>
          Title (optional, e.g. "Special issue: Phenomenology")
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={lblStyle}>
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "var(--serif-body)",
              fontSize: 14,
            }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={lblStyle}>
            URL slug
            <input
              value={urlPath}
              onChange={(e) => setUrlPath(e.target.value)}
              placeholder="2026-spring"
              style={inputStyle}
            />
          </label>
          <label style={lblStyle}>
            Access
            <select
              value={accessStatus}
              onChange={(e) =>
                setAccessStatus(e.target.value as "OPEN" | "RESTRICTED")
              }
              style={inputStyle}
            >
              <option value="OPEN">Open access</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </label>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: 6,
            fontSize: 12,
          }}
        >
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showVolume}
              onChange={(e) => setShowVolume(e.target.checked)}
            />
            Show volume
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showNumber}
              onChange={(e) => setShowNumber(e.target.checked)}
            />
            Show number
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showYear}
              onChange={(e) => setShowYear(e.target.checked)}
            />
            Show year
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
            />
            Show title
          </label>
        </div>
        {error ? (
          <p
            style={{
              margin: 0,
              padding: "10px 12px",
              border: "1px solid #fca5a5",
              background: "#fff5f5",
              color: "#b91c1c",
              borderRadius: "var(--r-2)",
              fontSize: 13,
            }}
          >
            {error}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Saving…" : initial ? "Save" : "Create issue"}
          </button>
          <button type="button" onClick={onCancel} style={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function labelOf(i: IssueResponse): string {
  if (i.title?.en) return i.title.en;
  const parts = [
    i.volume ? `Vol. ${i.volume}` : null,
    i.number ? `No. ${i.number}` : null,
    i.year ? `(${i.year})` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `Issue #${i.id}`;
}

const h2Style = {
  margin: "0 0 12px",
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 18,
};

const lblStyle = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontFamily: "var(--sans)",
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const inputStyle = {
  padding: "9px 11px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 14,
  background: "white",
  color: "var(--fg)",
  textTransform: "none" as const,
  letterSpacing: 0,
  fontWeight: 400,
};

const btnPrimary = {
  padding: "9px 16px",
  background: "var(--cobalt)",
  color: "white",
  border: "none",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

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
