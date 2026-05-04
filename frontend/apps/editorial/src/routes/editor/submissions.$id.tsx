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
import { isEditorial } from "../../auth/roles";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";

export const Route = createFileRoute("/editor/submissions/$id")({
  component: EditorialSubmissionDetailPage,
});

type Submission = components["schemas"]["SubmissionResponse"];
type AuthorRow = components["schemas"]["SubmissionAuthorResponse"];
type FileRow = components["schemas"]["SubmissionFileResponse"];
type ReviewRound = components["schemas"]["ReviewRoundResponse"];
type Assignment = components["schemas"]["ReviewAssignmentResponse"];
type Decision = components["schemas"]["EditorialDecisionResponse"];
type UserSummary = components["schemas"]["UserResponse"];
type Publication = components["schemas"]["PublicationResponse"];
type AuditEntry = components["schemas"]["EventLogEntrySummary"];

const DECISION_TYPES = [
  "EXTERNAL_REVIEW",
  "SKIP_REVIEW",
  "INITIAL_DECLINE",
  "ACCEPT",
  "DECLINE",
  "REQUEST_REVISIONS",
  "RESUBMIT_FOR_REVIEW",
  "NEW_REVIEW_ROUND",
  "CANCEL_REVIEW_ROUND",
  "SEND_TO_PRODUCTION",
  "BACK_FROM_PRODUCTION",
  "BACK_FROM_COPYEDITING",
] as const;
type DecisionType = (typeof DECISION_TYPES)[number];

const REVIEW_METHODS = ["OPEN", "ANONYMOUS", "DOUBLE_ANONYMOUS"] as const;
type ReviewMethod = (typeof REVIEW_METHODS)[number];

function EditorialSubmissionDetailPage(): ReactNode {
  const { id } = useParams({ from: "/editor/submissions/$id" });
  const { user, roles, loading: authLoading } = useAuth();
  const submissionId = Number.parseInt(id, 10);

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [rounds, setRounds] = useState<ReviewRound[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [s, a, f, r, d, p, log] = await Promise.all([
      api<Submission>(`/api/v1/submissions/${submissionId}`),
      api<AuthorRow[]>(`/api/v1/submissions/${submissionId}/authors`),
      api<FileRow[]>(`/api/v1/submissions/${submissionId}/files`),
      api<ReviewRound[]>(`/api/v1/submissions/${submissionId}/review-rounds`),
      api<Decision[]>(`/api/v1/submissions/${submissionId}/decisions`),
      api<Publication[]>(`/api/v1/submissions/${submissionId}/publications`),
      api<AuditEntry[]>(`/api/v1/submissions/${submissionId}/event-log`),
    ]);
    if (!s) {
      setErrored(true);
      return;
    }
    setErrored(false);
    setSubmission(s);
    setAuthors(a ?? []);
    setFiles(f ?? []);
    setRounds(r ?? []);
    setDecisions(d ?? []);
    setPublications(p ?? []);
    setAuditLog(log ?? []);
  }, [submissionId]);

  useEffect(() => {
    if (user && isEditorial(roles) && Number.isFinite(submissionId)) {
      void reload();
    }
  }, [user, roles, submissionId, reload]);

  if (authLoading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title={`Submission #${submissionId}`} />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="Only EDITOR / SECTION_EDITOR / ADMIN roles can review submissions."
        />
      </>
    );
  }
  if (!Number.isFinite(submissionId)) {
    return <EmptyState icon="alert" title="Invalid id" description="" />;
  }
  if (errored) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title={`Submission #${submissionId}`} />
        <EmptyState
          icon="alert"
          title="Submission unavailable"
          description="It may not exist."
        />
      </>
    );
  }
  if (!submission) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading&hellip;</p>;
  }

  const headerTitle =
    submission.title?.en ??
    (submission.title ? Object.values(submission.title)[0] : null) ??
    `Submission #${submission.id}`;
  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1]! : null;

  return (
    <>
      <p style={{ margin: "0 0 6px", fontSize: 12 }}>
        <Link to="/editor/queue" className="hover:text-cobalt">
          ← Editorial / queue
        </Link>
      </p>
      <PageHeader eyebrow="Editorial" title={headerTitle} />
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "baseline",
          marginBottom: 22,
          flexWrap: "wrap",
        }}
      >
        <StatusChip status={submission.status} />
        <StatusChip status={submission.stage} />
        <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--mono)" }}>
          submitted{" "}
          {submission.dateSubmitted
            ? new Date(submission.dateSubmitted).toLocaleDateString()
            : "—"}
        </span>
      </div>

      <MetadataView submission={submission} />
      <AuthorsView authors={authors} />
      <FilesView submissionId={submissionId} files={files} />
      <RoundsCard
        submissionId={submissionId}
        rounds={rounds}
        onChanged={() => void reload()}
      />
      <DecisionCard
        submissionId={submissionId}
        latestRound={latestRound}
        history={decisions}
        onChanged={() => void reload()}
      />

      <PublicationsCard
        submissionId={submissionId}
        publications={publications}
        onChanged={() => void reload()}
      />

      <AuditLogCard entries={auditLog} />
    </>
  );
}

function AuditLogCard({ entries }: { entries: AuditEntry[] }): ReactNode {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? entries : entries.slice(0, 8);
  return (
    <Card padded={false}>
      <div
        style={{
          padding: "16px 22px",
          borderBottom: entries.length > 0 ? "1px solid var(--border)" : "none",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ ...h2Style, marginBottom: 0 }}>
          Event log ({entries.length})
        </h2>
        {entries.length > 8 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            style={btnSecondary}
          >
            {expanded ? "Show recent only" : "Show all"}
          </button>
        ) : null}
      </div>
      {entries.length === 0 ? (
        <p style={{ padding: "12px 22px 18px", color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No events recorded yet.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {visible
            .slice()
            .sort((a, b) =>
              (b.occurredAt ?? "").localeCompare(a.occurredAt ?? ""),
            )
            .map((e, idx) => (
              <li
                key={e.id}
                style={{
                  padding: "10px 22px",
                  borderBottom:
                    idx < visible.length - 1 ? "1px solid var(--border)" : "none",
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "baseline",
                  fontSize: 13,
                }}
              >
                <span
                  className="tnum"
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                    minWidth: 36,
                  }}
                >
                  #{e.id}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--mono)",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {e.eventType}
                  </p>
                  {e.actorUserId ? (
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 11,
                        color: "var(--muted)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      actor: user #{e.actorUserId}
                    </p>
                  ) : null}
                  {e.payload && Object.keys(e.payload).length > 0 ? (
                    <pre
                      style={{
                        margin: "4px 0 0",
                        padding: "6px 8px",
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-1)",
                        fontFamily: "var(--mono)",
                        fontSize: 10.5,
                        color: "var(--fg-2)",
                        overflow: "auto",
                        maxHeight: 120,
                      }}
                    >
                      {JSON.stringify(e.payload, null, 2)}
                    </pre>
                  ) : null}
                </div>
                <span
                  className="tnum"
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.occurredAt ? new Date(e.occurredAt).toLocaleString() : ""}
                </span>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}

function PublicationsCard({
  submissionId,
  publications,
  onChanged,
}: {
  submissionId: number;
  publications: Publication[];
  onChanged: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);

  const draftFirst = async (): Promise<void> => {
    setBusy(true);
    const result = await api<Publication>(
      `/api/v1/submissions/${submissionId}/publications`,
      { method: "POST" },
    );
    setBusy(false);
    if (result?.id) {
      window.location.assign(`/editor/publications/${result.id}`);
    } else {
      onChanged();
    }
  };

  return (
    <Card padded={false}>
      <div
        style={{
          padding: "16px 22px",
          borderBottom: publications.length > 0 ? "1px solid var(--border)" : "none",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ ...h2Style, marginBottom: 0 }}>
          Publications ({publications.length})
        </h2>
        {publications.length === 0 ? (
          <button type="button" onClick={draftFirst} disabled={busy} style={btnSecondary}>
            {busy ? "Drafting…" : "Draft first version"}
          </button>
        ) : null}
      </div>
      {publications.length === 0 ? (
        <p style={{ padding: "12px 22px 18px", color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No publications yet — usually drafted automatically after a SEND_TO_PRODUCTION decision.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {publications.map((p, idx) => (
            <li
              key={p.id}
              style={{
                padding: "12px 22px",
                borderBottom:
                  idx < publications.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontWeight: 600,
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  Version {p.version}
                </p>
                <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  <StatusChip status={p.status} />
                  <StatusChip status={p.accessStatus} />
                  {p.urlPath ? (
                    <span
                      className="chip"
                      style={{ fontFamily: "var(--mono)", fontSize: 10 }}
                    >
                      /{p.urlPath}
                    </span>
                  ) : null}
                </div>
              </div>
              <Link
                to="/editor/publications/$id"
                params={{ id: String(p.id) }}
                style={{
                  ...btnSecondary,
                  textDecoration: "none",
                }}
              >
                Open editor
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------- Metadata ----------

function MetadataView({ submission }: { submission: Submission }): ReactNode {
  const locale = submission.locale ?? "en";
  const abstractText = submission.abstractText?.[locale] ?? "";
  const keywords = (submission.keywords ?? []).join(", ");
  return (
    <Card>
      <h2 style={h2Style}>Manuscript</h2>
      <Field label="Abstract">
        <span style={{ whiteSpace: "pre-wrap" }}>{abstractText || "—"}</span>
      </Field>
      <Field label="Keywords">{keywords || "—"}</Field>
      {submission.commentsToEditor ? (
        <Field label="Comments from author to editor">
          <span style={{ whiteSpace: "pre-wrap" }}>{submission.commentsToEditor}</span>
        </Field>
      ) : null}
    </Card>
  );
}

function AuthorsView({ authors }: { authors: AuthorRow[] }): ReactNode {
  return (
    <Card padded={false}>
      <div style={{ padding: "16px 22px 0" }}>
        <h2 style={h2Style}>Contributors ({authors.length})</h2>
      </div>
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {authors.length === 0 ? (
          <li style={{ padding: "12px 22px 18px", color: "var(--muted)", fontSize: 13 }}>
            No contributors recorded.
          </li>
        ) : (
          authors
            .slice()
            .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
            .map((author, idx) => (
              <li
                key={author.id}
                style={{
                  padding: "10px 22px",
                  borderTop: idx === 0 ? "1px solid var(--border)" : "none",
                  borderBottom:
                    idx < authors.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {[author.givenName, author.familyName].filter(Boolean).join(" ")}{" "}
                  {author.corresponding ? (
                    <span className="chip chip-cobalt" style={{ marginLeft: 6 }}>
                      corresponding
                    </span>
                  ) : null}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 11,
                    color: "var(--muted)",
                    margin: "3px 0 0",
                  }}
                >
                  {author.email}
                  {author.affiliation ? ` · ${author.affiliation}` : ""}
                  {author.orcidId ? ` · ${author.orcidId}` : ""}
                </p>
              </li>
            ))
        )}
      </ul>
    </Card>
  );
}

function FilesView({
  submissionId,
  files,
}: {
  submissionId: number;
  files: FileRow[];
}): ReactNode {
  return (
    <Card padded={false}>
      <div style={{ padding: "16px 22px 0" }}>
        <h2 style={h2Style}>Files ({files.length})</h2>
      </div>
      {files.length === 0 ? (
        <p
          style={{
            padding: "12px 22px 18px",
            color: "var(--muted)",
            fontSize: 13,
            margin: 0,
          }}
        >
          No files attached.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {files.map((f, idx) => (
            <li
              key={f.id}
              style={{
                padding: "10px 22px",
                borderTop: idx === 0 ? "1px solid var(--border)" : "none",
                borderBottom: idx < files.length - 1 ? "1px solid var(--border)" : "none",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "var(--serif-display)",
                    fontSize: 13.5,
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {f.originalFilename ?? `File #${f.id}`}
                </p>
                <p
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 10.5,
                    color: "var(--muted)",
                    margin: "2px 0 0",
                  }}
                >
                  {f.fileStage} · {f.contentType ?? "?"}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = await api<{ url: string }>(
                    `/api/v1/submissions/${submissionId}/files/${f.id}/download-url`,
                  );
                  if (url?.url) window.open(url.url, "_blank");
                }}
                style={btnSecondary}
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------- Review rounds + invitations + reviews ----------

function RoundsCard({
  submissionId,
  rounds,
  onChanged,
}: {
  submissionId: number;
  rounds: ReviewRound[];
  onChanged: () => void;
}): ReactNode {
  const [busy, setBusy] = useState(false);

  const openRound = async (): Promise<void> => {
    setBusy(true);
    await api<ReviewRound>(
      `/api/v1/submissions/${submissionId}/review-rounds?stage=EXTERNAL_REVIEW`,
      { method: "POST" },
    );
    setBusy(false);
    onChanged();
  };

  return (
    <Card padded={false}>
      <div
        style={{
          padding: "16px 22px",
          borderBottom: rounds.length > 0 ? "1px solid var(--border)" : "none",
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2 style={{ ...h2Style, marginBottom: 0 }}>Peer review</h2>
        <button type="button" onClick={openRound} disabled={busy} style={btnSecondary}>
          {busy ? "Opening…" : `Open round ${rounds.length + 1}`}
        </button>
      </div>
      {rounds.length === 0 ? (
        <p style={{ padding: "12px 22px 18px", color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No review rounds yet — open the first one above to start inviting reviewers.
        </p>
      ) : (
        rounds.map((round) => (
          <ReviewRoundView
            key={round.id}
            submissionId={submissionId}
            round={round}
            onChanged={onChanged}
          />
        ))
      )}
    </Card>
  );
}

function ReviewRoundView({
  submissionId,
  round,
  onChanged,
}: {
  submissionId: number;
  round: ReviewRound;
  onChanged: () => void;
}): ReactNode {
  const [assignments, setAssignments] = useState<Assignment[] | null>(null);
  const [adding, setAdding] = useState(false);

  const loadAssignments = useCallback(async (): Promise<void> => {
    const list = await api<Assignment[]>(
      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments`,
    );
    setAssignments(list ?? []);
  }, [submissionId, round.id]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  return (
    <section style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 8 }}>
        <p style={{ margin: 0, fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 14 }}>
          Round {round.roundNumber} · {round.stage}
        </p>
        <StatusChip status={round.status} />
      </div>
      {assignments == null ? (
        <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading reviewers&hellip;</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 8px" }}>
          No reviewers invited yet.
        </p>
      ) : (
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {assignments.map((a) => (
            <li
              key={a.id}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ flex: 1, fontSize: 13 }}>
                Reviewer #{a.reviewerUserId} · {a.reviewMethod}
              </span>
              <StatusChip status={a.status} />
              {a.recommendation ? (
                <span className="chip chip-cobalt">
                  {a.recommendation.replace(/_/g, " ").toLowerCase()}
                </span>
              ) : null}
              {a.status === "COMPLETED" ? (
                <button
                  type="button"
                  onClick={async () => {
                    await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}/confirm`,
                      { method: "POST" },
                    );
                    void loadAssignments();
                    onChanged();
                  }}
                  style={btnSecondary}
                >
                  Confirm
                </button>
              ) : null}
              {a.status === "AWAITING_RESPONSE" || a.status === "ACCEPTED" ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`Cancel reviewer #${a.reviewerUserId}?`)) return;
                    await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}`,
                      { method: "DELETE" },
                    );
                    void loadAssignments();
                  }}
                  style={{
                    ...btnSecondary,
                    color: "#b91c1c",
                    borderColor: "#fca5a5",
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {round.status === "PENDING_REVIEWERS" || round.status === "IN_PROGRESS" ? (
        <div style={{ marginTop: 10 }}>
          {adding ? (
            <InviteForm
              submissionId={submissionId}
              roundId={round.id ?? 0}
              onInvited={() => {
                setAdding(false);
                void loadAssignments();
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button type="button" onClick={() => setAdding(true)} style={btnSecondary}>
              + Invite reviewer
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

function InviteForm({
  submissionId,
  roundId,
  onInvited,
  onCancel,
}: {
  submissionId: number;
  roundId: number;
  onInvited: () => void;
  onCancel: () => void;
}): ReactNode {
  const [reviewers, setReviewers] = useState<UserSummary[] | null>(null);
  const [reviewerUserId, setReviewerUserId] = useState<string>("");
  const [reviewMethod, setReviewMethod] = useState<ReviewMethod>("DOUBLE_ANONYMOUS");
  const [responseDue, setResponseDue] = useState("");
  const [reviewDue, setReviewDue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Pull reviewer-eligible users; admin-only endpoint, but editors fall back gracefully
      const data = await api<Page<UserSummary>>("/api/v1/users?size=200");
      if (cancelled) return;
      const list = data?.content ?? [];
      setReviewers(list);
      if (list[0]?.id != null) setReviewerUserId(String(list[0].id));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const id = Number.parseInt(reviewerUserId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Pick a reviewer");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await api<Assignment>(
      `/api/v1/submissions/${submissionId}/review-rounds/${roundId}/assignments`,
      {
        method: "POST",
        body: {
          reviewerUserId: id,
          reviewMethod,
          dateResponseDue: responseDue
            ? new Date(responseDue + "T23:59:59Z").toISOString()
            : null,
          dateDue: reviewDue
            ? new Date(reviewDue + "T23:59:59Z").toISOString()
            : null,
        },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Invitation failed. The reviewer may already be on this round.");
    } else {
      onInvited();
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        marginTop: 8,
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2)",
        background: "var(--surface)",
        display: "grid",
        gap: 10,
      }}
    >
      {reviewers == null ? (
        <p style={{ color: "var(--muted)", fontSize: 12 }}>Loading reviewer list&hellip;</p>
      ) : reviewers.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 12 }}>
          No users available — admins can invite by user id directly via the API.
        </p>
      ) : (
        <label style={lblStyle}>
          Reviewer
          <select
            value={reviewerUserId}
            onChange={(e) => setReviewerUserId(e.target.value)}
            style={inputStyle}
          >
            {reviewers.map((u) => (
              <option key={u.id} value={String(u.id)}>
                {[u.givenName, u.familyName].filter(Boolean).join(" ") || u.email} · #{u.id}
              </option>
            ))}
          </select>
        </label>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label style={lblStyle}>
          Review method
          <select
            value={reviewMethod}
            onChange={(e) => setReviewMethod(e.target.value as ReviewMethod)}
            style={inputStyle}
          >
            {REVIEW_METHODS.map((m) => (
              <option key={m} value={m}>
                {m.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label style={lblStyle}>
          Respond by
          <input
            type="date"
            value={responseDue}
            onChange={(e) => setResponseDue(e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={lblStyle}>
          Review due
          <input
            type="date"
            value={reviewDue}
            onChange={(e) => setReviewDue(e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
      {error ? (
        <p
          style={{
            margin: 0,
            padding: "8px 10px",
            border: "1px solid #fca5a5",
            background: "#fff5f5",
            color: "#b91c1c",
            borderRadius: "var(--r-1)",
            fontSize: 12,
          }}
        >
          {error}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: 6 }}>
        <button type="submit" disabled={busy} style={btnPrimary}>
          {busy ? "Inviting…" : "Send invitation"}
        </button>
        <button type="button" onClick={onCancel} style={btnSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- Decisions ----------

function DecisionCard({
  submissionId,
  latestRound,
  history,
  onChanged,
}: {
  submissionId: number;
  latestRound: ReviewRound | null;
  history: Decision[];
  onChanged: () => void;
}): ReactNode {
  const [type, setType] = useState<DecisionType>("EXTERNAL_REVIEW");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await api<Decision>(
      `/api/v1/submissions/${submissionId}/decisions`,
      {
        method: "POST",
        body: {
          type,
          reviewRoundId: latestRound?.id ?? null,
          summary: summary.trim() || null,
        },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Decision failed — it may not be valid for the current stage.");
    } else {
      setSummary("");
      onChanged();
    }
  };

  return (
    <Card>
      <h2 style={h2Style}>Editorial decisions</h2>

      {history.length > 0 ? (
        <ul
          style={{
            margin: "0 0 16px",
            padding: 0,
            listStyle: "none",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-2)",
            background: "var(--surface)",
          }}
        >
          {history.map((d, idx) => (
            <li
              key={d.id}
              style={{
                padding: "10px 12px",
                borderBottom: idx < history.length - 1 ? "1px solid var(--border)" : "none",
                fontSize: 13,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                <strong style={{ fontFamily: "var(--mono)", fontSize: 12 }}>
                  {d.decisionType}
                </strong>
                <StatusChip status={d.newStage} />
                <StatusChip status={d.newStatus} />
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    color: "var(--muted)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  {d.dateDecided ? new Date(d.dateDecided).toLocaleString() : ""}
                </span>
              </div>
              {d.summary ? (
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "var(--fg-2)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {d.summary}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <label style={lblStyle}>
          Take a decision
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DecisionType)}
            style={inputStyle}
          >
            {DECISION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ").toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label style={lblStyle}>
          Summary / notes (optional)
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "var(--serif-body)" }}
          />
        </label>
        {latestRound ? (
          <p style={{ margin: 0, fontSize: 11, color: "var(--muted)", fontFamily: "var(--mono)" }}>
            Will be attached to round #{latestRound.roundNumber}
          </p>
        ) : null}
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
            {busy ? "Recording…" : "Record decision"}
          </button>
        </div>
      </form>
    </Card>
  );
}

// ---------- helpers ----------

function Field({ label, children }: { label: string; children: ReactNode }): ReactNode {
  return (
    <div style={{ marginBottom: 12 }}>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontFamily: "var(--sans)",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontWeight: 600,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "3px 0 0",
          fontFamily: "var(--serif-body)",
          fontSize: 14,
          color: "var(--fg)",
        }}
      >
        {children}
      </p>
    </div>
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
  padding: "9px 16px",
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
  padding: "8px 14px",
  background: "white",
  color: "var(--fg-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 12,
  cursor: "pointer",
};
