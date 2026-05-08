import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
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

export const Route = createFileRoute("/admin/review-forms/$id")({
  component: ReviewFormBuilderPage,
});

type Form = components["schemas"]["ReviewFormResponse"];
type Element = components["schemas"]["ReviewFormElementResponse"];
type ElementType = NonNullable<Element["elementType"]>;

const ELEMENT_TYPES: ElementType[] = [
  "SMALL_TEXT",
  "TEXT",
  "TEXTAREA",
  "RADIO",
  "CHECKBOXES",
  "DROPDOWN",
];

function isChoice(t?: ElementType | null): boolean {
  return t === "RADIO" || t === "CHECKBOXES" || t === "DROPDOWN";
}

function ReviewFormBuilderPage(): ReactNode {
  const { id } = useParams({ from: "/admin/review-forms/$id" });
  const { user, roles, loading: authLoading } = useAuth();
  const formId = Number.parseInt(id, 10);
  const [form, setForm] = useState<Form | null>(null);
  const [editing, setEditing] = useState<Element | "NEW" | null>(null);

  const reload = async (): Promise<void> => {
    setForm(null);
    const data = await api<Form>(`/api/v1/review-forms/${formId}`);
    setForm(data);
  };

  useEffect(() => {
    if (user && hasAnyRole(roles, ["ADMIN"]) && Number.isFinite(formId)) {
      void reload();
    }
  }, [user, roles, formId]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Review form" />
        <EmptyState icon="alert" title="Admin access required" description="" />
      </>
    );
  }
  if (!form) {
    return <p style={{ color: "var(--muted)" }}>Loading form&hellip;</p>;
  }

  const elements = form.elements ?? [];
  const headerTitle =
    Object.values(form.title ?? {}).find((v) => v && v.trim()) ??
    `Form #${form.id}`;

  const removeElement = async (elementId?: number): Promise<void> => {
    if (elementId == null) return;
    if (!window.confirm("Delete this element?")) return;
    await api(`/api/v1/review-forms/${formId}/elements/${elementId}`, { method: "DELETE" });
    await reload();
  };

  const reorder = async (orderedIds: number[]): Promise<void> => {
    await api(`/api/v1/review-forms/${formId}/elements/reorder`, {
      method: "POST",
      body: { orderedElementIds: orderedIds },
    });
    await reload();
  };

  const moveElement = async (idx: number, dir: -1 | 1): Promise<void> => {
    const next = idx + dir;
    if (next < 0 || next >= elements.length) return;
    const ids = elements.map((e) => e.id).filter((v): v is number => v != null);
    [ids[idx], ids[next]] = [ids[next]!, ids[idx]!];
    await reorder(ids);
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link to="/admin/review-forms" style={{ color: "inherit", textDecoration: "none" }}>
            ← Review forms
          </Link>
        }
        title={headerTitle}
        description={`code: ${form.code} · ${form.active ? "active" : "inactive"} · ${elements.length} element${elements.length === 1 ? "" : "s"}`}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setEditing("NEW")}
          style={{
            padding: "6px 12px",
            border: "1px solid var(--cobalt)",
            background: "var(--cobalt)",
            color: "white",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          + Add element
        </button>
      </div>

      {elements.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No elements yet"
          description="Add a question above. Reviewers see only included elements when filling out the form."
        />
      ) : (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 16px", width: 60 }}>Seq</th>
                <th style={{ padding: "10px 16px" }}>Question</th>
                <th style={{ padding: "10px 16px" }}>Type</th>
                <th style={{ padding: "10px 16px" }}>Flags</th>
                <th style={{ padding: "10px 16px", textAlign: "right" }} />
              </tr>
            </thead>
            <tbody>
              {elements.map((el, idx) => {
                const q = pickFirst(el.question);
                return (
                  <tr key={el.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)" }}>
                      <button
                        type="button"
                        onClick={() => void moveElement(idx, -1)}
                        disabled={idx === 0}
                        style={{ background: "transparent", border: "none", cursor: idx === 0 ? "default" : "pointer", color: "var(--muted)", padding: 0, marginRight: 4 }}
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => void moveElement(idx, 1)}
                        disabled={idx === elements.length - 1}
                        style={{ background: "transparent", border: "none", cursor: idx === elements.length - 1 ? "default" : "pointer", color: "var(--muted)", padding: 0 }}
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {q || <em style={{ color: "var(--muted)" }}>(no question)</em>}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontFamily: "var(--font-mono)" }}>
                      {el.elementType}
                    </td>
                    <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--muted)" }}>
                      {el.included ? "incl. " : "hidden "}
                      {el.required ? "· required" : ""}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setEditing(el)}
                        style={{
                          padding: "4px 10px",
                          marginRight: 6,
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          background: "transparent",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeElement(el.id)}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          background: "transparent",
                          color: "var(--danger)",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <ElementEditor
          formId={formId}
          existing={editing === "NEW" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

interface EditorProps {
  formId: number;
  existing: Element | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function ElementEditor({ formId, existing, onClose, onSaved }: EditorProps): ReactNode {
  const [type, setType] = useState<ElementType>(existing?.elementType ?? "TEXTAREA");
  const [included, setIncluded] = useState<boolean>(existing?.included ?? true);
  const [required, setRequired] = useState<boolean>(existing?.required ?? false);
  const [questionEn, setQuestionEn] = useState<string>(existing?.question?.en ?? "");
  const [descriptionEn, setDescriptionEn] = useState<string>(existing?.description?.en ?? "");
  const initialOptions = useMemo<{ value: string; labelEn: string }[]>(() => {
    const list = existing?.possibleResponses ?? [];
    return list.map((opt) => ({
      value: String(opt.value ?? ""),
      labelEn:
        typeof opt.label === "object" && opt.label
          ? String((opt.label as Record<string, string>).en ?? "")
          : String(opt.label ?? ""),
    }));
  }, [existing]);
  const [options, setOptions] = useState(initialOptions);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const updateOption = (idx: number, patch: Partial<{ value: string; labelEn: string }>): void => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };
  const addOption = (): void => setOptions((prev) => [...prev, { value: "", labelEn: "" }]);
  const removeOption = (idx: number): void => setOptions((prev) => prev.filter((_, i) => i !== idx));

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    if (!questionEn.trim()) {
      setErr("Question is required.");
      return;
    }
    if (isChoice(type) && options.length === 0) {
      setErr("Choice elements need at least one option.");
      return;
    }
    if (isChoice(type) && options.some((o) => !o.value.trim())) {
      setErr("Each option needs a non-blank value.");
      return;
    }
    setBusy(true);
    const body = {
      elementType: type,
      included,
      required,
      question: { en: questionEn.trim() },
      description: descriptionEn.trim() ? { en: descriptionEn.trim() } : {},
      possibleResponses: isChoice(type)
        ? options.map((o) => ({
            value: o.value.trim(),
            label: { en: o.labelEn.trim() || o.value.trim() },
          }))
        : [],
    };
    const url = existing
      ? `/api/v1/review-forms/${formId}/elements/${existing.id}`
      : `/api/v1/review-forms/${formId}/elements`;
    const result = await api(url, { method: existing ? "PUT" : "POST", body });
    setBusy(false);
    if (result == null) {
      setErr("Save failed.");
      return;
    }
    await onSaved();
  };

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
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0 }}>{existing ? "Edit element" : "New element"}</h2>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Type</span>
          <select
            value={type}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setType(e.target.value as ElementType)
            }
            style={{ display: "block", marginTop: 4, padding: 8, border: "1px solid var(--border)", borderRadius: 4 }}
          >
            {ELEMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Question (EN)</span>
          <textarea
            value={questionEn}
            onChange={(e) => setQuestionEn(e.target.value)}
            rows={3}
            style={{ display: "block", marginTop: 4, width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Helper text / description (EN)</span>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={2}
            style={{ display: "block", marginTop: 4, width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>

        <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13 }}>
          <label>
            <input type="checkbox" checked={included} onChange={(e) => setIncluded(e.target.checked)} />
            <span style={{ marginLeft: 6 }}>Included (visible to reviewers)</span>
          </label>
          <label>
            <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
            <span style={{ marginLeft: 6 }}>Required</span>
          </label>
        </div>

        {isChoice(type) && (
          <div
            style={{
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "var(--bg-soft)",
              marginBottom: 12,
            }}
          >
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Options</p>
            <p style={{ margin: "4px 0 8px 0", fontSize: 12, color: "var(--muted)" }}>
              {type === "CHECKBOXES" ? "Reviewers may pick more than one." : "Reviewers pick exactly one."}
            </p>
            {options.map((o, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                <input
                  type="text"
                  placeholder="value (e.g. yes)"
                  value={o.value}
                  onChange={(e) => updateOption(i, { value: e.target.value })}
                  style={{ padding: 6, border: "1px solid var(--border)", borderRadius: 4, fontSize: 13 }}
                />
                <input
                  type="text"
                  placeholder="label EN (e.g. Yes)"
                  value={o.labelEn}
                  onChange={(e) => updateOption(i, { labelEn: e.target.value })}
                  style={{ padding: 6, border: "1px solid var(--border)", borderRadius: 4, fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer", color: "var(--danger)", fontSize: 12 }}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 12 }}
            >
              + Add option
            </button>
          </div>
        )}

        {err && <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            style={{ padding: "6px 14px", border: "1px solid var(--cobalt)", borderRadius: 4, background: "var(--cobalt)", color: "white", cursor: "pointer" }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function pickFirst(m: Record<string, string> | undefined): string {
  if (!m) return "";
  return Object.values(m).find((v) => v && v.trim()) ?? "";
}
