import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAuth } from "../../auth/AuthContext";
import { hasAnyRole } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/admin/announcements")({
  component: AnnouncementsAdminPage,
});

type AnnouncementType = "GENERAL" | "CALL_FOR_PAPERS" | "SPECIAL_ISSUE" | "POLICY";

interface Announcement {
  id: number;
  type: AnnouncementType;
  title: Record<string, string>;
  body: Record<string, string>;
  urlPath: string | null;
  datePosted: string;
  dateExpires: string | null;
  pinned: boolean;
  visible: boolean;
  updatedAt: string;
}

const TYPE_OPTIONS: AnnouncementType[] = [
  "GENERAL",
  "CALL_FOR_PAPERS",
  "SPECIAL_ISSUE",
  "POLICY",
];

function AnnouncementsAdminPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async (): Promise<void> => {
    setItems(null);
    const data = await api<Announcement[]>("/api/v1/announcements/all");
    setItems(data ?? []);
  };

  useEffect(() => {
    if (user && hasAnyRole(roles, ["EDITOR", "ADMIN"])) {
      void reload();
    }
  }, [user, roles]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["EDITOR", "ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Announcements" />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="Only EDITOR or ADMIN role holders can post announcements."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Announcements"
        description="Calls for papers, journal news, special-issue invitations. Visible items appear on the public site."
      />

      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          style={{
            padding: "8px 16px",
            background: "var(--cobalt)",
            color: "white",
            border: "none",
            borderRadius: "var(--r-2)",
            fontFamily: "var(--sans)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          New announcement
        </button>
      </div>

      {showForm ? (
        <AnnouncementForm
          initial={editing}
          busy={busy}
          onSave={async (payload) => {
            setBusy(true);
            const path = editing
              ? `/api/v1/announcements/${editing.id}`
              : "/api/v1/announcements";
            const method = editing ? "PUT" : "POST";
            const result = await api<Announcement>(path, {
              method,
              body: payload,
            });
            setBusy(false);
            if (result) {
              setShowForm(false);
              setEditing(null);
              await reload();
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      ) : null}

      {items === null ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading announcements&hellip;</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="badgeCheck"
          title="No announcements yet"
          description="Post a call for papers or share journal news with readers."
        />
      ) : (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((a, idx) => (
              <li
                key={a.id}
                style={{
                  padding: "14px 22px",
                  borderBottom: idx < items.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontWeight: 600,
                        fontSize: 16,
                        margin: 0,
                      }}
                    >
                      {a.title.en ?? Object.values(a.title)[0] ?? `#${a.id}`}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                      <StatusChip status={a.type} />
                      {a.pinned ? <span className="chip chip-cobalt">pinned</span> : null}
                      {!a.visible ? <span className="chip">hidden</span> : null}
                      <span
                        className="tnum"
                        style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}
                      >
                        posted {new Date(a.datePosted).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flex: "none" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(a);
                        setShowForm(true);
                      }}
                      style={btnSecondary}
                    >
                      Edit
                    </button>
                    {a.visible ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await api(`/api/v1/announcements/${a.id}/withdraw`, { method: "POST" });
                          await reload();
                        }}
                        style={btnSecondary}
                      >
                        Withdraw
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Delete announcement #${a.id}? This is permanent.`)) return;
                        await api(`/api/v1/announcements/${a.id}`, { method: "DELETE" });
                        await reload();
                      }}
                      style={{ ...btnSecondary, color: "#b91c1c", borderColor: "#fca5a5" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function AnnouncementForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: Announcement | null;
  busy: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}): ReactNode {
  const [type, setType] = useState<AnnouncementType>(initial?.type ?? "GENERAL");
  const [title, setTitle] = useState(initial?.title.en ?? "");
  const [body, setBody] = useState(initial?.body.en ?? "");
  const [urlPath, setUrlPath] = useState(initial?.urlPath ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [dateExpires, setDateExpires] = useState(
    initial?.dateExpires ? initial.dateExpires.slice(0, 10) : "",
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    await onSave({
      type,
      title: { en: title.trim() },
      body: { en: body.trim() },
      urlPath: urlPath.trim() || null,
      pinned,
      visible,
      dateExpires: dateExpires ? new Date(dateExpires + "T23:59:59Z").toISOString() : null,
    });
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--serif-display)",
            fontSize: 18,
          }}
        >
          {initial ? `Edit announcement #${initial.id}` : "New announcement"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={lblStyle}>
            Type
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AnnouncementType)}
              style={inputStyle}
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </label>
          <label style={lblStyle}>
            Closes (optional)
            <input
              type="date"
              value={dateExpires}
              onChange={(e) => setDateExpires(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={lblStyle}>
          Title
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="Call for papers: special issue on..."
          />
        </label>
        <label style={lblStyle}>
          Body
          <textarea
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--serif-body)", fontSize: 15 }}
          />
        </label>
        <label style={lblStyle}>
          URL slug (optional, lowercase a-z 0-9 -)
          <input
            type="text"
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            style={inputStyle}
            placeholder="cfp-2026"
          />
        </label>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
            />
            Visible on public site
          </label>
          <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            Pin to top
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Saving…" : initial ? "Save changes" : "Post"}
          </button>
          <button type="button" onClick={onCancel} style={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

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
  padding: "9px 18px",
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
