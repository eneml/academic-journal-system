import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, Clock, Inbox } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";
import { isEditorial } from "../../auth/roles";
import { Badge, Button, StageStepper } from "@ajs/ui";

export const Route = createFileRoute("/editor/queue")({
  component: EditorQueuePage,
});

const STAGE_KEYS = ["SUBMISSION", "EXTERNAL_REVIEW", "EDITING", "PRODUCTION", "PUBLISHED"] as const;
type StageKey = (typeof STAGE_KEYS)[number];

const STAGE_LABEL: Record<StageKey, string> = {
  SUBMISSION: "Submission",
  EXTERNAL_REVIEW: "Review",
  EDITING: "Editing",
  PRODUCTION: "Production",
  PUBLISHED: "Published",
};

function stageIndex(stage: string | null | undefined): 0 | 1 | 2 | 3 | 4 | null {
  if (!stage) return null;
  const i = STAGE_KEYS.indexOf(stage.toUpperCase() as StageKey);
  return i === -1 ? null : (i as 0 | 1 | 2 | 3 | 4);
}

interface QueueSubmission {
  id: number;
  sectionId?: number | null;
  stage?: string;
  status?: string;
  progress?: string;
  title?: Record<string, string>;
  dateSubmitted?: string | null;
  dateLastActivity?: string | null;
  submittedByUserId?: number;
}

function EditorQueuePage(): ReactNode {
  const { user, roles, loading: authLoading } = useAuth();
  const [page, setPage] = useState<Page<QueueSubmission> | null>(null);
  const [stageCounts, setStageCounts] = useState<Record<StageKey, number | null>>({
    SUBMISSION: null,
    EXTERNAL_REVIEW: null,
    EDITING: null,
    PRODUCTION: null,
    PUBLISHED: null,
  });
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

  const allowed = isEditorial(roles);

  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);

    (async () => {
      const [queue, ...stageResponses] = await Promise.all([
        api<Page<QueueSubmission>>("/api/v1/submissions?status=QUEUED&size=50"),
        ...STAGE_KEYS.map((s) =>
          api<Page<QueueSubmission>>(`/api/v1/submissions?stage=${s}&size=1`),
        ),
      ]);
      if (cancelled) return;
      if (queue) setPage(queue);
      else setErrored(true);
      const counts = { ...stageCounts };
      STAGE_KEYS.forEach((key, i) => {
        const r = stageResponses[i];
        counts[key] = r?.totalElements ?? 0;
      });
      setStageCounts(counts);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, allowed]);

  if (authLoading) {
    return <p className="text-muted text-sm">Loading session…</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }
  if (!allowed) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="Editorial queue" />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="This area is restricted to ADMIN, EDITOR, and SECTION_EDITOR roles."
        />
      </>
    );
  }

  const submissions = page?.content ?? [];
  const total = page?.totalElements ?? submissions.length;

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Submissions"
        description={
          total > 0
            ? `${total} submission${total === 1 ? "" : "s"} awaiting editor action`
            : "Submissions awaiting editor action — triage, assign, or move on to peer review."
        }
        actions={
          <div className="flex items-center gap-1.5">
            <Button asChild variant="secondary" size="sm">
              <Link to="/editor/submissions">
                All submissions
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        }
      />

      <StageStrip counts={stageCounts} />

      <FilterChips total={total} />

      {fetching ? (
        <div className="flex items-center gap-2 text-muted text-sm py-6">
          <Clock className="size-4 animate-pulse" /> Loading queue…
        </div>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn’t load the queue"
          description="The /api/v1/submissions endpoint didn’t respond. Confirm the backend is up and you’re signed in with editor privileges."
        />
      ) : null}

      {!fetching && !errored && submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-tint/50 px-8 py-12 text-center">
          <Inbox className="mx-auto mb-3 size-8 text-cobalt" />
          <h3 className="font-serif-display text-[18px] font-semibold text-ink">
            Queue is clear
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
            No submissions are currently in QUEUED status. Newly submitted
            manuscripts will appear here.
          </p>
        </div>
      ) : null}

      {!fetching && submissions.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border bg-white">
          <div className="grid grid-cols-[140px_1fr_120px_100px_60px_40px] gap-3 border-b border-border bg-surface px-3.5 py-2.5 sc text-muted">
            <span>ID · Stage</span>
            <span>Manuscript</span>
            <span>Status</span>
            <span>Last activity</span>
            <span className="text-right">Days</span>
            <span></span>
          </div>
          <ul className="m-0 list-none divide-y divide-border p-0">
            {submissions.map((s) => (
              <QueueRow key={s.id} submission={s} />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function StageStrip({
  counts,
}: {
  counts: Record<StageKey, number | null>;
}): ReactNode {
  return (
    <div className="mb-4 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      {STAGE_KEYS.map((key, i) => {
        const n = counts[key];
        return (
          <div key={key} className="bg-white p-3.5">
            <div className="sc text-muted">
              {String(i + 1).padStart(2, "0")} · {STAGE_LABEL[key]}
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="lnum tnum font-serif-display text-[28px] font-semibold leading-none tracking-[-0.02em] text-ink">
                {n == null ? "—" : n}
              </span>
              <StageStepper stage={i as 0 | 1 | 2 | 3 | 4} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FilterChips({ total }: { total: number }): ReactNode {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1.5">
      <span className="chip chip-cobalt chip-dot">All {total}</span>
      <span className="chip">Needs decision</span>
      <span className="chip">Review overdue</span>
      <span className="chip">No editor</span>
      <span className="chip">My assignments</span>
      <div className="flex-1" />
      <span className="font-mono text-[11px] text-muted">
        Showing {Math.min(50, total)} of {total}
      </span>
    </div>
  );
}

function QueueRow({
  submission,
}: {
  submission: QueueSubmission;
}): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const date = submission.dateLastActivity ?? submission.dateSubmitted;
  const stage = stageIndex(submission.stage);
  const days = daysSince(date);

  return (
    <li>
      <Link
        to="/editor/submissions/$id"
        params={{ id: String(submission.id) }}
        className="group grid grid-cols-[140px_1fr_120px_100px_60px_40px] items-center gap-3 px-3.5 py-3.5 no-underline text-inherit transition-colors hover:bg-bg-tint/50"
      >
        <span className="flex flex-col gap-1.5">
          <span className="lnum tnum font-mono text-[11px] font-semibold text-cobalt">
            AJ-{String(submission.id).padStart(4, "0")}
          </span>
          {stage != null ? <StageStepper stage={stage} /> : null}
        </span>
        <span>
          <span className="block truncate font-serif-display text-[14px] font-medium leading-tight text-ink">
            {title}
          </span>
          <span className="block font-mono text-[10.5px] text-muted">
            {submission.stage
              ? submission.stage.replace(/_/g, " ").toLowerCase()
              : "—"}
          </span>
        </span>
        <span>
          {submission.status ? (
            <StatusChip status={submission.status} />
          ) : (
            <Badge variant="outline">—</Badge>
          )}
        </span>
        <span className="font-mono text-[11px] text-muted">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </span>
        <span className="text-right font-mono text-[11px] text-muted">
          {days != null ? `${days}d` : "—"}
        </span>
        <ArrowUpRight className="size-4 justify-self-end text-muted-2 transition-colors group-hover:text-cobalt" />
      </Link>
    </li>
  );
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 86_400_000));
}

function pickLocalized(map: Record<string, string> | undefined): string | undefined {
  if (!map) return undefined;
  return (
    map["en"] ??
    map["en-US"] ??
    map["en_GB"] ??
    Object.values(map).find((v) => v && v.trim().length > 0)
  );
}
