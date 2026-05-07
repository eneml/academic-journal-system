import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
interface MonthlyFlowPoint {
  month: number;
  submissions: number;
  decisions: number;
}
interface DecisionBreakdown {
  type: string;
  count: number;
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
  const [flow, setFlow] = useState<MonthlyFlowPoint[]>([]);
  const [decisions, setDecisions] = useState<DecisionBreakdown[]>([]);
  const [fetching, setFetching] = useState(true);
  const year = new Date().getFullYear();

  useEffect(() => {
    void (async () => {
      const [o, f, d] = await Promise.all([
        api<Overview>("/api/v1/admin/stats/overview"),
        api<MonthlyFlowPoint[]>("/api/v1/admin/stats/monthly-flow"),
        api<DecisionBreakdown[]>("/api/v1/admin/stats/decisions"),
      ]);
      setOverview(o);
      setFlow(f ?? []);
      setDecisions(d ?? []);
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

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            Submission flow · {year}
          </div>
          <div className="font-serif-display text-[20px] font-medium">
            Submissions vs decisions, monthly
          </div>
          <SubmissionFlowChart data={flow} />
        </Card>

        <Card>
          <div className="mb-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
            Decisions · cumulative
          </div>
          <div className="font-serif-display text-[20px] font-medium">
            Outcomes
          </div>
          <DecisionsDonut data={decisions} />
        </Card>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------
// Charts
// ----------------------------------------------------------------------

const MONTH_SHORT = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function SubmissionFlowChart({
  data,
}: {
  data: MonthlyFlowPoint[];
}): ReactNode {
  if (!data.length) {
    return (
      <div className="mt-6 grid h-[220px] place-items-center text-[13px] text-muted">
        No submission data yet.
      </div>
    );
  }
  const shaped = data.map((p) => ({ ...p, label: MONTH_SHORT[p.month] }));
  return (
    <div className="mt-4 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={shaped}
          margin={{ top: 12, right: 12, bottom: 0, left: -16 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            stroke="var(--border-strong)"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            stroke="var(--border-strong)"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 6 }}
            iconType="plainline"
          />
          <Line
            type="monotone"
            dataKey="submissions"
            stroke="var(--cobalt)"
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: "var(--cobalt)" }}
            activeDot={{ r: 4 }}
            name="Submitted"
          />
          <Line
            type="monotone"
            dataKey="decisions"
            stroke="var(--amber-deep)"
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: "var(--amber-deep)" }}
            activeDot={{ r: 4 }}
            name="Decisions issued"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function colorFor(type: string): string {
  if (type === "ACCEPT" || type === "SEND_TO_PRODUCTION") {
    return "var(--success)";
  }
  if (
    type === "DECLINE" ||
    type === "INITIAL_DECLINE" ||
    type === "CANCEL_REVIEW_ROUND"
  ) {
    return "var(--danger)";
  }
  if (type === "REQUEST_REVISIONS" || type === "NEW_REVIEW_ROUND") {
    return "var(--amber-deep)";
  }
  return "var(--cobalt)";
}

function DecisionsDonut({ data }: { data: DecisionBreakdown[] }): ReactNode {
  if (!data.length) {
    return (
      <div className="mt-6 grid h-[220px] place-items-center text-[13px] text-muted">
        No decisions logged yet.
      </div>
    );
  }
  const shaped = data.map((d) => ({
    ...d,
    label: d.type.replace(/_/g, " ").toLowerCase(),
    fill: colorFor(d.type),
  }));
  return (
    <div className="mt-4 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={shaped}
            dataKey="count"
            nameKey="label"
            cx="36%"
            cy="50%"
            innerRadius={48}
            outerRadius={80}
            paddingAngle={2}
            stroke="var(--bg)"
          >
            {shaped.map((entry) => (
              <Cell key={entry.type} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 11, lineHeight: 1.6, paddingLeft: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// KPI card
// ----------------------------------------------------------------------

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
        {loading
          ? "—"
          : value != null
            ? formatNumber(value) + (suffix ?? "")
            : "—"}
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
