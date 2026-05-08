import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { hasRole } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/highlights")({
  component: HighlightsAdminPage,
});

interface Highlight {
  id: number;
  sortOrder: number;
  title: Record<string, string>;
  description: Record<string, string>;
  url: string | null;
  imageStoredFileId: number | null;
  imageUrl: string | null;
  targetPublicationId: number | null;
  targetPublicationUrlPath: string | null;
  enabled: boolean;
  version: number;
  updatedAt: string;
}

interface UpsertRequest {
  sortOrder: number;
  title: Record<string, string>;
  description: Record<string, string>;
  url: string | null;
  imageStoredFileId: number | null;
  targetPublicationId: number | null;
  enabled: boolean;
}

function HighlightsAdminPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  const [items, setItems] = useState<Highlight[] | null>(null);
  const [editing, setEditing] = useState<Highlight | "NEW" | null>(null);

  const reload = async (): Promise<void> => {
    const data = await api<Highlight[]>("/api/v1/highlights?all=true");
    setItems(data ?? []);
  };

  useEffect(() => {
    if (user && hasRole(roles, "ADMIN")) {
      void reload();
    }
  }, [user, roles]);

  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!hasRole(roles, "ADMIN")) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Highlights" />
        <EmptyState
          icon="alert"
          title="Admin access required"
          description="The highlights manager is restricted to ADMIN role holders."
        />
      </>
    );
  }

  const remove = async (id: number): Promise<void> => {
    if (!confirm("Delete this highlight?")) return;
    const result = await api(`/api/v1/highlights/${id}`, { method: "DELETE" });
    if (result === null) {
      toast.success("Highlight deleted.");
      void reload();
    } else {
      toast.error("Couldn't delete the highlight.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Highlights"
        description="Curated tiles shown above the issue on the public homepage."
        actions={
          <Button
            type="button"
            onClick={() => setEditing("NEW")}
            disabled={editing === "NEW"}
          >
            <Plus />
            New highlight
          </Button>
        }
      />

      {editing != null ? (
        <HighlightEditor
          initial={editing === "NEW" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            void reload();
          }}
        />
      ) : null}

      {items == null ? (
        <p className="text-muted">Loading highlights…</p>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon="inbox"
            title="No highlights yet"
            description="Create one to surface a curated tile on the homepage."
          />
        </Card>
      ) : (
        <Card padded={false}>
          <ul className="m-0 list-none divide-y divide-border p-0">
            {items.map((h) => (
              <li
                key={h.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span className="font-mono text-[11px] text-muted w-10">
                  {String(h.sortOrder).padStart(3, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="m-0 truncate font-serif-display text-[14px] font-medium">
                    {pickFirstNonEmpty(h.title) ?? "(untitled)"}
                  </p>
                  <p className="m-0 truncate text-[11px] text-muted font-mono">
                    {h.targetPublicationUrlPath
                      ? "→ /articles/" + h.targetPublicationUrlPath
                      : h.url
                        ? "→ " + h.url
                        : "no link"}
                  </p>
                </div>
                {h.enabled ? (
                  <span className="rounded-md bg-success-soft px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success-deep">
                    Enabled
                  </span>
                ) : (
                  <span className="rounded-md bg-bg-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                    Disabled
                  </span>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(h)}
                >
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => void remove(h.id)}
                  className="text-danger hover:underline text-[12px]"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function HighlightEditor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Highlight | null;
  onClose: () => void;
  onSaved: () => void;
}): ReactNode {
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 100);
  const [titleEn, setTitleEn] = useState(initial?.title?.en ?? "");
  const [titleRo, setTitleRo] = useState(initial?.title?.ro ?? "");
  const [descEn, setDescEn] = useState(initial?.description?.en ?? "");
  const [descRo, setDescRo] = useState(initial?.description?.ro ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [targetId, setTargetId] = useState(
    initial?.targetPublicationId == null ? "" : String(initial.targetPublicationId),
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    const payload: UpsertRequest = {
      sortOrder,
      title: dropEmpty({ en: titleEn, ro: titleRo }),
      description: dropEmpty({ en: descEn, ro: descRo }),
      url: url.trim() || null,
      imageStoredFileId: initial?.imageStoredFileId ?? null,
      targetPublicationId: targetId.trim() ? Number.parseInt(targetId, 10) : null,
      enabled,
    };
    const path = initial == null
      ? "/api/v1/highlights"
      : `/api/v1/highlights/${initial.id}`;
    const result = await api<Highlight>(path, {
      method: initial == null ? "POST" : "PUT",
      body: payload,
    });
    setBusy(false);
    if (result) {
      toast.success(initial == null ? "Highlight created." : "Highlight saved.");
      onSaved();
    } else {
      toast.error("Couldn't save the highlight.");
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-3">
        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Sort order">
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number.parseInt(e.target.value, 10) || 0)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Enabled">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="size-4 rounded border-border accent-cobalt"
              />
              Visible on the homepage
            </label>
          </Field>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Title (EN)">
            <input
              type="text"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Title (RO)">
            <input
              type="text"
              value={titleRo}
              onChange={(e) => setTitleRo(e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Field label="Description (EN)">
            <textarea
              value={descEn}
              onChange={(e) => setDescEn(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Description (RO)">
            <textarea
              value={descRo}
              onChange={(e) => setDescRo(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <Field label="External URL">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Target publication ID">
            <input
              type="number"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="e.g. 7"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>

        <p className="m-0 text-[12px] text-muted">
          Set <em>either</em> a target publication ID (recommended for tiles
          linking to articles) <em>or</em> an external URL — the publication
          target wins when both are present.
        </p>

        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            <Save />
            {busy ? "Saving…" : initial == null ? "Create" : "Save"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}): ReactNode {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function dropEmpty(map: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(map)) {
    if (v && v.trim().length > 0) out[k] = v;
  }
  return out;
}

function pickFirstNonEmpty(map: Record<string, string> | null | undefined): string | null {
  if (!map) return null;
  for (const v of Object.values(map)) {
    if (v && v.trim().length > 0) return v;
  }
  return null;
}
