import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Inbox,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api, apiMultipart } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge, Button } from "@ajs/ui";

export const Route = createFileRoute("/editor/issues/$id/curate")({
  component: IssueCuratePage,
});

interface IssueResponse {
  id: number;
  volume: number | null;
  number: string | null;
  year: number | null;
  title: Record<string, string> | null;
}

interface PublicationRow {
  id: number;
  sectionId: number;
  issueId: number | null;
  status: string;
  title: Record<string, string>;
  pages: string | null;
  displayOrder: number;
  urlPath: string | null;
}

interface SectionRow {
  id: number;
  code: string;
  title: Record<string, string>;
}

function pickEn(v: Record<string, string> | null | undefined): string {
  if (!v) return "";
  return v["en"] ?? v["en-US"] ?? Object.values(v).find(Boolean) ?? "";
}

function IssueCuratePage(): ReactNode {
  const { user, roles, loading } = useAuth();
  const allowed = isEditorial(roles);
  const { id } = useParams({ from: "/editor/issues/$id/curate" });
  const issueId = Number(id);

  const [issue, setIssue] = useState<IssueResponse | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [pubs, setPubs] = useState<PublicationRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !allowed || !Number.isFinite(issueId)) return;
    let cancelled = false;
    void Promise.all([
      api<IssueResponse>(`/api/v1/issues/${issueId}`),
      api<SectionRow[]>(`/api/v1/sections`),
      api<PublicationRow[]>(`/api/v1/issues/${issueId}/publications`),
    ]).then(([is, sec, list]) => {
      if (cancelled) return;
      setIssue(is);
      setSections(sec ?? []);
      setPubs(list ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [user, allowed, issueId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (loading) return <p className="text-muted text-sm">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!allowed) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="Issue curation" />
        <p className="text-sm text-muted">
          This area is restricted to ADMIN, EDITOR, and SECTION_EDITOR roles.
        </p>
      </>
    );
  }

  const grouped = groupBySection(pubs, sections);

  async function persistOrder(sectionId: number, ordered: PublicationRow[]) {
    setBusy(true);
    const allOrdered = grouped
      .map((g) => (g.section.id === sectionId ? ordered : g.items))
      .flat();
    const ids = allOrdered.map((p) => p.id);
    await api<void>(`/api/v1/issues/${issueId}/articles`, {
      method: "PATCH",
      body: { order: ids },
    });
    setPubs(allOrdered.map((p, i) => ({ ...p, displayOrder: i })));
    setBusy(false);
  }

  function move(section: SectionRow, items: PublicationRow[], from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = arrayMove(items, from, to);
    void persistOrder(section.id, next);
  }

  function handleDragEnd(section: SectionRow, items: PublicationRow[], event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((p) => p.id === active.id);
    const to = items.findIndex((p) => p.id === over.id);
    if (from === -1 || to === -1) return;
    const next = arrayMove(items, from, to);
    void persistOrder(section.id, next);
  }

  return (
    <>
      <PageHeader
        eyebrow="Editorial · Issues"
        title={
          issue
            ? `Vol. ${issue.volume ?? "—"}, № ${issue.number ?? "—"}`
            : "Issue curation"
        }
        description={
          issue
            ? `${pubs.length} article${pubs.length === 1 ? "" : "s"} assigned · drag rows to reorder, or use the arrow buttons`
            : "Loading…"
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/editor/issues">Back to issues</Link>
          </Button>
        }
      />

      <IssueGalleysCard issueId={issueId} />

      {grouped.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-tint/50 px-8 py-12 text-center">
          <Inbox className="mx-auto mb-3 size-8 text-cobalt" />
          <h3 className="font-serif-display text-[18px] font-semibold text-fg">
            No articles assigned to this issue yet
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            Assign accepted manuscripts to this issue from the publication
            workflow. They'll appear here for ordering.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {grouped.map((g) => (
            <div
              key={g.section.id}
              className="rounded-md border border-border bg-white"
            >
              <div className="flex items-center gap-2.5 border-b border-border bg-bg-tint px-3.5 py-2.5">
                <h3 className="m-0 font-serif-display text-[16px] font-semibold text-ink">
                  {pickEn(g.section.title) || g.section.code}
                </h3>
                <Badge variant="mono">{g.items.length}</Badge>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(g.section, g.items, e)}
              >
                <SortableContext
                  items={g.items.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {g.items.map((p, i) => (
                    <SortableRow
                      key={p.id}
                      pub={p}
                      index={i}
                      total={g.items.length}
                      busy={busy}
                      onMoveUp={() => move(g.section, g.items, i, i - 1)}
                      onMoveDown={() => move(g.section, g.items, i, i + 1)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SortableRow({
  pub,
  index,
  total,
  busy,
  onMoveUp,
  onMoveDown,
}: {
  pub: PublicationRow;
  index: number;
  total: number;
  busy: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}): ReactNode {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: pub.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[24px_24px_36px_1fr_100px_120px_72px] items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0 bg-white"
    >
      <button
        type="button"
        aria-label="Drag handle"
        className="flex cursor-grab items-center justify-center text-muted-2 hover:text-cobalt active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="font-mono text-[10.5px] text-muted-2">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="font-mono text-[10.5px] text-cobalt">
        AJ-{String(pub.id).padStart(4, "0")}
      </span>
      <div>
        <div className="font-serif-display text-[14px] font-medium leading-tight text-ink">
          {pickEn(pub.title) || `Article ${pub.id}`}
        </div>
        <div className="font-mono text-[10.5px] text-muted">
          {pub.status.toLowerCase()}
        </div>
      </div>
      <span className="font-mono text-[11px] text-muted">
        {pub.pages ? `pp. ${pub.pages}` : "—"}
      </span>
      <span>
        {pub.status === "PUBLISHED" ? (
          <Badge variant="success" withDot>
            Galleys ready
          </Badge>
        ) : (
          <Badge variant="amber" withDot>
            In production
          </Badge>
        )}
      </span>
      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Move up"
          disabled={busy || index === 0}
          onClick={onMoveUp}
        >
          <ChevronUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Move down"
          disabled={busy || index === total - 1}
          onClick={onMoveDown}
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface IssueGalleyRow {
  id: number;
  storedFileId: number | null;
  remoteUrl: string | null;
  locale: string | null;
  label: Record<string, string>;
  seq: number;
  approved: boolean;
}

function IssueGalleysCard({ issueId }: { issueId: number }): ReactNode {
  const [galleys, setGalleys] = useState<IssueGalleyRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRemoteForm, setShowRemoteForm] = useState(false);
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteLabel, setRemoteLabel] = useState("");

  const reload = async (): Promise<void> => {
    const data = await api<IssueGalleyRow[]>(`/api/v1/issues/${issueId}/galleys`);
    setGalleys(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, [issueId]);

  const onUploadFile = async (file: File): Promise<void> => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    form.append("label", file.name);
    const result = await apiMultipart<IssueGalleyRow>(
      `/api/v1/issues/${issueId}/galleys/upload`,
      form,
    );
    setBusy(false);
    if (result) {
      toast.success(`Uploaded ${file.name}.`);
      void reload();
    } else {
      toast.error("Upload failed.");
    }
  };

  const onAddRemote = async (): Promise<void> => {
    if (!remoteUrl.trim()) return;
    setBusy(true);
    const result = await api<IssueGalleyRow>(`/api/v1/issues/${issueId}/galleys`, {
      method: "POST",
      body: {
        storedFileId: null,
        remoteUrl: remoteUrl.trim(),
        locale: null,
        label: { en: remoteLabel.trim() || remoteUrl.trim() },
        seq: galleys?.length ?? 0,
        approved: false,
      },
    });
    setBusy(false);
    if (result) {
      toast.success("External galley added.");
      setRemoteUrl("");
      setRemoteLabel("");
      setShowRemoteForm(false);
      void reload();
    } else {
      toast.error("Couldn't add the external galley.");
    }
  };

  const onApprove = async (g: IssueGalleyRow): Promise<void> => {
    const result = await api(
      `/api/v1/issues/${issueId}/galleys/${g.id}`,
      {
        method: "PUT",
        body: {
          storedFileId: g.storedFileId,
          remoteUrl: g.remoteUrl,
          locale: g.locale,
          label: g.label,
          seq: g.seq,
          approved: !g.approved,
        },
      },
    );
    if (result) {
      void reload();
    } else {
      toast.error("Couldn't update.");
    }
  };

  const onDelete = async (id: number): Promise<void> => {
    if (!confirm("Remove this galley?")) return;
    const result = await api(`/api/v1/issues/${issueId}/galleys/${id}`, { method: "DELETE" });
    if (result === null) {
      toast.success("Removed.");
      void reload();
    } else {
      toast.error("Couldn't remove.");
    }
  };

  return (
    <div className="mb-6 rounded-md border border-border bg-white">
      <div className="flex items-center gap-2.5 border-b border-border bg-bg-tint px-3.5 py-2.5">
        <h3 className="m-0 font-serif-display text-[16px] font-semibold text-ink">
          Issue galleys
        </h3>
        <Badge variant="mono">{galleys?.length ?? 0}</Badge>
        <span className="flex-1" />
        <label
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1 text-[12px] font-medium ${
            busy
              ? "cursor-wait border-border bg-bg-tint text-muted"
              : "cursor-pointer border-cobalt bg-cobalt-soft text-cobalt-deep hover:bg-cobalt/10"
          }`}
        >
          {busy ? "Uploading…" : "Upload file"}
          <input
            type="file"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUploadFile(f);
              e.currentTarget.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowRemoteForm((v) => !v)}
        >
          {showRemoteForm ? "Cancel" : "Add URL"}
        </Button>
      </div>

      {showRemoteForm ? (
        <div className="grid gap-2 border-b border-border px-3.5 py-3 md:grid-cols-[1fr_220px_auto]">
          <input
            type="url"
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="https://cdn.example.org/issue-7-combined.pdf"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={remoteLabel}
            onChange={(e) => setRemoteLabel(e.target.value)}
            placeholder="Label (optional)"
            className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          />
          <Button type="button" onClick={() => void onAddRemote()} disabled={busy}>
            Add
          </Button>
        </div>
      ) : null}

      {galleys == null ? (
        <p className="px-3.5 py-3 text-[12px] text-muted">Loading galleys…</p>
      ) : galleys.length === 0 ? (
        <p className="px-3.5 py-3 text-[12px] text-muted">
          No galleys yet — upload a combined PDF or paste a CDN URL above.
        </p>
      ) : (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {galleys.map((g) => {
            const label = pickEn(g.label) || (g.remoteUrl ?? `Galley #${g.id}`);
            return (
              <li key={g.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted w-12">
                  {g.storedFileId ? "FILE" : "URL"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="m-0 truncate text-[13px] font-medium text-fg">
                    {label}
                  </p>
                  {g.remoteUrl ? (
                    <p className="m-0 truncate text-[10.5px] font-mono text-muted">
                      {g.remoteUrl}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant={g.approved ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => void onApprove(g)}
                >
                  {g.approved ? "Approved" : "Approve"}
                </Button>
                <button
                  type="button"
                  onClick={() => void onDelete(g.id)}
                  className="text-danger hover:underline text-[12px]"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function groupBySection(
  pubs: PublicationRow[],
  sections: SectionRow[],
): { section: SectionRow; items: PublicationRow[] }[] {
  const bySectionId = new Map<number, PublicationRow[]>();
  pubs
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    .forEach((p) => {
      if (!bySectionId.has(p.sectionId)) bySectionId.set(p.sectionId, []);
      bySectionId.get(p.sectionId)!.push(p);
    });
  return sections
    .filter((s) => bySectionId.has(s.id))
    .map((s) => ({ section: s, items: bySectionId.get(s.id)! }));
}
