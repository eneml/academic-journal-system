import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, FileText, Plus } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

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
        <div className="rounded-lg border border-border bg-white overflow-hidden">
          <ul className="divide-y divide-border">
            {submissions.map((s) => (
              <SubmissionRow key={s.id} submission={s} />
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

function SubmissionRow({
  submission,
}: {
  submission: Submission;
}): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const summary = truncate(pickLocalized(submission.abstractText) ?? "", 220);
  const date = submission.dateLastActivity ?? submission.dateSubmitted;

  return (
    <li className="hover:bg-bg-tint/50 transition-colors">
      <Link
        to="/author/submissions/$id"
        params={{ id: String(submission.id) }}
        className="grid grid-cols-[64px_1fr_auto] gap-4 items-start p-5 no-underline text-inherit group"
      >
        <span className="font-mono tnum tabular-nums text-[11px] text-cobalt font-semibold mt-1">
          AJ-{String(submission.id).padStart(4, "0")}
        </span>
        <div className="min-w-0">
          <div className="flex gap-3 items-baseline justify-between">
            <p className="font-serif-display text-[16px] font-medium text-fg m-0 tracking-tight">
              {title}
            </p>
          </div>
          {summary ? (
            <p className="font-serif-body text-[13.5px] text-fg-2 mt-1 leading-relaxed">
              {summary}
            </p>
          ) : null}
          <div className="flex gap-1.5 mt-2.5 flex-wrap items-center">
            {submission.status ? <StatusChip status={submission.status} /> : null}
            {submission.stage ? (
              <Badge variant="outline">
                {submission.stage.replace(/_/g, " ").toLowerCase()}
              </Badge>
            ) : null}
            {submission.progress ? (
              <Badge variant="ghost" className="font-mono normal-case">
                {submission.progress}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-2 group-hover:text-cobalt transition-colors mt-1">
          {date ? (
            <span className="text-[11px] font-mono">
              {new Date(date).toLocaleDateString()}
            </span>
          ) : null}
          <ArrowUpRight className="size-4" />
        </div>
      </Link>
    </li>
  );
}

function pickLocalized(map: Record<string, string> | undefined): string | undefined {
  if (!map) return undefined;
  // Prefer English variants, then the first available value.
  return (
    map["en"] ??
    map["en-US"] ??
    map["en_GB"] ??
    Object.values(map).find((v) => v && v.trim().length > 0)
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1)}…`;
}
