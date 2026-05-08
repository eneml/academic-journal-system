import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  useEffect,
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

export const Route = createFileRoute("/admin/review-forms")({
  component: ReviewFormsPage,
});

type Form = components["schemas"]["ReviewFormResponse"];

function ReviewFormsPage(): ReactNode {
  // Child route (/admin/review-forms/$id) hangs off this file via TanStack
  // dot-naming. When a child path is active we hand off via <Outlet /> and
  // skip the index list entirely. Hooks run unconditionally first; the
  // early return for the child route is the *only* branching after.
  const location = useLocation();
  const { user, roles, loading: authLoading } = useAuth();
  const [forms, setForms] = useState<Form[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const reload = async (): Promise<void> => {
    setForms(null);
    const data = await api<Form[]>("/api/v1/review-forms");
    setForms(data ?? []);
  };

  useEffect(() => {
    if (user && hasAnyRole(roles, ["ADMIN"])) {
      void reload();
    }
  }, [user, roles]);

  const isIndex =
    location.pathname === "/admin/review-forms" ||
    location.pathname === "/admin/review-forms/";
  if (!isIndex) return <Outlet />;

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Review forms" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="Only ADMIN role holders can edit review forms."
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Review forms"
        description="Build structured questionnaires reviewers fill in alongside the freetext comments. Bind a form to a section in the section settings."
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
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
          + New form
        </button>
      </div>

      {forms === null ? (
        <p style={{ color: "var(--muted)" }}>Loading&hellip;</p>
      ) : forms.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No review forms yet"
          description="Create one to begin asking reviewers structured questions per section."
        />
      ) : (
        <Card style={{ padding: 0 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "10px 16px" }}>Code</th>
                <th style={{ padding: "10px 16px" }}>Title</th>
                <th style={{ padding: "10px 16px" }}>Elements</th>
                <th style={{ padding: "10px 16px" }}>Active</th>
                <th style={{ padding: "10px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => {
                const title = pickFirst(f.title);
                return (
                  <tr key={f.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)" }}>
                      {f.code}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {title || <em style={{ color: "var(--muted)" }}>(unnamed)</em>}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {(f.elements ?? []).length}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      {f.active ? (
                        <span style={{ color: "var(--cobalt)" }}>active</span>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>inactive</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", textAlign: "right" }}>
                      <Link
                        to="/admin/review-forms/$id"
                        params={{ id: String(f.id) }}
                        style={{
                          padding: "4px 10px",
                          border: "1px solid var(--border)",
                          borderRadius: 4,
                          textDecoration: "none",
                          color: "var(--fg-2)",
                          fontSize: 12,
                        }}
                      >
                        Open builder
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {showCreate && (
        <CreateFormDrawer
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setShowCreate(false);
            await reload();
          }}
        />
      )}
    </>
  );
}

function CreateFormDrawer({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}): ReactNode {
  const [code, setCode] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    if (!/^[a-z][a-zA-Z0-9_-]+$/.test(code)) {
      setErr("Code must start with a lowercase letter and contain only [a-zA-Z0-9_-].");
      return;
    }
    if (!titleEn.trim()) {
      setErr("Title is required.");
      return;
    }
    setBusy(true);
    const result = await api(`/api/v1/review-forms`, {
      method: "POST",
      body: { code, title: { en: titleEn.trim() }, description: {}, active: true },
    });
    setBusy(false);
    if (result == null) {
      setErr("Could not create — code may already be in use.");
      return;
    }
    await onCreated();
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
          width: "min(480px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create review form</h2>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>Code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="standard-review"
            style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, fontWeight: 600 }}>Title (EN)</span>
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            style={{ width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>
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
            {busy ? "Creating…" : "Create"}
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
