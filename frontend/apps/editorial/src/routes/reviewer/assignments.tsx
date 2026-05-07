import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, BadgeCheck, Clock } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { api, type Page } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { StatusChip } from "../../components/StatusChip";
import { SignInPrompt } from "../../components/SignInPrompt";
import { Badge } from "@ajs/ui";

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
  // assignments.$assignmentId.tsx is a child of this route — defer to
  // <Outlet /> when one is matched so /reviewer/assignments/{id} renders
  // the detail page rather than the index list.
  const location = useLocation();
  const isIndex =
    location.pathname === "/reviewer/assignments" ||
    location.pathname === "/reviewer/assignments/";
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

  if (!isIndex) {
    return <Outlet />;
  }
  if (authLoading) {
    return <p className="text-muted text-sm">Loading session…</p>;
  }
  if (!user) {
    return <SignInPrompt />;
  }

  // Bucketize so the user sees what's actionable first.
  const byStatus = (items ?? []).reduce<Record<string, ReviewAssignment[]>>(
    (acc, a) => {
      const k = a.status ?? "OTHER";
      (acc[k] ??= []).push(a);
      return acc;
    },
    {},
  );
  const groups: Array<{ key: string; label: string; description: string }> = [
    {
      key: "AWAITING_RESPONSE",
      label: "Awaiting your response",
      description: "Editors are waiting on accept / decline.",
    },
    {
      key: "ACCEPTED",
      label: "Accepted, in progress",
      description: "Reviews you've accepted but not yet submitted.",
    },
    {
      key: "IN_PROGRESS",
      label: "In progress",
      description: "Reviews currently being drafted.",
    },
    {
      key: "COMPLETED",
      label: "Submitted",
      description: "Submitted, awaiting editor confirmation.",
    },
    {
      key: "CONFIRMED",
      label: "Confirmed",
      description: "The editor has accepted your review.",
    },
    {
      key: "DECLINED",
      label: "Declined",
      description: "Invitations you turned down.",
    },
    {
      key: "CANCELLED",
      label: "Cancelled",
      description: "Withdrawn invitations.",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reviewer"
        title="My review assignments"
        description="Invitations awaiting your response, in-progress reviews, and ones you’ve completed."
      />

      {fetching ? (
        <div className="flex items-center gap-2 text-muted text-sm py-6">
          <Clock className="size-4 animate-pulse" /> Loading assignments…
        </div>
      ) : null}

      {!fetching && errored ? (
        <EmptyState
          icon="alert"
          title="Couldn’t load assignments"
          description="The /api/v1/reviewer/assignments endpoint didn’t respond. If you don’t hold the REVIEWER role this may return 403."
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
        <div className="flex flex-col gap-6">
          {groups.map((g) => {
            const list = byStatus[g.key];
            if (!list || list.length === 0) return null;
            return (
              <section key={g.key}>
                <header className="flex items-baseline justify-between mb-2">
                  <div>
                    <h2 className="font-serif-display text-[16px] font-semibold text-fg flex items-center gap-2">
                      <BadgeCheck className="size-4 text-cobalt" />
                      {g.label}
                      <Badge variant="outline" className="ml-1">
                        {list.length}
                      </Badge>
                    </h2>
                    <p className="text-[12px] text-muted mt-0.5">
                      {g.description}
                    </p>
                  </div>
                </header>
                <div className="rounded-lg border border-border bg-white overflow-hidden">
                  <ul className="divide-y divide-border">
                    {list.map((a) => (
                      <AssignmentRow key={a.id} assignment={a} />
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

function AssignmentRow({
  assignment,
}: {
  assignment: ReviewAssignment;
}): ReactNode {
  const dueIso = assignment.dateDue ?? assignment.dateResponseDue ?? null;
  const dueLabel = assignment.dateDue
    ? `Due ${new Date(assignment.dateDue).toLocaleDateString()}`
    : assignment.dateResponseDue
      ? `Respond by ${new Date(assignment.dateResponseDue).toLocaleDateString()}`
      : null;
  const days = dueIso ? daysUntil(dueIso) : null;
  const overdue = days != null && days < 0;
  const urgent = days != null && days >= 0 && days <= 3;

  return (
    <li className="hover:bg-bg-tint/50 transition-colors">
      <Link
        to="/reviewer/assignments/$assignmentId"
        params={{ assignmentId: String(assignment.id) }}
        className="flex gap-4 items-start p-4 no-underline text-inherit group"
      >
        <span className="font-mono tnum tabular-nums text-[11px] text-cobalt font-semibold w-12 mt-1 flex-none">
          AJ#{String(assignment.id).padStart(3, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-3 items-baseline">
            <p className="font-serif-display text-[15px] font-medium text-fg m-0">
              Assignment #{assignment.id}{" "}
              <span className="text-muted font-normal">
                · round {assignment.reviewRoundId}
              </span>
            </p>
            {dueLabel ? (
              <span
                className={cn(
                  "tnum tabular-nums text-[11px] font-mono inline-flex items-center gap-1",
                  overdue
                    ? "text-[#b91c1c]"
                    : urgent
                      ? "text-amber-deep"
                      : "text-muted",
                )}
              >
                <Clock className="size-3" />
                {dueLabel}
              </span>
            ) : null}
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap items-center">
            {assignment.status ? <StatusChip status={assignment.status} /> : null}
            {assignment.reviewMethod ? (
              <Badge variant="outline">
                {assignment.reviewMethod.replace(/_/g, " ").toLowerCase()}
              </Badge>
            ) : null}
            {assignment.recommendation ? (
              <Badge variant="cobalt">
                {assignment.recommendation.replace(/_/g, " ").toLowerCase()}
              </Badge>
            ) : null}
          </div>
        </div>
        <ArrowUpRight className="size-4 text-muted-2 group-hover:text-cobalt transition-colors mt-1 flex-none" />
      </Link>
    </li>
  );
}

function daysUntil(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
