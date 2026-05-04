import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/reviewer/assignments/$assignmentId")({
  component: ReviewerAssignmentDetailPage,
});

type Assignment = components["schemas"]["ReviewAssignmentResponse"];

const RECOMMENDATIONS = [
  "ACCEPT_SUBMISSION",
  "REVISIONS_REQUIRED",
  "RESUBMIT_FOR_REVIEW",
  "RESUBMIT_ELSEWHERE",
  "DECLINE_SUBMISSION",
  "SEE_COMMENTS",
] as const;
type Recommendation = (typeof RECOMMENDATIONS)[number];

function ReviewerAssignmentDetailPage(): ReactNode {
  const { assignmentId } = useParams({
    from: "/reviewer/assignments/$assignmentId",
  });
  const { user, loading: authLoading } = useAuth();
  const id = Number.parseInt(assignmentId, 10);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const a = await api<Assignment>(`/api/v1/reviewer/assignments/${id}`);
    if (a == null) {
      setErrored(true);
      return;
    }
    setErrored(false);
    setAssignment(a);
  }, [id]);

  useEffect(() => {
    if (user && Number.isFinite(id)) void reload();
  }, [user, id, reload]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!Number.isFinite(id)) {
    return <EmptyState icon="alert" title="Invalid assignment id" description="" />;
  }
  if (errored) {
    return (
      <>
        <PageHeader eyebrow="Reviewer" title={`Assignment #${id}`} />
        <EmptyState
          icon="alert"
          title="Assignment unavailable"
          description="It may not exist, or you don't have access to it."
        />
      </>
    );
  }
  if (!assignment) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading&hellip;</p>;
  }

  const status = assignment.status ?? "AWAITING_RESPONSE";
  const canRespond = status === "AWAITING_RESPONSE";
  const canSubmit = status === "ACCEPTED" || status === "IN_PROGRESS";
  const finished =
    status === "COMPLETED" ||
    status === "CONFIRMED" ||
    status === "DECLINED" ||
    status === "CANCELLED";

  const dueLabel = assignment.dateDue
    ? `Review due ${new Date(assignment.dateDue).toLocaleDateString()}`
    : assignment.dateResponseDue
      ? `Respond by ${new Date(assignment.dateResponseDue).toLocaleDateString()}`
      : null;

  return (
    <>
      <p style={{ margin: "0 0 6px", fontSize: 12 }}>
        <Link to="/reviewer/assignments" className="hover:text-cobalt">
          ← Reviewer / assignments
        </Link>
      </p>
      <PageHeader
        eyebrow="Reviewer"
        title={`Assignment #${assignment.id} · round ${assignment.reviewRoundId}`}
      />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <StatusChip status={status} />
        {assignment.reviewMethod ? (
          <span className="chip">
            {assignment.reviewMethod.replace(/_/g, " ").toLowerCase()}
          </span>
        ) : null}
        {assignment.recommendation ? (
          <span className="chip chip-cobalt">
            {assignment.recommendation.replace(/_/g, " ").toLowerCase()}
          </span>
        ) : null}
        {dueLabel ? (
          <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--mono)" }}>
            {dueLabel}
          </span>
        ) : null}
      </div>

      {canRespond ? (
        <RespondCard assignmentId={id} onChanged={() => void reload()} />
      ) : null}

      {canSubmit ? (
        <SubmitReviewCard assignmentId={id} onSubmitted={() => void reload()} />
      ) : null}

      {finished ? (
        <Card>
          <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>
            This assignment is closed. Thank you for your service to peer review.
          </p>
        </Card>
      ) : null}
    </>
  );
}

function RespondCard({
  assignmentId,
  onChanged,
}: {
  assignmentId: number;
  onChanged: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const respond = async (accept: boolean): Promise<void> => {
    setBusy(true);
    setError(null);
    const result = await api(
      `/api/v1/reviewer/assignments/${assignmentId}/respond`,
      {
        method: "POST",
        body: { accept, message: message.trim() || null },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Couldn't record your response. Try again.");
    } else {
      onChanged();
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>Respond to invitation</h2>
      <p style={{ margin: "0 0 14px", color: "var(--fg-2)", fontSize: 14 }}>
        Accept this assignment if you can deliver a review by the deadline. If
        you decline, a brief reason helps the editor reassign quickly.
      </p>
      <label style={lblStyle}>
        Message to editor (optional)
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(true)}
          style={btnPrimary}
        >
          {busy ? "Working…" : "Accept"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => respond(false)}
          style={{ ...btnSecondary, color: "#b91c1c", borderColor: "#fca5a5" }}
        >
          Decline
        </button>
      </div>
      {error ? (
        <p
          style={{
            margin: "10px 0 0",
            padding: "10px 12px",
            border: "1px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
            borderRadius: "var(--r-2)",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      ) : null}
    </Card>
  );
}

function SubmitReviewCard({
  assignmentId,
  onSubmitted,
}: {
  assignmentId: number;
  onSubmitted: () => void;
}): ReactNode {
  const [recommendation, setRecommendation] = useState<Recommendation>(
    "REVISIONS_REQUIRED",
  );
  const [commentsToEditor, setCommentsToEditor] = useState("");
  const [commentsToAuthor, setCommentsToAuthor] = useState("");
  const [competingInterests, setCompetingInterests] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (commentsToEditor.trim().length === 0 && commentsToAuthor.trim().length === 0) {
      setError("Add at least one set of comments before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await api(
      `/api/v1/reviewer/assignments/${assignmentId}/submit`,
      {
        method: "POST",
        body: {
          recommendation,
          commentsToEditor: commentsToEditor.trim() || null,
          commentsToAuthor: commentsToAuthor.trim() || null,
          competingInterests: competingInterests.trim() || null,
        },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Submit failed. The recommendation may be invalid for this round.");
    } else {
      onSubmitted();
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>Submit your review</h2>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label style={lblStyle}>
          Recommendation
          <select
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value as Recommendation)}
            style={inputStyle}
          >
            {RECOMMENDATIONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label style={lblStyle}>
          Comments to the editor (private)
          <textarea
            value={commentsToEditor}
            onChange={(e) => setCommentsToEditor(e.target.value)}
            rows={6}
            placeholder="Frank assessment shared only with the editor."
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "var(--serif-body)",
              fontSize: 14,
            }}
          />
        </label>
        <label style={lblStyle}>
          Comments to the author
          <textarea
            value={commentsToAuthor}
            onChange={(e) => setCommentsToAuthor(e.target.value)}
            rows={10}
            placeholder="Constructive feedback the author will see."
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "var(--serif-body)",
              fontSize: 14,
            }}
          />
        </label>
        <label style={lblStyle}>
          Competing interests (optional)
          <input
            type="text"
            value={competingInterests}
            onChange={(e) => setCompetingInterests(e.target.value)}
            style={inputStyle}
            placeholder="e.g. co-authored a paper with the submitter in 2023"
          />
        </label>
        {error ? (
          <p
            style={{
              margin: 0,
              padding: "10px 12px",
              border: "1px solid #fca5a5",
              background: "#fff5f5",
              color: "#b91c1c",
              borderRadius: "var(--r-2)",
              fontSize: 13,
            }}
          >
            {error}
          </p>
        ) : null}
        <div>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </form>
    </Card>
  );
}

const h2Style = {
  margin: "0 0 12px",
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 18,
};

const lblStyle = {
  display: "grid",
  gap: 4,
  fontSize: 12,
  fontFamily: "var(--sans)",
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const inputStyle = {
  padding: "9px 11px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 14,
  background: "white",
  color: "var(--fg)",
  textTransform: "none" as const,
  letterSpacing: 0,
  fontWeight: 400,
};

const btnPrimary = {
  padding: "10px 18px",
  background: "var(--cobalt)",
  color: "white",
  border: "none",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "9px 16px",
  background: "white",
  color: "var(--fg-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  cursor: "pointer",
};
