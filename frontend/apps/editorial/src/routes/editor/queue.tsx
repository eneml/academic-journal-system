import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";
import { isEditorial } from "../../auth/roles";

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
    return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
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

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="Editorial queue"
        description="Submissions awaiting editor action — triage, assign, or move on to peer review."
      />

      {fetching ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading queue&hellip;</p>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn&rsquo;t load the queue"
          description="The /api/v1/submissions endpoint didn&rsquo;t respond. Confirm the backend is up and you&rsquo;re signed in with editor privileges."
        />
      ) : null}

      {!fetching && !errored && submissions.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="Queue is clear"
          description="No submissions are currently in QUEUED status. Newly submitted manuscripts will appear here."
        />
      ) : null}

      {!fetching && submissions.length > 0 ? (
        <Card padded={false}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ textAlign: "left" }}>
                <Th width={50}>#</Th>
                <Th>Title</Th>
                <Th width={120}>Stage</Th>
                <Th width={120}>Status</Th>
                <Th width={130}>Last activity</Th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, idx) => (
                <QueueRow
                  key={s.id}
                  submission={s}
                  divider={idx < submissions.length - 1}
                />
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </>
  );
}

function Th({ children, width }: { children: ReactNode; width?: number }): ReactNode {
  return (
    <th
      className="sc"
      style={{
        textAlign: "left",
        padding: "12px 18px",
        color: "var(--muted)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        fontWeight: 600,
        width,
      }}
    >
      {children}
    </th>
  );
}

function QueueRow({
  submission,
  divider,
}: {
  submission: QueueSubmission;
  divider: boolean;
}): ReactNode {
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const date = submission.dateLastActivity ?? submission.dateSubmitted;
  return (
    <tr style={{ borderBottom: divider ? "1px solid var(--border)" : "none" }}>
      <Td>
        <span className="marginalia-num tnum">
          {String(submission.id).padStart(3, "0")}
        </span>
      </Td>
      <Td>
        <span
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--fg)",
          }}
        >
          {title}
        </span>
      </Td>
      <Td>
        {submission.stage ? (
          <StatusChip status={submission.stage} label={submission.stage.replace(/_/g, " ").toLowerCase()} />
        ) : (
          <span style={{ color: "var(--muted)" }}>—</span>
        )}
      </Td>
      <Td>
        {submission.status ? <StatusChip status={submission.status} /> : null}
      </Td>
      <Td>
        <span
          className="tnum"
          style={{ fontSize: 12, fontFamily: "var(--mono)", color: "var(--fg-2)" }}
        >
          {date ? new Date(date).toLocaleDateString() : "—"}
        </span>
      </Td>
    </tr>
  );
}

function Td({ children }: { children: ReactNode }): ReactNode {
  return (
    <td style={{ padding: "12px 18px", verticalAlign: "middle" }}>{children}</td>
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
