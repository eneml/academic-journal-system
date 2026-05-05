import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  CheckCheck,
  Download,
  FileIcon,
  FilePlus,
  Gavel,
  Globe,
  History,
  LibraryBig,
  Mail,
  Send,
  Trash2,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { components } from "@ajs/api-client/schema";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api, type Page } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";

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
      {/* Sticky page header — breadcrumb back-link + title + status pills.
          Contains the canonical "where am I" info that should never scroll
          out of sight while the editor moves through the workflow column. */}
      <div className="sticky top-14 z-30 -mx-6 px-6 -mt-6 pt-6 bg-bg-tint/95 backdrop-blur-sm border-b border-border pb-4 mb-6">
        <Link
          to="/editor/queue"
          className="text-[12px] text-muted hover:text-cobalt inline-flex items-center gap-1.5 mb-2"
        >
          <ArrowLeft className="size-3" /> Editorial / queue
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-cobalt-deep mb-1.5 font-mono">
              Submission · AJ-{String(submission.id ?? 0).padStart(4, "0")}
            </p>
            <h1 className="font-sans text-[22px] font-semibold tracking-[-0.015em] text-fg leading-tight m-0">
              {headerTitle}
            </h1>
            <div className="flex gap-2 items-center mt-3 flex-wrap">
              <StatusChip status={submission.status} />
              <StatusChip status={submission.stage} />
              <span className="text-[12px] text-muted font-mono inline-flex items-center gap-1">
                <Calendar className="size-3" />
                submitted{" "}
                {submission.dateSubmitted
                  ? new Date(submission.dateSubmitted).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Stage progress strip — five-segment progression so the editor
            sees workflow position at a glance without reading status text. */}
        <StageProgressStrip stage={submission.stage} />
      </div>

      {/* Two-column layout: workflow lives in the main column, reference
          metadata + files lives in the sticky right rail. The rail keeps
          contributors + files reachable without scrolling no matter how
          far down the editor is in the decision form / event log. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* MAIN — workflow */}
        <div className="flex flex-col gap-4 min-w-0">
          <MetadataView submission={submission} />
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
        </div>

        {/* RAIL — submission metadata + contributors + files */}
        <aside className="flex flex-col gap-3 xl:sticky xl:top-[14rem] xl:self-start xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto pr-1 -mr-1">
          <SubmissionAboutRail submission={submission} />
          <ContributorsRail authors={authors} />
          <FilesRail submissionId={submissionId} files={files} />
        </aside>
      </div>
    </>
  );
}

/**
 * Small five-segment stage indicator that lives under the page header.
 * Mirrors StageStepper from @ajs/ui but inline so the editor page can
 * show it without bringing along the legacy primitive.
 */
function StageProgressStrip({ stage }: { stage?: string }): ReactNode {
  const stages: Array<{ key: string; label: string }> = [
    { key: "SUBMISSION", label: "Submission" },
    { key: "EXTERNAL_REVIEW", label: "Review" },
    { key: "EDITING", label: "Editing" },
    { key: "PRODUCTION", label: "Production" },
    { key: "PUBLISHED", label: "Published" },
  ];
  const currentIndex = stages.findIndex((s) => s.key === stage);
  return (
    <div className="flex items-center gap-1.5 mt-4">
      {stages.map((s, idx) => {
        const isCurrent = idx === currentIndex;
        const isDone = currentIndex > -1 && idx < currentIndex;
        return (
          <div
            key={s.key}
            className="flex-1 flex flex-col gap-1.5 min-w-0"
            title={s.label}
          >
            <div
              className={`h-[3px] rounded-full transition-colors ${
                isCurrent
                  ? "bg-amber"
                  : isDone
                    ? "bg-cobalt"
                    : "bg-border-strong"
              }`}
            />
            <span
              className={`text-[10px] uppercase tracking-[0.06em] font-semibold truncate ${
                isCurrent
                  ? "text-amber-deep"
                  : isDone
                    ? "text-cobalt-deep"
                    : "text-muted-2"
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * "About this submission" rail card — section, locale, dates, who submitted.
 * The fields here are the ones an editor reaches for when triaging without
 * needing to scroll back to the top of the workflow column.
 */
function SubmissionAboutRail({
  submission,
}: {
  submission: Submission;
}): ReactNode {
  const submitted = submission.dateSubmitted
    ? new Date(submission.dateSubmitted).toLocaleDateString()
    : "—";
  const lastActivity = submission.dateLastActivity
    ? new Date(submission.dateLastActivity).toLocaleString()
    : "—";
  return (
    <Card padded={false}>
      <div className="px-4 py-3 border-b border-border">
        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">
          About
        </p>
      </div>
      <dl className="px-4 py-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[12.5px]">
        <DtIcon icon={LibraryBig}>Section</DtIcon>
        <dd className="m-0 text-fg-2 font-medium truncate">
          #{submission.sectionId ?? "—"}
        </dd>

        <DtIcon icon={Globe}>Locale</DtIcon>
        <dd className="m-0 text-fg-2 font-mono">{submission.locale ?? "—"}</dd>

        <DtIcon icon={Calendar}>Submitted</DtIcon>
        <dd className="m-0 text-fg-2 font-mono">{submitted}</dd>

        <DtIcon icon={History}>Last activity</DtIcon>
        <dd className="m-0 text-fg-2 font-mono text-[11.5px]">{lastActivity}</dd>

        <DtIcon icon={Users}>Submitter</DtIcon>
        <dd className="m-0 text-fg-2 font-mono">
          user #{submission.submittedByUserId ?? "—"}
        </dd>

        <DtIcon icon={FileIcon}>Version</DtIcon>
        <dd className="m-0 text-fg-2 font-mono">
          v{submission.version ?? 0}
        </dd>
      </dl>
    </Card>
  );
}

function DtIcon({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
}): ReactNode {
  return (
    <dt className="text-[10px] uppercase tracking-[0.06em] font-semibold text-muted inline-flex items-center gap-1.5 self-center">
      <Icon className="size-3 text-muted-2" />
      {children}
    </dt>
  );
}

/** Compact contributors list for the rail. */
function ContributorsRail({ authors }: { authors: AuthorRow[] }): ReactNode {
  if (authors.length === 0) {
    return (
      <Card padded={false}>
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">
            Contributors
          </p>
        </div>
        <p className="text-[12px] text-muted px-4 py-3 m-0">
          No contributors recorded.
        </p>
      </Card>
    );
  }
  const ordered = authors.slice().sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  return (
    <Card padded={false}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">
          Contributors
        </p>
        <Badge variant="ghost" className="font-mono">
          {authors.length}
        </Badge>
      </div>
      <ul className="divide-y divide-border">
        {ordered.map((a) => {
          const name = [a.givenName, a.familyName].filter(Boolean).join(" ");
          const initials = computeInitials(a.givenName ?? "", a.familyName ?? "");
          return (
            <li key={a.id} className="px-4 py-2.5 flex items-start gap-2.5">
              <span className="size-7 rounded-full bg-cobalt-soft text-cobalt-deep grid place-items-center font-semibold text-[10.5px] flex-none">
                {initials}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-serif-display text-[13px] font-medium text-fg m-0 truncate">
                  {name || "Unnamed contributor"}
                </p>
                {a.email ? (
                  <p className="text-[11px] text-muted font-mono truncate inline-flex items-center gap-1 m-0 mt-0.5">
                    <Mail className="size-2.5" />
                    {a.email}
                  </p>
                ) : null}
                {a.affiliation ? (
                  <p className="text-[11px] text-muted-2 truncate m-0 mt-0.5">
                    {a.affiliation}
                  </p>
                ) : null}
                {a.corresponding ? (
                  <Badge variant="cobalt" className="mt-1.5">
                    corresponding
                  </Badge>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Compact files list for the rail. */
function FilesRail({
  submissionId,
  files,
}: {
  submissionId: number;
  files: FileRow[];
}): ReactNode {
  return (
    <Card padded={false}>
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">
          Files
        </p>
        <Badge variant="ghost" className="font-mono">
          {files.length}
        </Badge>
      </div>
      {files.length === 0 ? (
        <p className="text-[12px] text-muted px-4 py-3 m-0">
          No files attached.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {files.map((f) => (
            <li
              key={f.id}
              className="px-4 py-2.5 flex items-center gap-2 group"
            >
              <FileIcon className="size-3.5 text-muted-2 flex-none" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-mono text-fg-2 truncate m-0">
                  {f.originalFilename ?? `File #${f.id}`}
                </p>
                <p className="text-[10px] text-muted font-mono uppercase tracking-wider mt-0.5 m-0">
                  {f.fileStage}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const url = await api<{ url: string }>(
                    `/api/v1/submissions/${submissionId}/files/${f.id}/download-url`,
                  );
                  if (url?.url) window.open(url.url, "_blank");
                  else toast.error("Couldn't generate download URL.");
                }}
                aria-label={`Download ${f.originalFilename ?? f.id}`}
                className="size-7 rounded-md grid place-items-center text-muted hover:text-cobalt hover:bg-bg-tint transition-colors flex-none"
              >
                <Download className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function computeInitials(given: string, family: string): string {
  const g = given.trim();
  const f = family.trim();
  if (g || f) return (g.charAt(0) + f.charAt(0)).toUpperCase() || "?";
  return "?";
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
        <h2 style={{ ...h2Style, marginBottom: 0 }} className="flex items-center gap-2">
          <History className="size-4 text-muted" />
          Event log ({entries.length})
        </h2>
        {entries.length > 8 ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show recent only" : "Show all"}
          </Button>
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
      toast.success("Publication drafted.", {
        description: "Fill in metadata, attach galleys, then publish.",
      });
      window.location.assign(`/editor/publications/${result.id}`);
    } else {
      toast.error("Couldn't draft a publication.");
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
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={draftFirst}
            disabled={busy}
          >
            <FilePlus />
            {busy ? "Drafting…" : "Draft first version"}
          </Button>
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
                    <Badge variant="cobalt" className="ml-2">
                      corresponding
                    </Badge>
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
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={async () => {
                  const url = await api<{ url: string }>(
                    `/api/v1/submissions/${submissionId}/files/${f.id}/download-url`,
                  );
                  if (url?.url) window.open(url.url, "_blank");
                  else toast.error("Couldn't generate download URL.");
                }}
              >
                <Download />
                Download
              </Button>
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
    const result = await api<ReviewRound>(
      `/api/v1/submissions/${submissionId}/review-rounds?stage=EXTERNAL_REVIEW`,
      { method: "POST" },
    );
    setBusy(false);
    if (result == null) {
      toast.error("Couldn't open a new review round.");
    } else {
      toast.success(`Round ${rounds.length + 1} opened.`, {
        description: "Invite reviewers below.",
      });
    }
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openRound}
          disabled={busy}
        >
          <UserPlus />
          {busy ? "Opening…" : `Open round ${rounds.length + 1}`}
        </Button>
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
      <div className="flex gap-2 items-center mb-3 pb-2 border-b border-border">
        <span className="size-6 rounded-md bg-cobalt-soft text-cobalt-deep grid place-items-center font-semibold text-[10.5px] tnum tabular-nums flex-none font-mono">
          R{round.roundNumber}
        </span>
        <p className="m-0 font-serif-display font-semibold text-[14px] flex-1">
          Round {round.roundNumber}
          <span className="text-muted font-normal font-sans ml-1.5">
            · {(round.stage ?? "").replace(/_/g, " ").toLowerCase()}
          </span>
        </p>
        <StatusChip status={round.status} />
      </div>
      {assignments == null ? (
        <p className="text-muted text-[12px] m-0">Loading reviewers…</p>
      ) : assignments.length === 0 ? (
        <p className="text-muted text-[12px] m-0 mb-2">
          No reviewers invited yet.
        </p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="rounded-md border border-border px-3 py-2.5 flex gap-2 items-center bg-bg-tint/30 hover:bg-bg-tint/60 transition-colors"
            >
              <span className="size-7 rounded-full bg-cobalt-soft text-cobalt-deep grid place-items-center font-semibold text-[10.5px] flex-none">
                R#{a.reviewerUserId}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-fg m-0 truncate">
                  Reviewer #{a.reviewerUserId}
                </p>
                <p className="text-[10.5px] text-muted font-mono uppercase tracking-wider mt-0.5 m-0">
                  {a.reviewMethod}
                </p>
              </div>
              <StatusChip status={a.status} />
              {a.recommendation ? (
                <Badge variant="cobalt">
                  {a.recommendation.replace(/_/g, " ").toLowerCase()}
                </Badge>
              ) : null}
              {a.status === "COMPLETED" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const result = await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}/confirm`,
                      { method: "POST" },
                    );
                    if (result == null) {
                      toast.error("Couldn't confirm the review.");
                    } else {
                      toast.success(`Confirmed reviewer #${a.reviewerUserId}.`);
                    }
                    void loadAssignments();
                    onChanged();
                  }}
                >
                  <CheckCheck />
                  Confirm
                </Button>
              ) : null}
              {a.status === "AWAITING_RESPONSE" || a.status === "ACCEPTED" ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`Cancel reviewer #${a.reviewerUserId}?`)) return;
                    const result = await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}`,
                      { method: "DELETE" },
                    );
                    if (result == null) {
                      toast.success(`Cancelled reviewer #${a.reviewerUserId}.`);
                    }
                    void loadAssignments();
                  }}
                >
                  <X />
                  Cancel
                </Button>
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAdding(true)}
            >
              <UserPlus />
              Invite reviewer
            </Button>
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
      toast.error("Invitation failed.");
    } else {
      toast.success("Reviewer invited.", {
        description: "They'll get an in-app notification + email.",
      });
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
      <div className="flex gap-1.5">
        <Button type="submit" disabled={busy}>
          <Send />
          {busy ? "Inviting…" : "Send invitation"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
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
      toast.error("Decision failed.");
    } else {
      toast.success(`Decision recorded: ${type.replace(/_/g, " ").toLowerCase()}.`);
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
          <Button type="submit" disabled={busy}>
            <Gavel />
            {busy ? "Recording…" : "Record decision"}
          </Button>
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
