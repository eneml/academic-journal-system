import Link from "next/link";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchActiveSections,
  fetchIssues,
  fetchJournalConfig,
  fetchMasthead,
  pickLocale,
} from "@/lib/api";

export const revalidate = 600;

export const metadata = {
  title: "About",
  description:
    "Browse the journal's current issue, archives, policies, board, and submission process.",
};

export default async function AboutPage(): Promise<ReactNode> {
  const [config, issues, sections, masthead] = await Promise.all([
    fetchJournalConfig(),
    fetchIssues(),
    fetchActiveSections(),
    fetchMasthead(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";

  // "Current" = the most recently published issue, if any.
  const publishedIssues = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    );
  const currentIssue = publishedIssues[0];
  const currentSlug =
    currentIssue?.urlPath ??
    (currentIssue?.id != null ? String(currentIssue.id) : null);
  const editorsCount = (masthead ?? []).filter((m) => m.visible).length;
  const sectionsCount = (sections ?? []).length;

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
      <section
        style={{
          padding: "32px 56px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 10 }}>
          About
        </div>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 500,
            fontSize: "clamp(34px, 4.6vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 10px",
          }}
        >
          {journalName}
        </h1>
        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--fg-2)",
            margin: 0,
            maxWidth: 720,
            fontStyle: "italic",
          }}
        >
          An open-access scholarly journal publishing peer-reviewed research.
          Articles are released as soon as they clear production — no embargo,
          no article-processing charge.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 280px",
          gap: 56,
          padding: "32px 56px 80px",
        }}
      >
        {/* Card grid — main column */}
        <div>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            Browse
          </div>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {cards.map((card) => (
              <li key={card.title}>
                <Link
                  href={card.href}
                  style={{
                    display: "block",
                    padding: "18px 18px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
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
                        fontWeight: 500,
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

        {/* Right rail — at-a-glance */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 18,
              background: "var(--bg)",
              marginBottom: 14,
            }}
          >
            <div
              className="sc"
              style={{ color: "var(--muted)", marginBottom: 14 }}
            >
              At a glance
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <Stat n={publishedIssues.length} label="published issues" />
              <Stat n={sectionsCount} label="active sections" />
              <Stat n={editorsCount} label="board members" />
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              padding: 18,
              background: "var(--cobalt-soft)",
            }}
          >
            <div
              className="sc"
              style={{ color: "var(--cobalt-deep)", marginBottom: 8 }}
            >
              Reading mode
            </div>
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                margin: "0 0 14px",
              }}
            >
              Open access, no embargo, no article-processing charge.
            </p>
            <Link
              href="/policies"
              style={{
                fontSize: 12,
                color: "var(--cobalt-deep)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              How peer review works →
            </Link>
          </div>
        </aside>
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
          fontFamily: "var(--serif-display)",
          fontSize: 26,
          fontWeight: 500,
          lineHeight: 1.1,
          color: "var(--fg)",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--muted)",
          fontFamily: "var(--sans)",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </div>
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
