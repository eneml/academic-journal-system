import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, FileText, MoreHorizontal, Plus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge, Button, StageStepper } from "@ajs/ui";

const STAGE_KEYS = ["SUBMISSION", "EXTERNAL_REVIEW", "EDITING", "PRODUCTION", "PUBLISHED"] as const;

function stageIndex(stage: string | null | undefined): 0 | 1 | 2 | 3 | 4 | null {
  if (!stage) return null;
  const i = (STAGE_KEYS as readonly string[]).indexOf(stage.toUpperCase());
  return i === -1 ? null : (i as 0 | 1 | 2 | 3 | 4);
}

function actionNeeded(submission: Submission): boolean {
  const status = submission.status?.toUpperCase() ?? "";
  // The author needs to act when the editor has issued a Request Revisions
  // decision (status flips back to QUEUED with stage SUBMISSION while waiting
  // for the upload), or when a draft is sitting unsubmitted.
  return status === "DRAFT";
}

export const Route = createFileRoute("/author/submissions")({
  component: AuthorSubmissionsPage,
});

interface Submission {
  id: number;
  sectionId?: number | null;
  stage?: string;
  status?: string;
  progress?: string;
  title?: Record<string, string>;
  abstractText?: Record<string, string>;
  dateSubmitted?: string | null;
  dateLastActivity?: string | null;
}

function AuthorSubmissionsPage(): ReactNode {
  // TanStack file-based routing nests submissions.new.tsx and submissions.$id.tsx
  // under this parent. When the URL matches a child path, defer the entire main
  // column to the child via <Outlet />. Without this, the parent layout
  // hijacks the child's content and pages like /author/submissions/new render
  // empty. (All hooks declared up front to keep the call order stable.)
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState<Page<Submission> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

  const isIndex =
    location.pathname === "/author/submissions" ||
    location.pathname === "/author/submissions/";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);
    (async () => {
      const data = await api<Page<Submission>>("/api/v1/submissions/me?size=50");
      if (cancelled) return;
      if (data) setPage(data);
      else setErrored(true);
      setFetching(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Defer to child route when one is active.
  if (!isIndex) {
    return <Outlet />;
  }
  if (authLoading) {
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }

  const submissions = page?.content ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Author"
        title="My submissions"
        description="Drafts you’re still working on, plus anything currently moving through the editorial workflow."
        actions={
          <Button asChild>
            <Link to="/author/submissions/new">
              <Plus />
              New submission
            </Link>
          </Button>
        }
      />

      {fetching ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading submissions&hellip;</p>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Submissions service unavailable"
          description="The /api/v1/submissions/me endpoint didn&rsquo;t respond. Check the backend logs and verify your roles."
        />
      ) : null}

      {!fetching && !errored && submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-bg-tint/40 px-8 py-14 text-center">
          <FileText className="size-8 text-cobalt mx-auto mb-3" />
          <h3 className="font-serif-display text-[18px] font-semibold text-fg">
            No submissions yet
          </h3>
          <p className="text-sm text-muted mt-1.5 max-w-md mx-auto">
            When you start a new submission it will appear here so you can pick up where you left off.
          </p>
          <Button asChild className="mt-4">
            <Link to="/author/submissions/new">
              <Plus />
              Start a submission
            </Link>
          </Button>
        </div>
      ) : null}

      {!fetching && submissions.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((s) => (
            <SubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      ) : null}
    </>
  );
}

function SubmissionCard({ submission }: { submission: Submission }): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const stage = stageIndex(submission.stage);
  const date = submission.dateLastActivity ?? submission.dateSubmitted;
  const needsAction = actionNeeded(submission);

  return (
    <Link
      to="/author/submissions/$id"
      params={{ id: String(submission.id) }}
      className={`group flex flex-col gap-3 rounded-md border bg-white p-4 no-underline transition-shadow text-inherit ${
        needsAction
          ? "border-amber/60 shadow-[0_0_0_3px_var(--amber-soft)] hover:shadow-[0_0_0_3px_var(--amber-soft),0_4px_8px_-2px_oklch(20%_0.02_270/0.06)]"
          : "border-border hover:shadow-[0_4px_8px_-2px_oklch(20%_0.02_270/0.06)]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="lnum tnum font-mono text-[11px] font-semibold text-cobalt">
          AJ-{String(submission.id).padStart(4, "0")}
        </span>
        <MoreHorizontal className="size-4 text-muted-2" />
      </div>
      <div
        className="font-serif-display text-[14px] font-medium leading-tight text-ink"
        style={{ minHeight: 56 }}
      >
        {title}
      </div>
      {stage != null ? (
        <StageStepper stage={stage} size="lg" showLabels />
      ) : null}
      <div className="border-t border-border pt-2.5">
        <div
          className={`text-[12px] font-medium ${
            needsAction ? "text-amber-deep" : "text-fg-2"
          }`}
        >
          {needsAction ? "Action needed — finish your draft" : (
            submission.status?.replace(/_/g, " ").toLowerCase() ?? "—"
          )}
        </div>
        <div className="mt-0.5 font-mono text-[10.5px] text-muted">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-2 transition-colors group-hover:text-cobalt">
        <span className="flex-1" />
        <span>Open submission</span>
        <ArrowUpRight className="size-3.5" />
      </div>
    </Link>
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
