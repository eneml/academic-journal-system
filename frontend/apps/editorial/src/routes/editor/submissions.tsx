import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import type { components } from "@ajs/api-client/schema";
import type { Page } from "../../lib/api";
import { useAuth } from "../../auth/AuthContext";
import { isEditorial } from "../../auth/roles";
import { api } from "../../lib/api";
import { cn } from "../../lib/cn";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SignInPrompt } from "../../components/SignInPrompt";
import { StatusChip } from "../../components/StatusChip";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type SubmissionResponse = components["schemas"]["SubmissionResponse"];
type SectionResponse = components["schemas"]["SectionResponse"];

/**
 * URL-synced facets. Anything not on this allowlist is dropped — keeps
 * stale/typo'd query strings from getting bound and surfacing as filters
 * the UI can't reset.
 */
interface SubmissionsSearchParams {
  status?: string;     // SubmissionStatus enum or "ANY"
  stage?: string;      // SubmissionStage enum
  sectionId?: number;
  submittedAfter?: string; // ISO8601 (date-only is fine; we widen to start-of-day)
  submittedBefore?: string;
  q?: string;          // local-only title filter (server-side disabled, see SubmissionService)
  page?: number;
  size?: number;
  sort?: string;       // "field,dir" e.g. "dateSubmitted,desc"
}

const ALL_STATUSES = ["ANY", "DRAFT", "QUEUED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
const ALL_STAGES = [
  "SUBMISSION",
  "EXTERNAL_REVIEW",
  "EDITING",
  "PRODUCTION",
  "PUBLISHED",
] as const;

const DEFAULT_SIZE = 25;
const DEFAULT_SORT = "dateSubmitted,desc";

export const Route = createFileRoute("/editor/submissions")({
  component: AllSubmissionsPage,
  validateSearch: (raw): SubmissionsSearchParams => {
    const r = raw as Record<string, unknown>;
    const out: SubmissionsSearchParams = {};

    const status = stringOf(r.status);
    if (status && (ALL_STATUSES as readonly string[]).includes(status)) {
      out.status = status;
    }
    const stage = stringOf(r.stage);
    if (stage && (ALL_STAGES as readonly string[]).includes(stage)) {
      out.stage = stage;
    }
    const sectionId = numberOf(r.sectionId);
    if (sectionId != null && sectionId > 0) out.sectionId = sectionId;

    const submittedAfter = stringOf(r.submittedAfter);
    if (submittedAfter && !Number.isNaN(Date.parse(submittedAfter))) {
      out.submittedAfter = submittedAfter;
    }
    const submittedBefore = stringOf(r.submittedBefore);
    if (submittedBefore && !Number.isNaN(Date.parse(submittedBefore))) {
      out.submittedBefore = submittedBefore;
    }

    const q = stringOf(r.q);
    if (q && q.length > 0) out.q = q;

    const page = numberOf(r.page);
    if (page != null && page >= 0) out.page = page;
    const size = numberOf(r.size);
    if (size != null && size > 0 && size <= 200) out.size = size;

    const sort = stringOf(r.sort);
    if (sort) out.sort = sort;

    return out;
  },
});

function stringOf(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function numberOf(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function AllSubmissionsPage(): ReactNode {
  // submissions.$id.tsx is a child of this route — defer the entire main
  // column to it when matched, so /editor/submissions/{id} actually renders
  // the detail page instead of the index list.
  const location = useLocation();
  const { user, roles, loading } = useAuth();
  const isIndex =
    location.pathname === "/editor/submissions" ||
    location.pathname === "/editor/submissions/";
  if (!isIndex) return <Outlet />;
  if (loading) return <p style={{ color: "var(--muted)" }}>Loading session&hellip;</p>;
  if (!user) return <SignInPrompt />;
  if (!isEditorial(roles)) {
    return (
      <>
        <PageHeader eyebrow="Editorial" title="All submissions" />
        <EmptyState
          icon="alert"
          title="Editor access required"
          description="This area is restricted to ADMIN, EDITOR, and SECTION_EDITOR roles."
        />
      </>
    );
  }
  return <FacetedBrowser />;
}

function FacetedBrowser(): ReactNode {
  const navigate = useNavigate({ from: "/editor/submissions" });
  const search = useSearch({ from: "/editor/submissions" });

  const [page, setPage] = useState<Page<SubmissionResponse> | null>(null);
  const [sections, setSections] = useState<SectionResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  // Local-only "find by title" — applies on top of the server-side page.
  // The backend can't text-search jsonb columns through portable JPA, so
  // for now we keep it client-side; switch to /api/v1/search later for
  // cross-page text search.
  const [titleFilter, setTitleFilter] = useState(search.q ?? "");

  // Fetch sections once; they back the section filter dropdown.
  useEffect(() => {
    void api<SectionResponse[]>("/api/v1/journal/sections").then((s) =>
      setSections(s ?? []),
    );
  }, []);

  const fetchPage = useCallback(async (): Promise<void> => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("status", search.status ?? "ANY");
    if (search.stage) params.set("stage", search.stage);
    if (search.sectionId) params.set("sectionId", String(search.sectionId));
    if (search.submittedAfter) {
      // Widen YYYY-MM-DD to start-of-day so editors can pick a single date.
      params.set("submittedAfter", normalizeIso(search.submittedAfter, "start"));
    }
    if (search.submittedBefore) {
      params.set("submittedBefore", normalizeIso(search.submittedBefore, "end"));
    }
    params.set("page", String(search.page ?? 0));
    params.set("size", String(search.size ?? DEFAULT_SIZE));
    params.set("sort", search.sort ?? DEFAULT_SORT);
    const result = await api<Page<SubmissionResponse>>(
      `/api/v1/submissions?${params.toString()}`,
    );
    setPage(result);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const updateSearch = useCallback(
    (patch: Partial<SubmissionsSearchParams>) => {
      // When the user changes a facet, jump back to page 0 unless they
      // explicitly passed a page in the patch — otherwise pagination on a
      // filtered view becomes nonsensical (page 5 of a fresh filter rarely
      // exists).
      const next: SubmissionsSearchParams = {
        ...search,
        ...patch,
      };
      if (!("page" in patch)) next.page = 0;
      // Strip nullables / empty strings so the URL stays tidy.
      (Object.keys(next) as (keyof SubmissionsSearchParams)[]).forEach((k) => {
        const v = next[k];
        if (v === undefined || v === null || v === "") delete next[k];
      });
      void navigate({ search: next as never, replace: false });
    },
    [navigate, search],
  );

  const sectionsById = useMemo(() => {
    const m = new Map<number, SectionResponse>();
    (sections ?? []).forEach((s) => m.set(s.id ?? -1, s));
    return m;
  }, [sections]);

  const filteredRows = useMemo(() => {
    if (!page) return [];
    const q = titleFilter.trim().toLowerCase();
    if (!q) return page.content;
    // Client-side title match: pick the first non-empty title across locales.
    return page.content.filter((s) => {
      const titles = s.title ? Object.values(s.title) : [];
      return titles.some((t) => t && t.toLowerCase().includes(q));
    });
  }, [page, titleFilter]);

  const totalElements = page?.totalElements ?? 0;
  const totalPages = page?.totalPages ?? 0;
  const currentPage = page?.number ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Editorial"
        title="All submissions"
        description={
          loading
            ? "Loading…"
            : `${totalElements.toLocaleString()} submission${totalElements === 1 ? "" : "s"} matching the current filters.`
        }
      />

      {/* Status pills — quick filter for the most common axis. */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {ALL_STATUSES.map((s) => {
          const active = (search.status ?? "ANY") === s;
          return (
            <Button
              key={s}
              type="button"
              variant={active ? "default" : "secondary"}
              size="sm"
              onClick={() => updateSearch({ status: s })}
              className={cn(
                "rounded-full px-3.5 capitalize",
                !active && "text-muted hover:text-fg-2",
              )}
            >
              {s === "ANY" ? "All statuses" : s.toLowerCase()}
            </Button>
          );
        })}
      </div>

      {/* Secondary facets row. */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_2fr] gap-2 mb-3">
        <FilterSelect
          label="Stage"
          value={search.stage ?? ""}
          options={[
            { value: "", label: "Any stage" },
            ...ALL_STAGES.map((s) => ({ value: s, label: s.replace(/_/g, " ").toLowerCase() })),
          ]}
          onChange={(v) => updateSearch({ stage: v || undefined })}
        />
        <FilterSelect
          label="Section"
          value={search.sectionId ? String(search.sectionId) : ""}
          options={[
            { value: "", label: "Any section" },
            ...(sections ?? []).map((s) => ({
              value: String(s.id ?? ""),
              label:
                pickLocalized(s.title) ?? pickLocalized(s.abbrev) ?? `#${s.id ?? "?"}`,
            })),
          ]}
          onChange={(v) =>
            updateSearch({
              sectionId: v ? Number.parseInt(v, 10) : undefined,
            })
          }
        />
        <FilterDate
          label="Submitted after"
          value={search.submittedAfter ?? ""}
          onChange={(v) => updateSearch({ submittedAfter: v || undefined })}
        />
        <FilterDate
          label="Submitted before"
          value={search.submittedBefore ?? ""}
          onChange={(v) => updateSearch({ submittedBefore: v || undefined })}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-[0.06em] text-muted font-semibold">
            Find in title (this page)
          </span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-2" />
            <Input
              value={titleFilter}
              onChange={(e) => {
                setTitleFilter(e.target.value);
                updateSearch({ q: e.target.value || undefined, page: 0 });
              }}
              placeholder="Filter this page by title…"
              className="pl-8"
            />
          </div>
        </div>
      </div>

      {(search.stage ||
        search.sectionId ||
        search.submittedAfter ||
        search.submittedBefore ||
        search.q ||
        (search.status && search.status !== "ANY")) && (
        <div className="mb-3 flex items-center gap-2">
          <Filter className="size-3 text-muted" />
          <span className="text-[11.5px] text-muted">Filters active</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              setTitleFilter("");
              void navigate({ search: {} as never, replace: false });
            }}
            className="rounded-full text-[11.5px] h-7"
          >
            <X />
            Clear filters
          </Button>
        </div>
      )}

      {/* Results table. */}
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-2)",
          background: "white",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr 110px 110px 160px 130px 80px",
            gap: 12,
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-tint)",
          }}
        >
          <ColumnHeader label="ID" />
          <ColumnHeader label="Title" />
          <ColumnHeader label="Stage" />
          <ColumnHeader label="Status" />
          <ColumnHeader label="Section" />
          <ColumnHeader label="Submitted" />
          <ColumnHeader label="" />
        </div>

        {loading && page == null ? (
          <p
            style={{
              padding: 20,
              color: "var(--muted)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            Loading submissions…
          </p>
        ) : filteredRows.length === 0 ? (
          <p
            style={{
              padding: 30,
              color: "var(--muted)",
              fontSize: 13,
              textAlign: "center",
            }}
          >
            No submissions match the current filters.
          </p>
        ) : (
          filteredRows.map((s) => (
            <SubmissionRow
              key={s.id}
              submission={s}
              sectionName={
                s.sectionId != null
                  ? pickLocalized(sectionsById.get(s.sectionId)?.title) ?? `#${s.sectionId}`
                  : "—"
              }
            />
          ))
        )}
      </div>

      {/* Pagination. */}
      {page && totalPages > 1 ? (
        <div className="flex justify-between items-center mt-4 text-[12px] text-muted font-mono">
          <span>
            Page {currentPage + 1} of {totalPages}
            {titleFilter
              ? ` · ${filteredRows.length} match${filteredRows.length === 1 ? "" : "es"} on this page`
              : ""}
          </span>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => updateSearch({ page: currentPage - 1 })}
              disabled={currentPage === 0}
            >
              <ChevronLeft />
              Prev
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => updateSearch({ page: currentPage + 1 })}
              disabled={currentPage + 1 >= totalPages}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SubmissionRow({
  submission,
  sectionName,
}: {
  submission: SubmissionResponse;
  sectionName: string;
}): ReactNode {
  const title =
    pickLocalized(submission.title) ?? <em style={{ color: "var(--muted)" }}>(untitled)</em>;
  return (
    <Link
      to="/editor/submissions/$id"
      params={{ id: String(submission.id ?? "") }}
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 110px 110px 160px 130px 80px",
        gap: 12,
        padding: "12px 14px",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--cobalt)",
        }}
      >
        AJ-{String(submission.id ?? 0).padStart(4, "0")}
      </span>
      <span
        style={{
          fontFamily: "var(--serif-display)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--fg)",
          minWidth: 0,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </span>
      <Badge variant="outline" className="justify-self-start">
        {(submission.stage ?? "").replace(/_/g, " ").toLowerCase()}
      </Badge>
      <StatusChip status={submission.status ?? "DRAFT"} />
      <span
        style={{
          fontSize: 12,
          color: "var(--muted-2)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
        title={sectionName}
      >
        {sectionName}
      </span>
      <span
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        {submission.dateSubmitted
          ? new Date(submission.dateSubmitted).toLocaleDateString()
          : "draft"}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--cobalt)",
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        Open →
      </span>
    </Link>
  );
}

/* ─── small UI helpers ─── */

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}): ReactNode {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={lblStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      >
        {options.map((o) => (
          <option key={o.value || "_"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): ReactNode {
  return (
    <label style={{ display: "grid", gap: 4 }}>
      <span style={lblStyle}>{label}</span>
      <input
        type="date"
        value={dateInputValue(value)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

function ColumnHeader({ label }: { label: string }): ReactNode {
  return (
    <span
      style={{
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "var(--muted)",
        fontFamily: "var(--sans)",
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

/* ─── helpers ─── */

function pickLocalized(map: Record<string, string> | undefined): string | undefined {
  if (!map) return undefined;
  return Object.values(map).find((v) => v && v.trim().length > 0);
}

/** Pull yyyy-mm-dd out of an ISO string for a `<input type="date">`. */
function dateInputValue(iso: string): string {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})/);
  return m?.[1] ?? "";
}

/** Widen yyyy-mm-dd to a UTC instant at start- or end-of-day. */
function normalizeIso(value: string, edge: "start" | "end"): string {
  if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return edge === "start" ? `${value}T00:00:00Z` : `${value}T23:59:59Z`;
  }
  return value;
}

/* ─── styles ─── */

const lblStyle = {
  fontSize: 10,
  fontFamily: "var(--sans)",
  color: "var(--muted)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const inputStyle = {
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  background: "white",
  color: "var(--fg)",
  textTransform: "none" as const,
  letterSpacing: 0,
  fontWeight: 400,
};

