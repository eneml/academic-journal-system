import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
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
  // Allow either url-path slugs or numeric ids in the URL.
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
  const [issue, config] = await Promise.all([loadIssue(slug), fetchJournalConfig()]);
  if (!issue) return { title: "Issue not found" };
  const locale = config?.defaultLocale ?? "en";
  const heading =
    pickLocale(issue.title, locale) || formatIssueLine(issue) || `Issue ${issue.id}`;
  return {
    title: heading,
    description: pickLocale(issue.title, locale) || formatIssueLine(issue) || undefined,
  };
}

export default async function SingleIssuePage({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const [issue, config] = await Promise.all([loadIssue(slug), fetchJournalConfig()]);
  if (!issue) notFound();

  const [toc, sectionsMap] = await Promise.all([
    fetchIssueTableOfContents(issue.id),
    fetchActiveSectionsMap(),
  ]);

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const heading = pickLocale(issue.title, locale) || formatIssueLine(issue) || `Issue ${issue.id}`;
  const subhead = pickLocale(issue.title, locale) ? formatIssueLine(issue) : null;
  const grouped = groupBySection(toc ?? [], sectionsMap, locale);

  return (
    <div className="min-h-screen flex flex-col">
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
            <Link href="/issues" className="text-cobalt">
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
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <p
              className="sc text-cobalt mb-3"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {issue.datePublished
                ? new Date(issue.datePublished).toLocaleDateString(locale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Issue"}
            </p>
            <h1
              className="text-fg"
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(34px, 5vw, 52px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {heading}
            </h1>
            {subhead ? (
              <p
                className="text-fg-2 mt-4"
                style={{ fontFamily: "var(--serif-body)", fontSize: 18 }}
              >
                {subhead}
              </p>
            ) : null}
          </div>
        </section>

        <section>
          <div className="max-w-4xl mx-auto px-6 py-14">
            {grouped.length === 0 ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                No articles have been published in this issue yet.
              </p>
            ) : (
              grouped.map(({ sectionId, sectionTitle, items }) => (
                <section key={sectionId ?? "uncategorised"} className="mb-14 last:mb-0">
                  <h2
                    className="text-fg mb-6"
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontWeight: 600,
                      fontSize: 22,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                    }}
                  >
                    {sectionTitle}
                  </h2>
                  <ul className="grid grid-cols-1 gap-y-7">
                    {items.map((article) => {
                      const slug = article.urlPath ?? String(article.id);
                      const title =
                        pickLocale(article.title, locale) || `Article ${article.id}`;
                      const summary = pickLocale(article.abstractText, locale).slice(0, 220);
                      return (
                        <li key={article.id}>
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
                          {summary ? (
                            <p
                              className="text-fg-2 mt-2"
                              style={{
                                fontFamily: "var(--serif-body)",
                                fontSize: 15,
                                lineHeight: 1.55,
                              }}
                            >
                              {summary}
                              {summary.length === 220 ? "…" : ""}
                            </p>
                          ) : null}
                          {article.keywords?.length ? (
                            <p
                              className="text-muted mt-2"
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 12,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              {article.keywords.slice(0, 5).join(" · ")}
                            </p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>
            <Link href="/issues" className="hover:text-cobalt">
              ← Back to archive
            </Link>
          </p>
          <p>
            © {new Date().getFullYear()} {journalName}. All rights reserved.
          </p>
        </div>
      </footer>
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
