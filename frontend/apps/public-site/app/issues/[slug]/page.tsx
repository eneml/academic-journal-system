import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchActiveSectionsMap,
  fetchIssueById,
  fetchIssueBySlug,
  fetchIssueTableOfContents,
  fetchJournalConfig,
  pickLocale,
  type IssueSummary,
  type PublicationSummary,
  type SectionSummary,
} from "@/lib/api";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

async function loadIssue(slug: string): Promise<IssueSummary | null> {
  const bySlug = await fetchIssueBySlug(slug);
  if (bySlug) return bySlug;
  const numeric = Number.parseInt(slug, 10);
  if (Number.isFinite(numeric)) {
    const byId = await fetchIssueById(numeric);
    if (byId && byId.published) return byId;
  }
  return null;
}

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const [issue, config] = await Promise.all([
    loadIssue(slug),
    fetchJournalConfig(),
  ]);
  if (!issue) return { title: "Issue not found" };
  const locale = config?.defaultLocale ?? "en";
  const heading =
    pickLocale(issue.title, locale) || formatIssueLine(issue) || `Issue ${issue.id}`;
  return {
    title: heading,
    description:
      pickLocale(issue.title, locale) || formatIssueLine(issue) || undefined,
  };
}

export default async function SingleIssuePage({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const [issue, config] = await Promise.all([
    loadIssue(slug),
    fetchJournalConfig(),
  ]);
  if (!issue) notFound();

  const [toc, sectionsMap] = await Promise.all([
    fetchIssueTableOfContents(issue.id),
    fetchActiveSectionsMap(),
  ]);

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const grouped = groupBySection(toc ?? [], sectionsMap, locale);

  const totalArticles = (toc ?? []).length;

  // Eyebrow line: "Current Issue · December 2026"
  const eyebrow = [
    "Current Issue",
    issue.datePublished
      ? new Date(issue.datePublished).toLocaleDateString(locale, {
          month: "long",
          year: "numeric",
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  // Title:  "Volume 12, Number 4" or the localized title
  const title =
    pickLocale(issue.title, locale) ||
    [
      issue.volume ? `Volume ${issue.volume}` : null,
      issue.number ? `Number ${issue.number}` : null,
    ]
      .filter(Boolean)
      .join(", ") ||
    `Issue ${issue.id}`;

  let runningIdx = 0;

  return (
    <SiteChrome journalName={journalName} active="archive">
      {/* Breadcrumb */}
      <div
        style={{
          padding: "20px 56px 0",
          maxWidth: 1280,
          margin: "0 auto",
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
        {issue.volume ? (
          <>
            <span>Volume {issue.volume}</span>
            <ChevronRight />
          </>
        ) : null}
        <span style={{ color: "var(--fg)", fontWeight: 500 }}>
          {[
            issue.number ? `Number ${issue.number}` : `Issue ${issue.id}`,
            issue.datePublished
              ? new Date(issue.datePublished).toLocaleDateString(locale, {
                  month: "long",
                  year: "numeric",
                })
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>

      {/* Issue masthead */}
      <section
        style={{
          padding: "32px 56px 40px",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 56,
          alignItems: "start",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div>
          <CoverArt label={formatVolNo(issue)} year={issue.year ?? null} />
          <div
            style={{
              marginTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled
              title="PDF generation coming in a follow-up"
            >
              <DownloadIcon /> Download full issue (PDF)
            </button>
            <div style={{ display: "flex", gap: 6 }}>
              <a
                href="/feed.xml"
                className="btn btn-sm"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                <RssIcon /> Subscribe
              </a>
              <button
                type="button"
                className="btn btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >
                <ShareIcon /> Share
              </button>
            </div>
          </div>
        </div>

        <div>
          <div
            className="sc"
            style={{ color: "var(--amber-deep)", marginBottom: 12 }}
          >
            {eyebrow}
          </div>
          <h1
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: "clamp(36px, 4.6vw, 48px)",
              fontWeight: 500,
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </h1>
          {pickLocale(issue.title, locale) ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                margin: "0 0 18px",
                maxWidth: 640,
                fontStyle: "italic",
              }}
            >
              {formatIssueLine(issue) || ""}
            </p>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 12,
              color: "var(--muted)",
              paddingTop: 18,
              borderTop: "1px solid var(--border)",
              flexWrap: "wrap",
            }}
          >
            <Stat n={totalArticles} label="articles" />
            <Stat n={grouped.length} label="sections" />
            {issue.datePublished ? (
              <div>
                <div
                  className="tnum"
                  style={{
                    color: "var(--fg)",
                    fontWeight: 600,
                    fontSize: 22,
                    fontFamily: "var(--serif-display)",
                  }}
                >
                  {new Date(issue.datePublished).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                published
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div style={{ padding: "0 56px", maxWidth: 1280, margin: "0 auto" }}>
        <div className="double-rule" />
      </div>

      {/* TOC by section */}
      <section
        style={{
          padding: "36px 56px 0",
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 56,
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            Sections
          </div>
          {grouped.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
              No articles in this issue yet.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
              }}
            >
              {grouped.map((g, i) => (
                <a
                  key={g.sectionTitle}
                  href={`#section-${g.sectionId ?? "uncat"}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: i === 0 ? "var(--fg)" : "var(--fg-2)",
                    textDecoration: "none",
                    fontWeight: i === 0 ? 600 : 400,
                    borderLeft:
                      i === 0
                        ? "2px solid var(--amber)"
                        : "2px solid transparent",
                    paddingLeft: 10,
                  }}
                >
                  <span>{g.sectionTitle}</span>
                  <span
                    className="tnum"
                    style={{
                      color: "var(--muted)",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                    }}
                  >
                    {g.items.length}
                  </span>
                </a>
              ))}
            </div>
          )}
        </aside>

        <div>
          {grouped.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                color: "var(--muted)",
                fontSize: 16,
                marginTop: 12,
              }}
            >
              No articles have been published in this issue yet.
            </p>
          ) : (
            grouped.map(({ sectionId, sectionTitle, items }) => (
              <section
                key={sectionId ?? "uncat"}
                id={`section-${sectionId ?? "uncat"}`}
                style={{ marginBottom: 40 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontSize: 22,
                      fontWeight: 500,
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {sectionTitle}
                  </h3>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--border)",
                    }}
                  />
                  <span
                    className="tnum sc"
                    style={{ color: "var(--muted)" }}
                  >
                    {items.length} {items.length === 1 ? "article" : "articles"}
                  </span>
                </div>
                {items.map((article) => {
                  const num = String(runningIdx++).padStart(2, "0");
                  const articleSlug =
                    article.urlPath ?? String(article.id);
                  const articleTitle =
                    pickLocale(article.title, locale) ||
                    `Article ${article.id}`;
                  const datePub = article.datePublished
                    ? new Date(article.datePublished).toLocaleDateString(locale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                  return (
                    <article
                      key={article.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px 1fr 130px 110px",
                        gap: 16,
                        padding: "16px 0",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <div
                        className="marginalia-num"
                        style={{ paddingTop: 4 }}
                      >
                        {num}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <h4
                          style={{
                            fontFamily: "var(--serif-display)",
                            fontSize: 17,
                            fontWeight: 500,
                            margin: "0 0 4px",
                            lineHeight: 1.3,
                          }}
                        >
                          <Link
                            href={`/articles/${encodeURIComponent(articleSlug)}`}
                            style={{
                              color: "var(--fg)",
                              textDecoration: "none",
                            }}
                          >
                            {articleTitle}
                          </Link>
                        </h4>
                        {article.keywords && article.keywords.length > 0 ? (
                          <div
                            style={{
                              fontFamily: "var(--serif-body)",
                              fontStyle: "italic",
                              color: "var(--muted)",
                              fontSize: 13,
                            }}
                          >
                            {article.keywords.slice(0, 4).join(" · ")}
                          </div>
                        ) : null}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--mono)",
                          fontSize: 11,
                          color: "var(--muted)",
                          paddingTop: 5,
                        }}
                      >
                        {datePub ?? `v${article.version ?? 1}`}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          paddingTop: 3,
                          justifyContent: "flex-end",
                        }}
                      >
                        <Link
                          href={`/articles/${encodeURIComponent(articleSlug)}`}
                          style={{
                            fontSize: 12,
                            color: "var(--cobalt)",
                            textDecoration: "none",
                          }}
                        >
                          HTML
                        </Link>
                        <span style={{ color: "var(--border-strong)" }}>·</span>
                        <Link
                          href={`/articles/${encodeURIComponent(articleSlug)}`}
                          style={{
                            fontSize: 12,
                            color: "var(--cobalt)",
                            textDecoration: "none",
                          }}
                        >
                          Read
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </section>
            ))
          )}
        </div>
      </section>
    </SiteChrome>
  );
}

function Stat({ n, label }: { n: number; label: string }): ReactNode {
  return (
    <div>
      <div
        className="tnum"
        style={{
          color: "var(--fg)",
          fontWeight: 600,
          fontSize: 22,
          fontFamily: "var(--serif-display)",
          lineHeight: 1.1,
        }}
      >
        {n}
      </div>
      {label}
    </div>
  );
}

function CoverArt({
  label,
  year,
}: {
  label: string;
  year: number | null;
}): ReactNode {
  return (
    <div
      style={{
        width: 260,
        height: 364,
        background:
          "linear-gradient(180deg, var(--cobalt-deep) 0%, var(--cobalt) 100%)",
        position: "relative",
        boxShadow:
          "0 1px 0 0 oklch(85% 0.012 90 / 0.6), 0 8px 24px oklch(20% 0.02 270 / 0.12)",
        color: "white",
        padding: "26px 24px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        className="sc"
        style={{
          letterSpacing: "0.18em",
          fontSize: 9,
          color: "oklch(85% 0.04 80)",
        }}
      >
        ACADEMIC JOURNAL
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.1,
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </div>
        {year ? (
          <div
            className="tnum"
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              opacity: 0.7,
              marginTop: 6,
              letterSpacing: "0.06em",
            }}
          >
            {year}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type GroupedSection = {
  sectionId: number | null;
  sectionTitle: string;
  items: PublicationSummary[];
};

function groupBySection(
  items: PublicationSummary[],
  sections: Map<number, SectionSummary>,
  locale: string,
): GroupedSection[] {
  const buckets = new Map<number | null, PublicationSummary[]>();
  for (const article of items) {
    const key = article.sectionId ?? null;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(article);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => sectionSeq(a[0], sections) - sectionSeq(b[0], sections))
    .map(([sectionId, list]) => ({
      sectionId,
      sectionTitle: sectionId
        ? pickLocale(sections.get(sectionId)?.title, locale) || "Articles"
        : "Articles",
      items: list,
    }));
}

function sectionSeq(
  id: number | null,
  sections: Map<number, SectionSummary>,
): number {
  if (id == null) return Number.MAX_SAFE_INTEGER;
  return sections.get(id)?.seq ?? Number.MAX_SAFE_INTEGER;
}

function formatIssueLine(issue: IssueSummary): string {
  const parts: string[] = [];
  if (issue.volume) parts.push(`Vol. ${issue.volume}`);
  if (issue.number) parts.push(`No. ${issue.number}`);
  if (issue.year) parts.push(String(issue.year));
  return parts.join(" · ");
}

function formatVolNo(issue: IssueSummary): string {
  if (issue.volume && issue.number)
    return `Vol. ${issue.volume} № ${issue.number}`;
  if (issue.volume) return `Vol. ${issue.volume}`;
  if (issue.number) return `№ ${issue.number}`;
  return `Issue ${issue.id}`;
}

function ChevronRight(): ReactNode {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function DownloadIcon(): ReactNode {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4v12M6 11l6 6 6-6M4 21h16" />
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

function ShareIcon(): ReactNode {
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
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M16 6l-4-4-4 4M12 2v14" />
    </svg>
  );
}
