import Link from "next/link";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchActiveSections,
  fetchAnnouncements,
  fetchIssueTableOfContents,
  fetchIssues,
  fetchJournalConfig,
  fetchMasthead,
  pickLocale,
  type IssueSummary,
  type PublicationSummary,
  type SectionSummary,
} from "@/lib/api";

export const revalidate = 60;

export default async function HomePage(): Promise<ReactNode> {
  const [config, issues, sections, masthead, announcements] = await Promise.all([
    fetchJournalConfig(),
    fetchIssues(),
    fetchActiveSections(),
    fetchMasthead(),
    fetchAnnouncements(5),
  ]);

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";

  // Pick the most recent published issue.
  const currentIssue = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    )[0];

  // Articles in the current issue (TOC).
  const toc = currentIssue?.id
    ? ((await fetchIssueTableOfContents(currentIssue.id)) ?? [])
    : [];

  const sectionsById = new Map<number, SectionSummary>(
    (sections ?? []).map((s) => [s.id, s]),
  );

  // Group articles by section for the sidebar TOC counter.
  const sectionCounts = new Map<string, number>();
  for (const a of toc) {
    const sectionTitle = a.sectionId
      ? pickLocale(sectionsById.get(a.sectionId)?.title, locale) || "Articles"
      : "Articles";
    sectionCounts.set(sectionTitle, (sectionCounts.get(sectionTitle) ?? 0) + 1);
  }

  const callForPapers = (announcements ?? []).find(
    (a) => a.type === "CALL_FOR_PAPERS" && a.visible,
  );

  return (
    <SiteChrome journalName={journalName} active="current">
      {/* Hero — current issue */}
      <section
        style={{
          padding: "56px var(--page-gutter) 40px",
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 56,
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 22,
            }}
          >
            <span className="sc" style={{ color: "var(--amber-deep)" }}>
              {currentIssue ? "Current Issue" : "No issues yet"}
            </span>
            <span
              style={{ width: 32, height: 1, background: "var(--border-strong)" }}
            />
            <span className="marginalia-num" style={{ fontSize: 13 }}>
              {currentIssue
                ? formatIssueLine(currentIssue, locale)
                : "Forthcoming"}
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: "clamp(36px, 5.5vw, 56px)",
              lineHeight: 1.05,
              fontWeight: 500,
              margin: "0 0 18px",
              letterSpacing: "-0.02em",
              maxWidth: 720,
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            {currentIssue
              ? pickLocale(currentIssue.title, locale) ||
                `${journalName}, ${formatIssueLine(currentIssue, locale)}`
              : journalName}
          </h2>
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 18,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              margin: "0 0 24px",
              maxWidth: 620,
              fontStyle: "italic",
            }}
          >
            Peer-reviewed original research, methods, and theory. Open access
            since the first issue, with no embargo and no article-processing
            charge.
          </p>
          <div style={{ display: "flex", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
            {currentIssue ? (
              <Link
                href={`/issues/${encodeURIComponent(currentIssue.urlPath ?? String(currentIssue.id))}`}
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                Read this issue <ArrowRight />
              </Link>
            ) : (
              <Link
                href="/issues"
                className="btn btn-primary"
                style={{ textDecoration: "none" }}
              >
                Browse archives <ArrowRight />
              </Link>
            )}
            <a href="/feed.xml" className="btn" style={{ textDecoration: "none" }}>
              <RssIcon /> Subscribe
            </a>
            <Link href="/search" className="btn" style={{ textDecoration: "none" }}>
              Search articles
            </Link>
          </div>
          <div
            style={{
              display: "flex",
              gap: 28,
              fontSize: 12,
              color: "var(--muted)",
              flexWrap: "wrap",
            }}
          >
            <Stat n={toc.length} label="articles" />
            <Stat n={(masthead ?? []).filter((m) => m.visible).length} label="editors" />
            <Stat n={(issues ?? []).filter((i) => i.published).length} label="issues published" />
          </div>
        </div>

        {/* Cover */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <CoverArt
            label={currentIssue ? formatVolNo(currentIssue) : "Forthcoming"}
            year={currentIssue?.year ?? null}
          />
        </div>
      </section>

      <div style={{ padding: "0 var(--page-gutter)" }}>
        <div className="double-rule" />
      </div>

      {/* Table of contents */}
      <section
        style={{
          padding: "32px var(--page-gutter) 0",
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 56,
        }}
      >
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            In this issue
          </div>
          {toc.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                lineHeight: 1.6,
              }}
            >
              No articles in the current issue yet.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 9,
                fontSize: 13,
                color: "var(--fg-2)",
              }}
            >
              {[...sectionCounts.entries()].map(([title, count], i) => (
                <span
                  key={title}
                  style={{
                    color: i === 0 ? "var(--fg)" : "var(--fg-2)",
                    fontWeight: i === 0 ? 600 : 400,
                    borderLeft:
                      i === 0
                        ? "2px solid var(--amber)"
                        : "2px solid transparent",
                    paddingLeft: 10,
                  }}
                >
                  {title} ({count})
                </span>
              ))}
            </div>
          )}
          <div className="rule" style={{ margin: "20px 0 16px" }} />
          <Link
            href="/search"
            style={{
              fontSize: 12,
              color: "var(--cobalt)",
              fontFamily: "var(--sans)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Browse all articles →
          </Link>
        </aside>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--serif-display)",
                fontSize: 26,
                fontWeight: 500,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Featured in this issue
            </h3>
            {currentIssue ? (
              <Link
                href={`/issues/${encodeURIComponent(currentIssue.urlPath ?? String(currentIssue.id))}`}
                style={{
                  fontSize: 12,
                  color: "var(--cobalt)",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                View full table of contents <ArrowRight size={11} />
              </Link>
            ) : null}
          </div>
          {toc.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                color: "var(--muted)",
                marginTop: 24,
              }}
            >
              The next issue is in production. Recently published articles will
              appear here when the issue lands.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {toc.slice(0, 5).map((article, i) => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  index={i}
                  sectionsById={sectionsById}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Three-up: Scope, Editorial, Indexing */}
      <section
        style={{
          padding: "64px var(--page-gutter) 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          background: "var(--border)",
        }}
      >
        <ThreeUpCard title="Scope">
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 14.5,
              lineHeight: 1.6,
              margin: 0,
              color: "var(--fg-2)",
            }}
          >
            We publish original research, systematic reviews, and
            methodological contributions across the journal&rsquo;s active
            sections. Articles are peer-reviewed under a double-anonymous
            protocol and released open access.
          </p>
          <Link
            href="/about"
            style={{
              fontSize: 12,
              color: "var(--cobalt)",
              textDecoration: "none",
              marginTop: 8,
              display: "inline-block",
            }}
          >
            About the journal →
          </Link>
        </ThreeUpCard>

        <ThreeUpCard title="Editorial board">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 13,
            }}
          >
            {(masthead ?? [])
              .filter((m) => m.visible)
              .slice(0, 4)
              .map((m) => {
                const fullName =
                  [m.givenName, m.familyName].filter(Boolean).join(" ") ||
                  `Member #${m.userId}`;
                const role = pickLocale(m.roleLabel, locale);
                return (
                  <div
                    key={m.id}
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <div
                      className="avatar"
                      style={{ width: 28, height: 28, fontSize: 10 }}
                    >
                      {fullName
                        .split(" ")
                        .filter(Boolean)
                        .map((s) => s[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {fullName}
                      </div>
                      {role ? (
                        <div style={{ fontSize: 11, color: "var(--muted)" }}>
                          {role}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            {(masthead ?? []).length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>
                Editorial board listing coming soon.
              </p>
            ) : null}
            <Link
              href="/about/editorial-board"
              style={{
                fontSize: 12,
                color: "var(--cobalt)",
                textDecoration: "none",
                marginTop: 4,
              }}
            >
              See full board →
            </Link>
          </div>
        </ThreeUpCard>

        <ThreeUpCard title="Indexing">
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 14.5,
              lineHeight: 1.6,
              margin: 0,
              color: "var(--fg-2)",
            }}
          >
            Articles are deposited with Crossref for DOI registration and
            harvested via OAI-PMH so they appear in the abstracting and
            indexing services your institution subscribes to.
          </p>
          <Link
            href="/policies"
            style={{
              fontSize: 12,
              color: "var(--cobalt)",
              textDecoration: "none",
              marginTop: 8,
              display: "inline-block",
            }}
          >
            See archiving policy →
          </Link>
        </ThreeUpCard>
      </section>

      {/* Announcement strip */}
      {callForPapers ? (
        <section
          style={{
            padding: "56px var(--page-gutter) 0",
          }}
        >
          <Link
            href={`/announcements${callForPapers.urlPath ? `#${callForPapers.urlPath}` : ""}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--cobalt-deep)",
              color: "white",
              padding: "28px 32px",
              borderRadius: 6,
              textDecoration: "none",
              gap: 16,
            }}
          >
            <div>
              <div
                className="sc"
                style={{
                  color: "var(--amber)",
                  marginBottom: 6,
                  opacity: 0.9,
                }}
              >
                Open Call
                {callForPapers.dateExpires
                  ? ` · Due ${new Date(callForPapers.dateExpires).toLocaleDateString(
                      locale,
                      { day: "numeric", month: "short", year: "numeric" },
                    )}`
                  : ""}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif-display)",
                  fontSize: 24,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                }}
              >
                {pickLocale(callForPapers.title, locale) || "Special call for papers"}
              </div>
            </div>
            <span
              className="btn"
              style={{
                background: "white",
                color: "var(--cobalt-deep)",
                borderColor: "white",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Submit a manuscript <ArrowRight />
            </span>
          </Link>
        </section>
      ) : null}
    </SiteChrome>
  );
}

function Stat({ n, label }: { n: number; label: string }): ReactNode {
  return (
    <div>
      <span
        className="tnum"
        style={{
          color: "var(--fg)",
          fontWeight: 600,
          fontSize: 18,
          marginRight: 4,
        }}
      >
        {n}
      </span>
      {label}
    </div>
  );
}

function ThreeUpCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div style={{ background: "var(--bg)", padding: "32px 28px" }}>
      <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function ArticleRow({
  article,
  index,
  sectionsById,
  locale,
}: {
  article: PublicationSummary;
  index: number;
  sectionsById: Map<number, SectionSummary>;
  locale: string;
}): ReactNode {
  const slug = article.urlPath ?? String(article.id);
  const title = pickLocale(article.title, locale) || `Article ${article.id}`;
  const abstract = pickLocale(article.abstractText, locale);
  const sectionTitle = article.sectionId
    ? pickLocale(sectionsById.get(article.sectionId)?.title, locale) ||
      sectionsById.get(article.sectionId)?.code
    : null;

  return (
    <article
      style={{
        padding: "22px 0",
        borderTop: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "44px 1fr 110px",
        gap: 20,
      }}
    >
      <div className="marginalia-num" style={{ fontSize: 12, paddingTop: 4 }}>
        {String(index + 1).padStart(2, "0")}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          {sectionTitle ? (
            <span className="sc" style={{ color: "var(--cobalt)" }}>
              {sectionTitle}
            </span>
          ) : null}
          {article.accessStatus === "OPEN" ? (
            <span className="chip chip-mono">OA</span>
          ) : null}
        </div>
        <h4
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: 22,
            fontWeight: 500,
            margin: "0 0 6px",
            lineHeight: 1.25,
            letterSpacing: "-0.005em",
          }}
        >
          <Link
            href={`/articles/${encodeURIComponent(slug)}`}
            style={{ color: "var(--fg)", textDecoration: "none" }}
          >
            {title}
          </Link>
        </h4>
        {abstract ? (
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 14.5,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              margin: 0,
              maxWidth: 640,
            }}
          >
            {truncate(abstract, 280)}
          </p>
        ) : null}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 14,
            fontSize: 11,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {article.datePublished ? (
            <span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {new Date(article.datePublished).toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          ) : null}
          <Link
            href={`/articles/${encodeURIComponent(slug)}`}
            style={{ color: "var(--cobalt)", textDecoration: "none" }}
          >
            Read article →
          </Link>
        </div>
      </div>
      <div style={{ textAlign: "right", paddingTop: 4 }}>
        <div
          className="tnum"
          style={{
            fontSize: 24,
            fontWeight: 500,
            color: "var(--fg)",
            fontFamily: "var(--serif-display)",
          }}
        >
          v{article.version ?? 1}
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--muted)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          version
        </div>
      </div>
    </article>
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
        width: 220,
        height: 308,
        background:
          "linear-gradient(180deg, var(--cobalt-deep) 0%, var(--cobalt) 100%)",
        position: "relative",
        boxShadow:
          "0 1px 0 0 oklch(85% 0.012 90 / 0.6), 0 8px 24px oklch(20% 0.02 270 / 0.12)",
        color: "white",
        padding: "24px 22px",
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
            fontSize: 28,
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

function ArrowRight({ size = 14 }: { size?: number }): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ verticalAlign: -1 }}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function RssIcon(): ReactNode {
  return (
    <svg
      width={13}
      height={13}
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

function formatIssueLine(issue: IssueSummary, locale: string): string {
  const parts: string[] = [];
  if (issue.volume) parts.push(`Vol. ${issue.volume}`);
  if (issue.number) parts.push(`No. ${issue.number}`);
  if (issue.datePublished) {
    parts.push(
      new Date(issue.datePublished).toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      }),
    );
  } else if (issue.year) {
    parts.push(String(issue.year));
  }
  return parts.join(" · ") || `Issue ${issue.id}`;
}

function formatVolNo(issue: IssueSummary): string {
  if (issue.volume && issue.number) return `Vol. ${issue.volume} № ${issue.number}`;
  if (issue.volume) return `Vol. ${issue.volume}`;
  if (issue.number) return `№ ${issue.number}`;
  return `Issue ${issue.id}`;
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
