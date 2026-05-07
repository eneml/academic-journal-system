import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Calendar, Download, Search } from "lucide-react";
import { Button, Input } from "@ajs/ui";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";

export const Route = createFileRoute("/admin/stats/articles")({
  component: ArticleStatsPage,
});

interface Bucket {
  key: string;
  abstracts: number;
  files: number;
}
interface Row {
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
interface PageResp {
  rows: Row[];
  totalRows: number;
  page: number;
  size: number;
}

const PAGE_SIZE = 30;

function ArticleStatsPage(): ReactNode {
  const { user, roles, loading } = useAuth();
  if (loading) return <p className="text-muted">Loading session…</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Administration" title="Article statistics" />
        <EmptyState
          icon="alert"
          title="Editorial access required"
          description="Statistics is visible to editors and administrators."
        />
      </>
    );
  }
  return <ArticleStatsAdmin />;
}

function ArticleStatsAdmin(): ReactNode {
  const today = useMemo(() => isoDate(new Date()), []);
  const monthAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return isoDate(d);
  }, []);

  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [granularity, setGranularity] = useState<"daily" | "monthly">("daily");
  const [series, setSeries] = useState<"abstracts" | "files">("abstracts");
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [details, setDetails] = useState<PageResp | null>(null);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Fetch chart whenever range / granularity changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingChart(true);
    void (async () => {
      const data = await api<Bucket[]>(
        `/api/v1/admin/stats/articles/timeseries?from=${from}&to=${to}&granularity=${granularity}`,
      );
      if (!cancelled) {
        setBuckets(data ?? []);
        setLoadingChart(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to, granularity]);

  // Fetch table whenever range / search / page changes.
  useEffect(() => {
    let cancelled = false;
    setLoadingTable(true);
    const qs = new URLSearchParams({
      from,
      to,
      page: String(page),
      size: String(PAGE_SIZE),
    });
    if (search.trim()) qs.set("q", search.trim());
    void (async () => {
      const data = await api<PageResp>(
        `/api/v1/admin/stats/articles/details?${qs.toString()}`,
      );
      if (!cancelled) {
        setDetails(data);
        setLoadingTable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [from, to, search, page]);

  const totalRows = details?.totalRows ?? 0;
  const lastPage = Math.max(0, Math.ceil(totalRows / PAGE_SIZE) - 1);

  return (
    <>
      <PageHeader
        eyebrow="Statistics"
        title="Articles"
        description={`Per-article view and download metrics across the journal.`}
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled
            title="CSV export wiring lands with the next iteration"
          >
            <Download />
            Download report
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Toggle
            options={[
              { value: "abstracts", label: "Abstracts" },
              { value: "files", label: "Files" },
            ]}
            value={series}
            onChange={setSeries}
          />
          <div className="flex flex-wrap items-center gap-3">
            <DateRangeBox from={from} to={to} onFrom={setFrom} onTo={setTo} />
            <Toggle
              options={[
                { value: "daily", label: "Daily" },
                { value: "monthly", label: "Monthly" },
              ]}
              value={granularity}
              onChange={setGranularity}
            />
          </div>
        </div>

        <div className="mt-5 h-[260px] rounded-md bg-fg/95 p-3 text-bg">
          {loadingChart ? (
            <div className="grid h-full place-items-center text-[12.5px] text-bg/70">
              Loading…
            </div>
          ) : buckets.length === 0 ? (
            <div className="grid h-full place-items-center text-[12.5px] text-bg/70">
              No events recorded in this range.
            </div>
          ) : (
            <ChartView buckets={buckets} series={series} />
          )}
        </div>
      </Card>

      <div className="mt-6">
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <h2 className="m-0 font-serif-display text-[18px] font-medium">
              Article details
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-muted">
                {Math.min(PAGE_SIZE, details?.rows.length ?? 0)} of{" "}
                {totalRows.toLocaleString()} articles
              </span>
            </div>
          </div>

          <div className="border-b border-border px-5 py-3">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                placeholder="Search by title, author and ID"
                className="pl-9"
              />
            </div>
          </div>

          {loadingTable ? (
            <div className="grid h-[200px] place-items-center text-[13px] text-muted">
              Loading…
            </div>
          ) : !details || details.rows.length === 0 ? (
            <div className="px-5 py-10">
              <EmptyState
                icon="inbox"
                title="No articles match"
                description="Try widening the date range or clearing the search."
              />
            </div>
          ) : (
            <>
              <DetailsTable rows={details.rows} />
              <Pagination
                page={page}
                lastPage={lastPage}
                total={totalRows}
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
// Chart
// ----------------------------------------------------------------------

function ChartView({
  buckets,
  series,
}: {
  buckets: Bucket[];
  series: "abstracts" | "files";
}): ReactNode {
  const data = buckets.map((b) => ({
    label: prettyKey(b.key),
    value: series === "abstracts" ? b.abstracts : b.files,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          stroke="rgba(255,255,255,0.4)"
          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.4)"
          tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 11 }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--fg)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            fontSize: 12,
            color: "var(--bg)",
          }}
          labelStyle={{ color: "var(--bg)" }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="oklch(72% 0.16 12)"
          strokeWidth={2}
          dot={{ r: 3, fill: "oklch(72% 0.16 12)", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function prettyKey(k: string): string {
  // YYYY-MM-DD → "Apr 12, 2026" (short for chart axis)
  // YYYY-MM    → "Apr 2026"
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  if (ymd) {
    const d = new Date(`${k}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  const ym = /^(\d{4})-(\d{2})$/.exec(k);
  if (ym) {
    const d = new Date(`${k}-01T00:00:00`);
    return d.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return k;
}

// ----------------------------------------------------------------------
// Table
// ----------------------------------------------------------------------

function DetailsTable({ rows }: { rows: Row[] }): ReactNode {
  return (
    <div className="grid grid-cols-[1fr_120px_120px_70px_70px_70px_80px] gap-3 px-5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
      <div className="border-b border-border py-2.5">Title</div>
      <div className="border-b border-border py-2.5 text-right">
        Abstract views
      </div>
      <div className="border-b border-border py-2.5 text-right">File views</div>
      <div className="border-b border-border py-2.5 text-right">PDF</div>
      <div className="border-b border-border py-2.5 text-right">HTML</div>
      <div className="border-b border-border py-2.5 text-right">Other</div>
      <div className="border-b border-border py-2.5 text-right">Total</div>

      {rows.map((r) => (
        <RowCells key={r.publicationId} row={r} />
      ))}
    </div>
  );
}

function RowCells({ row }: { row: Row }): ReactNode {
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

function Pagination({
  page,
  lastPage,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  lastPage: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}): ReactNode {
  if (total <= pageSize) return null;
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

// ----------------------------------------------------------------------
// Tiny controls
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
            value === o.value
              ? "bg-cobalt text-white"
              : "text-fg-2 hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DateRangeBox({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}): ReactNode {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-[12px] text-fg-2">
      <Calendar className="size-3.5 text-muted" />
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        max={to}
        className="bg-transparent text-[12px] outline-none"
      />
      <span className="text-muted">—</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        min={from}
        max={isoDate(new Date())}
        className="bg-transparent text-[12px] outline-none"
      />
    </label>
  );
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
