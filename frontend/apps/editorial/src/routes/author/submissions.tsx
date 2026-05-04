import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@ajs/ui/primitives";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";

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
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState<Page<Submission> | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

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
        description="Drafts you&rsquo;re still working on, plus anything currently moving through the editorial workflow."
        actions={
          <a href="/author/submissions/new" className="btn btn-primary btn-sm">
            <Icon name="plus" size={13} />
            New submission
          </a>
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
        <EmptyState
          icon="fileText"
          title="No submissions yet"
          description="When you start a new submission it will appear here so you can pick up where you left off."
          action={
            <a href="/author/submissions/new" className="btn btn-primary btn-sm">
              <Icon name="plus" size={13} />
              Start a submission
            </a>
          }
        />
      ) : null}

      {!fetching && submissions.length > 0 ? (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {submissions.map((s, idx) => (
              <SubmissionRow
                key={s.id}
                submission={s}
                divider={idx < submissions.length - 1}
              />
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

function SubmissionRow({
  submission,
  divider,
}: {
  submission: Submission;
  divider: boolean;
}): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const summary = truncate(pickLocalized(submission.abstractText) ?? "", 220);
  const date = submission.dateLastActivity ?? submission.dateSubmitted;

  return (
    <li
      style={{
        borderBottom: divider ? "1px solid var(--border)" : "none",
      }}
    >
      <Link
        to="/author/submissions/$id"
        params={{ id: String(submission.id) }}
        style={{
          padding: "16px 22px",
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <span
          className="marginalia-num tnum"
          style={{ width: 28, marginTop: 4, flex: "none" }}
        >
          {String(submission.id).padStart(3, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <p
              style={{
                fontFamily: "var(--serif-display)",
                fontSize: 16,
                fontWeight: 500,
                margin: 0,
                color: "var(--fg)",
                letterSpacing: "-0.005em",
              }}
            >
              {title}
            </p>
            {date ? (
              <span
                className="tnum"
                style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}
              >
                {new Date(date).toLocaleDateString()}
              </span>
            ) : null}
          </div>
          {summary ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 13.5,
                color: "var(--fg-2)",
                margin: "5px 0 0",
                lineHeight: 1.55,
              }}
            >
              {summary}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
            {submission.status ? <StatusChip status={submission.status} /> : null}
            {submission.stage ? (
              <StatusChip status={submission.stage} label={submission.stage.replace(/_/g, " ").toLowerCase()} />
            ) : null}
            {submission.progress ? (
              <span className="chip chip-mono">{submission.progress}</span>
            ) : null}
          </div>
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
