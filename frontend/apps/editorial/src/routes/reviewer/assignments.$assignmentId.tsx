import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
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

/**
 * Recommendations match the backend {@code ReviewRecommendation} enum exactly.
 * The labels/descriptions follow the design handoff's recommendation cards.
 */
const RECOMMENDATIONS = [
  {
    value: "ACCEPT",
    label: "Accept submission",
    description: "No revisions necessary",
  },
  {
    value: "REVISIONS",
    label: "Revisions required",
    description: "Minor changes — re-review not required",
  },
  {
    value: "RESUBMIT",
    label: "Resubmit for review",
    description: "Major revisions, new round needed",
  },
  {
    value: "DECLINE",
    label: "Decline submission",
    description: "Not suitable for this journal",
  },
  {
    value: "SEE_COMMENTS",
    label: "See comments",
    description: "Defer the recommendation to a written discussion",
  },
] as const;
type Recommendation = (typeof RECOMMENDATIONS)[number]["value"];

interface Manuscript {
  submissionId: number;
  assignmentId: number;
  reviewMethod: string | null;
  locale: string;
  title: Record<string, string>;
  abstractText: Record<string, string>;
  keywords: string[];
  files: Array<{
    id: number;
    stage: string;
    filename: string;
    contentType: string | null;
    sizeBytes: number;
    downloadUrl: string | null;
    uploadedAt: string;
  }>;
}

function ReviewerAssignmentDetailPage(): ReactNode {
  const { assignmentId } = useParams({
    from: "/reviewer/assignments/$assignmentId",
  });
  const { user, loading: authLoading } = useAuth();
  const id = Number.parseInt(assignmentId, 10);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [manuscript, setManuscript] = useState<Manuscript | null>(null);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [a, m] = await Promise.all([
      api<Assignment>(`/api/v1/reviewer/assignments/${id}`),
      api<Manuscript>(`/api/v1/reviewer/assignments/${id}/manuscript`),
    ]);
    if (a == null) {
      setErrored(true);
      return;
    }
    setErrored(false);
    setAssignment(a);
    if (m) setManuscript(m);
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

  const dueIso = assignment.dateDue ?? assignment.dateResponseDue ?? null;
  const dueLabel = assignment.dateDue
    ? `Review due ${new Date(assignment.dateDue).toLocaleDateString()}`
    : assignment.dateResponseDue
      ? `Respond by ${new Date(assignment.dateResponseDue).toLocaleDateString()}`
      : null;
  const daysRemaining = dueIso ? daysUntil(dueIso) : null;

  // Header changes for the Submit phase: title becomes "Submit your review"
  // and the actions slot carries a top-right Submit button (which forwards
  // to the form below). For the Respond phase we keep the assignment-id
  // breadcrumb-style title.
  const headerTitle = canSubmit
    ? "Submit your review"
    : `Assignment #${assignment.id} · round ${assignment.reviewRoundId}`;
  const headerSubtitle = canSubmit
    ? `Round ${assignment.reviewRoundId} · Assignment #${assignment.id}${
        dueLabel ? ` · ${dueLabel}` : ""
      }`
    : undefined;

  return (
    <>
      <p style={{ margin: "0 0 6px", fontSize: 12 }}>
        <Link to="/reviewer/assignments" className="hover:text-cobalt">
          ← Reviewer / assignments
        </Link>
      </p>
      <PageHeader
        eyebrow="Reviewer"
        title={headerTitle}
        description={headerSubtitle}
        actions={
          canSubmit ? (
            <>
              {daysRemaining != null ? (
                <CountdownChip days={daysRemaining} />
              ) : null}
              <button
                type="submit"
                form="reviewer-submit-form"
                style={btnPrimary}
              >
                Submit review
              </button>
            </>
          ) : daysRemaining != null ? (
            <CountdownChip days={daysRemaining} />
          ) : undefined
        }
      />

      {/* Status / method chips row — kept under the header so the page never
          loses the canonical assignment status at a glance. */}
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
      </div>

      {canRespond ? (
        <>
          {manuscript ? <ManuscriptPreview manuscript={manuscript} /> : null}
          <RespondCard assignmentId={id} onChanged={() => void reload()} />
        </>
      ) : null}

      {canSubmit ? (
        <SubmitReviewLayout
          assignmentId={id}
          assignment={assignment}
          manuscript={manuscript}
          onSubmitted={() => void reload()}
        />
      ) : null}

      {finished ? (
        <>
          {manuscript ? <ManuscriptPreview manuscript={manuscript} /> : null}
          <Card>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>
              This assignment is closed. Thank you for your service to peer review.
            </p>
          </Card>
        </>
      ) : null}
    </>
  );
}

/**
 * 5-step strip rendered above the reviewer submit form. Steps light up as
 * the reviewer fills in each section — purely informational, the form is
 * still single-page (no pagination). Submit happens via the page header CTA.
 */
function ReviewStepIndicator({
  recommendation,
  commentsAuthor,
  commentsEditor,
}: {
  recommendation: string;
  commentsAuthor: string;
  commentsEditor: string;
}): ReactNode {
  const steps = [
    { label: "1. Recommendation", done: !!recommendation },
    { label: "2. Comments", done: commentsAuthor.trim().length >= 50 },
    { label: "3. Confidential", done: commentsEditor.trim().length > 0 },
    { label: "4. Files", done: false },
    { label: "5. Confirm", done: false },
  ];
  return (
    <div
      style={{ gridColumn: "1 / -1" }}
      className="mb-2 flex items-center gap-0 overflow-x-auto"
    >
      {steps.map((s, i) => (
        <div
          key={s.label}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          <span
            className={`inline-flex size-6 flex-none items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
              s.done
                ? "bg-cobalt text-white"
                : "border border-border-strong bg-white text-muted"
            }`}
          >
            {s.done ? "✓" : i + 1}
          </span>
          <span
            className={`truncate text-[11.5px] ${
              s.done ? "font-semibold text-fg" : "text-muted"
            }`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 ? (
            <span
              className={`mx-2 h-px flex-1 ${
                s.done ? "bg-cobalt" : "bg-border"
              }`}
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Days until an ISO timestamp, rounded down. Negative when overdue.
 */
function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const ms = target - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function CountdownChip({ days }: { days: number }): ReactNode {
  const overdue = days < 0;
  const urgent = days <= 3;
  const color = overdue
    ? "var(--danger)"
    : urgent
      ? "var(--amber-deep)"
      : "var(--muted)";
  const label = overdue
    ? `${Math.abs(days)} days overdue`
    : days === 0
      ? "due today"
      : days === 1
        ? "1 day remaining"
        : `${days} days remaining`;
  return (
    <span
      style={{
        fontSize: 11.5,
        color,
        fontFamily: "var(--mono)",
        alignSelf: "center",
      }}
      aria-label={label}
    >
      ⧖ {label}
    </span>
  );
}

/* ─────────────────────── RESPOND PHASE ─────────────────────── */

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
      toast.error("Couldn't record your response.");
    } else {
      toast.success(accept ? "Assignment accepted." : "Assignment declined.", {
        description: accept
          ? "We've notified the editor. Submit your review when ready."
          : "We've let the editor know.",
      });
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

/* ─────────────────────── SUBMIT PHASE ─────────────────────── */

/**
 * Two-column review form following the design handoff's
 * {@code ReviewerFormCompact}: recommendation + comments + attachments
 * placeholder on the left, "About this submission" + reviewer guidelines on
 * the right rail.
 */
function SubmitReviewLayout({
  assignmentId,
  assignment,
  manuscript,
  onSubmitted,
}: {
  assignmentId: number;
  assignment: Assignment;
  manuscript: Manuscript | null;
  onSubmitted: () => void;
}): ReactNode {
  const [recommendation, setRecommendation] =
    useState<Recommendation>("REVISIONS");
  const [commentsToEditor, setCommentsToEditor] = useState("");
  const [commentsToAuthor, setCommentsToAuthor] = useState("");
  const [competingInterests, setCompetingInterests] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = wordsOf(commentsToAuthor);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (
      commentsToEditor.trim().length === 0 &&
      commentsToAuthor.trim().length === 0
    ) {
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
      setError(
        "Submit failed. The recommendation may not be valid for this round, or your session may have expired.",
      );
      toast.error("Couldn't submit your review.");
    } else {
      toast.success("Review submitted.", {
        description: "Thank you — the editor will be notified.",
      });
      onSubmitted();
    }
  };

  return (
    <form
      id="reviewer-submit-form"
      onSubmit={submit}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 320px",
        gap: 18,
        alignItems: "start",
      }}
    >
      <ReviewStepIndicator
        recommendation={recommendation}
        commentsAuthor={commentsToAuthor}
        commentsEditor={commentsToEditor}
      />
      {/* ─── Left column ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
        <RecommendationCard
          value={recommendation}
          onChange={setRecommendation}
        />

        <CommentsCard
          title="Comments to author"
          chipLabel="Visible to author"
          chipClass="chip-cobalt"
          value={commentsToAuthor}
          onChange={setCommentsToAuthor}
          rows={10}
          placeholder="Constructive, specific feedback the author will see. Cite line/section numbers where you can."
          footer={
            <span
              style={{
                fontSize: 11,
                color: "var(--muted)",
                fontFamily: "var(--mono)",
              }}
            >
              {wordCount} word{wordCount === 1 ? "" : "s"}
            </span>
          }
        />

        <CommentsCard
          title="Comments to editor only"
          chipLabel="Editor only"
          chipClass="chip-amber"
          value={commentsToEditor}
          onChange={setCommentsToEditor}
          rows={6}
          placeholder="Frank assessment shared only with the editor — confidence, conflicts, anything you don't want the author to see."
        />

        <Card>
          <h3 style={h3Style}>Competing interests</h3>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12.5,
              color: "var(--muted)",
            }}
          >
            Disclose any prior collaboration, financial interest, or personal
            relationship that could bias your review. Leave blank if none.
          </p>
          <input
            type="text"
            value={competingInterests}
            onChange={(e) => setCompetingInterests(e.target.value)}
            style={inputStyle}
            placeholder="e.g. co-authored a paper with the submitter in 2023"
          />
        </Card>

        {/* Attachments placeholder — the backend doesn't yet accept review
            attachments through this endpoint, so we render the design but
            disable interaction. Reviewers can still add attachments through
            the editor on request. */}
        <div
          style={{
            background: "var(--bg)",
            border: "2px dashed var(--border-strong)",
            borderRadius: "var(--r-2)",
            padding: 24,
            textAlign: "center",
            opacity: 0.65,
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 6 }}>↑</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
            Drag review attachments here, or browse
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--muted)",
              marginTop: 4,
              fontFamily: "var(--mono)",
            }}
          >
            (coming soon — attach files separately for now)
          </div>
        </div>

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

        {/* Bottom-of-form submit so the Submit action stays visible on long
            forms even when the page header scrolls off. */}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={busy} style={btnPrimary}>
            {busy ? "Submitting…" : "Submit review"}
          </button>
        </div>
      </div>

      {/* ─── Right rail ─── */}
      <aside
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "sticky",
          top: 16,
        }}
      >
        {manuscript ? (
          <SubmissionSummaryCard
            assignment={assignment}
            manuscript={manuscript}
          />
        ) : null}
        <ReviewerGuidelinesCard />
      </aside>
    </form>
  );
}

function RecommendationCard({
  value,
  onChange,
}: {
  value: Recommendation;
  onChange: (next: Recommendation) => void;
}): ReactNode {
  return (
    <Card>
      <h3 style={h3Style}>Your recommendation</h3>
      <p
        style={{
          margin: "0 0 14px",
          fontSize: 12.5,
          color: "var(--muted)",
        }}
      >
        Shared with the editor only — authors see only your written comments.
      </p>
      <div
        role="radiogroup"
        aria-label="Review recommendation"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {RECOMMENDATIONS.map((option) => {
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              style={{
                padding: 12,
                border: selected
                  ? "2px solid var(--cobalt)"
                  : "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                cursor: "pointer",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                background: selected ? "var(--cobalt-soft)" : "var(--bg)",
                // Compensate for 1→2px border to avoid 1px layout jump on
                // selection.
                margin: selected ? 0 : 1,
              }}
            >
              <input
                type="radio"
                name="recommendation"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              />
              <div
                aria-hidden
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  flex: "none",
                  marginTop: 2,
                  border: `2px solid ${
                    selected ? "var(--cobalt)" : "var(--border-strong)"
                  }`,
                  position: "relative",
                  background: "var(--bg)",
                }}
              >
                {selected ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 2,
                      borderRadius: "50%",
                      background: "var(--cobalt)",
                    }}
                  />
                ) : null}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 2,
                    color: "var(--fg)",
                  }}
                >
                  {option.label}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                  {option.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </Card>
  );
}

function CommentsCard({
  title,
  chipLabel,
  chipClass,
  value,
  onChange,
  rows,
  placeholder,
  footer,
}: {
  title: string;
  chipLabel: string;
  chipClass: string;
  value: string;
  onChange: (next: string) => void;
  rows: number;
  placeholder: string;
  footer?: ReactNode;
}): ReactNode {
  return (
    <Card>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          gap: 10,
        }}
      >
        <h3 style={h3Style}>{title}</h3>
        <span className={`chip ${chipClass}`}>{chipLabel}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          resize: "vertical",
          fontFamily: "var(--serif-body)",
          fontSize: 14,
          lineHeight: 1.6,
          width: "100%",
          boxSizing: "border-box",
          display: "block",
        }}
      />
      {footer ? (
        <div
          style={{
            marginTop: 6,
            textAlign: "right",
            color: "var(--muted)",
          }}
        >
          {footer}
        </div>
      ) : null}
    </Card>
  );
}

/**
 * Right-rail submission summary. Replaces the old full-width
 * {@code ManuscriptCard}: same data, denser layout, mono filenames, and
 * clearer "Authors anonymized" affordance for double-anonymous review.
 */
function SubmissionSummaryCard({
  assignment,
  manuscript,
}: {
  assignment: Assignment;
  manuscript: Manuscript;
}): ReactNode {
  const title = pickLocalized(manuscript.title, manuscript.locale) ?? "(untitled)";
  const abstractText = pickLocalized(manuscript.abstractText, manuscript.locale);
  const blinded = manuscript.reviewMethod === "DOUBLE_ANONYMOUS";
  const dueLabel = assignment.dateDue
    ? new Date(assignment.dateDue).toLocaleDateString()
    : assignment.dateResponseDue
      ? new Date(assignment.dateResponseDue).toLocaleDateString()
      : "—";

  return (
    <Card padded={false}>
      <div style={{ padding: "14px 16px" }}>
        <div className="sc" style={{ color: "var(--muted)", marginBottom: 10 }}>
          About this submission
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            lineHeight: 1.4,
            marginBottom: 6,
            fontFamily: "var(--serif-display)",
            color: "var(--fg)",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--muted)",
            fontFamily: "var(--serif-body)",
            fontStyle: "italic",
            marginBottom: 12,
          }}
        >
          {blinded ? "Authors anonymized" : "Authors visible to you"}
        </div>
        <dl
          style={{
            margin: 0,
            fontSize: 11,
            color: "var(--muted)",
            lineHeight: 1.7,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            columnGap: 10,
            rowGap: 0,
          }}
        >
          <dt style={metaTermStyle}>Round</dt>
          <dd style={metaDefStyle}>#{assignment.reviewRoundId}</dd>
          <dt style={metaTermStyle}>Type</dt>
          <dd style={metaDefStyle}>
            {(manuscript.reviewMethod ?? "—").replace(/_/g, " ").toLowerCase()}
          </dd>
          <dt style={metaTermStyle}>Due</dt>
          <dd style={metaDefStyle}>{dueLabel}</dd>
          <dt style={metaTermStyle}>Locale</dt>
          <dd style={metaDefStyle}>{manuscript.locale}</dd>
        </dl>
      </div>

      {abstractText ? (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg-tint)",
          }}
        >
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
            Abstract
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              fontFamily: "var(--serif-body)",
              lineHeight: 1.55,
              color: "var(--fg-2)",
              // Long abstracts in the rail get a polite cap so they don't
              // crowd the form. Reviewer can scroll inside.
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {abstractText}
          </p>
        </div>
      ) : null}

      {manuscript.keywords.length > 0 ? (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
            Keywords
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {manuscript.keywords.map((k) => (
              <span key={k} className="chip" style={{ fontSize: 10.5 }}>
                {k}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--muted)", marginBottom: 8 }}>
          Files ({manuscript.files.length})
        </div>
        {manuscript.files.length === 0 ? (
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            No files attached. Ask the editor to follow up.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {manuscript.files.map((f) => (
              <li
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 0",
                  borderBottom: "1px dashed var(--border)",
                }}
              >
                <span aria-hidden style={{ color: "var(--muted)", fontSize: 11 }}>
                  ▢
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      color: "var(--fg-2)",
                    }}
                  >
                    {f.filename}
                  </div>
                </div>
                <span
                  style={{
                    color: "var(--muted)",
                    fontFamily: "var(--mono)",
                    fontSize: 10.5,
                  }}
                >
                  {formatBytes(f.sizeBytes)}
                </span>
                {f.downloadUrl ? (
                  <a
                    href={f.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Download ${f.filename}`}
                    style={{
                      color: "var(--cobalt)",
                      textDecoration: "none",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    ↓
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function ReviewerGuidelinesCard(): ReactNode {
  return (
    <Card padded={false}>
      <div style={{ padding: "14px 16px" }}>
        <div className="sc" style={{ color: "var(--muted)", marginBottom: 10 }}>
          Reviewer guidelines
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: 18,
            fontSize: 12,
            lineHeight: 1.65,
            color: "var(--fg-2)",
          }}
        >
          <li>Be specific and constructive.</li>
          <li>Cite line or section numbers where possible.</li>
          <li>Distinguish major concerns from minor ones.</li>
          <li>Disclose any conflict of interest.</li>
          <li>Comments to the author should be ones you'd be comfortable signing.</li>
        </ul>
      </div>
    </Card>
  );
}

/**
 * Read-only blinded view rendered above the Respond and Closed cards
 * (the rich rail-mounted version is reserved for the active Submit phase).
 */
function ManuscriptPreview({
  manuscript,
}: {
  manuscript: Manuscript;
}): ReactNode {
  const title = pickLocalized(manuscript.title, manuscript.locale) ?? "(untitled)";
  const abstractText = pickLocalized(manuscript.abstractText, manuscript.locale);
  const blinded = manuscript.reviewMethod === "DOUBLE_ANONYMOUS";

  return (
    <Card padded={false}>
      <div
        style={{
          padding: "16px 22px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--serif-display)",
            fontSize: 19,
            fontWeight: 500,
            letterSpacing: "-0.005em",
          }}
        >
          Manuscript to review
        </h3>
        {blinded ? (
          <span
            className="chip"
            title="Authors are hidden from you under double-anonymous review."
          >
            Authors blinded
          </span>
        ) : null}
      </div>
      <div style={{ padding: "18px 22px" }}>
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--serif-display)",
            fontSize: 20,
            fontWeight: 500,
            letterSpacing: "-0.01em",
            lineHeight: 1.25,
          }}
        >
          {title}
        </p>
        {abstractText ? (
          <p
            style={{
              margin: "0 0 14px",
              fontFamily: "var(--serif-body)",
              fontSize: 14,
              lineHeight: 1.65,
              color: "var(--fg-2)",
            }}
          >
            {abstractText}
          </p>
        ) : (
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 13,
              color: "var(--muted)",
              fontStyle: "italic",
            }}
          >
            No abstract supplied with the submission.
          </p>
        )}
        {manuscript.keywords.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {manuscript.keywords.map((k) => (
              <span key={k} className="chip">
                {k}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div
        style={{
          padding: "12px 22px",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-tint)",
        }}
      >
        <div
          className="sc"
          style={{ color: "var(--muted)", marginBottom: 10 }}
        >
          Files ({manuscript.files.length})
        </div>
        {manuscript.files.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
            No files attached. Ask the editor to follow up with the author.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {manuscript.files.map((f) => (
              <li
                key={f.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: "1px dashed var(--border)",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.filename}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    {f.stage} · {f.contentType ?? "?"} · {formatBytes(f.sizeBytes)}
                  </div>
                </div>
                {f.downloadUrl ? (
                  <a
                    href={f.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: 12.5,
                      color: "var(--cobalt)",
                      textDecoration: "none",
                      fontWeight: 500,
                    }}
                  >
                    Download →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ─────────────────────── helpers ─────────────────────── */

function pickLocalized(
  map: Record<string, string> | undefined,
  preferred: string,
): string | undefined {
  if (!map) return undefined;
  const direct = map[preferred];
  if (direct && direct.trim().length > 0) return direct;
  return Object.values(map).find((v) => v && v.trim().length > 0);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.max(1, Math.round(kb))} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function wordsOf(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/\s+/).length;
}

/* ─────────────────────── styles ─────────────────────── */

const h2Style = {
  margin: "0 0 12px",
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 18,
};

const h3Style = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: "var(--sans)",
  color: "var(--fg)",
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

const metaTermStyle = {
  fontWeight: 500,
  color: "var(--fg-2)",
};

const metaDefStyle = {
  margin: 0,
  color: "var(--muted)",
};
