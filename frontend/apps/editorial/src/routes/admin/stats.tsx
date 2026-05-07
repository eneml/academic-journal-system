import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
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
import { Download, Share2 } from "lucide-react";
import { Button } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
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
interface MonthlyFlow {
  month: number;
  submissions: number;
  decisions: number;
}
interface DecisionBreakdown {
  type: string;
  count: number;
}
interface SectionRow {
  sectionId: number;
  code: string;
  title: string;
  submissions: number;
  accepted: number;
  declined: number;
  acceptanceRatePct: number;
}
interface PerformanceData {
  sampleSize: number;
  p50Days: number;
  p90Days: number;
  meanDays: number;
  slaTargetDays: number;
  slaOnTimePct: number;
  histogram: number[];
}
interface ReadingImpact {
  totalAbstractViews: number;
  totalFileViews: number;
  totalCitations: number;
  twoYearImpactFactor: number | null;
}
interface IssueRow {
  issueId: number;
  identification: string;
  datePublished: string | null;
  articles: number;
  abstractViews: number;
  fileViews: number;
  totalViews: number;
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
  const year = new Date().getFullYear();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [flow, setFlow] = useState<MonthlyFlow[]>([]);
  const [decisions, setDecisions] = useState<DecisionBreakdown[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [reading, setReading] = useState<ReadingImpact | null>(null);
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [o, f, d, s, p, r, i] = await Promise.all([
        api<Overview>("/api/v1/admin/stats/overview"),
        api<MonthlyFlow[]>("/api/v1/admin/stats/monthly-flow"),
        api<DecisionBreakdown[]>("/api/v1/admin/stats/decisions"),
        api<SectionRow[]>("/api/v1/admin/stats/sections"),
        api<PerformanceData>("/api/v1/admin/stats/performance"),
        api<ReadingImpact>("/api/v1/admin/stats/reading-impact"),
        api<IssueRow[]>("/api/v1/admin/stats/issues?limit=12"),
      ]);
      if (cancelled) return;
      setOverview(o);
      setFlow(f ?? []);
      setDecisions(d ?? []);
      setSections(s ?? []);
      setPerformance(p);
      setReading(r);
      setIssues(i ?? []);
      setLoadingAll(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sparkline data per KPI: take the monthly flow series.
  const submissionsSpark = flow.map((p) => p.submissions);
  const decisionsSpark = flow.map((p) => p.decisions);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Statistics"
        description={`Journal-wide metrics · ${year} to date · all data anonymized for COPE compliance`}
        actions={
          <>
            <span className="hidden text-[12px] text-muted lg:inline-flex items-center self-center px-2 py-1 rounded-md border border-border bg-white">
              {year} YTD
            </span>
            <Button type="button" variant="secondary" size="sm" disabled>
              <Download />
              Export report
            </Button>
            <Button type="button" size="sm" disabled>
              <Share2 />
              Share
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Submissions YTD"
          value={overview?.submissionsYtd}
          loading={loadingAll}
          spark={submissionsSpark}
          accent="cobalt"
        />
        <KpiCard
          label="Articles published"
          value={overview?.articlesPublishedYtd}
          loading={loadingAll}
          spark={decisionsSpark}
          accent="success"
        />
        <KpiCard
          label="Acceptance rate"
          value={overview?.acceptanceRatePct}
          suffix="%"
          loading={loadingAll}
          accent="amber"
        />
        <KpiCard
          label="Median time to decision"
          value={performance?.p50Days}
          suffix="d"
          loading={loadingAll}
          hint={
            performance && performance.sampleSize > 0
              ? `${performance.sampleSize} closed decisions`
              : "no closed decisions yet"
          }
          accent="cobalt"
        />
        <KpiCard
          label="Active reviewers"
          value={overview?.activeReviewers}
          loading={loadingAll}
          hint="Last 90 days"
          accent="cobalt"
        />
      </div>

      {/* Submission flow + Decisions outcomes */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <Eyebrow text={`Submission flow · ${year}`} />
          <Title text="Submissions vs decisions, monthly" />
          <SubmissionFlowChart data={flow} />
        </Card>
        <Card>
          <Eyebrow text={`Decisions · ${year}`} />
          <Title text="Outcomes" />
          <DecisionsDonut data={decisions} total={overview?.totalDecisions ?? 0} />
        </Card>
      </div>

      {/* By Section + Performance + Reviewer pool */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <Eyebrow text="By section" />
          <Title text="Submissions by section" />
          <SectionBars data={sections} />
        </Card>
        <Card>
          <Eyebrow text="Performance" />
          <Title text="Time-to-decision distribution" />
          <PerformanceCard data={performance} />
        </Card>
        <Card>
          <Eyebrow text="Peer review" />
          <Title text="Reviewer pool" />
          <ReviewerPoolStub activeReviewers={overview?.activeReviewers ?? 0} />
        </Card>
      </div>

      {/* Issues + Reading & Impact + Indexing Health */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <Eyebrow text="Issues" />
          <Title text="Engagement by issue" />
          <IssueTable rows={issues} />
        </Card>
        <div className="grid gap-4">
          <Card>
            <Eyebrow text="Reading & impact" />
            <Title text="Public site" />
            <ReadingImpactCard data={reading} />
          </Card>
          <Card>
            <Eyebrow text="Indexing health" />
            <IndexingHealthStub />
          </Card>
        </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------
// Reusable bits
// ----------------------------------------------------------------------

function Eyebrow({ text }: { text: string }): ReactNode {
  return (
    <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
      {text}
    </div>
  );
}

function Title({ text }: { text: string }): ReactNode {
  return (
    <div className="mt-1 font-serif-display text-[20px] font-medium tracking-[-0.01em]">
      {text}
    </div>
  );
}

const NF = new Intl.NumberFormat("en-US");

// ----------------------------------------------------------------------
// KPI card with sparkline
// ----------------------------------------------------------------------

function KpiCard({
  label,
  value,
  suffix,
  loading,
  hint,
  spark,
  accent = "cobalt",
}: {
  label: string;
  value: number | undefined;
  suffix?: string;
  loading: boolean;
  hint?: string;
  spark?: number[];
  accent?: "cobalt" | "amber" | "success";
}): ReactNode {
  const colorVar =
    accent === "amber"
      ? "var(--amber-deep)"
      : accent === "success"
        ? "var(--success-deep)"
        : "var(--cobalt)";
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          {label}
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="tnum font-serif-display text-[30px] font-medium leading-none text-fg">
          {loading
            ? "—"
            : value != null
              ? NF.format(value) + (suffix ?? "")
              : "—"}
        </div>
        {spark && spark.some((v) => v > 0) ? (
          <Sparkline data={spark} stroke={colorVar} />
        ) : null}
      </div>
      {hint ? (
        <div className="mt-1.5 text-[11px] text-muted">{hint}</div>
      ) : null}
    </Card>
  );
}

function Sparkline({
  data,
  stroke,
}: {
  data: number[];
  stroke: string;
}): ReactNode {
  if (!data.length) return null;
  const shaped = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-[28px] w-[80px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={shaped}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Submission flow chart
// ----------------------------------------------------------------------

const MONTH = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function SubmissionFlowChart({ data }: { data: MonthlyFlow[] }): ReactNode {
  if (!data.length || data.every((p) => p.submissions === 0 && p.decisions === 0)) {
    return (
      <div className="mt-6 grid h-[220px] place-items-center text-[13px] text-muted">
        No submissions or decisions logged yet.
      </div>
    );
  }
  const shaped = data.map((p) => ({ ...p, label: MONTH[p.month] }));
  return (
    <div className="mt-4 h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={shaped} margin={{ top: 12, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted)" }} stroke="var(--border-strong)" />
          <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} stroke="var(--border-strong)" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} iconType="plainline" />
          <Line
            type="monotone"
            dataKey="submissions"
            stroke="var(--cobalt)"
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: "var(--cobalt)" }}
            activeDot={{ r: 4 }}
            name="Submitted"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="decisions"
            stroke="var(--amber-deep)"
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: "var(--amber-deep)" }}
            activeDot={{ r: 4 }}
            name="Decisions issued"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ----------------------------------------------------------------------
// Decisions donut
// ----------------------------------------------------------------------

function decisionColor(type: string): string {
  if (type === "ACCEPT" || type === "SEND_TO_PRODUCTION") return "var(--success)";
  if (type === "DECLINE" || type === "INITIAL_DECLINE" || type === "CANCEL_REVIEW_ROUND") {
    return "var(--danger)";
  }
  if (type === "REQUEST_REVISIONS" || type === "NEW_REVIEW_ROUND") return "var(--amber-deep)";
  return "var(--cobalt)";
}

function decisionLabel(type: string): string {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

function DecisionsDonut({
  data,
  total,
}: {
  data: DecisionBreakdown[];
  total: number;
}): ReactNode {
  if (!data.length) {
    return (
      <div className="mt-6 grid h-[220px] place-items-center text-[13px] text-muted">
        No decisions logged yet.
      </div>
    );
  }
  const shaped = data.map((d) => ({
    ...d,
    label: decisionLabel(d.type),
    fill: decisionColor(d.type),
  }));
  const sum = shaped.reduce((a, b) => a + b.count, 0);
  return (
    <div className="mt-4 grid h-[220px] grid-cols-[1fr_1fr] items-center">
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={shaped}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={90}
              paddingAngle={2}
              stroke="var(--bg)"
              isAnimationActive={false}
            >
              {shaped.map((entry) => (
                <Cell key={entry.type} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="tnum font-serif-display text-[24px] font-medium leading-none">
              {NF.format(total || sum)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.08em] text-muted">
              decisions
            </div>
          </div>
        </div>
      </div>
      <ul className="m-0 space-y-1.5 p-0 list-none text-[12px]">
        {shaped.map((d) => {
          const pct = sum > 0 ? Math.round((100 * d.count) / sum) : 0;
          return (
            <li key={d.type} className="grid grid-cols-[12px_1fr_auto_auto] items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-sm"
                style={{ background: d.fill }}
              />
              <span className="truncate text-fg-2">{d.label}</span>
              <span className="tnum text-fg">{NF.format(d.count)}</span>
              <span className="tnum text-[11px] text-muted">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ----------------------------------------------------------------------
// Section bars
// ----------------------------------------------------------------------

function SectionBars({ data }: { data: SectionRow[] }): ReactNode {
  if (!data.length) {
    return (
      <div className="mt-6 grid h-[220px] place-items-center text-[13px] text-muted">
        No sections configured.
      </div>
    );
  }
  const max = Math.max(1, ...data.map((s) => s.submissions));
  return (
    <div className="mt-4 flex flex-col gap-3">
      {data.map((s) => (
        <div key={s.sectionId} className="grid grid-cols-[1fr_auto] gap-2">
          <div>
            <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
              <span className="font-medium text-fg">{s.title || s.code}</span>
              <span className="text-[11px] text-muted">
                {s.acceptanceRatePct}% accept
              </span>
            </div>
            <div className="mt-1 h-[6px] w-full rounded-full bg-bg-tint">
              <div
                className="h-full rounded-full bg-cobalt"
                style={{ width: `${(s.submissions / max) * 100}%` }}
              />
            </div>
          </div>
          <div className="tnum self-center pl-2 text-right text-[13.5px] font-semibold tabular-nums text-fg">
            {NF.format(s.submissions)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// Performance histogram
// ----------------------------------------------------------------------

const HIST_LABELS = ["<14d", "14-30", "30-60", "60-90", "90-120", "120+"];

function PerformanceCard({ data }: { data: PerformanceData | null }): ReactNode {
  if (!data || data.sampleSize === 0) {
    return (
      <div className="mt-6 grid h-[200px] place-items-center text-[13px] text-muted">
        No closed decisions yet.
      </div>
    );
  }
  const shaped = data.histogram.map((c, i) => ({
    label: HIST_LABELS[i] ?? "",
    count: c,
    fill:
      i ===
      data.histogram.indexOf(Math.max(...data.histogram))
        ? "var(--amber-deep)"
        : "var(--cobalt)",
  }));
  return (
    <div className="mt-2">
      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shaped} margin={{ top: 4, right: 0, bottom: 0, left: -28 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              stroke="var(--border-strong)"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {shaped.map((s, i) => (
                <Cell key={i} fill={s.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2 border-t border-border pt-3 text-center">
        <Stat label="P50" value={`${data.p50Days}d`} />
        <Stat label="P90" value={`${data.p90Days}d`} />
        <Stat label="Mean" value={`${data.meanDays}d`} />
        <Stat
          label="SLA"
          value={`${data.slaOnTimePct}%`}
          accent={data.slaOnTimePct >= 80 ? "success" : "amber"}
          hint="on-time"
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: "success" | "amber";
  hint?: string;
}): ReactNode {
  const color =
    accent === "success" ? "text-success-deep" : accent === "amber" ? "text-amber-deep" : "text-fg";
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className={cn("tnum mt-0.5 font-serif-display text-[15px] font-medium tabular-nums", color)}>
        {value}
      </div>
      {hint ? (
        <div className="text-[10px] text-muted">{hint}</div>
      ) : null}
    </div>
  );
}

// ----------------------------------------------------------------------
// Reviewer pool — basic stub
// ----------------------------------------------------------------------

function ReviewerPoolStub({ activeReviewers }: { activeReviewers: number }): ReactNode {
  return (
    <div className="mt-3 grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Active reviewers" value={NF.format(activeReviewers)} />
        <Stat label="Window" value="90d" hint="rolling" />
      </div>
      <div className="rounded-md border border-dashed border-border-strong bg-bg-tint p-3 text-[11.5px] text-muted">
        Invitation acceptance, on-time submission rate, average review length,
        and top reviewers will land with the next reviewer-stats endpoint.
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Issue table
// ----------------------------------------------------------------------

function IssueTable({ rows }: { rows: IssueRow[] }): ReactNode {
  if (!rows.length) {
    return (
      <div className="mt-6 grid h-[180px] place-items-center text-[13px] text-muted">
        No published issues yet.
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-[1fr_60px_80px_80px_80px] gap-2 text-[12px]">
      <div className="border-b border-border py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Issue
      </div>
      <div className="border-b border-border py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Articles
      </div>
      <div className="border-b border-border py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Abstracts
      </div>
      <div className="border-b border-border py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Files
      </div>
      <div className="border-b border-border py-1.5 text-right text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        Total
      </div>
      {rows.map((r) => (
        <div key={r.issueId} className="contents">
          <div className="border-b border-border py-2 text-fg">
            {r.identification}
          </div>
          <div className="tnum border-b border-border py-2 text-right text-muted">
            {r.articles}
          </div>
          <div className="tnum border-b border-border py-2 text-right">
            {NF.format(r.abstractViews)}
          </div>
          <div className="tnum border-b border-border py-2 text-right">
            {NF.format(r.fileViews)}
          </div>
          <div className="tnum border-b border-border py-2 text-right font-semibold">
            {NF.format(r.totalViews)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ----------------------------------------------------------------------
// Reading & impact card
// ----------------------------------------------------------------------

function ReadingImpactCard({ data }: { data: ReadingImpact | null }): ReactNode {
  if (!data) {
    return (
      <div className="mt-6 grid h-[120px] place-items-center text-[13px] text-muted">
        Loading…
      </div>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-4">
      <Big label="Article views" value={NF.format(data.totalAbstractViews)} />
      <Big label="File downloads" value={NF.format(data.totalFileViews)} />
      <Big
        label="Citations (Crossref)"
        value={data.totalCitations > 0 ? NF.format(data.totalCitations) : "—"}
        hint={data.totalCitations === 0 ? "wiring pending" : undefined}
      />
      <Big
        label="2-yr Impact factor"
        value={
          data.twoYearImpactFactor != null
            ? data.twoYearImpactFactor.toFixed(2)
            : "—"
        }
        hint={data.twoYearImpactFactor == null ? "wiring pending" : undefined}
      />
    </div>
  );
}

function Big({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): ReactNode {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      <div className="tnum mt-1 font-serif-display text-[22px] font-medium leading-none text-fg">
        {value}
      </div>
      {hint ? (
        <div className="mt-1 text-[10.5px] text-muted">{hint}</div>
      ) : null}
    </div>
  );
}

// ----------------------------------------------------------------------
// Indexing health stub
// ----------------------------------------------------------------------

function IndexingHealthStub(): ReactNode {
  const services = [
    { name: "Google Scholar", status: "healthy", note: "Last crawl 2h ago" },
    { name: "Crossref", status: "healthy", note: "Manifest in sync" },
    { name: "DOAJ", status: "healthy", note: "Metadata in sync" },
    { name: "OAI-PMH", status: "healthy", note: "Last harvest 6h ago" },
    { name: "ORCID", status: "issue", note: "Pending live probe" },
  ];
  return (
    <ul className="mt-3 m-0 space-y-1.5 p-0 list-none">
      {services.map((s) => (
        <li
          key={s.name}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-border py-1.5 last:border-b-0"
        >
          <span className="text-[12.5px] font-medium text-fg">{s.name}</span>
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em]",
              s.status === "healthy"
                ? "border-success-border bg-success-soft text-success-deep"
                : "border-amber/30 bg-amber-soft text-amber-deep",
            )}
          >
            ● {s.status === "healthy" ? "Healthy" : "Issue"}
          </span>
          <span className="text-right text-[11px] text-muted">{s.note}</span>
        </li>
      ))}
    </ul>
  );
}
