import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { ArrowDown, ArrowUp, Download, Search, Share2 } from "lucide-react";
import { Button, Input } from "@ajs/ui";
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
interface Bucket {
  key: string;
  abstracts: number;
  files: number;
}
interface ArticleRow {
  publicationId: number;
  title: string;
  authorByline: string | null;
  abstractViews: number;
  fileViews: number;
  pdfViews: number;
  htmlViews: number;
  otherViews: number;
  total: number;
}
interface ArticlePage {
  rows: ArticleRow[];
  totalRows: number;
  page: number;
  size: number;
}

type RangePreset = "3m" | "6m" | "12m" | "ytd" | "all";
type EngagementMode = "articles" | "issues";
type EngagementSeries = "abstracts" | "files";
type SortKey =
  | "title"
  | "abstract"
  | "file"
  | "pdf"
  | "html"
  | "other"
  | "total";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 20;
const RANGE_LABELS: Record<RangePreset, string> = {
  "3m": "Last 3 months",
  "6m": "Last 6 months",
  "12m": "Last 12 months",
  ytd: "YTD",
  all: "All time",
};

function rangeFor(preset: RangePreset): { from: string; to: string } {
  const today = new Date();
  const to = isoDate(today);
  if (preset === "all") return { from: "2000-01-01", to };
  if (preset === "ytd") return { from: `${today.getFullYear()}-01-01`, to };
  const months = preset === "3m" ? 3 : preset === "6m" ? 6 : 12;
  const d = new Date(today);
  d.setMonth(d.getMonth() - months);
  return { from: isoDate(d), to };
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // Reader engagement card state
  const [engagementMode, setEngagementMode] = useState<EngagementMode>("articles");
  const [engagementSeries, setEngagementSeries] =
    useState<EngagementSeries>("abstracts");
  const [rangePreset, setRangePreset] = useState<RangePreset>("12m");
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Article details table state
  const [articles, setArticles] = useState<ArticlePage | null>(null);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const range = useMemo(() => rangeFor(rangePreset), [rangePreset]);

  function toggleSort(key: SortKey): void {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  // Dashboard core: KPIs, flow, decisions, sections, performance,
  // reading-impact, issues — fetched once on mount.
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

  // Engagement chart buckets — re-fires on range change. Issues mode
  // reuses the issues array we already have and doesn't need a server
  // round-trip.
  useEffect(() => {
    if (engagementMode === "issues") return;
    let cancelled = false;
    setLoadingBuckets(true);
    const qs = new URLSearchParams({
      from: range.from,
      to: range.to,
      granularity: "monthly",
    });
    void (async () => {
      const data = await api<Bucket[]>(
        `/api/v1/admin/stats/articles/timeseries?${qs.toString()}`,
      );
      if (!cancelled) {
        setBuckets(data ?? []);
        setLoadingBuckets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engagementMode, range.from, range.to]);

  // Article details table — re-fires on range / search / page / sort.
  useEffect(() => {
    let cancelled = false;
    setLoadingArticles(true);
    const qs = new URLSearchParams({
      from: range.from,
      to: range.to,
      page: String(page),
      size: String(PAGE_SIZE),
      sort: sortKey,
      dir: sortDir,
    });
    if (search.trim()) qs.set("q", search.trim());
    void (async () => {
      const data = await api<ArticlePage>(
        `/api/v1/admin/stats/articles/details?${qs.toString()}`,
      );
      if (!cancelled) {
        setArticles(data);
        setLoadingArticles(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, search, page, sortKey, sortDir]);

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

      {/* Reader engagement — interchangeable Articles vs Issues + monthly range */}
      <div className="mt-4">
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <Eyebrow text="Reader engagement" />
              <Title
                text={
                  engagementMode === "articles"
                    ? "Article views, monthly"
                    : "Engagement by issue"
                }
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle
                options={[
                  { value: "articles", label: "Articles" },
                  { value: "issues", label: "Issues" },
                ]}
                value={engagementMode}
                onChange={setEngagementMode}
              />
              <Toggle
                options={[
                  { value: "abstracts", label: "Abstracts" },
                  { value: "files", label: "Files" },
                ]}
                value={engagementSeries}
                onChange={setEngagementSeries}
              />
              {engagementMode === "articles" ? (
                <RangePresetPicker value={rangePreset} onChange={setRangePreset} />
              ) : null}
            </div>
          </div>

          <div className="mt-4 h-[260px]">
            {engagementMode === "articles" ? (
              loadingBuckets ? (
                <div className="grid h-full place-items-center text-[12.5px] text-muted">
                  Loading…
                </div>
              ) : buckets.length === 0 ? (
                <div className="grid h-full place-items-center text-[12.5px] text-muted">
                  No events recorded in this range.
                </div>
              ) : (
                <ArticleEngagementChart
                  buckets={buckets}
                  series={engagementSeries}
                />
              )
            ) : issues.length === 0 ? (
              <div className="grid h-full place-items-center text-[12.5px] text-muted">
                No published issues yet.
              </div>
            ) : (
              <IssueEngagementChart
                rows={issues}
                series={engagementSeries}
              />
            )}
          </div>
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

      {/* Article details — paginated, searchable, sortable */}
      <div className="mt-4">
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <Eyebrow text="Articles" />
              <Title text="Article details" />
            </div>
            <span className="text-[12px] text-muted">
              {Math.min(PAGE_SIZE, articles?.rows.length ?? 0)} of{" "}
              {(articles?.totalRows ?? 0).toLocaleString()} articles ·{" "}
              {RANGE_LABELS[rangePreset]}
            </span>
          </div>

          {loadingArticles && !articles ? (
            <div className="grid h-[180px] place-items-center text-[13px] text-muted">
              Loading…
            </div>
          ) : (
            <>
              <ArticleDetailsTable
                rows={articles?.rows ?? []}
                search={search}
                onSearch={(s) => {
                  setPage(0);
                  setSearch(s);
                }}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={toggleSort}
              />
              {!articles || articles.rows.length === 0 ? (
                <div className="border-t border-border px-5 py-10">
                  <EmptyState
                    icon="inbox"
                    title="No articles match"
                    description="Try widening the range or clearing the search."
                  />
                </div>
              ) : null}
              <ArticlePagination
                page={page}
                total={articles?.totalRows ?? 0}
                pageSize={PAGE_SIZE}
                onPage={setPage}
              />
            </>
          )}
        </Card>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------
// Reusable bits
// ----------------------------------------------------------------------

function Eyebrow({ text }: { text: string }): ReactNode {
  return <div className="sc text-muted">{text}</div>;
}

function Title({ text }: { text: string }): ReactNode {
  return (
    <div className="mt-1 font-serif-display text-[20px] font-medium tracking-[-0.01em] text-ink">
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

// ----------------------------------------------------------------------
// Reader engagement: chart variants, range picker, generic toggle
// ----------------------------------------------------------------------

function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}): ReactNode {
  return (
    <div
      role="tablist"
      className="inline-flex rounded-md border border-border bg-bg-tint p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-[4px] px-3 py-1 text-[12px] font-medium transition-colors",
            value === o.value ? "bg-cobalt text-white" : "text-fg-2 hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RangePresetPicker({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (v: RangePreset) => void;
}): ReactNode {
  const presets: RangePreset[] = ["3m", "6m", "12m", "ytd", "all"];
  return (
    <div className="inline-flex rounded-md border border-border bg-bg-tint p-0.5">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          aria-pressed={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "rounded-[4px] px-2.5 py-1 text-[11.5px] font-medium uppercase tracking-wider transition-colors",
            value === p
              ? "bg-cobalt text-white"
              : "text-fg-2 hover:text-fg",
          )}
        >
          {p === "ytd" ? "YTD" : p === "all" ? "All" : p.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function prettyMonth(k: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(k);
  if (!m) return k;
  const d = new Date(`${m[1]}-${m[2]}-01T00:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  });
}

function ArticleEngagementChart({
  buckets,
  series,
}: {
  buckets: Bucket[];
  series: EngagementSeries;
}): ReactNode {
  const data = buckets.map((b) => ({
    label: prettyMonth(b.key),
    value: series === "abstracts" ? b.abstracts : b.files,
  }));
  const stroke = series === "abstracts" ? "var(--cobalt)" : "var(--amber-deep)";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
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
        <Line
          type="monotone"
          dataKey="value"
          stroke={stroke}
          strokeWidth={2}
          dot={{ r: 2.5, strokeWidth: 0, fill: stroke }}
          activeDot={{ r: 4 }}
          name={series === "abstracts" ? "Abstract views" : "File views"}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function IssueEngagementChart({
  rows,
  series,
}: {
  rows: IssueRow[];
  series: EngagementSeries;
}): ReactNode {
  const data = rows
    .map((r) => ({
      label: r.identification.replace(/\(\d{4}\)$/, "").trim(),
      value: series === "abstracts" ? r.abstractViews : r.fileViews,
    }))
    .reverse();
  const fill = series === "abstracts" ? "var(--cobalt)" : "var(--amber-deep)";
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 3" />
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
        <Bar
          dataKey="value"
          fill={fill}
          radius={[3, 3, 0, 0]}
          name={series === "abstracts" ? "Abstract views" : "File views"}
          isAnimationActive={false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ----------------------------------------------------------------------
// Article details: search + sortable header + paginated table
// ----------------------------------------------------------------------

function ArticleDetailsTable({
  rows,
  search,
  onSearch,
  sortKey,
  sortDir,
  onSort,
}: {
  rows: ArticleRow[];
  search: string;
  onSearch: (s: string) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}): ReactNode {
  return (
    <div className="grid grid-cols-[1fr_120px_120px_70px_70px_70px_80px] gap-3 px-5">
      <div className="border-b border-border py-2.5">
        <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
          Title
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by title, author and ID"
            className="h-8 pl-8 text-[12px]"
          />
        </div>
      </div>
      <SortHeader k="abstract" label="Abstract Views" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortHeader k="file" label="File Views" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortHeader k="pdf" label="PDF" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortHeader k="html" label="HTML" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortHeader k="other" label="Other" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
      <SortHeader k="total" label="Total" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />

      {rows.map((r) => (
        <ArticleRowCells key={r.publicationId} row={r} />
      ))}
    </div>
  );
}

function SortHeader({
  k,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  k: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}): ReactNode {
  const active = sortKey === k;
  const Icon = active && sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      aria-sort={
        active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn(
        "flex h-full items-end justify-end gap-1 self-stretch border-b border-border py-2.5 text-right text-[10.5px] font-semibold uppercase tracking-[0.08em] transition-colors",
        active ? "text-fg" : "text-muted hover:text-fg-2",
      )}
    >
      <span>{label}</span>
      <Icon
        className={cn(
          "size-3 shrink-0 transition-opacity",
          active ? "opacity-100" : "opacity-30",
        )}
      />
    </button>
  );
}

function ArticleRowCells({ row }: { row: ArticleRow }): ReactNode {
  return (
    <>
      <div className="border-b border-border py-3">
        {row.authorByline ? (
          <span className="font-medium">{row.authorByline}. </span>
        ) : null}
        <span className="text-fg-2">{row.title}</span>
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[13px]">
        {row.abstractViews.toLocaleString()}
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[13px]">
        {row.fileViews.toLocaleString()}
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[12.5px] text-muted">
        {row.pdfViews.toLocaleString()}
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[12.5px] text-muted">
        {row.htmlViews.toLocaleString()}
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[12.5px] text-muted">
        {row.otherViews.toLocaleString()}
      </div>
      <div className="tnum border-b border-border py-3 text-right text-[13px] font-semibold">
        {row.total.toLocaleString()}
      </div>
    </>
  );
}

function ArticlePagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}): ReactNode {
  if (total <= pageSize) return null;
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);
  const fromIdx = page * pageSize + 1;
  const toIdx = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12px] text-muted">
      <span>
        Showing {fromIdx}–{toIdx} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page === 0}
          onClick={() => onPage(Math.max(0, page - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPage(Math.min(lastPage, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
