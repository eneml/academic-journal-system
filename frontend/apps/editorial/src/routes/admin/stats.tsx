import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/stats")({
  component: StatsPage,
});

interface Overview {
  submissionsYtd: number;
  articlesPublishedYtd: number;
  acceptanceRatePct: number;
  activeReviewers: number;
  totalDecisions: number;
}

function StatsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Statistics" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="Statistics is visible to editors and administrators."
        />
      </>
    );
  }
  return <StatsAdmin />;
}

function StatsAdmin(): ReactNode {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [fetching, setFetching] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    void (async () => {
      const data = await api<Overview>("/api/v1/admin/stats/overview");
      setOverview(data);
      setFetching(false);
    })();
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Statistics"
        description={`Journal-wide metrics · ${year} year to date`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Submissions YTD"
          value={overview?.submissionsYtd}
          loading={fetching}
        />
        <KpiCard
          label="Articles published"
          value={overview?.articlesPublishedYtd}
          loading={fetching}
        />
        <KpiCard
          label="Acceptance rate"
          value={overview?.acceptanceRatePct}
          suffix="%"
          loading={fetching}
        />
        <KpiCard
          label="Decisions"
          value={overview?.totalDecisions}
          loading={fetching}
          hint="Closed (accept/decline)"
        />
        <KpiCard
          label="Active reviewers"
          value={overview?.activeReviewers}
          loading={fetching}
          hint="Last 90 days"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            Submission flow · {year}
          </div>
          <div className="font-serif-display text-[20px] font-medium">
            Submissions vs decisions, monthly
          </div>
          <div className="mt-6 grid h-[180px] place-items-center rounded-md border border-dashed border-border-strong text-[13px] text-muted">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-cobalt" />
              Chart wiring lands with the next backend aggregation.
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            Decisions · {year}
          </div>
          <div className="font-serif-display text-[20px] font-medium">
            Outcomes
          </div>
          <div className="mt-6 grid h-[180px] place-items-center rounded-md border border-dashed border-border-strong text-[13px] text-muted">
            Donut breakdown lands with the per-decision-type endpoint.
          </div>
        </Card>
      </div>
    </>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  loading,
  hint,
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  loading: boolean;
  hint?: string;
}): ReactNode {
  return (
    <Card>
      <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="mt-2 tnum font-serif-display text-[28px] font-medium leading-none text-fg">
        {loading ? "—" : value != null ? formatNumber(value) + (suffix ?? "") : "—"}
      </div>
      {hint ? (
        <div className="mt-1.5 text-[11px] text-muted">{hint}</div>
      ) : null}
    </Card>
  );
}

const NF = new Intl.NumberFormat("en-US");
function formatNumber(n: number): string {
  return NF.format(n);
}
