import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/reviewer/assignments")({
  component: ReviewerAssignmentsPage,
});

interface ReviewAssignment {
  id: number;
  reviewRoundId: number;
  reviewMethod?: string;
  status?: string;
  recommendation?: string | null;
  dateAssigned?: string;
  dateResponseDue?: string | null;
  dateDue?: string | null;
  dateResponded?: string | null;
  dateCompleted?: string | null;
}

function ReviewerAssignmentsPage(): ReactNode {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ReviewAssignment[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setFetching(true);
    setErrored(false);
    (async () => {
      // Backend may return a Page<> or a List<>; tolerate both.
      const data = await api<Page<ReviewAssignment> | ReviewAssignment[]>(
        "/api/v1/reviewer/assignments",
      );
      if (cancelled) return;
      if (data) {
        if (Array.isArray(data)) setItems(data);
        else setItems(data.content);
      } else {
        setErrored(true);
      }
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

  return (
    <>
      <PageHeader
        eyebrow="Reviewer"
        title="My review assignments"
        description="Invitations awaiting your response, in-progress reviews, and ones you&rsquo;ve completed."
      />

      {fetching ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading assignments&hellip;</p>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn&rsquo;t load assignments"
          description="The /api/v1/reviewer/assignments endpoint didn&rsquo;t respond. If you don&rsquo;t hold the REVIEWER role this may return 403."
        />
      ) : null}

      {!fetching && !errored && items && items.length === 0 ? (
        <EmptyState
          icon="badgeCheck"
          title="No active assignments"
          description="When an editor invites you to review a manuscript, the invitation will appear here with response options."
        />
      ) : null}

      {!fetching && items && items.length > 0 ? (
        <Card padded={false}>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((a, idx) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                divider={idx < items.length - 1}
              />
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}

function AssignmentRow({
  assignment,
  divider,
}: {
  assignment: ReviewAssignment;
  divider: boolean;
}): ReactNode {
  const dueLabel = assignment.dateDue
    ? `Due ${new Date(assignment.dateDue).toLocaleDateString()}`
    : assignment.dateResponseDue
      ? `Respond by ${new Date(assignment.dateResponseDue).toLocaleDateString()}`
      : null;

  return (
    <li style={{ borderBottom: divider ? "1px solid var(--border)" : "none" }}>
      <Link
        to="/reviewer/assignments/$assignmentId"
        params={{ assignmentId: String(assignment.id) }}
        style={{
          padding: "14px 22px",
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
          {String(assignment.id).padStart(3, "0")}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "baseline",
          }}
        >
          <p
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 15,
              fontWeight: 500,
              margin: 0,
            }}
          >
            Assignment #{assignment.id}{" "}
            <span style={{ color: "var(--muted)", fontWeight: 400 }}>
              · round {assignment.reviewRoundId}
            </span>
          </p>
          {dueLabel ? (
            <span
              className="tnum"
              style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}
            >
              {dueLabel}
            </span>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {assignment.status ? <StatusChip status={assignment.status} /> : null}
          {assignment.reviewMethod ? (
            <span className="chip">{assignment.reviewMethod.replace(/_/g, " ").toLowerCase()}</span>
          ) : null}
          {assignment.recommendation ? (
            <span className="chip chip-cobalt">
              {assignment.recommendation.replace(/_/g, " ").toLowerCase()}
            </span>
          ) : null}
        </div>
      </div>
      </Link>
    </li>
  );
}
