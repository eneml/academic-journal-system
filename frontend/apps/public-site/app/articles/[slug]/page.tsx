import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchArticle,
  fetchArticleGalleys,
  fetchArticleVersions,
  fetchIssueById,
  fetchJournalConfig,
  fetchActiveSections,
  pickLocale,
  type Article,
  type ArticleAuthor,
  type GalleySummary,
  type IssueSummary,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: "Article not found" };
  const title = pickLocale(article.title, article.locale) || "Untitled";
  const abstract =
    pickLocale(article.abstractText, article.locale).slice(0, 200) || undefined;
  return {
    title,
    description: abstract,
    openGraph: { title, description: abstract, type: "article" },
    other: {
      citation_title: title,
      citation_publication_date: article.datePublished ?? "",
      ...(article.copyrightYear
        ? { citation_year: String(article.copyrightYear) }
        : {}),
    },
  };
}

export default async function ArticlePage({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const [article, config, sections, versions, galleys] = await Promise.all([
    fetchArticle(slug),
    fetchJournalConfig(),
    fetchActiveSections(),
    fetchArticleVersions(slug),
    fetchArticleGalleys(slug),
  ]);
  if (!article) notFound();

  const locale = article.locale ?? config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const issue = article.issueId ? await fetchIssueById(article.issueId) : null;

  const title = pickLocale(article.title, locale) || "Untitled";
  const abstract = pickLocale(article.abstractText, locale);
  const section = (sections ?? []).find((s) => s.id === article.sectionId) ?? null;
  const sectionLabel = section ? pickLocale(section.title, locale) : "Article";

  const publishedAt = article.datePublished ? new Date(article.datePublished) : null;

  // Authors with stable affiliation numbering, deduped by affiliation string.
  const { affiliations, authorIndex } = collectAffiliations(article.authors);

  const versionsSorted = (versions ?? [])
    .slice()
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

  const galleysSorted = (galleys ?? [])
    .slice()
    .filter((g) => g.approved)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  const pdfGalley = galleysSorted.find((g) =>
    (pickLocale(g.label, locale) || "").toLowerCase().includes("pdf"),
  );
  const galleyDownloadUrl = (g: GalleySummary): string =>
    `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${g.id}/download-url`;

  const jsonLd = buildScholarlyArticleJsonLd(article, journalName, slug, locale);

  // On-this-page entries that actually exist in the DOM right now.
  const tocEntries: Array<{ id: string; label: string }> = [];
  if (abstract) tocEntries.push({ id: "abstract", label: "Abstract" });
  if (article.authors && article.authors.length > 0)
    tocEntries.push({ id: "authors", label: "Authors" });
  if (article.keywords && article.keywords.length > 0)
    tocEntries.push({ id: "keywords", label: "Keywords" });
  if (galleysSorted.length > 0)
    tocEntries.push({ id: "fulltext", label: "Read full text" });
  tocEntries.push({ id: "cite", label: "Cite this article" });
  if (versionsSorted.length > 1)
    tocEntries.push({ id: "versions", label: "Versions" });

  return (
    <SiteChrome journalName={journalName}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb + version meta */}
      <div
        style={{
          padding: "20px 56px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            fontSize: 12,
            color: "var(--muted)",
          }}
        >
          <Link href="/issues" style={{ color: "var(--muted)", textDecoration: "none" }}>
            Archive
          </Link>
          <ChevronRight />
          {issue && issue.volume ? (
            <>
              <Link
                href={`/issues/${encodeURIComponent(issue.urlPath ?? String(issue.id))}`}
                style={{ color: "var(--muted)", textDecoration: "none" }}
              >
                Vol. {issue.volume}
              </Link>
              <ChevronRight />
            </>
          ) : null}
          {issue && issue.number ? (
            <>
              <Link
                href={`/issues/${encodeURIComponent(issue.urlPath ?? String(issue.id))}`}
                style={{ color: "var(--muted)", textDecoration: "none" }}
              >
                No. {issue.number}
                {issue.datePublished
                  ? ` · ${new Date(issue.datePublished).toLocaleDateString(locale, {
                      month: "long",
                      year: "numeric",
                    })}`
                  : ""}
              </Link>
              <ChevronRight />
            </>
          ) : null}
          {sectionLabel ? (
            <span className="sc" style={{ color: "var(--cobalt)" }}>
              {sectionLabel}
            </span>
          ) : null}
        </div>
        {versionsSorted.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--muted)",
            }}
          >
            <HistoryIcon /> Version {article.version} of {versionsSorted.length}
            {publishedAt ? (
              <>
                {" · published "}
                {publishedAt.toLocaleDateString(locale, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Article body grid */}
      <article
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 720px) 1fr",
          gap: 56,
          padding: "32px 56px 80px",
          alignItems: "start",
        }}
      >
        {/* Left: On this page */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            On this page
          </div>
          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 13,
            }}
          >
            {tocEntries.map((t, i) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                style={{
                  textDecoration: "none",
                  color: i === 0 ? "var(--fg)" : "var(--fg-2)",
                  fontWeight: i === 0 ? 600 : 400,
                  borderLeft:
                    i === 0
                      ? "2px solid var(--amber)"
                      : "2px solid var(--border)",
                  padding: "1px 0 1px 10px",
                  fontFamily: "var(--sans)",
                }}
              >
                {t.label}
              </a>
            ))}
          </nav>

          {article.doi ? (
            <>
              <div className="rule" style={{ margin: "20px 0 16px" }} />
              <div
                className="sc"
                style={{ color: "var(--muted)", marginBottom: 8 }}
              >
                DOI
              </div>
              <a
                href={`https://doi.org/${article.doi}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--cobalt)",
                  textDecoration: "none",
                  wordBreak: "break-all",
                }}
              >
                {article.doi}
              </a>
            </>
          ) : null}
        </aside>

        {/* Center: article */}
        <div>
          <header style={{ marginBottom: 32 }}>
            <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 14 }}>
              {sectionLabel}
              {article.accessStatus === "OPEN" ? " · Open Access" : ""}
            </div>
            <h1
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(34px, 4.4vw, 44px)",
                lineHeight: 1.12,
                letterSpacing: "-0.02em",
                margin: "0 0 18px",
              }}
            >
              {title}
            </h1>

            {article.authors && article.authors.length > 0 ? (
              <>
                <div
                  id="authors"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 18,
                    marginBottom: 14,
                  }}
                >
                  {article.authors.map((a, i) => {
                    const fullName = [a.givenName, a.familyName]
                      .filter(Boolean)
                      .join(" ")
                      .trim();
                    if (!fullName) return null;
                    const idx = authorIndex[i];
                    const sup = [
                      idx != null ? String(idx + 1) : null,
                      a.corresponding ? "*" : null,
                    ]
                      .filter(Boolean)
                      .join(",");
                    return (
                      <div
                        key={`${i}-${fullName}`}
                        style={{ display: "flex", flexDirection: "column", gap: 2 }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: "var(--sans)",
                          }}
                        >
                          {a.orcidId ? (
                            <Link
                              href={`/authors/${encodeURIComponent(
                                a.orcidId.replace(/^https?:\/\/orcid\.org\//, ""),
                              )}`}
                              style={{ color: "var(--fg)", textDecoration: "none" }}
                            >
                              {fullName}
                            </Link>
                          ) : (
                            fullName
                          )}
                          {sup ? (
                            <sup
                              style={{
                                color: "var(--muted)",
                                fontWeight: 400,
                                fontFamily: "var(--mono)",
                                fontSize: 10,
                                marginLeft: 2,
                              }}
                            >
                              {sup}
                            </sup>
                          ) : null}
                        </div>
                        {a.orcidId ? (
                          <OrcidBadge orcidId={a.orcidId} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {affiliations.length > 0 || article.authors.some((a) => a.corresponding) ? (
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "var(--muted)",
                      lineHeight: 1.7,
                      fontFamily: "var(--sans)",
                      borderLeft: "2px solid var(--border)",
                      paddingLeft: 12,
                      marginBottom: 22,
                    }}
                  >
                    {affiliations.map((aff, i) => (
                      <span key={aff}>
                        <span style={{ fontFamily: "var(--mono)" }}>{i + 1}</span>{" "}
                        {aff}
                        {i < affiliations.length - 1 ? " · " : null}
                      </span>
                    ))}
                    {article.authors.some((a) => a.corresponding) ? (
                      <>
                        {affiliations.length > 0 ? <br /> : null}
                        <span style={{ fontFamily: "var(--mono)" }}>*</span>{" "}
                        Corresponding author
                      </>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : null}

            {/* Meta strip */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                padding: "12px 0",
                borderTop: "1px solid var(--border)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {article.doi ? <DoiChip doi={article.doi} /> : null}
              {article.accessStatus === "OPEN" ? (
                <span className="chip chip-amber chip-dot">Open Access</span>
              ) : null}
              {article.licenseUrl ? (
                <span className="chip">{licenseLabel(article.licenseUrl)}</span>
              ) : null}
              <span className="chip chip-mono">
                v{article.version}
                {versionsSorted.length > 1 ? " · current" : ""}
              </span>
              <div style={{ flex: 1 }} />
              {publishedAt ? (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    fontFamily: "var(--mono)",
                  }}
                >
                  Published{" "}
                  {publishedAt.toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {article.pages ? ` · pp. ${article.pages}` : ""}
                </span>
              ) : null}
            </div>

            {/* Action toolbar */}
            <div style={{ display: "flex", gap: 6, marginTop: 18, flexWrap: "wrap" }}>
              {pdfGalley ? (
                <a
                  className="btn btn-primary"
                  href={galleyDownloadUrl(pdfGalley)}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <BookOpenIcon /> Read PDF
                </a>
              ) : (
                <button className="btn btn-primary" type="button" disabled>
                  <BookOpenIcon /> Read PDF
                </button>
              )}
              {pdfGalley ? (
                <a
                  className="btn"
                  href={galleyDownloadUrl(pdfGalley)}
                  download
                  style={{ textDecoration: "none" }}
                >
                  <DownloadIcon /> Download
                </a>
              ) : null}
              <a
                className="btn"
                href="#cite"
                style={{ textDecoration: "none" }}
              >
                <QuoteIcon /> Cite this
              </a>
              <a
                className="btn"
                href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${SITE_URL}/articles/${slug}`)}`}
                style={{ textDecoration: "none" }}
              >
                <ShareIcon /> Share
              </a>
            </div>
          </header>

          {/* Abstract */}
          {abstract ? (
            <section
              id="abstract"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "20px 24px",
                marginBottom: 32,
              }}
            >
              <div className="sc" style={{ color: "var(--muted)", marginBottom: 10 }}>
                Abstract
              </div>
              <p
                className="reading"
                style={{ fontSize: 15.5, lineHeight: 1.65, margin: 0 }}
              >
                {abstract}
              </p>
              {article.keywords && article.keywords.length > 0 ? (
                <div
                  id="keywords"
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span className="sc" style={{ color: "var(--muted)" }}>
                    Keywords
                  </span>
                  {article.keywords.map((kw) => (
                    <Link
                      key={kw}
                      href={`/search?q=${encodeURIComponent(kw)}`}
                      style={{
                        fontSize: 11.5,
                        color: "var(--cobalt)",
                        textDecoration: "none",
                        borderBottom: "1px dashed var(--cobalt-soft)",
                        paddingBottom: 1,
                      }}
                    >
                      {kw}
                    </Link>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Full text galleys */}
          {galleysSorted.length > 0 ? (
            <section id="fulltext" style={{ marginBottom: 32 }}>
              <h2
                style={{
                  fontFamily: "var(--serif-display)",
                  fontWeight: 500,
                  fontSize: 22,
                  margin: "0 0 12px",
                  letterSpacing: "-0.005em",
                }}
              >
                Read the full article
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                {galleysSorted.map((g) => {
                  const labelText =
                    pickLocale(g.label, locale) ||
                    (g.remoteUrl ? "External link" : "Download");
                  return (
                    <a
                      key={g.id}
                      href={galleyDownloadUrl(g)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 14px",
                        border: "1px solid var(--border-strong)",
                        borderRadius: 6,
                        textDecoration: "none",
                        color: "var(--fg)",
                        background: "var(--bg)",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <DownloadIcon />
                        {labelText}
                      </span>
                      <ChevronRight />
                    </a>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="reading dropcap" style={{ marginBottom: 32 }}>
              <p>
                The full text of this article is being prepared. Citation
                metadata is available below.
              </p>
            </section>
          )}

          {/* Citations */}
          <section
            id="cite"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 18,
              marginBottom: 32,
              fontFamily: "var(--sans)",
            }}
          >
            <div className="sc" style={{ color: "var(--muted)", marginBottom: 12 }}>
              Cite this article
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {(["BIBTEX", "RIS", "APA"] as const).map((fmt, i) => (
                <a
                  key={fmt}
                  href={`${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/citation?format=${fmt}`}
                  className="btn btn-sm"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "none",
                    background: i === 2 ? "var(--cobalt)" : "var(--bg)",
                    color: i === 2 ? "white" : "var(--fg)",
                    borderColor: i === 2 ? "var(--cobalt)" : "var(--border-strong)",
                  }}
                >
                  {citationLabel(fmt)}
                </a>
              ))}
            </div>
            <div
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--fg)",
                background: "var(--bg)",
                padding: 12,
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            >
              {renderApaInline(article, journalName, locale, slug)}
            </div>
          </section>

          {/* Versions */}
          {versionsSorted.length > 1 ? (
            <section
              id="versions"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 18,
                marginBottom: 32,
                fontFamily: "var(--sans)",
              }}
            >
              <div
                className="sc"
                style={{ color: "var(--muted)", marginBottom: 12 }}
              >
                Versions
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "grid",
                  gap: 6,
                }}
              >
                {versionsSorted.map((v) => {
                  const vSlug = v.urlPath ?? String(v.id);
                  const isCurrent = v.id === article.id;
                  return (
                    <li
                      key={v.id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "baseline",
                        fontSize: 13,
                        padding: "8px 10px",
                        borderRadius: 4,
                        background: isCurrent ? "var(--amber-soft)" : "transparent",
                        border: `1px solid ${isCurrent ? "oklch(88% 0.08 80)" : "var(--border)"}`,
                      }}
                    >
                      <span
                        className="tnum"
                        style={{
                          fontFamily: "var(--mono)",
                          fontWeight: 600,
                          minWidth: 28,
                          color: isCurrent ? "var(--amber-deep)" : "var(--fg-2)",
                        }}
                      >
                        v{v.version}
                      </span>
                      {isCurrent ? (
                        <span style={{ color: "var(--fg)" }}>this version</span>
                      ) : (
                        <Link
                          href={`/articles/${encodeURIComponent(vSlug)}`}
                          style={{ color: "var(--cobalt)", textDecoration: "none" }}
                        >
                          {pickLocale(v.title, locale) || `Version ${v.version}`}
                        </Link>
                      )}
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "var(--muted)",
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                        }}
                      >
                        {v.datePublished
                          ? new Date(v.datePublished).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                      {isCurrent ? (
                        <span
                          style={{
                            fontSize: 9.5,
                            color: "var(--amber-deep)",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          CURRENT
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {/* Footer license + copyright */}
          {article.licenseUrl || article.copyrightHolder ? (
            <footer
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 18,
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              {article.copyrightHolder ? (
                <p style={{ margin: "0 0 6px" }}>
                  © {article.copyrightYear ?? new Date().getFullYear()}{" "}
                  {article.copyrightHolder}.
                </p>
              ) : null}
              {article.licenseUrl ? (
                <p style={{ margin: 0 }}>
                  Licensed under{" "}
                  <a
                    href={article.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--cobalt)" }}
                  >
                    {article.licenseUrl.replace(/^https?:\/\//, "")}
                  </a>
                  .
                </p>
              ) : null}
            </footer>
          ) : null}
        </div>

        {/* Right: rail */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          {issue ? (
            <IssueCard issue={issue} locale={locale} />
          ) : null}

          {galleysSorted.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div
                className="sc"
                style={{ color: "var(--muted)", marginBottom: 10 }}
              >
                Files ({galleysSorted.length})
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                {galleysSorted.map((g) => (
                  <a
                    key={g.id}
                    href={galleyDownloadUrl(g)}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      padding: "6px 8px",
                      border: "1px solid var(--border)",
                      borderRadius: 4,
                      color: "var(--fg-2)",
                      textDecoration: "none",
                      fontFamily: "var(--sans)",
                    }}
                  >
                    <DownloadIcon />
                    {pickLocale(g.label, locale) || "File"}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {versionsSorted.length > 1 ? (
            <>
              <div className="rule" style={{ margin: "16px 0" }} />
              <div
                className="sc"
                style={{ color: "var(--muted)", marginBottom: 10 }}
              >
                Versions
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  fontSize: 12,
                }}
              >
                {versionsSorted.map((v) => {
                  const isCurrent = v.id === article.id;
                  return (
                    <div
                      key={v.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "6px 8px",
                        borderRadius: 4,
                        background: isCurrent ? "var(--amber-soft)" : "transparent",
                        border: `1px solid ${isCurrent ? "oklch(88% 0.08 80)" : "var(--border)"}`,
                      }}
                    >
                      <span style={{ fontFamily: "var(--mono)", fontWeight: 600 }}>
                        v{v.version}
                      </span>
                      <span style={{ color: "var(--muted)" }}>
                        {v.datePublished
                          ? new Date(v.datePublished).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                      {isCurrent ? (
                        <span
                          style={{
                            fontSize: 9.5,
                            color: "var(--amber-deep)",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                          }}
                        >
                          CURRENT
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </aside>
      </article>
    </SiteChrome>
  );
}

// ---------- helpers ----------

function collectAffiliations(
  authors: ArticleAuthor[],
): { affiliations: string[]; authorIndex: Array<number | null> } {
  const order: string[] = [];
  const idx: Array<number | null> = [];
  for (const a of authors) {
    if (a.affiliation && a.affiliation.trim()) {
      const aff = a.affiliation.trim();
      let i = order.indexOf(aff);
      if (i < 0) {
        i = order.length;
        order.push(aff);
      }
      idx.push(i);
    } else {
      idx.push(null);
    }
  }
  return { affiliations: order, authorIndex: idx };
}

function citationLabel(fmt: "BIBTEX" | "RIS" | "APA"): string {
  if (fmt === "BIBTEX") return "BibTeX";
  if (fmt === "RIS") return "RIS / EndNote";
  return "APA";
}

function licenseLabel(url: string): string {
  const m = url.match(/creativecommons\.org\/licenses\/([\w-]+)/i);
  if (m) return `CC ${m[1]!.toUpperCase()}`;
  if (/creativecommons\.org\/publicdomain\/zero/.test(url)) return "CC0";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function renderApaInline(
  article: Article,
  journalName: string,
  locale: string,
  slug: string,
): ReactNode {
  const authors = article.authors
    .map((a) => {
      const last = (a.familyName ?? "").trim();
      const first = (a.givenName ?? "").trim();
      if (!last) return first;
      const initials = first
        .split(/\s+/)
        .filter(Boolean)
        .map((p) => `${p[0]!.toUpperCase()}.`)
        .join(" ");
      return `${last}${initials ? `, ${initials}` : ""}`;
    })
    .filter(Boolean);
  const authorBlock =
    authors.length === 0
      ? null
      : authors.length === 1
        ? authors[0]
        : authors.length === 2
          ? `${authors[0]}, & ${authors[1]}`
          : `${authors.slice(0, -1).join(", ")}, & ${authors.at(-1)}`;
  const year = article.copyrightYear
    ? article.copyrightYear
    : article.datePublished
      ? new Date(article.datePublished).getUTCFullYear()
      : null;
  const title = pickLocale(article.title, locale) || "Untitled";
  const doiUrl = article.doi
    ? `https://doi.org/${article.doi}`
    : `${SITE_URL.replace(/\/$/, "")}/articles/${slug}`;
  return (
    <>
      {authorBlock ? <>{authorBlock} </> : null}
      {year ? <>({year}). </> : null}
      {title}.{" "}
      <i>{journalName}</i>
      {article.pages ? <>, {article.pages}</> : null}.{" "}
      <a href={doiUrl} style={{ color: "var(--cobalt)" }}>
        {doiUrl}
      </a>
    </>
  );
}

function buildScholarlyArticleJsonLd(
  article: Article,
  journalName: string,
  slug: string,
  locale: string,
): Record<string, unknown> {
  const url = `${SITE_URL.replace(/\/$/, "")}/articles/${encodeURIComponent(slug)}`;
  const headline = pickLocale(article.title, locale) || "Untitled";
  const abstractText = pickLocale(article.abstractText, locale) || undefined;
  const authors = article.authors.map((a) => {
    const node: Record<string, unknown> = { "@type": "Person" };
    const name = [a.givenName, a.familyName].filter(Boolean).join(" ").trim();
    if (name) node.name = name;
    if (a.givenName) node.givenName = a.givenName;
    if (a.familyName) node.familyName = a.familyName;
    if (a.affiliation) {
      node.affiliation = { "@type": "Organization", name: a.affiliation };
    }
    if (a.orcidId) {
      node.identifier = a.orcidId.startsWith("http")
        ? a.orcidId
        : `https://orcid.org/${a.orcidId}`;
    }
    return node;
  });

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    url,
    headline,
    name: headline,
    inLanguage: article.locale ?? locale,
    isAccessibleForFree: article.accessStatus === "OPEN",
    isPartOf: { "@type": "Periodical", name: journalName },
  };
  if (abstractText) ld.abstract = abstractText;
  if (article.datePublished) ld.datePublished = article.datePublished;
  if (article.keywords && article.keywords.length > 0)
    ld.keywords = article.keywords.join(", ");
  if (article.copyrightHolder) {
    ld.copyrightHolder = { "@type": "Organization", name: article.copyrightHolder };
  }
  if (article.copyrightYear) ld.copyrightYear = article.copyrightYear;
  if (article.licenseUrl) ld.license = article.licenseUrl;
  if (article.pages) ld.pagination = article.pages;
  if (article.doi) {
    ld.identifier = [
      { "@type": "PropertyValue", propertyID: "DOI", value: article.doi },
    ];
    ld.sameAs = `https://doi.org/${article.doi}`;
  }
  if (authors.length > 0) ld.author = authors;
  return ld;
}

// ---------- subcomponents ----------

function IssueCard({
  issue,
  locale,
}: {
  issue: IssueSummary;
  locale: string;
}): ReactNode {
  const slug = issue.urlPath ?? String(issue.id);
  return (
    <Link
      href={`/issues/${encodeURIComponent(slug)}`}
      style={{
        display: "block",
        marginBottom: 16,
        padding: 14,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "var(--bg)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="sc" style={{ color: "var(--muted)", marginBottom: 10 }}>
        Appears in
      </div>
      <div
        style={{
          fontFamily: "var(--serif-display)",
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.3,
          color: "var(--fg)",
        }}
      >
        {pickLocale(issue.title, locale) ||
          [
            issue.volume ? `Vol. ${issue.volume}` : null,
            issue.number ? `No. ${issue.number}` : null,
            issue.year ? `(${issue.year})` : null,
          ]
            .filter(Boolean)
            .join(" ")}
      </div>
      {issue.datePublished ? (
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--muted)",
            marginTop: 6,
          }}
        >
          {new Date(issue.datePublished).toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      ) : null}
    </Link>
  );
}

function DoiChip({ doi }: { doi: string }): ReactNode {
  return (
    <a
      href={`https://doi.org/${doi}`}
      target="_blank"
      rel="noreferrer"
      className="chip chip-mono"
      style={{
        textDecoration: "none",
        color: "var(--cobalt)",
        background: "var(--cobalt-soft)",
        border: "1px solid oklch(85% 0.06 255)",
      }}
    >
      DOI · {doi}
    </a>
  );
}

function OrcidBadge({ orcidId }: { orcidId: string }): ReactNode {
  const short = orcidId.replace(/^https?:\/\/orcid\.org\//, "");
  const href = orcidId.startsWith("http") ? orcidId : `https://orcid.org/${short}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "var(--mono)",
        fontSize: 10,
        color: "var(--muted)",
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "oklch(72% 0.16 130)",
        }}
      />
      <span style={{ color: "var(--cobalt)" }}>{short}</span>
    </a>
  );
}

// ---------- icons ----------

function ChevronRight(): ReactNode {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function HistoryIcon(): ReactNode {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" />
    </svg>
  );
}

function BookOpenIcon(): ReactNode {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 4h7a3 3 0 0 1 3 3v13M22 4h-7a3 3 0 0 0-3 3v13M2 4v15h7a3 3 0 0 1 3 3M22 4v15h-7a3 3 0 0 0-3 3" />
    </svg>
  );
}

function DownloadIcon(): ReactNode {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 4v12M6 11l6 6 6-6M4 21h16" />
    </svg>
  );
}

function QuoteIcon(): ReactNode {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 7h4v6a4 4 0 0 1-4 4M14 7h4v6a4 4 0 0 1-4 4" />
    </svg>
  );
}

function ShareIcon(): ReactNode {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}
