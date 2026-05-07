import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Inbox, BadgeCheck, Plus } from "lucide-react";
import { Icon, type IconName, StageStepper, type StageIndex } from "@ajs/ui/primitives";
import { useAuth } from "../auth/AuthContext";
import {
  hasRole,
  isEditorial,
  type RealmRole,
} from "../auth/roles";
import { api, type Page } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@ajs/ui";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

// --------------------------------------------------------------------------

function Dashboard(): ReactNode {
  // AppShell handles loading + redirect-to-/login for unauthenticated users,
  // so by the time this component renders we're guaranteed a signed-in user.
  // Defensive guard kept just in case the shell is bypassed in tests.
  const { user, roles } = useAuth();
  if (!user) return null;

  const greeting =
    (user.profile.given_name as string | undefined) ??
    (user.profile.preferred_username as string | undefined) ??
    "there";

  // Pick the most-privileged role for the dashboard layout decision. A user
  // with multiple roles still gets shortcuts to the others via the sidebar.
  const primary = primaryRole(roles);

  return (
    <>
      <PageHeader
        eyebrow={`Signed in · ${formatRoles(roles)}`}
        title={`Hello, ${greeting}.`}
        description={dashboardSubtitle(primary)}
        actions={dashboardActions(primary)}
      />

      {primary === "editor" ? <EditorOverview /> : null}
      {primary === "reviewer" ? <ReviewerOverview /> : null}
      {primary === "author" ? <AuthorOverview /> : null}
      {primary === "admin" ? <AdminOverview /> : null}
    </>
  );
}

function dashboardSubtitle(primary: PrimaryRole): string {
  switch (primary) {
    case "editor":
      return "Triage the queue, decide on rounds in flight, and push the issue forward.";
    case "reviewer":
      return "Outstanding review invitations and the assignments that are due.";
    case "author":
      return "Drafts you're working on, plus anything currently moving through the editorial workflow.";
    case "admin":
      return "Journal configuration, user roster, and ops surfaces.";
    default:
      return "Pick up where you left off.";
  }
}

function dashboardActions(primary: PrimaryRole): ReactNode {
  if (primary === "author") {
    return (
      <Button asChild>
        <Link to="/author/submissions/new">
          <Plus />
          New submission
        </Link>
      </Button>
    );
  }
  if (primary === "editor") {
    return (
      <Button asChild>
        <Link to="/editor/queue">
          <Inbox />
          Open queue
        </Link>
      </Button>
    );
  }
  if (primary === "reviewer") {
    return (
      <Button asChild>
        <Link to="/reviewer/assignments">
          <BadgeCheck />
          Review queue
        </Link>
      </Button>
    );
  }
  return null;
}

// --------------------------------------------------------------------------
// EDITOR overview — stat strip + recent queue rows
// --------------------------------------------------------------------------

interface SubmissionRow {
  id: number;
  title?: Record<string, string>;
  sectionId?: number | null;
  stage?: string;
  status?: string;
  dateSubmitted?: string | null;
  dateLastActivity?: string | null;
}

function EditorOverview(): ReactNode {
  const [byStage, setByStage] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<SubmissionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      api<Page<SubmissionRow>>("/api/v1/submissions?status=QUEUED&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?status=ACTIVE&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?status=ACTIVE&stage=REVIEW&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?status=ACTIVE&stage=EDITING&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?status=ACTIVE&stage=PRODUCTION&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?status=COMPLETE&size=1"),
      api<Page<SubmissionRow>>("/api/v1/submissions?size=8"),
    ]).then(([qd, ac, rv, ed, pd, pb, recentPage]) => {
      if (cancelled) return;
      setByStage({
        SUBMISSION: qd?.totalElements ?? 0,
        REVIEW: rv?.totalElements ?? 0,
        EDITING: ed?.totalElements ?? 0,
        PRODUCTION: pd?.totalElements ?? 0,
        PUBLISHED: pb?.totalElements ?? 0,
        ACTIVE: ac?.totalElements ?? 0,
      });
      setRecent(recentPage?.content ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <StageStrip
        cells={[
          { stage: 0, label: "Submission", n: byStage.SUBMISSION ?? 0 },
          { stage: 1, label: "Review", n: byStage.REVIEW ?? 0 },
          { stage: 2, label: "Editing", n: byStage.EDITING ?? 0 },
          { stage: 3, label: "Production", n: byStage.PRODUCTION ?? 0 },
          { stage: 4, label: "Published", n: byStage.PUBLISHED ?? 0 },
        ]}
      />

      <SubsectionHead
        title="Recent submissions"
        cta={{ to: "/editor/submissions", label: "Open all submissions" }}
      />
      {recent == null ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>
          Loading queue&hellip;
        </p>
      ) : recent.length === 0 ? (
        <EmptyRow message="No submissions yet — first one will appear here when an author submits." />
      ) : (
        <SubmissionTable rows={recent} viewerRole="editor" />
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// AUTHOR overview — 3-up active-submission cards + recent activity
// --------------------------------------------------------------------------

function AuthorOverview(): ReactNode {
  const [submissions, setSubmissions] = useState<SubmissionRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api<Page<SubmissionRow>>("/api/v1/submissions/me?size=12").then(
      (data) => {
        if (cancelled) return;
        setSubmissions(data?.content ?? []);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (submissions == null) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading submissions&hellip;</p>;
  }

  const active = submissions.filter((s) => s.status !== "ARCHIVED").slice(0, 3);

  return (
    <>
      {active.length === 0 ? (
        <EmptyHero
          icon="fileText"
          title="No submissions yet"
          description="Start a draft and pick up here. Drafts auto-save as you fill in the wizard."
          cta={{ to: "/author/submissions/new", label: "Start a submission" }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          {active.map((s) => (
            <AuthorSubmissionCard key={s.id} submission={s} />
          ))}
        </div>
      )}

      <SubsectionHead
        title="All my submissions"
        cta={{ to: "/author/submissions", label: "Open author area" }}
      />
      {submissions.length > active.length ? (
        <SubmissionTable
          rows={submissions.slice(active.length, active.length + 6)}
          viewerRole="author"
        />
      ) : (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "12px 0" }}>
          Nothing further — every submission you have is highlighted above.
        </p>
      )}
    </>
  );
}

function AuthorSubmissionCard({ submission }: { submission: SubmissionRow }): ReactNode {
  const stage = stageIndexFor(submission.stage);
  const title = pickLocalized(submission.title) ?? `Submission #${submission.id}`;
  const isDraft = submission.status === "DRAFT";
  const lastActivity = submission.dateLastActivity ?? submission.dateSubmitted;

  return (
    <Link
      to="/author/submissions/$id"
      params={{ id: String(submission.id) }}
      style={{
        textDecoration: "none",
        color: "inherit",
        background: "var(--bg)",
        border: isDraft ? "1px solid oklch(88% 0.08 80)" : "1px solid var(--border)",
        borderRadius: 6,
        padding: 16,
        display: "block",
        boxShadow: isDraft ? "0 0 0 3px var(--amber-soft)" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--cobalt)",
            fontWeight: 600,
          }}
        >
          AJ-{String(submission.id).padStart(4, "0")}
        </span>
        <Icon name="arrowUpRight" size={14} color="var(--muted)" />
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.35,
          minHeight: 56,
          marginBottom: 10,
          color: "var(--fg)",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {title}
      </div>
      <div style={{ marginBottom: 10 }}>
        <StageStepper stage={stage} showLabels />
      </div>
      <div className="rule" style={{ margin: "10px 0" }} />
      <div
        style={{
          fontSize: 12,
          color: isDraft ? "var(--amber-deep)" : "var(--fg-2)",
          fontWeight: isDraft ? 600 : 500,
          marginBottom: 4,
        }}
      >
        {isDraft ? (
          <>
            <Icon name="alert" size={12} /> Draft — finish + submit
          </>
        ) : (
          formatStatus(submission.status, submission.stage)
        )}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
        {lastActivity
          ? `Last activity ${new Date(lastActivity).toLocaleDateString()}`
          : "Just started"}
      </div>
    </Link>
  );
}

// --------------------------------------------------------------------------
// REVIEWER overview
// --------------------------------------------------------------------------

interface AssignmentRow {
  id: number;
  submissionId: number;
  status?: string;
  dueDate?: string | null;
  reviewRoundNumber?: number | null;
}

function ReviewerOverview(): ReactNode {
  const [assignments, setAssignments] = useState<AssignmentRow[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    void api<Page<AssignmentRow>>("/api/v1/reviewer/assignments?size=8").then(
      (data) => {
        if (cancelled) return;
        setAssignments(data?.content ?? []);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (assignments == null) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading assignments&hellip;</p>;
  }
  if (assignments.length === 0) {
    return (
      <EmptyHero
        icon="badgeCheck"
        title="No reviews assigned"
        description="When an editor invites you to review a manuscript it'll show up here."
      />
    );
  }
  const open = assignments.filter((a) => a.status !== "COMPLETED");

  return (
    <>
      <StageStrip
        cells={[
          { stage: 0, label: "Invited", n: countBy(assignments, "INVITED") },
          { stage: 1, label: "Accepted", n: countBy(assignments, "ACCEPTED") },
          { stage: 2, label: "Submitted", n: countBy(assignments, "COMPLETED") },
          { stage: 3, label: "Declined", n: countBy(assignments, "DECLINED") },
          { stage: 4, label: "Total", n: assignments.length },
        ]}
      />
      <SubsectionHead
        title="Open assignments"
        cta={{ to: "/reviewer/assignments", label: "Open review queue" }}
      />
      {open.length === 0 ? (
        <EmptyRow message="No open assignments — submitted reviews still show in the full queue." />
      ) : (
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
          }}
        >
          {open.slice(0, 5).map((a, i, arr) => (
            <Link
              key={a.id}
              to="/reviewer/assignments/$assignmentId"
              params={{ assignmentId: String(a.id) }}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 110px 80px",
                gap: 12,
                alignItems: "center",
                padding: "12px 16px",
                textDecoration: "none",
                color: "inherit",
                borderBottom: i === arr.length - 1 ? "none" : "1px solid var(--border)",
              }}
            >
              <div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  Submission #{a.submissionId}
                </span>
                <span
                  style={{
                    color: "var(--muted)",
                    fontSize: 11.5,
                    marginLeft: 8,
                    fontFamily: "var(--mono)",
                  }}
                >
                  R{a.reviewRoundNumber ?? 1}
                </span>
              </div>
              <span style={{ fontSize: 12 }}>
                <StatusPill status={a.status ?? "INVITED"} />
              </span>
              <span style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--mono)" }}>
                {a.dueDate
                  ? `due ${new Date(a.dueDate).toLocaleDateString()}`
                  : "no due date"}
              </span>
              <Icon name="chevronRight" size={14} color="var(--muted)" />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

// --------------------------------------------------------------------------
// ADMIN overview — utility tiles
// --------------------------------------------------------------------------

function AdminOverview(): ReactNode {
  const tiles: Array<{ to: string; icon: IconName; title: string; body: string }> = [
    {
      to: "/admin/users",
      icon: "users",
      title: "Users",
      body: "Activate or disable accounts, hand out roles, audit sign-ins.",
    },
    {
      to: "/admin/journal",
      icon: "settings",
      title: "Journal config",
      body: "Sections, masthead, ISSN, and submission policies.",
    },
    {
      to: "/admin/announcements",
      icon: "flag",
      title: "Announcements",
      body: "Calls for papers, special issue invitations, journal news.",
    },
    {
      to: "/editor/deposits",
      icon: "arrowUpRight",
      title: "Deposits",
      body: "CrossRef + ORCID outbox — retry failed deposits, inspect logs.",
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {tiles.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          style={{
            textDecoration: "none",
            color: "inherit",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 18,
            display: "block",
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
            <span
              style={{
                width: 30,
                height: 30,
                borderRadius: 4,
                background: "var(--cobalt-soft)",
                color: "var(--cobalt-deep)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={t.icon} size={15} />
            </span>
            <Icon name="arrowUpRight" size={14} color="var(--muted)" />
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              marginBottom: 4,
              color: "var(--fg)",
            }}
          >
            {t.title}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.55 }}>
            {t.body}
          </div>
        </Link>
      ))}
    </div>
  );
}

// --------------------------------------------------------------------------
// Shared bits
// --------------------------------------------------------------------------

function StageStrip({
  cells,
}: {
  cells: Array<{ stage: StageIndex; label: string; n: number }>;
}): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
        gap: 1,
        background: "var(--border)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        marginBottom: 22,
        overflow: "hidden",
      }}
    >
      {cells.map((s) => (
        <div key={s.label} style={{ background: "var(--bg)", padding: "14px 16px" }}>
          <div className="sc" style={{ color: "var(--muted)" }}>
            {String(s.stage + 1).padStart(2, "0")} · {s.label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 6,
            }}
          >
            <span
              className="tnum"
              style={{
                fontSize: 28,
                fontWeight: 600,
                fontFamily: "var(--serif-display)",
                letterSpacing: "-0.02em",
              }}
            >
              {s.n}
            </span>
            <StageStepper stage={s.stage} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SubsectionHead({
  title,
  cta,
}: {
  title: string;
  cta?: { to: string; label: string };
}): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <div className="sc" style={{ color: "var(--muted)" }}>
        {title}
      </div>
      {cta ? (
        <Link
          to={cta.to}
          style={{
            fontSize: 12,
            color: "var(--cobalt)",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          {cta.label} →
        </Link>
      ) : null}
    </div>
  );
}

function SubmissionTable({
  rows,
  viewerRole,
}: {
  rows: SubmissionRow[];
  viewerRole: "editor" | "author";
}): ReactNode {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 130px 110px 90px",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--muted)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          gap: 12,
        }}
      >
        <div>ID</div>
        <div>Manuscript</div>
        <div>Stage</div>
        <div>Status</div>
        <div style={{ textAlign: "right" }}>Last activity</div>
      </div>
      {rows.map((s, i) => {
        const stage = stageIndexFor(s.stage);
        const title = pickLocalized(s.title) ?? `Submission #${s.id}`;
        const last = s.dateLastActivity ?? s.dateSubmitted;
        const path =
          viewerRole === "editor"
            ? `/editor/submissions/${s.id}`
            : `/author/submissions/${s.id}`;
        return (
          <Link
            key={s.id}
            to={path}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 130px 110px 90px",
              padding: "12px 14px",
              gap: 12,
              alignItems: "center",
              textDecoration: "none",
              color: "inherit",
              borderBottom: i === rows.length - 1 ? "none" : "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 11,
                color: "var(--cobalt)",
                fontWeight: 600,
              }}
            >
              AJ-{String(s.id).padStart(4, "0")}
            </span>
            <div
              style={{
                fontSize: 13.5,
                fontWeight: 500,
                lineHeight: 1.4,
                color: "var(--fg)",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </div>
            <StageStepper stage={stage} />
            <StatusPill status={s.status ?? "DRAFT"} />
            <span
              style={{
                color: "var(--muted)",
                fontSize: 11.5,
                fontFamily: "var(--mono)",
                textAlign: "right",
              }}
            >
              {last ? new Date(last).toLocaleDateString() : "—"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }): ReactNode {
  const palette = pillPalette(status);
  return (
    <span
      className={`chip ${palette.cls}`}
      style={{ fontSize: 10.5, fontFamily: "var(--sans)" }}
    >
      {status.replace(/_/g, " ").toLowerCase()}
    </span>
  );
}

function pillPalette(status: string): { cls: string } {
  const s = status.toUpperCase();
  if (s === "DRAFT") return { cls: "chip-amber" };
  if (s === "QUEUED" || s === "INVITED") return { cls: "chip" };
  if (s === "ACCEPTED" || s === "ACTIVE") return { cls: "chip-cobalt" };
  if (s === "COMPLETED" || s === "PUBLISHED") return { cls: "chip-green" };
  if (s === "DECLINED" || s === "REJECTED" || s === "WITHDRAWN") return { cls: "chip-red" };
  return { cls: "chip" };
}

function EmptyRow({ message }: { message: string }): ReactNode {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "20px 18px",
        fontSize: 13,
        color: "var(--muted)",
      }}
    >
      {message}
    </div>
  );
}

function EmptyHero({
  icon,
  title,
  description,
  cta,
}: {
  icon: IconName;
  title: string;
  description: string;
  cta?: { to: string; label: string };
}): ReactNode {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px dashed var(--border-strong)",
        borderRadius: 6,
        padding: "32px 24px",
        textAlign: "center",
        color: "var(--fg-2)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "var(--surface-2)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Icon name={icon} size={16} color="var(--muted)" />
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          marginBottom: 4,
          color: "var(--fg)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 13,
          maxWidth: 480,
          margin: "0 auto 14px",
          lineHeight: 1.55,
        }}
      >
        {description}
      </div>
      {cta ? (
        <Link
          to={cta.to}
          className="btn btn-primary btn-sm"
          style={{ textDecoration: "none" }}
        >
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// helpers
// --------------------------------------------------------------------------

type PrimaryRole = "editor" | "reviewer" | "author" | "admin" | "none";

function primaryRole(roles: RealmRole[]): PrimaryRole {
  if (hasRole(roles, "ADMIN")) return "admin";
  if (isEditorial(roles)) return "editor";
  if (hasRole(roles, "REVIEWER")) return "reviewer";
  if (hasRole(roles, "AUTHOR")) return "author";
  return "none";
}

function formatRoles(roles: RealmRole[]): string {
  if (roles.length === 0) return "no roles assigned";
  return roles.map((r) => r.replace(/_/g, " ").toLowerCase()).join(" · ");
}

function pickLocalized(map?: Record<string, string>): string | undefined {
  if (!map) return undefined;
  return (
    map["en"] ??
    map["en-US"] ??
    Object.values(map).find((v) => v && v.trim().length > 0)
  );
}

function stageIndexFor(stage: string | undefined): StageIndex {
  switch (stage) {
    case "SUBMISSION": return 0;
    case "REVIEW": return 1;
    case "EDITING": return 2;
    case "PRODUCTION": return 3;
    case "PUBLISHED": return 4;
    default: return 0;
  }
}

function formatStatus(status: string | undefined, stage: string | undefined): string {
  if (!status) return "—";
  if (status === "DRAFT") return "Draft";
  if (status === "QUEUED") return "Queued — awaiting editor triage";
  if (status === "ACTIVE") {
    return stage
      ? `In ${stage.toLowerCase()}`
      : "Active";
  }
  if (status === "COMPLETE") return "Complete";
  return status.replace(/_/g, " ").toLowerCase();
}

function countBy<T extends { status?: string }>(items: T[], status: string): number {
  return items.filter((i) => i.status === status).length;
}
