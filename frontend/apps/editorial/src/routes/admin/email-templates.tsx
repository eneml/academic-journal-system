import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { hasAnyRole } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/email-templates")({
  component: EmailTemplatesAdminPage,
});

type Template = components["schemas"]["EmailTemplateResponse"];
type LocaleEntry = components["schemas"]["EmailTemplateLocaleResponse"];
type LocalePut = components["schemas"]["EmailTemplateLocaleUpsertRequest"];

const VARIABLE_HINTS: Record<string, string[]> = {
  "submission.": [
    "{{submission.id}}",
    "{{submission.title}}",
    "{{submission.url}}",
  ],
  "decision.": [
    "{{submission.id}}",
    "{{submission.title}}",
    "{{submission.url}}",
    "{{decision.type}}",
  ],
  "review.": [
    "{{assignment.id}}",
    "{{assignment.url}}",
  ],
};
const COMMON_HINTS = [
  "{{recipient.givenName}}",
  "{{recipient.familyName}}",
  "{{recipient.fullName}}",
  "{{recipient.email}}",
];

function EmailTemplatesAdminPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Template[] | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);

  const reload = async (): Promise<void> => {
    setItems(null);
    const data = await api<Template[]>("/api/v1/email-templates");
    setItems(data ?? []);
  };

  useEffect(() => {
    if (user && hasAnyRole(roles, ["ADMIN"])) {
      void reload();
    }
  }, [user, roles]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Email templates" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="Only ADMIN role holders can edit notification templates."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Email templates"
        description="Manage the subject + body of every notification the system sends. A template with no localised content falls back to a hardcoded message and logs a warning until you fill it in."
      />

      {items === null ? (
        <p style={{ color: "var(--muted)" }}>Loading templates&hellip;</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="mail"
          title="No templates configured"
          description="The bootstrap routine should create canonical rows on startup. Check the backend logs."
        />
      ) : (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 16px" }}>Key</th>
                <th style={{ padding: "10px 16px" }}>Description</th>
                <th style={{ padding: "10px 16px" }}>Locales</th>
                <th style={{ padding: "10px 16px" }}>State</th>
                <th style={{ padding: "10px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.key} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)" }}>
                    {t.key}
                  </td>
                  <td style={{ padding: "10px 16px", color: "var(--muted)" }}>
                    {t.description ?? <em>(no description)</em>}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    {(t.locales ?? []).length === 0 ? (
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    ) : (
                      (t.locales ?? []).map((l) => (
                        <span
                          key={l.locale}
                          style={{
                            display: "inline-block",
                            padding: "1px 7px",
                            marginRight: 4,
                            border: "1px solid var(--border)",
                            borderRadius: 4,
                            fontSize: 12,
                            textTransform: "uppercase",
                          }}
                        >
                          {l.locale}
                        </span>
                      ))
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12 }}>
                    {t.custom ? (
                      <span style={{ color: "var(--cobalt)" }}>customised</span>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>default</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => setEditing(t)}
                      style={{
                        padding: "4px 10px",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <TemplateEditor
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            await reload();
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

interface EditorProps {
  template: Template;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function TemplateEditor({ template, onClose, onSaved }: EditorProps): ReactNode {
  const initialLocales = useMemo<LocaleEntry[]>(
    () => template.locales ?? [],
    [template],
  );
  const [activeLocale, setActiveLocale] = useState<string>(
    initialLocales[0]?.locale ?? "en",
  );
  const [drafts, setDrafts] = useState<Record<string, LocalePut>>(() =>
    Object.fromEntries(
      initialLocales.map((l) => [
        l.locale,
        { subject: l.subject ?? "", body: l.body ?? "" },
      ]),
    ),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ensureLocale = (locale: string): void => {
    if (!drafts[locale]) {
      setDrafts((d) => ({ ...d, [locale]: { subject: "", body: "" } }));
    }
    setActiveLocale(locale);
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const draft = drafts[activeLocale];
    if (!draft || !draft.subject?.trim() || !draft.body?.trim()) {
      setErr("Subject and body are both required.");
      return;
    }
    setBusy(true);
    setErr(null);
    const path = `/api/v1/email-templates/${encodeURIComponent(template.key ?? "")}/locales/${encodeURIComponent(activeLocale)}`;
    const result = await api<Template>(path, { method: "PUT", body: draft });
    setBusy(false);
    if (result === null) {
      setErr("Failed to save. Check console for details.");
      return;
    }
    await onSaved();
  };

  const removeLocale = async (): Promise<void> => {
    if (!confirm(`Delete the ${activeLocale.toUpperCase()} translation?`)) return;
    setBusy(true);
    setErr(null);
    const path = `/api/v1/email-templates/${encodeURIComponent(template.key ?? "")}/locales/${encodeURIComponent(activeLocale)}`;
    await api(path, { method: "DELETE" });
    setBusy(false);
    await onSaved();
  };

  const localeKeys = Array.from(
    new Set([...Object.keys(drafts), "en", "ro"]),
  ).sort();

  const hints = useMemo(() => {
    const prefixHint = Object.entries(VARIABLE_HINTS).find(([prefix]) =>
      (template.key ?? "").startsWith(prefix),
    );
    return [...COMMON_HINTS, ...(prefixHint ? prefixHint[1] : [])];
  }, [template.key]);

  const draft = drafts[activeLocale] ?? { subject: "", body: "" };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          overflowY: "auto",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
            Email template
          </p>
          <h2 style={{ margin: "4px 0 4px 0", fontFamily: "var(--font-mono)" }}>
            {template.key}
          </h2>
          {template.description && (
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{template.description}</p>
          )}
        </header>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {localeKeys.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => ensureLocale(loc)}
              style={{
                padding: "4px 12px",
                border: "1px solid var(--border)",
                borderBottom: activeLocale === loc ? "2px solid var(--cobalt)" : "1px solid var(--border)",
                background: activeLocale === loc ? "var(--bg-soft)" : "transparent",
                fontWeight: drafts[loc] ? 600 : 400,
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              {loc} {drafts[loc] ? "" : "·"}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>
          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Subject
            </span>
            <input
              type="text"
              value={draft.subject ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({
                  ...d,
                  [activeLocale]: { ...draft, subject: e.target.value },
                }))
              }
              maxLength={512}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontFamily: "inherit",
              }}
            />
          </label>

          <label style={{ display: "block", marginBottom: 12 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Body (Mustache; missing variables render as empty)
            </span>
            <textarea
              value={draft.body ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({
                  ...d,
                  [activeLocale]: { ...draft, body: e.target.value },
                }))
              }
              rows={14}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            />
          </label>

          <div
            style={{
              padding: "8px 10px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--bg-soft)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            <strong style={{ display: "block", marginBottom: 4 }}>Available variables</strong>
            <code>{hints.join("  ")}</code>
          </div>

          {err && (
            <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{err}</p>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {initialLocales.some((l) => l.locale === activeLocale) && (
              <button
                type="button"
                onClick={removeLocale}
                disabled={busy}
                style={{
                  padding: "6px 14px",
                  border: "1px solid var(--danger)",
                  borderRadius: 4,
                  background: "transparent",
                  color: "var(--danger)",
                  cursor: "pointer",
                }}
              >
                Delete this locale
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--border)",
                borderRadius: 4,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--cobalt)",
                borderRadius: 4,
                background: "var(--cobalt)",
                color: "white",
                cursor: "pointer",
              }}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
