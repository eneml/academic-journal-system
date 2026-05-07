import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, FileText, Inbox } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
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
    // Build the full issue order: sections by id ASC, ordered list by section.
    const allOrdered = grouped
      .map((g) => (g.section.id === sectionId ? ordered : g.items))
      .flat();
    const ids = allOrdered.map((p) => p.id);
    await api<void>(`/api/v1/issues/${issueId}/articles`, {
      method: "PATCH",
      body: { order: ids },
    });
    // Optimistic local mutation; the server response is 204.
    setPubs(allOrdered.map((p, i) => ({ ...p, displayOrder: i })));
    setBusy(false);
  }

  function move(section: SectionRow, items: PublicationRow[], from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row!);
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
            ? `${pubs.length} article${pubs.length === 1 ? "" : "s"} assigned · use the up/down arrows on each row to reorder`
            : "Loading…"
        }
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link to="/editor/issues">Back to issues</Link>
          </Button>
        }
      />

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
              {g.items.map((p, i) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[24px_1fr_100px_120px_72px] items-center gap-3 border-b border-border px-3.5 py-2.5 last:border-b-0"
                >
                  <span className="font-mono text-[10.5px] text-muted-2">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-serif-display text-[14px] font-medium leading-tight text-ink">
                      {pickEn(p.title) || `Article ${p.id}`}
                    </div>
                    <div className="font-mono text-[10.5px] text-muted">
                      AJ-{String(p.id).padStart(4, "0")} · {p.status.toLowerCase()}
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-muted">
                    {p.pages ? `pp. ${p.pages}` : "—"}
                  </span>
                  <span>
                    {p.status === "PUBLISHED" ? (
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
                      disabled={busy || i === 0}
                      onClick={() => move(g.section, g.items, i, i - 1)}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Move down"
                      disabled={busy || i === g.items.length - 1}
                      onClick={() => move(g.section, g.items, i, i + 1)}
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
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
