import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchActiveSections,
  fetchJournalConfig,
  pickLocale,
  search,
  type SearchHit,
  type SectionSummary,
} from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Search",
  description: "Full-text search across published articles.",
};

const filterSelectStyle: React.CSSProperties = {
  padding: "9px 11px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-2)",
  fontFamily: "var(--sans)",
  fontSize: 13,
  background: "var(--surface)",
  color: "var(--fg)",
  textTransform: "none",
  letterSpacing: 0,
  fontWeight: 400,
};

type Props = {
  searchParams: Promise<{
    q?: string;
    section?: string;
    year?: string;
  }>;
};

export default async function SearchPage({ searchParams }: Props): Promise<ReactNode> {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sectionId = params.section ? Number.parseInt(params.section, 10) : undefined;
  const year = params.year ? Number.parseInt(params.year, 10) : undefined;

  const [config, sections] = await Promise.all([
    fetchJournalConfig(),
    fetchActiveSections(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";

  let results: SearchHit[] | null = null;
  let backendUnreachable = false;
  if (q.length > 0) {
    const data = await search(q, {
      section: Number.isFinite(sectionId) ? sectionId : undefined,
      year: Number.isFinite(year) ? year : undefined,
      size: 30,
    });
    if (data == null) {
      backendUnreachable = true;
    } else {
      results = data;
    }
  }

  const sectionsById = new Map<number, SectionSummary>(
    (sections ?? []).map((s) => [s.id, s]),
  );

  return (
    <SiteChrome journalName={journalName} active="search">
      <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-14">
            <p
              className="sc text-cobalt mb-3"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Search
            </p>
            <h1
              className="text-fg mb-8"
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(34px, 5vw, 52px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              Find published work
            </h1>
            <form
              method="get"
              action="/search"
              style={{ display: "grid", gap: 10 }}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="Title, abstract, keywords, author affiliation…"
                  style={{
                    flex: 1,
                    padding: "11px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-2)",
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    background: "var(--surface)",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "11px 22px",
                    background: "var(--cobalt)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--r-2)",
                    fontFamily: "var(--sans)",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Search
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <label
                  style={{
                    display: "grid",
                    gap: 4,
                    fontSize: 11,
                    fontFamily: "var(--sans)",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Section
                  <select
                    name="section"
                    defaultValue={sectionId ? String(sectionId) : ""}
                    style={filterSelectStyle}
                  >
                    <option value="">— any —</option>
                    {(sections ?? []).map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {pickLocale(s.title, locale) || s.code}
                      </option>
                    ))}
                  </select>
                </label>
                <label
                  style={{
                    display: "grid",
                    gap: 4,
                    fontSize: 11,
                    fontFamily: "var(--sans)",
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Year
                  <input
                    type="number"
                    name="year"
                    defaultValue={year ? String(year) : ""}
                    placeholder="e.g. 2024"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    style={filterSelectStyle}
                  />
                </label>
              </div>
            </form>
          </div>
        </section>

        <section>
          <div className="max-w-3xl mx-auto px-6 py-12">
            {q.length === 0 ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                Type a query to search across titles, abstracts, and keywords.
              </p>
            ) : backendUnreachable ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                Search is temporarily unavailable. Please try again in a moment.
              </p>
            ) : !results || results.length === 0 ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                No results for <em>“{q}”</em>. Try a broader query or check the
                spelling.
              </p>
            ) : (
              <>
                <p
                  className="text-muted mb-6"
                  style={{ fontFamily: "var(--mono)", fontSize: 12 }}
                >
                  {results.length} result{results.length === 1 ? "" : "s"} for{" "}
                  <span style={{ color: "var(--fg)" }}>“{q}”</span>
                </p>
                <ul className="grid grid-cols-1 gap-y-7">
                  {results.map((hit) => {
                    const slug = hit.publication.urlPath ?? String(hit.publication.id);
                    const title =
                      pickLocale(hit.publication.title, locale) ||
                      `Article ${hit.publication.id}`;
                    const sectionTitle = hit.publication.sectionId
                      ? pickLocale(
                          sectionsById.get(hit.publication.sectionId)?.title,
                          locale,
                        )
                      : null;
                    return (
                      <li key={hit.publication.id}>
                        {sectionTitle ? (
                          <p
                            className="sc text-cobalt mb-1"
                            style={{
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                              fontSize: 10,
                              fontWeight: 600,
                            }}
                          >
                            {sectionTitle}
                          </p>
                        ) : null}
                        <Link
                          href={`/articles/${encodeURIComponent(slug)}`}
                          className="text-fg hover:text-cobalt"
                          style={{
                            fontFamily: "var(--serif-display)",
                            fontWeight: 600,
                            fontSize: 22,
                            lineHeight: 1.25,
                            display: "inline-block",
                          }}
                        >
                          {title}
                        </Link>
                        {hit.snippet ? (
                          <p
                            className="text-fg-2 mt-2"
                            style={{
                              fontFamily: "var(--serif-body)",
                              fontSize: 15,
                              lineHeight: 1.55,
                            }}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{ __html: hit.snippet }}
                          />
                        ) : null}
                        {hit.publication.datePublished ? (
                          <p
                            className="text-muted mt-2"
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: 11,
                            }}
                          >
                            {new Date(hit.publication.datePublished).toLocaleDateString(
                              locale,
                              { day: "numeric", month: "long", year: "numeric" },
                            )}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
    </SiteChrome>
  );
}
