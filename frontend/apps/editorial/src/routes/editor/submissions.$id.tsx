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
import { Badge } from "@ajs/ui";
import { Button } from "@ajs/ui";

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
type Participant = components["schemas"]["StageParticipantSummary"];
type Discussion = components["schemas"]["DiscussionSummary"];
type DiscussionMessage = components["schemas"]["DiscussionMessageSummary"];
type ReviewerSuggestion = components["schemas"]["ReviewerSuggestionSummary"];
type StageRole = NonNullable<Participant["role"]>;
type Stage = NonNullable<Participant["stage"]>;

const STAGE_ROLES: StageRole[] = ["EDITOR", "SECTION_EDITOR", "AUTHOR", "PRODUCTION_STAFF"];
const STAGE_ORDER: Stage[] = ["SUBMISSION", "EXTERNAL_REVIEW", "EDITING", "PRODUCTION", "PUBLISHED"];

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
  "RECOMMEND_ACCEPT",
  "RECOMMEND_DECLINE",
  "RECOMMEND_REVISIONS",
  "RECOMMEND_RESUBMIT",
  "REVERT_DECLINE",
  "REVERT_INITIAL_DECLINE",
] as const;
type DecisionType = (typeof DECISION_TYPES)[number];

const RECOMMEND_TYPES: DecisionType[] = [
  "RECOMMEND_ACCEPT",
  "RECOMMEND_DECLINE",
  "RECOMMEND_REVISIONS",
  "RECOMMEND_RESUBMIT",
];

function isRecommendation(t: DecisionType): boolean {
  return RECOMMEND_TYPES.includes(t);
}

/**
 * True when the current user's stage assignment for the submission's
 * current stage carries {@code recommendOnly=true}. Section editors in
 * that mode see only the four RECOMMEND_* options. Admins always see
 * everything.
 */
function resolveRecommendOnly(
  participants: Participant[],
  meId: number | null,
  stage: string | undefined,
  roles: readonly string[],
): boolean {
  if (!meId || !stage) return false;
  if (roles.includes("ADMIN")) return false;
  const mine = participants.find(
    (p) => p.userId === meId && p.stage === stage,
  );
  return mine?.recommendOnly === true;
}

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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [meId, setMeId] = useState<number | null>(null);
  const [errored, setErrored] = useState(false);

  const reload = useCallback(async (): Promise<void> => {
    const [s, a, f, r, d, p, log, parts, me] = await Promise.all([
      api<Submission>(`/api/v1/submissions/${submissionId}`),
      api<AuthorRow[]>(`/api/v1/submissions/${submissionId}/authors`),
      api<FileRow[]>(`/api/v1/submissions/${submissionId}/files`),
      api<ReviewRound[]>(`/api/v1/submissions/${submissionId}/review-rounds`),
      api<Decision[]>(`/api/v1/submissions/${submissionId}/decisions`),
      api<Publication[]>(`/api/v1/submissions/${submissionId}/publications`),
      api<AuditEntry[]>(`/api/v1/submissions/${submissionId}/event-log`),
      api<Participant[]>(`/api/v1/submissions/${submissionId}/participants`),
      api<{ id?: number }>(`/api/v1/users/me`),
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
    setParticipants(parts ?? []);
    setMeId(me?.id ?? null);
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

        <WorkflowTabStrip />
      </div>

      {/* Two-column layout: workflow lives in the main column, reference
          metadata + files lives in the sticky right rail. The rail keeps
          contributors + files reachable without scrolling no matter how
          far down the editor is in the decision form / event log. */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* MAIN — workflow */}
        <div className="flex flex-col gap-4 min-w-0">
          <div id="tab-submission" className="scroll-mt-44">
            <MetadataView submission={submission} />
          </div>
          <div id="tab-review" className="scroll-mt-44">
            <RoundsCard
              submissionId={submissionId}
              rounds={rounds}
              onChanged={() => void reload()}
            />
            <ReviewerSuggestionsCard submissionId={submissionId} />
          </div>
          <div id="tab-workflow" className="scroll-mt-44">
            <DecisionCard
              submissionId={submissionId}
              submission={submission}
              latestRound={latestRound}
              history={decisions}
              onChanged={() => void reload()}
              recommendOnly={resolveRecommendOnly(participants, meId, submission.stage, roles)}
            />
          </div>
          <div id="tab-publication" className="scroll-mt-44">
            <PublicationsCard
              submissionId={submissionId}
              publications={publications}
              onChanged={() => void reload()}
            />
          </div>
          <div id="tab-participants" className="scroll-mt-44">
            <ParticipantsCard
              submissionId={submissionId}
              participants={participants}
              onChanged={() => void reload()}
            />
          </div>
          <div id="tab-discussions" className="scroll-mt-44">
            <DiscussionsCard
              submissionId={submissionId}
              currentStage={(submission.stage as Stage | undefined) ?? "SUBMISSION"}
              participants={participants}
            />
          </div>
          <div id="tab-history" className="scroll-mt-44">
            <AuditLogCard entries={auditLog} />
          </div>
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
 * In-page tab strip — anchor-jumps to the matching card sections so the
 * editor can navigate the workflow detail without scrolling. Tabs that have
 * no backing data today render in a muted state.
 */
function WorkflowTabStrip(): ReactNode {
  const TABS = [
    { id: "workflow", label: "Workflow", live: true },
    { id: "submission", label: "Submission", live: true },
    { id: "review", label: "Review", live: true },
    { id: "editing", label: "Editing", live: false },
    { id: "production", label: "Production", live: false },
    { id: "publication", label: "Publication", live: true },
    { id: "participants", label: "Participants", live: true },
    { id: "discussions", label: "Discussions", live: true },
    { id: "history", label: "History", live: true },
  ];
  return (
    <div className="-mb-px mt-3 flex flex-wrap gap-0 border-b border-border">
      {TABS.map((tab) => (
        <a
          key={tab.id}
          href={tab.live ? `#tab-${tab.id}` : undefined}
          aria-disabled={!tab.live}
          className={`-mb-px border-b-2 px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors ${
            tab.live
              ? "border-transparent text-fg-2 hover:border-cobalt hover:text-fg"
              : "cursor-not-allowed border-transparent text-muted-2"
          }`}
        >
          {tab.label}
        </a>
      ))}
    </div>
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
                <p className="text-[10px] text-muted font-mono uppercase tracking-wider mt-0.5 m-0 flex items-center gap-1.5">
                  {f.fileStage}
                  {f.fileStage === "REVIEW_ATTACHMENT" ? (
                    <Badge variant="cobalt" className="font-sans">
                      from reviewer
                    </Badge>
                  ) : null}
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
              {a.status === "AWAITING_RESPONSE" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const result = await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}/resend`,
                      { method: "POST" },
                    );
                    if (result == null) {
                      toast.error("Couldn't resend invitation.");
                    } else {
                      toast.success(`Re-sent invitation to reviewer #${a.reviewerUserId}.`);
                    }
                    void loadAssignments();
                  }}
                >
                  <Send />
                  Resend
                </Button>
              ) : null}
              {a.status === "DECLINED" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    const result = await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}/reinstate`,
                      { method: "POST" },
                    );
                    if (result == null) {
                      toast.error("Couldn't reinstate the assignment.");
                    } else {
                      toast.success(`Reinstated reviewer #${a.reviewerUserId}.`);
                    }
                    void loadAssignments();
                    onChanged();
                  }}
                >
                  <UserPlus />
                  Reinstate
                </Button>
              ) : null}
              {a.status === "AWAITING_RESPONSE"
                || a.status === "ACCEPTED"
                || a.status === "IN_PROGRESS" ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (!confirm(`Unassign reviewer #${a.reviewerUserId}?`)) return;
                    const result = await api(
                      `/api/v1/submissions/${submissionId}/review-rounds/${round.id}/assignments/${a.id}/unassign`,
                      { method: "POST" },
                    );
                    if (result == null) {
                      toast.error("Couldn't unassign the reviewer.");
                    } else {
                      toast.success(`Unassigned reviewer #${a.reviewerUserId}.`);
                    }
                    void loadAssignments();
                    onChanged();
                  }}
                >
                  <X />
                  Unassign
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

type DecisionPreview = components["schemas"]["DecisionPreviewResponse"];
type DecisionEmailPreview = components["schemas"]["DecisionEmailPreview"];
type EmailRenderResponse = components["schemas"]["EmailTemplateRenderResponse"];

interface WizardEmailDraft {
  stepId: string;
  templateKey: string;
  recipientUserIds: number[];
  recipientLabel: string;
  locale: string;
  subject: string;
  body: string;
  configured: boolean;
  skipped: boolean;
}

function DecisionCard({
  submissionId,
  submission,
  latestRound,
  history,
  onChanged,
  recommendOnly,
}: {
  submissionId: number;
  submission: Submission;
  latestRound: ReviewRound | null;
  history: Decision[];
  onChanged: () => void;
  recommendOnly: boolean;
}): ReactNode {
  const visibleTypes: DecisionType[] = recommendOnly
    ? [...RECOMMEND_TYPES]
    : DECISION_TYPES.filter((t) => !isRecommendation(t));
  const [type, setType] = useState<DecisionType>(
    recommendOnly ? "RECOMMEND_ACCEPT" : "EXTERNAL_REVIEW",
  );
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wizard, setWizard] = useState<{
    preview: DecisionPreview;
    drafts: WizardEmailDraft[];
  } | null>(null);

  const openWizard = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const preview = await api<DecisionPreview>(
      `/api/v1/submissions/${submissionId}/decisions/preview`,
      {
        method: "POST",
        body: {
          type,
          reviewRoundId: latestRound?.id ?? null,
        },
      },
    );
    if (!preview) {
      setBusy(false);
      setError("Preview failed — this decision may not be valid for the current stage.");
      toast.error("Preview failed.");
      return;
    }
    const steps: DecisionEmailPreview[] = preview.emailSteps ?? [];
    const journalConfig = await api<{ name?: Record<string, string>; defaultLocale?: string }>(
      "/api/v1/journal/config",
    );
    const drafts: WizardEmailDraft[] = await Promise.all(
      steps.map(async (s) => {
        const recipient = (s.recipients ?? [])[0];
        const submissionTitle =
          submission.title?.[s.locale ?? "en"] ??
          (submission.title ? Object.values(submission.title)[0] : null) ??
          `Submission #${submission.id}`;
        const journalName =
          (journalConfig?.name?.[s.locale ?? "en"] as string | undefined) ??
          (journalConfig?.name
            ? (Object.values(journalConfig.name)[0] as string)
            : "The Academic Journal");
        const baseUrl = window.location.origin;
        const vars = {
          recipient: {
            givenName: recipient?.fullName?.split(" ")[0] ?? "",
            familyName: recipient?.fullName?.split(" ").slice(1).join(" ") ?? "",
            fullName: recipient?.fullName ?? "",
            email: recipient?.email ?? "",
          },
          submission: {
            id: submission.id,
            title: submissionTitle,
            url: `${baseUrl}/author/submissions/${submission.id}`,
          },
          journal: { name: journalName, url: window.location.origin.replace(":5173", ":3000") },
          decision: { type },
        };
        const rendered = await api<EmailRenderResponse>(
          `/api/v1/email-templates/${encodeURIComponent(s.templateKey ?? "")}/render`,
          {
            method: "POST",
            body: { locale: s.locale ?? "en", vars },
          },
        );
        return {
          stepId: s.stepId ?? "step",
          templateKey: s.templateKey ?? "",
          recipientUserIds: (s.recipients ?? [])
            .map((r) => r.userId)
            .filter((id): id is number => id != null),
          recipientLabel:
            recipient?.fullName ?? recipient?.email ?? `User #${recipient?.userId ?? "?"}`,
          locale: rendered?.locale ?? s.locale ?? "en",
          subject: rendered?.subject ?? "",
          body: rendered?.body ?? "",
          configured: rendered?.configured ?? false,
          skipped: false,
        };
      }),
    );
    setBusy(false);
    setWizard({ preview, drafts });
  };

  const commit = async (): Promise<void> => {
    if (!wizard) return;
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
          emailOverrides: wizard.drafts.map((d) => ({
            stepId: d.stepId,
            templateKey: d.templateKey,
            skipped: d.skipped,
            subject: d.subject,
            body: d.body,
            recipientUserIds: d.recipientUserIds,
          })),
        },
      },
    );
    setBusy(false);
    if (result === null) {
      setError("Decision failed.");
      toast.error("Decision failed.");
      return;
    }
    toast.success(`Decision recorded: ${type.replace(/_/g, " ").toLowerCase()}.`);
    setSummary("");
    setWizard(null);
    onChanged();
  };

  const submit = openWizard;

  return (
    <Card>
      <h2 style={h2Style}>
        {recommendOnly ? "Recommendations" : "Editorial decisions"}
      </h2>
      {recommendOnly && (
        <p
          style={{
            margin: "0 0 12px 0",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          You are assigned as section editor with recommend-only authority.
          Your input is recorded as a recommendation; the deciding editor
          takes the terminal call.
        </p>
      )}

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
            {visibleTypes.map((t) => (
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
            {busy ? "Loading preview…" : "Continue → Preview email"}
          </Button>
        </div>
      </form>

      {wizard && (
        <DecisionWizardDrawer
          preview={wizard.preview}
          drafts={wizard.drafts}
          summary={summary}
          busy={busy}
          onChange={(drafts) => setWizard({ ...wizard, drafts })}
          onClose={() => setWizard(null)}
          onCommit={() => void commit()}
        />
      )}
    </Card>
  );
}

interface WizardDrawerProps {
  preview: DecisionPreview;
  drafts: WizardEmailDraft[];
  summary: string;
  busy: boolean;
  onChange: (drafts: WizardEmailDraft[]) => void;
  onClose: () => void;
  onCommit: () => void;
}

function DecisionWizardDrawer({
  preview,
  drafts,
  summary,
  busy,
  onChange,
  onClose,
  onCommit,
}: WizardDrawerProps): ReactNode {
  const updateDraft = (idx: number, patch: Partial<WizardEmailDraft>): void => {
    onChange(drafts.map((d, i) => (i === idx ? { ...d, ...patch } : d)));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          overflowY: "auto",
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 11,
              color: "var(--muted)",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: "var(--mono)",
            }}
          >
            Decision wizard · step 2 of 2
          </p>
          <h2 style={{ margin: "4px 0", fontFamily: "var(--font-mono)" }}>
            {(preview.type ?? "").replace(/_/g, " ").toLowerCase()}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            <strong>{preview.previousStage}</strong> →{" "}
            <strong>{preview.newStage}</strong> · status {preview.newStatus}
            {summary ? ` · note: ${summary}` : ""}
          </p>
        </header>

        {drafts.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            This decision sends no automatic email.
          </p>
        ) : (
          drafts.map((d, idx) => (
            <section
              key={d.stepId}
              style={{
                marginBottom: 16,
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--surface)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: "var(--muted)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    To: {d.recipientLabel} · locale {d.locale.toUpperCase()}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: d.configured ? "var(--muted)" : "var(--danger)",
                    }}
                  >
                    {d.configured
                      ? `template: ${d.templateKey}`
                      : `template ${d.templateKey} not configured — write your own`}
                  </p>
                </div>
                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={d.skipped}
                    onChange={(e) => updateDraft(idx, { skipped: e.target.checked })}
                  />
                  <span>Skip this email</span>
                </label>
              </div>
              {!d.skipped && (
                <>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 10,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Subject
                    <input
                      type="text"
                      value={d.subject}
                      onChange={(e) => updateDraft(idx, { subject: e.target.value })}
                      maxLength={512}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        padding: "6px 10px",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        fontFamily: "inherit",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600 }}>
                    Body
                    <textarea
                      value={d.body}
                      onChange={(e) => updateDraft(idx, { body: e.target.value })}
                      rows={12}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        padding: "6px 10px",
                        border: "1px solid var(--border)",
                        borderRadius: 4,
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        resize: "vertical",
                      }}
                    />
                  </label>
                </>
              )}
            </section>
          ))
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              padding: "6px 14px",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCommit}
            disabled={busy}
            style={{
              padding: "6px 14px",
              border: "1px solid var(--cobalt)",
              borderRadius: 4,
              background: "var(--cobalt)",
              color: "white",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {busy ? "Sending…" : "Send & record decision"}
          </button>
        </div>
      </div>
    </div>
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

interface ParticipantsCardProps {
  submissionId: number;
  participants: Participant[];
  onChanged: () => void;
}

function ParticipantsCard({
  submissionId,
  participants,
  onChanged,
}: ParticipantsCardProps): ReactNode {
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    stage: "EXTERNAL_REVIEW" as Stage,
    userId: "",
    role: "EDITOR" as StageRole,
    canChangeMetadata: true,
    recommendOnly: false,
  });
  const [err, setErr] = useState<string | null>(null);

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    rows: participants.filter((p) => p.stage === stage),
  })).filter((g) => g.rows.length > 0);

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    const userIdNum = Number.parseInt(form.userId, 10);
    if (!Number.isFinite(userIdNum) || userIdNum <= 0) {
      setErr("User id must be a positive number.");
      return;
    }
    setBusy(true);
    const result = await api(
      `/api/v1/submissions/${submissionId}/participants`,
      {
        method: "POST",
        body: {
          stage: form.stage,
          userId: userIdNum,
          role: form.role,
          canChangeMetadata: form.canChangeMetadata,
          recommendOnly: form.recommendOnly,
        },
      },
    );
    setBusy(false);
    if (result == null) {
      setErr("Could not assign — verify the user id and try again.");
      return;
    }
    setShowForm(false);
    setForm((f) => ({ ...f, userId: "" }));
    onChanged();
  };

  const remove = async (assignmentId?: number): Promise<void> => {
    if (assignmentId == null) return;
    if (!window.confirm("Remove this participant from the stage?")) return;
    setBusy(true);
    await api(
      `/api/v1/submissions/${submissionId}/participants/${assignmentId}`,
      { method: "DELETE" },
    );
    setBusy(false);
    onChanged();
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Participants
        </h3>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          style={{ ...btnSecondary, fontSize: 12 }}
        >
          {showForm ? "Cancel" : "+ Assign"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 6,
            background: "var(--bg-tint)",
            marginBottom: 12,
          }}
        >
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>Stage</span>
            <select
              value={form.stage}
              onChange={(e) =>
                setForm((f) => ({ ...f, stage: e.target.value as Stage }))
              }
              style={{ padding: 6 }}
            >
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>User id</span>
            <input
              type="number"
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              min={1}
              style={{ padding: 6 }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            <span style={{ fontWeight: 600 }}>Role</span>
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as StageRole }))
              }
              style={{ padding: 6 }}
            >
              {STAGE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <input
              type="checkbox"
              checked={form.canChangeMetadata}
              onChange={(e) =>
                setForm((f) => ({ ...f, canChangeMetadata: e.target.checked }))
              }
            />
            <span>Can change metadata</span>
          </label>
          <label
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              fontSize: 12,
              opacity: form.role === "SECTION_EDITOR" ? 1 : 0.5,
            }}
          >
            <input
              type="checkbox"
              checked={form.recommendOnly}
              disabled={form.role !== "SECTION_EDITOR"}
              onChange={(e) =>
                setForm((f) => ({ ...f, recommendOnly: e.target.checked }))
              }
            />
            <span>Recommend only</span>
          </label>
          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 4,
            }}
          >
            {err && (
              <span style={{ color: "var(--danger)", fontSize: 12, marginRight: "auto" }}>
                {err}
              </span>
            )}
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--cobalt)",
                borderRadius: 4,
                background: "var(--cobalt)",
                color: "white",
                fontFamily: "var(--sans)",
                fontSize: 13,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "Assigning…" : "Assign"}
            </button>
          </div>
        </form>
      )}

      {grouped.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          No participants assigned yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {grouped.map(({ stage, rows }) => (
            <section key={stage}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--muted)",
                }}
              >
                {stage}
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th style={{ padding: "4px 0", width: "12%" }}>User</th>
                    <th style={{ padding: "4px 0", width: "20%" }}>Role</th>
                    <th style={{ padding: "4px 0", width: "20%" }}>Flags</th>
                    <th style={{ padding: "4px 0", width: "20%" }}>Assigned</th>
                    <th style={{ padding: "4px 0" }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "6px 0", fontFamily: "var(--font-mono)" }}>
                        #{p.userId}
                      </td>
                      <td style={{ padding: "6px 0" }}>{p.role}</td>
                      <td style={{ padding: "6px 0", color: "var(--muted)" }}>
                        {p.canChangeMetadata && "metadata · "}
                        {p.recommendOnly && "recommend-only"}
                        {!p.canChangeMetadata && !p.recommendOnly && "—"}
                      </td>
                      <td style={{ padding: "6px 0", color: "var(--muted)" }}>
                        {p.dateAssigned
                          ? new Date(p.dateAssigned).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ padding: "6px 0", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => void remove(p.id)}
                          disabled={busy}
                          style={{
                            ...btnSecondary,
                            padding: "4px 10px",
                            fontSize: 12,
                            color: "var(--danger)",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </Card>
  );
}

interface DiscussionsCardProps {
  submissionId: number;
  currentStage: Stage;
  participants: Participant[];
}

function DiscussionsCard({
  submissionId,
  currentStage,
  participants,
}: DiscussionsCardProps): ReactNode {
  const [discussions, setDiscussions] = useState<Discussion[] | null>(null);
  const [showOpen, setShowOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);

  const reload = async (): Promise<void> => {
    setDiscussions(null);
    const data = await api<Discussion[]>(
      `/api/v1/submissions/${submissionId}/discussions`,
    );
    setDiscussions(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, [submissionId]);

  const grouped = STAGE_ORDER.map((stage) => ({
    stage,
    threads: (discussions ?? []).filter((d) => d.stage === stage),
  })).filter((g) => g.threads.length > 0);

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            textTransform: "uppercase",
            letterSpacing: 1,
          }}
        >
          Discussions
        </h3>
        <button
          type="button"
          onClick={() => setShowOpen(true)}
          style={{ ...btnSecondary, fontSize: 12 }}
        >
          + New thread
        </button>
      </div>

      {discussions === null ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
      ) : grouped.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          No discussions yet. Open a thread to coordinate with the editorial
          team or the author.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {grouped.map(({ stage, threads }) => (
            <section key={stage}>
              <h4
                style={{
                  margin: "0 0 6px 0",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  color: "var(--muted)",
                }}
              >
                {stage}
              </h4>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {threads.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      padding: "8px 0",
                      borderTop: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => d.id != null && setActiveId(d.id)}
                      style={{
                        flex: 1,
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {d.subject}
                        {d.closed && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 11,
                              color: "var(--muted)",
                              fontWeight: 400,
                            }}
                          >
                            closed
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {d.messageCount} message{d.messageCount === 1 ? "" : "s"}
                        {" · "}
                        last activity{" "}
                        {d.dateModified
                          ? new Date(d.dateModified).toLocaleString()
                          : "—"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {showOpen && (
        <OpenDiscussionDrawer
          submissionId={submissionId}
          defaultStage={currentStage}
          participants={participants}
          onClose={() => setShowOpen(false)}
          onCreated={async (id) => {
            setShowOpen(false);
            await reload();
            setActiveId(id);
          }}
        />
      )}

      {activeId !== null && (
        <DiscussionDetailDrawer
          discussionId={activeId}
          onClose={async () => {
            setActiveId(null);
            await reload();
          }}
        />
      )}
    </Card>
  );
}

function OpenDiscussionDrawer({
  submissionId,
  defaultStage,
  participants,
  onClose,
  onCreated,
}: {
  submissionId: number;
  defaultStage: Stage;
  participants: Participant[];
  onClose: () => void;
  onCreated: (id: number) => Promise<void>;
}): ReactNode {
  const [stage, setStage] = useState<Stage>(defaultStage);
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const candidates = participants
    .filter((p) => p.stage === stage)
    .filter(
      (p, idx, all) =>
        p.userId != null &&
        all.findIndex((x) => x.userId === p.userId) === idx,
    );

  const toggleUser = (userId: number): void => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    if (!subject.trim()) {
      setErr("Subject is required.");
      return;
    }
    setBusy(true);
    const result = await api<Discussion>(
      `/api/v1/submissions/${submissionId}/discussions`,
      {
        method: "POST",
        body: {
          stage,
          subject: subject.trim(),
          firstMessage: firstMessage.trim() || null,
          participantUserIds: Array.from(selectedUsers),
        },
      },
    );
    setBusy(false);
    if (result == null || result.id == null) {
      setErr("Could not open the discussion.");
      return;
    }
    await onCreated(result.id);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          overflowY: "auto",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Open a discussion</h2>

        <label style={{ display: "block", marginBottom: 12, fontSize: 12 }}>
          <span style={{ fontWeight: 600 }}>Stage</span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as Stage)}
            style={{ display: "block", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          >
            {STAGE_ORDER.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={512}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>First message</span>
          <textarea
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            rows={5}
            style={{ display: "block", width: "100%", padding: 8, marginTop: 4, border: "1px solid var(--border)", borderRadius: 4, resize: "vertical" }}
          />
        </label>

        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600 }}>
            Participants on {stage}
          </p>
          {candidates.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
              No stage participants — assign them in the Participants tab first.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {candidates.map((p) => (
                <label
                  key={p.userId}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  <input
                    type="checkbox"
                    checked={p.userId != null && selectedUsers.has(p.userId)}
                    onChange={() => p.userId != null && toggleUser(p.userId)}
                  />
                  user #{p.userId} ({p.role})
                </label>
              ))}
            </div>
          )}
        </div>

        {err && (
          <p style={{ color: "var(--danger)", fontSize: 13 }}>{err}</p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{ padding: "6px 14px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            style={{ padding: "6px 14px", border: "1px solid var(--cobalt)", borderRadius: 4, background: "var(--cobalt)", color: "white", cursor: "pointer" }}
          >
            {busy ? "Opening…" : "Open"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DiscussionDetailDrawer({
  discussionId,
  onClose,
}: {
  discussionId: number;
  onClose: () => void;
}): ReactNode {
  const [messages, setMessages] = useState<DiscussionMessage[] | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async (): Promise<void> => {
    setMessages(null);
    const data = await api<DiscussionMessage[]>(
      `/api/v1/discussions/${discussionId}/messages`,
    );
    setMessages(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, [discussionId]);

  const post = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    const result = await api<DiscussionMessage>(
      `/api/v1/discussions/${discussionId}/messages`,
      { method: "POST", body: { body: body.trim() } },
    );
    setBusy(false);
    if (result == null) {
      toast.error("Could not post.");
      return;
    }
    setBody("");
    await reload();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 50,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(640px, 100%)",
          background: "var(--bg)",
          borderLeft: "1px solid var(--border)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Discussion</h2>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "4px 12px", border: "1px solid var(--border)", borderRadius: 4, background: "transparent", cursor: "pointer", fontSize: 12 }}
          >
            Close
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
          {messages === null ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p>
          ) : messages.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>No messages yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    padding: 10,
                    background: "var(--surface)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 12,
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    user #{m.authorUserId}
                    {" · "}
                    {m.postedAt ? new Date(m.postedAt).toLocaleString() : "—"}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={post}>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Write a reply…"
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              border: "1px solid var(--border)",
              borderRadius: 4,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              type="submit"
              disabled={busy || !body.trim()}
              style={{
                padding: "6px 14px",
                border: "1px solid var(--cobalt)",
                borderRadius: 4,
                background: "var(--cobalt)",
                color: "white",
                cursor: busy || !body.trim() ? "default" : "pointer",
                opacity: !body.trim() ? 0.6 : 1,
              }}
            >
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ReviewerSuggestionsCardProps {
  submissionId: number;
}

function ReviewerSuggestionsCard({
  submissionId,
}: ReviewerSuggestionsCardProps): ReactNode {
  const [items, setItems] = useState<ReviewerSuggestion[] | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async (): Promise<void> => {
    setItems(null);
    const data = await api<ReviewerSuggestion[]>(
      `/api/v1/submissions/${submissionId}/reviewer-suggestions`,
    );
    setItems(data ?? []);
  };

  useEffect(() => {
    void reload();
  }, [submissionId]);

  const approve = async (id?: number): Promise<void> => {
    if (id == null) return;
    setBusy(true);
    await api(
      `/api/v1/submissions/${submissionId}/reviewer-suggestions/${id}/approve`,
      { method: "POST" },
    );
    setBusy(false);
    await reload();
  };

  const remove = async (id?: number): Promise<void> => {
    if (id == null) return;
    if (!window.confirm("Remove this suggestion?")) return;
    setBusy(true);
    await api(
      `/api/v1/submissions/${submissionId}/reviewer-suggestions/${id}`,
      { method: "DELETE" },
    );
    setBusy(false);
    await reload();
  };

  if (items === null) return null;

  return (
    <Card style={{ marginTop: 16 }}>
      <h3
        style={{
          margin: 0,
          marginBottom: 12,
          fontSize: 14,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        Author-suggested reviewers ({items.length})
      </h3>
      {items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
          The author did not propose any reviewers.
        </p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--muted)" }}>
              <th style={{ padding: "4px 0" }}>Name</th>
              <th style={{ padding: "4px 0" }}>Email · ORCID</th>
              <th style={{ padding: "4px 0" }}>Affiliation</th>
              <th style={{ padding: "4px 0" }}>Status</th>
              <th style={{ padding: "4px 0" }} />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} style={{ borderTop: "1px solid var(--border)", verticalAlign: "top" }}>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>
                  {`${s.givenName ?? ""} ${s.familyName ?? ""}`.trim() || s.email}
                  {s.suggestionReason && (
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)", fontWeight: 400 }}>
                      {s.suggestionReason}
                    </p>
                  )}
                </td>
                <td style={{ padding: "8px 0", color: "var(--muted)" }}>
                  {s.email}
                  {s.orcidId && (
                    <>
                      <br />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        {s.orcidId}
                      </span>
                    </>
                  )}
                </td>
                <td style={{ padding: "8px 0", color: "var(--muted)" }}>
                  {s.affiliation || "—"}
                </td>
                <td style={{ padding: "8px 0" }}>
                  {s.approvedAt ? (
                    <span style={{ color: "var(--cobalt)" }}>
                      approved {new Date(s.approvedAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>pending</span>
                  )}
                </td>
                <td style={{ padding: "8px 0", textAlign: "right", whiteSpace: "nowrap" }}>
                  {!s.approvedAt && (
                    <button
                      type="button"
                      onClick={() => void approve(s.id)}
                      disabled={busy}
                      style={{
                        padding: "4px 10px",
                        marginRight: 6,
                        border: "1px solid var(--cobalt)",
                        background: "var(--cobalt)",
                        color: "white",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Approve
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(s.id)}
                    disabled={busy}
                    style={{
                      padding: "4px 10px",
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--danger)",
                      borderRadius: 4,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
