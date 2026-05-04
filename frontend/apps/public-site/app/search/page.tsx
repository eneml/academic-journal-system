import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchActiveSections,
  fetchJournalConfig,
  pickLocale,
  search,
  type PublicationSummary,
  type SearchHit,
  type SectionSummary,
} from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Search",
  description: "Full-text search across published articles.",
};

type Props = {
  searchParams: Promise<{
    q?: string;
    section?: string;
    year?: string;
    oa?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 20;

export default async function SearchPage({
  searchParams,
}: Props): Promise<ReactNode> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sectionId = parseIntSafe(params.section);
  const year = parseIntSafe(params.year);
  const oaOnly = params.oa === "1";
  const page = Math.max(1, parseIntSafe(params.page) ?? 1);

  const [config, sections] = await Promise.all([
    fetchJournalConfig(),
    fetchActiveSections(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const sectionsById = new Map<number, SectionSummary>(
    (sections ?? []).map((s) => [s.id, s]),
  );

  // Baseline (unfiltered) hits for sidebar facet counts.
  // When no query is set, results stay null and the sidebar is empty.
  let baseline: SearchHit[] | null = null;
  let backendUnreachable = false;
  if (q.length > 0) {
    const data = await search(q, { size: 200 });
    if (data == null) {
      backendUnreachable = true;
    } else {
      baseline = data;
    }
  }

  // Filter the baseline locally to drive both the chip strip and the
  // results body. We do this client-side so facet counts can stay
  // representative of the un-filtered query.
  const filtered = applyFacets(baseline ?? [], { sectionId, year, oaOnly });
  const totalFiltered = filtered.length;
  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = pageStart + PAGE_SIZE;
  const pageHits = filtered.slice(pageStart, pageEnd);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const yearCounts = histogram(baseline ?? [], (h) => yearOf(h.publication));
  const sectionCounts = histogram(
    baseline ?? [],
    (h) => h.publication.sectionId,
  );
  const oaCount = (baseline ?? []).filter(
    (h) => h.publication.accessStatus === "OPEN",
  ).length;

  const activeFilters: Array<{ label: string; href: string }> = [];
  if (year != null)
    activeFilters.push({
      label: String(year),
      href: hrefFor({ q, sectionId, oaOnly }),
    });
  if (sectionId != null) {
    const s = sectionsById.get(sectionId);
    activeFilters.push({
      label: pickLocale(s?.title, locale) || `Section ${sectionId}`,
      href: hrefFor({ q, year, oaOnly }),
    });
  }
  if (oaOnly)
    activeFilters.push({
      label: "OA only",
      href: hrefFor({ q, sectionId, year }),
    });

  return (
    <SiteChrome journalName={journalName}>
      <section style={{ padding: "32px 56px" }}>
        {/* Search bar */}
        <form
          method="get"
          action="/search"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "1px solid var(--border-strong)",
            borderRadius: 6,
            padding: "10px 14px",
            maxWidth: 800,
            marginBottom: 18,
            background: "var(--bg)",
          }}
        >
          {/* Preserve facet selections when the user re-submits */}
          {sectionId != null ? (
            <input type="hidden" name="section" value={sectionId} />
          ) : null}
          {year != null ? <input type="hidden" name="year" value={year} /> : null}
          {oaOnly ? <input type="hidden" name="oa" value="1" /> : null}
          <SearchIcon />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Title, abstract, keywords…"
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              fontSize: 16,
              fontFamily: "var(--serif-body)",
              color: "var(--fg)",
              background: "transparent",
            }}
          />
          <span className="chip chip-mono" style={{ fontSize: 9.5 }}>
            ⌘K
          </span>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 40 }}>
          {/* Refine sidebar */}
          <aside>
            <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
              Refine
            </div>

            {q.length === 0 ? (
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  fontFamily: "var(--serif-body)",
                  fontStyle: "italic",
                }}
              >
                Enter a query to filter results.
              </p>
            ) : (
              <>
                <FacetGroup
                  title="Year"
                  options={Array.from(yearCounts.entries())
                    .filter(([k]) => k != null)
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .slice(0, 6)
                    .map(([y, n]) => ({
                      label: String(y),
                      count: n,
                      active: year != null && Number(y) === year,
                      href: hrefFor({
                        q,
                        sectionId,
                        oaOnly,
                        year: year === Number(y) ? null : Number(y),
                      }),
                    }))}
                />
                <FacetGroup
                  title="Section"
                  options={Array.from(sectionCounts.entries())
                    .filter(([k]) => k != null)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .map(([sid, n]) => {
                      const s = sectionsById.get(Number(sid));
                      return {
                        label: pickLocale(s?.title, locale) || `Section ${sid}`,
                        count: n,
                        active: sectionId === Number(sid),
                        href: hrefFor({
                          q,
                          year,
                          oaOnly,
                          sectionId:
                            sectionId === Number(sid) ? null : Number(sid),
                        }),
                      };
                    })}
                />
                <FacetGroup
                  title="Open Access"
                  options={[
                    {
                      label: "OA only",
                      count: oaCount,
                      active: oaOnly,
                      href: hrefFor({
                        q,
                        sectionId,
                        year,
                        oaOnly: !oaOnly,
                      }),
                    },
                  ]}
                />
              </>
            )}
          </aside>

          {/* Results column */}
          <div>
            {q.length === 0 ? (
              <EmptyHero />
            ) : backendUnreachable ? (
              <p
                className="text-fg-2"
                style={{ fontFamily: "var(--serif-body)", fontSize: 16 }}
              >
                Search is temporarily unavailable. Please try again in a moment.
              </p>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 16,
                  }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontSize: 24,
                      fontWeight: 500,
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <span className="tnum" style={{ color: "var(--cobalt)" }}>
                      {totalFiltered}
                    </span>{" "}
                    result{totalFiltered === 1 ? "" : "s"} for{" "}
                    <em>&ldquo;{q}&rdquo;</em>
                  </h2>
                  <a
                    href="/feed.xml"
                    className="btn btn-sm"
                    style={{ textDecoration: "none" }}
                    aria-label="Subscribe to RSS"
                  >
                    <RssIcon />
                  </a>
                </div>

                {activeFilters.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      marginBottom: 18,
                      flexWrap: "wrap",
                    }}
                  >
                    {activeFilters.map((f) => (
                      <Link
                        key={f.label}
                        href={f.href}
                        className="chip chip-cobalt"
                        style={{ textDecoration: "none" }}
                      >
                        {f.label} <XIcon />
                      </Link>
                    ))}
                    <Link
                      href={`/search?q=${encodeURIComponent(q)}`}
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        textDecoration: "none",
                      }}
                    >
                      Clear all
                    </Link>
                  </div>
                ) : null}

                {pageHits.length === 0 ? (
                  <p
                    className="text-fg-2"
                    style={{
                      fontFamily: "var(--serif-body)",
                      fontSize: 16,
                      margin: "30px 0",
                    }}
                  >
                    No results match the current filters. Try removing a refinement
                    or broadening your query.
                  </p>
                ) : (
                  pageHits.map((hit) => {
                    const slug =
                      hit.publication.urlPath ?? String(hit.publication.id);
                    const title =
                      pickLocale(hit.publication.title, locale) ||
                      `Article ${hit.publication.id}`;
                    const sectionTitle = hit.publication.sectionId
                      ? pickLocale(
                          sectionsById.get(hit.publication.sectionId)?.title,
                          locale,
                        )
                      : null;
                    const pubYear = yearOf(hit.publication);
                    return (
                      <article
                        key={hit.publication.id}
                        style={{
                          padding: "20px 0",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--serif-display)",
                            fontSize: 20,
                            fontWeight: 500,
                            margin: "0 0 6px",
                            lineHeight: 1.25,
                          }}
                        >
                          <Link
                            href={`/articles/${encodeURIComponent(slug)}`}
                            style={{ color: "var(--fg)", textDecoration: "none" }}
                          >
                            {title}
                          </Link>
                        </h3>
                        <div
                          style={{
                            fontFamily: "var(--serif-body)",
                            fontStyle: "italic",
                            color: "var(--muted)",
                            fontSize: 13,
                            marginBottom: 8,
                          }}
                        >
                          {sectionTitle ? (
                            <>
                              <span
                                style={{
                                  color: "var(--cobalt)",
                                  fontStyle: "normal",
                                }}
                              >
                                {sectionTitle}
                              </span>
                              {pubYear ? " · " : null}
                            </>
                          ) : null}
                          {pubYear ? (
                            <span
                              className="tnum"
                              style={{ fontFamily: "var(--mono)", fontSize: 12 }}
                            >
                              {pubYear}
                            </span>
                          ) : null}
                        </div>
                        {hit.snippet ? (
                          <p
                            style={{
                              fontFamily: "var(--serif-body)",
                              fontSize: 14,
                              lineHeight: 1.6,
                              color: "var(--fg-2)",
                              margin: "0 0 10px",
                              maxWidth: 720,
                            }}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: hit.snippet }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: "flex",
                            gap: 14,
                            fontSize: 11,
                            alignItems: "center",
                            color: "var(--muted)",
                          }}
                        >
                          {hit.publication.accessStatus === "OPEN" ? (
                            <span
                              className="chip chip-mono"
                              title="Open access"
                            >
                              OA
                            </span>
                          ) : null}
                          {hit.publication.datePublished ? (
                            <span style={{ fontFamily: "var(--mono)" }}>
                              {new Date(
                                hit.publication.datePublished,
                              ).toLocaleDateString(locale, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          ) : null}
                          <span>·</span>
                          <Link
                            href={`/articles/${encodeURIComponent(slug)}`}
                            style={{
                              color: "var(--cobalt)",
                              textDecoration: "none",
                            }}
                          >
                            Read
                          </Link>
                          <Link
                            href={`/articles/${encodeURIComponent(slug)}#cite`}
                            style={{
                              color: "var(--cobalt)",
                              textDecoration: "none",
                            }}
                          >
                            Cite
                          </Link>
                        </div>
                      </article>
                    );
                  })
                )}

                {totalPages > 1 ? (
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    base={hrefFor({ q, sectionId, year, oaOnly })}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}

function FacetGroup({
  title,
  options,
}: {
  title: string;
  options: Array<{ label: string; count: number; active: boolean; href: string }>;
}): ReactNode {
  if (options.length === 0) return null;
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: "var(--fg-2)",
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {options.map((o) => (
          <Link
            key={o.label}
            href={o.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12.5,
              color: "var(--fg-2)",
              cursor: "pointer",
              textDecoration: "none",
              padding: "2px 0",
            }}
          >
            <span
              style={{
                width: 13,
                height: 13,
                border: "1.5px solid",
                borderColor: o.active ? "var(--cobalt)" : "var(--border-strong)",
                borderRadius: 3,
                background: o.active ? "var(--cobalt)" : "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              {o.active ? <CheckIcon /> : null}
            </span>
            <span style={{ flex: 1 }}>{o.label}</span>
            <span
              className="tnum"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10.5,
                color: "var(--muted)",
              }}
            >
              {o.count}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  base,
}: {
  page: number;
  totalPages: number;
  base: string;
}): ReactNode {
  // Compact pagination: 1 … (page-1) page (page+1) … last
  const slots: Array<number | "…"> = [];
  const push = (n: number | "…") => slots.push(n);
  push(1);
  if (page > 3) push("…");
  for (
    let p = Math.max(2, page - 1);
    p <= Math.min(totalPages - 1, page + 1);
    p++
  ) {
    push(p);
  }
  if (page < totalPages - 2) push("…");
  if (totalPages > 1) push(totalPages);

  const sep = base.includes("?") ? "&" : "?";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 4,
        marginTop: 32,
        flexWrap: "wrap",
      }}
    >
      {slots.map((p, i) =>
        p === "…" ? (
          <span
            key={`gap-${i}`}
            className="btn btn-sm"
            style={{
              minWidth: 32,
              justifyContent: "center",
              border: "none",
              background: "transparent",
              cursor: "default",
            }}
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            href={`${base}${sep}page=${p}`}
            className="btn btn-sm"
            style={{
              minWidth: 32,
              justifyContent: "center",
              background: p === page ? "var(--cobalt)" : "var(--bg)",
              color: p === page ? "white" : "var(--fg)",
              borderColor: p === page ? "var(--cobalt)" : "var(--border-strong)",
              textDecoration: "none",
            }}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link
          href={`${base}${sep}page=${page + 1}`}
          className="btn btn-sm"
          style={{ textDecoration: "none" }}
        >
          Next <ChevronRightIcon />
        </Link>
      ) : null}
    </div>
  );
}

function EmptyHero(): ReactNode {
  return (
    <div style={{ paddingTop: 24 }}>
      <p
        className="sc text-cobalt mb-3"
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontSize: 11,
          fontWeight: 600,
          color: "var(--cobalt)",
        }}
      >
        Search
      </p>
      <h1
        className="text-fg"
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: "clamp(34px, 5vw, 52px)",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
        }}
      >
        Find published work
      </h1>
      <p
        className="text-fg-2"
        style={{
          fontFamily: "var(--serif-body)",
          fontSize: 17,
          lineHeight: 1.55,
          maxWidth: 540,
          color: "var(--fg-2)",
        }}
      >
        Search across every published article — titles, abstracts, keywords. Once
        you have results, refine by year, section, or open-access only from the
        sidebar.
      </p>
    </div>
  );
}

// ---------- helpers ----------

function applyFacets(
  hits: SearchHit[],
  f: { sectionId: number | null; year: number | null; oaOnly: boolean },
): SearchHit[] {
  return hits.filter((h) => {
    if (f.sectionId != null && h.publication.sectionId !== f.sectionId)
      return false;
    if (f.year != null && yearOf(h.publication) !== f.year) return false;
    if (f.oaOnly && h.publication.accessStatus !== "OPEN") return false;
    return true;
  });
}

function histogram<K extends string | number | null>(
  hits: SearchHit[],
  key: (h: SearchHit) => K,
): Map<K, number> {
  const m = new Map<K, number>();
  for (const h of hits) {
    const k = key(h);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function yearOf(p: PublicationSummary): number | null {
  if (!p.datePublished) return null;
  const y = new Date(p.datePublished).getUTCFullYear();
  return Number.isFinite(y) ? y : null;
}

function parseIntSafe(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function hrefFor(opts: {
  q: string;
  sectionId?: number | null;
  year?: number | null;
  oaOnly?: boolean | null;
}): string {
  const sp = new URLSearchParams();
  sp.set("q", opts.q);
  if (opts.sectionId != null) sp.set("section", String(opts.sectionId));
  if (opts.year != null) sp.set("year", String(opts.year));
  if (opts.oaOnly) sp.set("oa", "1");
  return `/search?${sp.toString()}`;
}

// ---------- icons ----------

function SearchIcon(): ReactNode {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--muted)"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function RssIcon(): ReactNode {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 19a2 2 0 1 0 .001-3.999A2 2 0 0 0 5 19ZM4 12a8 8 0 0 1 8 8M4 5a15 15 0 0 1 15 15" />
    </svg>
  );
}

function XIcon(): ReactNode {
  return (
    <svg
      width={10}
      height={10}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronRightIcon(): ReactNode {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon(): ReactNode {
  return (
    <svg
      width={9}
      height={9}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}
