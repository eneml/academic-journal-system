import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import {
  fetchArticle,
  fetchArticleGalleys,
  fetchArticleVersions,
  fetchJournalConfig,
  fetchActiveSections,
  pickLocale,
  type Article,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const citeBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-1)",
  background: "var(--surface)",
  color: "var(--fg-2)",
  fontFamily: "var(--mono)",
  fontSize: 11,
  textDecoration: "none",
  letterSpacing: "0.04em",
};

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) {
    return { title: "Article not found" };
  }
  const title = pickLocale(article.title, article.locale) || "Untitled";
  const abstract =
    pickLocale(article.abstractText, article.locale).slice(0, 200) || undefined;
  return {
    title,
    description: abstract,
    openGraph: {
      title,
      description: abstract,
      type: "article",
    },
    other: {
      "citation_title": title,
      "citation_publication_date": article.datePublished ?? "",
      ...(article.copyrightYear
        ? { "citation_year": String(article.copyrightYear) }
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

  if (!article) {
    notFound();
  }

  const locale = article.locale ?? config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const title = pickLocale(article.title, locale) || "Untitled";
  const abstract = pickLocale(article.abstractText, locale);
  const section = (sections ?? []).find((s) => s.id === article.sectionId);
  const sectionLabel = section
    ? pickLocale(section.title, locale)
    : "Article";
  const publishedAt = article.datePublished
    ? new Date(article.datePublished)
    : null;

  const jsonLd = buildScholarlyArticleJsonLd(article, journalName, slug, locale);

  return (
    <div className="min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-fg"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {journalName}
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-fg-2 hover:text-cobalt">
              Home
            </Link>
            <Link href="/issues" className="text-fg-2 hover:text-cobalt">
              Archive
            </Link>
            <Link href="/announcements" className="text-fg-2 hover:text-cobalt">
              News
            </Link>
            <Link href="/search" className="text-fg-2 hover:text-cobalt">
              Search
            </Link>
            <Link href="/about" className="text-fg-2 hover:text-cobalt">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-3xl mx-auto px-6 py-16">
          <p
            className="sc text-cobalt mb-4"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {sectionLabel}
            {article.accessStatus === "OPEN" ? " · Open Access" : ""}
            {article.version > 1 ? ` · Version ${article.version}` : ""}
          </p>

          <h1
            className="text-fg mb-4"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: "clamp(32px, 4vw, 48px)",
              lineHeight: 1.12,
              letterSpacing: "-0.02em",
              textWrap: "balance",
            }}
          >
            {title}
          </h1>

          {article.authors && article.authors.length > 0 ? (
            <p
              className="mb-3"
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 16,
                lineHeight: 1.5,
                color: "var(--fg-2)",
              }}
            >
              {article.authors.map((a, i) => {
                const fullName = [a.givenName, a.familyName]
                  .filter(Boolean)
                  .join(" ")
                  .trim();
                if (!fullName) return null;
                const sep = i === 0
                  ? null
                  : i === article.authors.length - 1
                    ? " & "
                    : ", ";
                if (a.orcidId) {
                  const orcidShort = a.orcidId.replace(
                    /^https?:\/\/orcid\.org\//,
                    "",
                  );
                  return (
                    <span key={`${i}-${fullName}`}>
                      {sep}
                      <Link
                        href={`/authors/${encodeURIComponent(orcidShort)}`}
                        className="text-fg hover:text-cobalt"
                        style={{ textDecoration: "none" }}
                      >
                        {fullName}
                      </Link>
                    </span>
                  );
                }
                return (
                  <span key={`${i}-${fullName}`}>
                    {sep}
                    {fullName}
                  </span>
                );
              })}
            </p>
          ) : null}

          {publishedAt ? (
            <p
              className="text-muted mb-10"
              style={{
                fontFamily: "var(--mono)",
                fontSize: 12,
              }}
            >
              Published{" "}
              {publishedAt.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {article.pages ? ` · pp. ${article.pages}` : ""}
            </p>
          ) : null}

          {abstract ? (
            <section
              className="mb-12 reading"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-3)",
                padding: 24,
              }}
            >
              <p
                className="sc text-muted mb-3"
                style={{ fontSize: 10.5, fontWeight: 600 }}
              >
                Abstract
              </p>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65 }}>
                {abstract}
              </p>
            </section>
          ) : null}

          {article.keywords && article.keywords.length > 0 ? (
            <section className="mb-12 flex flex-wrap gap-2">
              {article.keywords.map((kw) => (
                <span
                  key={kw}
                  className="chip"
                  style={{
                    fontFamily: "var(--sans)",
                    fontSize: 11,
                    padding: "3px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-1)",
                    background: "var(--surface)",
                    color: "var(--fg-2)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </section>
          ) : null}

          {galleys && galleys.length > 0 ? (
            <section className="mb-12">
              <p
                className="sc text-muted mb-3"
                style={{ fontSize: 10.5, fontWeight: 600 }}
              >
                Read the article
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                {galleys.map((g) => {
                  const labelText =
                    pickLocale(g.label, locale) ||
                    (g.remoteUrl ? "External link" : "Download");
                  const downloadUrl =
                    `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${g.id}/download-url`;
                  return (
                    <a
                      key={g.id}
                      href={downloadUrl}
                      style={{
                        padding: "8px 14px",
                        border: "1px solid var(--cobalt)",
                        borderRadius: "var(--r-2)",
                        background: "var(--cobalt)",
                        color: "white",
                        textDecoration: "none",
                        fontFamily: "var(--sans)",
                        fontSize: 13,
                        fontWeight: 500,
                      }}
                    >
                      {labelText}
                    </a>
                  );
                })}
              </div>
              {(() => {
                const pdfGalley = galleys.find((g) =>
                  (pickLocale(g.label, locale) || "").toLowerCase().includes("pdf"),
                );
                if (!pdfGalley) return null;
                const previewUrl = `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${pdfGalley.id}/download-url`;
                // The presigned URL response is JSON {url}; redirecting via
                // server-rendered link is the simplest path. Inline preview
                // requires resolving that redirect — we render a link plus a
                // hint, leaving the actual viewer to the browser's default.
                return (
                  <p
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                      margin: 0,
                    }}
                  >
                    PDF available · open in browser:{" "}
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "var(--cobalt)" }}
                    >
                      preview
                    </a>
                  </p>
                );
              })()}
            </section>
          ) : (
            <section className="reading dropcap">
              <p>
                The full text of this article is being prepared. Citation
                metadata is available below.
              </p>
            </section>
          )}

          {versions && versions.length > 1 ? (
            <section
              className="mt-12"
              style={{
                borderTop: "1px solid var(--border)",
                paddingTop: 18,
                fontFamily: "var(--sans)",
              }}
            >
              <p
                className="sc text-muted mb-3"
                style={{ fontSize: 10.5, fontWeight: 600 }}
              >
                Version history
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "grid",
                  gap: 6,
                }}
              >
                {versions
                  .slice()
                  .sort((a, b) => (b.version ?? 0) - (a.version ?? 0))
                  .map((v) => {
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
                        }}
                      >
                        <span
                          className="tnum"
                          style={{
                            fontFamily: "var(--mono)",
                            fontSize: 12,
                            color: isCurrent ? "var(--cobalt)" : "var(--muted)",
                            fontWeight: isCurrent ? 600 : 400,
                            minWidth: 24,
                          }}
                        >
                          v{v.version}
                        </span>
                        {isCurrent ? (
                          <span style={{ color: "var(--fg)" }}>
                            this version
                          </span>
                        ) : (
                          <Link
                            href={`/articles/${encodeURIComponent(vSlug)}`}
                            className="text-cobalt"
                            style={{ textDecoration: "none" }}
                          >
                            {pickLocale(v.title, locale) || `Version ${v.version}`}
                          </Link>
                        )}
                        {v.datePublished ? (
                          <span
                            style={{
                              marginLeft: "auto",
                              color: "var(--muted)",
                              fontFamily: "var(--mono)",
                              fontSize: 11,
                            }}
                          >
                            {new Date(v.datePublished).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
              </ul>
            </section>
          ) : null}

          <section
            className="mt-12"
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: 18,
              fontFamily: "var(--sans)",
            }}
          >
            <p
              className="sc text-muted mb-3"
              style={{ fontSize: 10.5, fontWeight: 600 }}
            >
              Cite this article
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a
                href={`${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/citation?format=BIBTEX`}
                className="hover:text-cobalt"
                style={citeBtnStyle}
              >
                BibTeX
              </a>
              <a
                href={`${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/citation?format=RIS`}
                className="hover:text-cobalt"
                style={citeBtnStyle}
              >
                RIS / EndNote
              </a>
              <a
                href={`${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/citation?format=APA`}
                className="hover:text-cobalt"
                style={citeBtnStyle}
              >
                APA (plain text)
              </a>
            </div>
          </section>

          {article.licenseUrl || article.copyrightHolder ? (
            <footer
              className="mt-16 pt-8"
              style={{
                borderTop: "1px solid var(--border)",
                fontFamily: "var(--sans)",
                fontSize: 13,
                color: "var(--muted)",
              }}
            >
              {article.copyrightHolder ? (
                <p>
                  © {article.copyrightYear ?? ""} {article.copyrightHolder}.
                </p>
              ) : null}
              {article.licenseUrl ? (
                <p>
                  Licensed under{" "}
                  <a
                    href={article.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cobalt"
                  >
                    {article.licenseUrl.replace(/^https?:\/\//, "")}
                  </a>
                  .
                </p>
              ) : null}
            </footer>
          ) : null}
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} {journalName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
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
    isPartOf: {
      "@type": "Periodical",
      name: journalName,
    },
  };

  if (abstractText) ld.abstract = abstractText;
  if (article.datePublished) ld.datePublished = article.datePublished;
  if (article.keywords && article.keywords.length > 0) ld.keywords = article.keywords.join(", ");
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
