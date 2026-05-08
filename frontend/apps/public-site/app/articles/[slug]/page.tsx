import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import { ChevronRight, History } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge, DoiChip, OrcidBadge } from "@ajs/ui";
import { ArticleToolbar } from "@/components/ArticleToolbar";
import { ArticleToc, type TocItem } from "@/components/ArticleToc";
import { PdfViewerClient } from "@/components/PdfViewerClient";
import { ReadingProgress } from "@/components/ReadingProgress";
import {
  fetchActiveSections,
  fetchArticle,
  fetchArticleGalleys,
  fetchArticleVersions,
  fetchIssueById,
  fetchJournalConfig,
  fetchRecommendationsByAuthor,
  pickLocale,
  type ArticleAuthor,
} from "@/lib/api";
import { articlePath, formatDate, issuePath, truncate } from "@/lib/format";

const SITE_URL = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const [article, config, galleys] = await Promise.all([
    fetchArticle(slug),
    fetchJournalConfig(),
    fetchArticleGalleys(slug),
  ]);
  if (!article) return { title: "Article not found" };
  const locale = article.locale ?? config?.defaultLocale ?? "en";
  const title = pickLocale(article.title, locale) || "Untitled";
  const abstract =
    pickLocale(article.abstractText, locale).slice(0, 200) || undefined;
  const journalName = pickLocale(config?.name, locale) || "";
  const articleUrl = `${SITE_URL}/articles/${encodeURIComponent(slug)}`;
  const pdfGalley = (galleys ?? []).find(
    (g) => g.approved && (pickLocale(g.label, locale) || "").toLowerCase().includes("pdf"),
  );
  const pdfUrl = pdfGalley
    ? `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${pdfGalley.id}/download-url`
    : undefined;
  const dateString = article.datePublished
    ? new Date(article.datePublished).toISOString().slice(0, 10)
    : undefined;
  const issn = config?.issnOnline || config?.issnPrint || undefined;

  // Highwire / Google Scholar tags + Dublin Core. Multiple
  // citation_author tags is the canonical pattern; Next renders an
  // array under one name as repeated <meta>.
  const others: Record<string, string | string[]> = {
    "citation_title": title,
    "citation_journal_title": journalName,
  };
  const authorNames = (article.authors ?? [])
    .map((a) => [a.familyName, a.givenName].filter(Boolean).join(", "))
    .filter((s) => s.length > 0);
  if (authorNames.length > 0) others["citation_author"] = authorNames;
  if (dateString) others["citation_publication_date"] = dateString;
  if (issn) others["citation_issn"] = issn;
  if (article.doi) others["citation_doi"] = article.doi;
  if (pdfUrl) others["citation_pdf_url"] = pdfUrl;
  if (locale) others["citation_language"] = locale;

  others["DC.title"] = title;
  if (authorNames.length > 0) others["DC.creator"] = authorNames;
  if (journalName) others["DC.publisher"] = journalName;
  if (dateString) others["DC.date"] = dateString;
  if (article.doi) others["DC.identifier"] = article.doi;
  others["DC.type"] = "Text";
  others["DC.format"] = "text/html";
  if (locale) others["DC.language"] = locale;
  if (abstract) others["DC.description"] = abstract;

  return {
    title,
    description: abstract,
    openGraph: {
      title,
      description: abstract,
      type: "article",
      url: articleUrl,
      siteName: journalName,
    },
    twitter: { card: "summary_large_image", title, description: abstract },
    alternates: { canonical: articleUrl },
    other: others,
  };
}

function fullName(a: ArticleAuthor): string {
  return [a.givenName, a.familyName].filter(Boolean).join(" ");
}

export default async function ArticlePage({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const [article, sections, versions, galleys, config, byAuthor] = await Promise.all([
    fetchArticle(slug),
    fetchActiveSections(),
    fetchArticleVersions(slug),
    fetchArticleGalleys(slug),
    fetchJournalConfig(),
    fetchRecommendationsByAuthor(slug, 5),
  ]);
  if (!article) notFound();

  const locale = article.locale ?? config?.defaultLocale ?? "en";
  const issue = article.issueId ? await fetchIssueById(article.issueId) : null;

  const title = pickLocale(article.title, locale) || "Untitled";
  const abstract = pickLocale(article.abstractText, locale);
  const section = (sections ?? []).find((s) => s.id === article.sectionId);
  const sectionLabel = section ? pickLocale(section.title, locale) : "Article";

  const galleysSorted = (galleys ?? [])
    .slice()
    .filter((g) => g.approved)
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  const pdfGalley = galleysSorted.find((g) =>
    (pickLocale(g.label, locale) || "").toLowerCase().includes("pdf"),
  );
  const pdfHref = pdfGalley
    ? `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${pdfGalley.id}/download-url`
    : null;

  const versionsSorted = (versions ?? [])
    .slice()
    .sort((a, b) => (b.version ?? 0) - (a.version ?? 0));

  const tocItems: TocItem[] = [
    { id: "abstract", label: "Abstract" },
    { id: "intro", label: "1. Introduction" },
    { id: "related", label: "2. Related work" },
    { id: "method", label: "3. Method" },
    { id: "results", label: "4. Results" },
    { id: "discussion", label: "5. Discussion" },
    { id: "refs", label: "References" },
  ];

  const issueHref = issue ? issuePath(issue) : "/archive";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: title,
    inLanguage: locale,
    datePublished: article.datePublished,
    url: `${SITE_URL}/articles/${article.urlPath ?? article.id}`,
    author: article.authors.map((a) => ({
      "@type": "Person",
      name: fullName(a),
      ...(a.orcidId ? { sameAs: `https://orcid.org/${a.orcidId}` } : {}),
      ...(a.affiliation
        ? {
            affiliation: { "@type": "Organization", name: a.affiliation },
          }
        : {}),
    })),
    isAccessibleForFree: article.accessStatus === "OPEN",
    ...(article.doi ? { sameAs: `https://doi.org/${article.doi}` } : {}),
  };

  return (
    <div className="bg-bg">
      <PublicHeader activePath="/archive" />
      <ReadingProgress targetId="article" />

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 lg:px-14">
        <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted">
          <Link href="/archive" className="hover:text-fg no-underline text-inherit">
            Archive
          </Link>
          <ChevronRight className="h-3 w-3" />
          {issue?.volume ? (
            <>
              <Link href={issueHref} className="hover:text-fg no-underline text-inherit">
                Vol. {issue.volume}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <Link href={issueHref} className="hover:text-fg no-underline text-inherit">
                {issue.number ? `No. ${issue.number}` : "Issue"}
                {issue.datePublished
                  ? ` · ${new Date(issue.datePublished).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
                  : ""}
              </Link>
              <ChevronRight className="h-3 w-3" />
            </>
          ) : null}
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cobalt">
            {sectionLabel}
          </span>
        </nav>
        {versionsSorted.length > 1 ? (
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
            <History className="h-3 w-3" /> Version {article.version} of{" "}
            {versionsSorted.length}
            {article.datePublished
              ? ` · published ${formatDate(article.datePublished)}`
              : ""}
          </div>
        ) : null}
      </div>

      <article
        id="article"
        className="grid justify-center gap-10 px-6 pt-8 pb-20 lg:grid-cols-[240px_minmax(0,720px)_240px] lg:gap-14 lg:px-14"
      >
        <aside className="sticky top-8 hidden self-start lg:block">
          <div className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            On this page
          </div>
          <ArticleToc items={tocItems} />
          <div className="my-5 border-t border-border" />
          <div className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Metadata
          </div>
          <dl className="grid grid-cols-2 gap-3 font-mono text-[11px] text-muted">
            {article.pages ? (
              <Metric value={article.pages} label="pages" />
            ) : null}
            {article.copyrightYear ? (
              <Metric value={String(article.copyrightYear)} label="year" />
            ) : null}
            {article.keywords?.length ? (
              <Metric value={String(article.keywords.length)} label="keywords" />
            ) : null}
            <Metric value={String(versionsSorted.length || 1)} label="versions" />
          </dl>
        </aside>

        <div>
          <header className="mb-8">
            <div className="mb-3.5 flex items-center gap-2.5">
              <span className="sc text-cobalt">{sectionLabel}</span>
              {article.accessStatus === "OPEN" ? (
                <span className="oa-badge">Open Access</span>
              ) : null}
            </div>
            <h1 className="m-0 mb-3.5 text-balance font-serif-display text-[clamp(28px,4vw,40px)] font-medium leading-[1.12] tracking-[-0.02em] text-ink">
              {title}
            </h1>

            <div className="mb-4 flex flex-wrap gap-x-5 gap-y-3">
              {article.authors.map((a, idx) => (
                <div
                  key={`${a.familyName}-${idx}`}
                  className="flex flex-col gap-0.5"
                >
                  <div className="text-[14px] font-semibold">
                    {fullName(a)}
                    <sup className="ml-0.5 font-mono text-[10px] font-normal text-muted">
                      {idx + 1}
                      {a.corresponding ? ",*" : ""}
                    </sup>
                  </div>
                  {a.orcidId ? <OrcidBadge id={a.orcidId} /> : null}
                </div>
              ))}
            </div>

            <div className="mb-5 border-l-2 border-border pl-3 font-sans text-[11.5px] leading-[1.7] text-muted">
              {article.authors.map((a, idx) =>
                a.affiliation ? (
                  <div key={idx}>
                    <span className="font-mono">{idx + 1}</span> {a.affiliation}
                  </div>
                ) : null,
              )}
              {article.authors.find((a) => a.corresponding) ? (
                <div className="mt-1">
                  <span className="font-mono">*</span> Corresponding author
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
              {article.doi ? <DoiChip doi={article.doi} /> : null}
              {article.accessStatus === "OPEN" ? (
                <span className="oa-badge">Open Access</span>
              ) : null}
              <Badge>CC BY 4.0</Badge>
              <Badge variant="mono">v{article.version} · current</Badge>
              <div className="ml-auto font-mono text-[11px] text-muted">
                {article.datePublished
                  ? `Published ${formatDate(article.datePublished)}`
                  : ""}
                {article.pages ? ` · pp. ${article.pages}` : ""}
              </div>
            </div>

            <ArticleToolbar
              article={article}
              volume={issue?.volume ?? null}
              issue={issue?.number ?? null}
              pages={article.pages ?? null}
              pdfHref={pdfHref}
            />
          </header>

          <section
            id="abstract"
            className="mb-8 rounded-md border border-border bg-surface p-6"
          >
            <div className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              Abstract
            </div>
            <p className="m-0 font-serif-body text-[15.5px] leading-[1.65] text-fg">
              {abstract}
            </p>
            {article.keywords && article.keywords.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Keywords
                </span>
                {article.keywords.map((k) => (
                  <Link
                    key={k}
                    href={`/search?q=${encodeURIComponent(k)}`}
                    className="border-b border-dashed border-cobalt-soft pb-px text-[11.5px] text-cobalt hover:border-amber-deep hover:text-amber-deep no-underline"
                  >
                    {k}
                  </Link>
                ))}
              </div>
            ) : null}
          </section>

          {pdfHref ? (
            <PdfInlineViewer pdfHref={pdfHref} />
          ) : (
            <div className="reading dropcap" id="article-body">
              <h2 id="intro">1. Introduction</h2>
              <p>{abstract}</p>
              <p>
                The full text of this article is distributed as the canonical
                PDF galley. The structured HTML rendering of figures, equations,
                and footnotes will appear here when the production team finalises
                the galley — until then the PDF link above carries the
                authoritative version of record.
              </p>
            </div>
          )}
        </div>

        <aside className="sticky top-8 hidden self-start lg:block">
          {galleysSorted.length > 0 ? (
            <>
              <div className="sc mb-2.5 text-muted">Galleys</div>
              <ul className="m-0 mb-5 flex flex-col gap-1.5 p-0 text-[12px] list-none">
                {galleysSorted.map((g) => {
                  const label = pickLocale(g.label, locale) || `Galley ${g.seq}`;
                  const href = `${API_BASE_URL}/api/v1/articles/${encodeURIComponent(slug)}/galleys/${g.id}/download-url`;
                  const kind = label.toLowerCase().includes("pdf")
                    ? "PDF"
                    : label.toLowerCase().includes("html")
                      ? "HTML"
                      : label.toLowerCase().includes("xml") ||
                          label.toLowerCase().includes("jats")
                        ? "JATS"
                        : label.toUpperCase().slice(0, 5);
                  return (
                    <li key={g.id}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded border border-border bg-bg px-2 py-1.5 no-underline transition-colors hover:border-cobalt"
                      >
                        <span className="chip chip-cobalt">{kind}</span>
                        <span className="flex-1 truncate font-mono text-[10.5px] text-fg-2">
                          {label}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}

          {versionsSorted.length > 1 ? (
            <>
              <div className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                Versions
              </div>
              <ul className="flex flex-col gap-1.5 text-[12px] m-0 p-0 list-none">
                {versionsSorted.map((v) => {
                  const isCurrent = v.id === article.id;
                  return (
                    <li
                      key={v.id}
                      className={
                        "flex items-center justify-between rounded-[4px] px-2 py-1.5 " +
                        (isCurrent
                          ? "border border-amber/60 bg-amber-soft"
                          : "border border-border")
                      }
                    >
                      <span className="font-mono font-semibold">
                        v{v.version ?? "—"}
                      </span>
                      <span className="text-muted">
                        {formatDate(v.datePublished)}
                      </span>
                      {isCurrent ? (
                        <span className="font-sans text-[9.5px] font-semibold uppercase tracking-[0.04em] text-amber-deep">
                          Current
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              <div className="my-5 border-t border-border" />
            </>
          ) : null}

          <div className="rounded-md border border-border bg-bg p-3.5">
            <div className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              In this issue
            </div>
            <Link
              href={issueHref}
              className="text-[13px] font-medium text-cobalt hover:text-cobalt-deep no-underline"
            >
              View full table of contents →
            </Link>
          </div>
        </aside>
      </article>

      {(byAuthor ?? []).length > 0 && (
        <section className="mx-auto max-w-[1100px] px-6 mt-12">
          <header className="mb-4 flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-[0.12em] font-mono text-muted-2 m-0">
              Read next
            </p>
            <h2 className="font-serif-display text-[20px] font-semibold m-0">
              More from these authors
            </h2>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {(byAuthor ?? []).map((p) => {
              const recTitle = pickLocale(p.title, locale) || `Article #${p.id}`;
              const recAbstract = truncate(pickLocale(p.abstractText, locale), 180);
              return (
                <li
                  key={p.id}
                  className="rounded-md border border-border bg-bg p-4 hover:border-cobalt"
                >
                  <Link
                    href={articlePath(p)}
                    className="group block no-underline text-fg"
                  >
                    <h3 className="font-serif-display text-[16px] font-semibold m-0 group-hover:text-cobalt">
                      {recTitle}
                    </h3>
                    {recAbstract && (
                      <p className="text-fg-2 text-[13px] mt-2 mb-0">{recAbstract}</p>
                    )}
                    <p className="text-[11px] text-muted mt-2 mb-0 font-mono">
                      {p.datePublished ? formatDate(p.datePublished) : "—"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}

/**
 * Inline PDF reader. Server resolves a presigned download URL via the
 * existing `/galleys/{id}/download-url` endpoint, then we hand the URL
 * to a client component that fetches it and renders pdf.js inside an
 * `<object>` (native browser viewer) with a fallback link if the
 * browser refuses to embed PDFs.
 */
function PdfInlineViewer({ pdfHref }: { pdfHref: string }) {
  return <PdfViewerClient pdfHref={pdfHref} />;
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif-display text-[18px] tabular-nums text-fg">
        {value}
      </div>
      {label}
    </div>
  );
}
