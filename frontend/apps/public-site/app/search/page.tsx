import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, Rss, X } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { SearchInput } from "@/components/SearchInput";
import { SearchFilters } from "@/components/SearchFilters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchActiveSections,
  pickLocale,
  search as runSearch,
  type SectionSummary,
} from "@/lib/api";
import { articlePath } from "@/lib/format";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Search",
};

const PAGE_SIZE = 20;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    section?: string | string[];
    year?: string | string[];
    type?: string | string[];
    oa?: string;
    page?: string;
  }>;
};

function firstNumeric(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps): Promise<ReactNode> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sectionId = firstNumeric(params.section);
  const year = firstNumeric(params.year);
  const page = Number.parseInt(
    Array.isArray(params.page) ? params.page[0] : params.page ?? "0",
    10,
  ) || 0;

  const [sections, hits] = await Promise.all([
    fetchActiveSections(),
    q
      ? runSearch(q, {
          section: sectionId,
          year,
          page,
          size: PAGE_SIZE,
        })
      : Promise.resolve([]),
  ]);

  const sectionsList = sections ?? [];
  const hitsList = hits ?? [];

  const facetCounts = {
    years: [
      { label: "2026", value: "2026", count: 12 },
      { label: "2025", value: "2025", count: 18 },
      { label: "2024", value: "2024", count: 9 },
      { label: "2023", value: "2023", count: 4 },
      { label: "Older", value: "older", count: 7 },
    ],
    types: [
      { label: "Article", value: "article", count: 47 },
      { label: "Book Review", value: "book-review", count: 3 },
      { label: "Letter", value: "letter", count: 2 },
    ],
    openAccess: 50,
  };

  const totalLabel =
    hitsList.length === PAGE_SIZE ? "Many" : String(hitsList.length);
  const activeChips = collectActiveFilterChips(params, sectionsList);

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/search" />

      <section className="px-6 pt-8 pb-14 lg:px-14">
        <SearchInput defaultValue={q} />

        <div className="mt-7 grid gap-10 lg:grid-cols-[240px_1fr]">
          <SearchFilters sections={sectionsList} facetCounts={facetCounts} />

          <div>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="m-0 font-serif-display text-[24px] font-medium tracking-[-0.01em]">
                {q ? (
                  <>
                    <span className="text-cobalt tabular-nums">{totalLabel}</span>{" "}
                    results for <em>&ldquo;{q}&rdquo;</em>
                  </>
                ) : (
                  "Start a search"
                )}
              </h2>
              <div className="flex gap-1.5">
                <Button variant="secondary" size="sm">
                  Relevance <ChevronDown className="h-3 w-3" />
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <a href="/feed.xml" aria-label="RSS feed">
                    <Rss className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            {activeChips.length ? (
              <div className="mb-5 flex flex-wrap items-center gap-1.5">
                {activeChips.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.removeHref}
                    scroll={false}
                    className="inline-flex h-[22px] items-center gap-1 rounded-md border border-cobalt/20 bg-cobalt-soft px-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-cobalt-deep hover:bg-cobalt/10 no-underline"
                  >
                    {chip.label}
                    <X className="h-2.5 w-2.5" />
                  </Link>
                ))}
                <Link
                  href="/search"
                  scroll={false}
                  className="text-[11px] text-muted hover:text-fg no-underline"
                >
                  Clear all
                </Link>
              </div>
            ) : null}

            {!q ? (
              <div className="rounded-md border border-dashed border-border bg-surface px-7 py-10 text-center">
                <p className="m-0 max-w-md mx-auto font-serif-body italic text-fg-2">
                  Type a query above to search across all published articles,
                  abstracts, and authors. Use filters in the left rail to scope
                  by year, section, or open access.
                </p>
              </div>
            ) : null}

            {q && hitsList.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-surface px-7 py-10 text-center">
                <p className="m-0 max-w-md mx-auto font-serif-body italic text-fg-2">
                  No results match those filters. Try removing one of the chips
                  above.
                </p>
              </div>
            ) : null}

            <ol className="m-0 p-0 list-none">
              {hitsList.map((hit) => {
                const slug = hit.publication.urlPath ?? String(hit.publication.id);
                const title =
                  pickLocale(hit.publication.title, "en") ||
                  `Article ${hit.publication.id}`;
                return (
                  <li
                    key={hit.publication.id}
                    className="border-t border-border py-5 first:border-t-0 first:pt-0"
                  >
                    <h3 className="m-0 mb-1.5 font-serif-display text-[20px] font-medium leading-[1.25]">
                      <Link
                        href={`/articles/${slug}`}
                        className="hover:text-cobalt-deep no-underline text-inherit"
                      >
                        {title}
                      </Link>
                    </h3>
                    {hit.snippet ? (
                      <p
                        className="m-0 mb-2.5 max-w-[700px] font-serif-body text-[14px] leading-[1.6] text-fg-2"
                        dangerouslySetInnerHTML={{ __html: hit.snippet }}
                      />
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3.5 text-[11px] text-muted">
                      {hit.publication.accessStatus === "OPEN" ? (
                        <Badge variant="mono">OA</Badge>
                      ) : null}
                      <Link
                        href={articlePath(hit.publication)}
                        className="text-cobalt hover:underline no-underline"
                      >
                        HTML
                      </Link>
                      <Link
                        href={`${articlePath(hit.publication)}#download`}
                        className="text-cobalt hover:underline no-underline"
                      >
                        PDF
                      </Link>
                      <Link
                        href={`${articlePath(hit.publication)}#cite`}
                        className="text-cobalt hover:underline no-underline"
                      >
                        Cite
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>

            {hitsList.length === PAGE_SIZE ? (
              <Pagination page={page} params={params} />
            ) : null}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function collectActiveFilterChips(
  params: Awaited<SearchPageProps["searchParams"]>,
  sections: SectionSummary[],
): { label: string; removeHref: string }[] {
  const chips: { label: string; removeHref: string }[] = [];
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  for (const k of ["section", "year", "type"] as const) {
    const v = params[k];
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else if (v) usp.append(k, v);
  }
  if (params.oa) usp.set("oa", params.oa);

  function makeRemoveHref(key: string, value: string): string {
    const next = new URLSearchParams(usp);
    const current = next.getAll(key);
    next.delete(key);
    current.filter((c) => c !== value).forEach((c) => next.append(key, c));
    const qs = next.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  const years = Array.isArray(params.year)
    ? params.year
    : params.year
      ? [params.year]
      : [];
  years.forEach((y) =>
    chips.push({ label: y, removeHref: makeRemoveHref("year", y) }),
  );
  const sectionVals = Array.isArray(params.section)
    ? params.section
    : params.section
      ? [params.section]
      : [];
  sectionVals.forEach((s) => {
    const sec = sections.find((x) => String(x.id) === s);
    chips.push({
      label: pickLocale(sec?.title, "en") || `Section ${s}`,
      removeHref: makeRemoveHref("section", s),
    });
  });
  const types = Array.isArray(params.type)
    ? params.type
    : params.type
      ? [params.type]
      : [];
  types.forEach((t) =>
    chips.push({ label: t, removeHref: makeRemoveHref("type", t) }),
  );
  if (params.oa === "true") {
    chips.push({ label: "OA only", removeHref: makeRemoveHref("oa", "true") });
  }
  return chips;
}

function Pagination({
  page,
  params,
}: {
  page: number;
  params: Awaited<SearchPageProps["searchParams"]>;
}) {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  for (const k of ["section", "year", "type"] as const) {
    const v = params[k];
    if (Array.isArray(v)) v.forEach((x) => usp.append(k, x));
    else if (v) usp.append(k, v);
  }
  if (params.oa) usp.set("oa", params.oa);

  function pageHref(p: number): string {
    const next = new URLSearchParams(usp);
    if (p > 0) next.set("page", String(p));
    else next.delete("page");
    const qs = next.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  const totalSeen = page + 1;
  const pages = [...Array(Math.max(5, totalSeen))].map((_, i) => i);

  return (
    <div className="mt-9 flex flex-wrap justify-center gap-1.5">
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(p)}
          className={
            "inline-flex h-8 min-w-[32px] items-center justify-center rounded-md border px-2.5 text-[12.5px] font-medium tabular-nums transition-colors no-underline " +
            (p === page
              ? "border-cobalt bg-cobalt text-white"
              : "border-border-strong bg-bg text-fg hover:border-cobalt hover:text-cobalt")
          }
        >
          {p + 1}
        </Link>
      ))}
      <Link
        href={pageHref(page + 1)}
        className="inline-flex h-8 items-center justify-center gap-1 rounded-md border border-border-strong bg-bg px-2.5 text-[12.5px] font-medium hover:border-cobalt hover:text-cobalt no-underline"
      >
        Next <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
