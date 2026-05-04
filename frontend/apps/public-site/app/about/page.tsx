import Link from "next/link";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchIssues, fetchJournalConfig, pickLocale } from "@/lib/api";

export const revalidate = 600;

export const metadata = {
  title: "About",
  description:
    "Browse the journal's current issue, archives, policies, board, and submission process.",
};

export default async function AboutPage(): Promise<ReactNode> {
  const [config, issues] = await Promise.all([
    fetchJournalConfig(),
    fetchIssues(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";

  // "Current" = the most recently published issue, if any.
  const currentIssue = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    )[0];
  const currentSlug = currentIssue?.urlPath
    ?? (currentIssue?.id != null ? String(currentIssue.id) : null);

  const cards: Array<{
    href: string;
    title: string;
    body: string;
    badge?: string;
  }> = [
    {
      href: currentSlug ? `/issues/${encodeURIComponent(currentSlug)}` : "/issues",
      title: "Current",
      body: currentIssue
        ? `Latest issue: ${formatIssueLabel(currentIssue, locale)}`
        : "The most recent published issue.",
      badge: currentIssue ? "now reading" : undefined,
    },
    {
      href: "/issues",
      title: "Archives",
      body: "Every published volume and issue, grouped by year.",
    },
    {
      href: "/for-authors",
      title: "Article submission",
      body: "Guidelines for authors: how to submit, format requirements, peer review timeline.",
    },
    {
      href: "/policies",
      title: "Policies",
      body: "Peer review, ethics, open access, copyright, archiving.",
    },
    {
      href: "/about/editorial-board",
      title: "Editorial Board",
      body: "Editors, advisors, and section editors who steward each manuscript.",
    },
    {
      href: "/announcements",
      title: "Call for Papers",
      body: "Open calls, special issues, and journal news.",
    },
    {
      href: "/contact",
      title: "Contact",
      body: "How to reach the editorial office for questions and submissions.",
    },
  ];

  return (
    <SiteChrome journalName={journalName} active="about">
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
            About
          </p>
          <h1
            className="text-fg"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: "clamp(40px, 6vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 12,
            }}
          >
            {journalName}
          </h1>
          <p
            className="text-fg-2"
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 18,
              lineHeight: 1.6,
              maxWidth: 640,
            }}
          >
            An open-access scholarly journal publishing peer-reviewed
            research. Articles are released as soon as they clear
            production — no embargo, no article-processing charge.
          </p>
        </div>
      </section>

      <section>
        <div className="max-w-4xl mx-auto px-6 py-14">
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {cards.map((card) => (
              <li key={card.title}>
                <Link
                  href={card.href}
                  style={{
                    display: "block",
                    padding: "20px 18px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-2)",
                    background: "var(--surface)",
                    textDecoration: "none",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "var(--serif-display)",
                        fontWeight: 600,
                        fontSize: 19,
                        color: "var(--fg)",
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {card.title}
                    </p>
                    {card.badge ? (
                      <span
                        className="chip chip-cobalt"
                        style={{ fontSize: 9, letterSpacing: "0.06em" }}
                      >
                        {card.badge}
                      </span>
                    ) : null}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--sans)",
                      fontSize: 13.5,
                      color: "var(--muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {card.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteChrome>
  );
}

type Issue = NonNullable<Awaited<ReturnType<typeof fetchIssues>>>[number];

function formatIssueLabel(issue: Issue, locale: string): string {
  const t = pickLocale(issue.title, locale);
  if (t) return t;
  const parts = [
    issue.volume ? `Vol. ${issue.volume}` : null,
    issue.number ? `No. ${issue.number}` : null,
    issue.year ? `(${issue.year})` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : `Issue ${issue.id}`;
}
