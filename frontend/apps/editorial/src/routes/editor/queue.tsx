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
import { Badge } from "@ajs/ui";
import { Button } from "@ajs/ui";

export const Route = createFileRoute("/editor/queue")({
  component: EditorQueuePage,
});

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
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

  const allowed = isEditorial(roles);

  useEffect(() => {
    if (!user || !allowed) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);
    (async () => {
      const data = await api<Page<QueueSubmission>>(
        "/api/v1/submissions?status=QUEUED&size=50",
      );
      if (cancelled) return;
      if (data) setPage(data);
      else setErrored(true);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
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
        title="Editorial queue"
        description="Submissions awaiting editor action — triage, assign, or move on to peer review."
        actions={
          total > 0 ? (
            <Button asChild variant="secondary" size="sm">
              <Link to="/editor/submissions">
                Open all
                <ArrowUpRight />
              </Link>
            </Button>
          ) : undefined
        }
      />

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
          <Inbox className="size-8 text-cobalt mx-auto mb-3" />
          <h3 className="font-serif-display text-[18px] font-semibold text-fg">
            Queue is clear
          </h3>
          <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
            No submissions are currently in QUEUED status. Newly submitted manuscripts will appear here.
          </p>
        </div>
      ) : null}

      {!fetching && submissions.length > 0 ? (
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <div className="grid grid-cols-[64px_1fr_140px_120px_140px_60px] gap-3 px-4 py-3 border-b border-border bg-bg-tint text-[10px] uppercase tracking-[0.07em] text-muted font-semibold">
            <span>ID</span>
            <span>Title</span>
            <span>Stage</span>
            <span>Status</span>
            <span>Last activity</span>
            <span></span>
          </div>
          <ul className="divide-y divide-border">
            {submissions.map((s) => (
              <QueueRow key={s.id} submission={s} />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function QueueRow({
  submission,
}: {
  submission: QueueSubmission;
}): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const date = submission.dateLastActivity ?? submission.dateSubmitted;
  return (
    <li>
      <Link
        to="/editor/submissions/$id"
        params={{ id: String(submission.id) }}
        className="grid grid-cols-[64px_1fr_140px_120px_140px_60px] gap-3 items-center px-4 py-3 hover:bg-bg-tint/50 transition-colors no-underline text-inherit group"
      >
        <span className="font-mono tnum tabular-nums text-[11px] text-cobalt font-semibold">
          AJ-{String(submission.id).padStart(4, "0")}
        </span>
        <span className="font-serif-display text-[14px] font-medium text-fg truncate">
          {title}
        </span>
        <span className="justify-self-start">
          {submission.stage ? (
            <Badge variant="outline">
              {submission.stage.replace(/_/g, " ").toLowerCase()}
            </Badge>
          ) : (
            <span className="text-muted">—</span>
          )}
        </span>
        <span className="justify-self-start">
          {submission.status ? <StatusChip status={submission.status} /> : null}
        </span>
        <span className="text-[12px] font-mono text-muted">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </span>
        <ArrowUpRight className="size-4 text-muted-2 group-hover:text-cobalt justify-self-end transition-colors" />
      </Link>
    </li>
  );
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
