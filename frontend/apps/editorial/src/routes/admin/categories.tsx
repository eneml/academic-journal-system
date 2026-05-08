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

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesAdminPage,
});

type Category = components["schemas"]["CategorySummary"];
type SortOption = NonNullable<Category["sortOption"]>;

const SORT_OPTIONS: SortOption[] = [
  "DATE_PUBLISHED_DESC",
  "DATE_PUBLISHED_ASC",
  "TITLE_ASC",
  "MANUAL",
];

function CategoriesAdminPage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [items, setItems] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<Category | "NEW" | null>(null);

  const reload = async (): Promise<void> => {
    setItems(null);
    const data = await api<Category[]>("/api/v1/categories");
    setItems(data ?? []);
  };

  useEffect(() => {
    if (user && hasAnyRole(roles, ["ADMIN"])) {
      void reload();
    }
  }, [user, roles]);

  const grouped = useMemo(() => {
    const all = items ?? [];
    const roots = all.filter((c) => c.parentId == null);
    const byParent = new Map<number, Category[]>();
    for (const c of all) {
      if (c.parentId != null) {
        const list = byParent.get(c.parentId) ?? [];
        list.push(c);
        byParent.set(c.parentId, list);
      }
    }
    return { roots, byParent };
  }, [items]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!hasAnyRole(roles, ["ADMIN"])) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Categories" />
        <EmptyState icon="alert" title="Admin access required" description="" />
      </>
    );
  }

  const remove = async (id?: number): Promise<void> => {
    if (id == null) return;
    if (!window.confirm("Delete this category? Children get re-parented to root.")) return;
    await api(`/api/v1/categories/${id}`, { method: "DELETE" });
    await reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Categories"
        description="Hierarchical taxonomy for browsing the public site. Publications opt into one or more categories."
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
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
          + New category
        </button>
      </div>

      {items === null ? (
        <p style={{ color: "var(--muted)" }}>Loading&hellip;</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon="alert"
          title="No categories yet"
          description="Create the first one to start grouping publications."
        />
      ) : (
        <Card>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {grouped.roots.map((root) => (
              <CategoryRow
                key={root.id}
                category={root}
                children={root.id != null ? grouped.byParent.get(root.id) ?? [] : []}
                onEdit={(c) => setEditing(c)}
                onDelete={(id) => void remove(id)}
              />
            ))}
          </ul>
        </Card>
      )}

      {editing && (
        <CategoryEditorDrawer
          existing={editing === "NEW" ? null : editing}
          allCategories={items ?? []}
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

function CategoryRow({
  category,
  children,
  onEdit,
  onDelete,
}: {
  category: Category;
  children: Category[];
  onEdit: (c: Category) => void;
  onDelete: (id?: number) => void;
}): ReactNode {
  const title = pickFirst(category.title);
  return (
    <li
      style={{
        padding: "8px 0",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ flex: 1, fontWeight: 600 }}>
          {title || category.code}
          <span style={{ marginLeft: 8, fontSize: 12, color: "var(--muted)", fontWeight: 400, fontFamily: "var(--font-mono)" }}>
            /{category.path}
          </span>
        </span>
        <button
          type="button"
          onClick={() => onEdit(category)}
          style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 12 }}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(category.id)}
          style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
        >
          Delete
        </button>
      </div>
      {children.length > 0 && (
        <ul style={{ margin: "8px 0 0 24px", padding: 0, listStyle: "none" }}>
          {children.map((c) => (
            <li
              key={c.id}
              style={{
                padding: "6px 0",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ flex: 1, fontSize: 13 }}>
                {pickFirst(c.title) || c.code}
                <span style={{ marginLeft: 8, fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                  /{c.path}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onEdit(c)}
                style={{ padding: "2px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 11 }}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(c.id)}
                style={{ padding: "2px 8px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: 11 }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function CategoryEditorDrawer({
  existing,
  allCategories,
  onClose,
  onSaved,
}: {
  existing: Category | null;
  allCategories: Category[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}): ReactNode {
  const [code, setCode] = useState(existing?.code ?? "");
  const [path, setPath] = useState(existing?.path ?? "");
  const [parentId, setParentId] = useState<string>(existing?.parentId ? String(existing.parentId) : "");
  const [titleEn, setTitleEn] = useState<string>(existing?.title?.en ?? "");
  const [descriptionEn, setDescriptionEn] = useState<string>(existing?.description?.en ?? "");
  const [sortOption, setSortOption] = useState<SortOption>(
    existing?.sortOption ?? "DATE_PUBLISHED_DESC",
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const possibleParents = allCategories.filter(
    (c) => c.parentId == null && (existing?.id == null || c.id !== existing.id),
  );

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    if (!slugRegex.test(code)) {
      setErr("Code must be kebab-case (a-z, 0-9, hyphens).");
      return;
    }
    if (!slugRegex.test(path)) {
      setErr("Path must be kebab-case.");
      return;
    }
    if (!titleEn.trim()) {
      setErr("Title (EN) is required.");
      return;
    }
    setBusy(true);
    const body = {
      code,
      path,
      parentId: parentId ? Number(parentId) : null,
      title: { en: titleEn.trim() },
      description: descriptionEn.trim() ? { en: descriptionEn.trim() } : {},
      sortOption,
      imageFileId: null,
    };
    const url = existing ? `/api/v1/categories/${existing.id}` : `/api/v1/categories`;
    const result = await api(url, { method: existing ? "PUT" : "POST", body });
    setBusy(false);
    if (result == null) {
      setErr("Save failed. Code or path may already be in use.");
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
        justifyContent: "flex-end",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0 }}>
          {existing ? "Edit category" : "New category"}
        </h2>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Code (immutable)</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!existing}
            placeholder="machine-learning"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-mono)" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Path (URL slug)</span>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="machine-learning"
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4, fontFamily: "var(--font-mono)" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Parent category</span>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            style={{ display: "block", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          >
            <option value="">— root —</option>
            {possibleParents.map((p) => (
              <option key={p.id} value={p.id ?? ""}>
                {pickFirst(p.title) || p.code}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Title (EN)</span>
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Description (EN)</span>
          <textarea
            value={descriptionEn}
            onChange={(e) => setDescriptionEn(e.target.value)}
            rows={3}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Sort order on public page</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            style={{ display: "block", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
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
