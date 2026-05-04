import Link from "next/link";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchIssues,
  fetchJournalConfig,
  pickLocale,
} from "@/lib/api";

export const revalidate = 60;

export const metadata = {
  title: "Archive",
};

export default async function IssuesPage(): Promise<ReactNode> {
  const [issues, config] = await Promise.all([
    fetchIssues(),
    fetchJournalConfig(),
  ]);

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const published = (issues ?? []).filter((i) => i.published);
  const byYear = groupByYear(published);
  const earliestYear =
    byYear.length > 0
      ? byYear.map((g) => g.year).filter((y): y is number => y != null).at(-1)
      : null;
  const latestYear =
    byYear.length > 0
      ? byYear.map((g) => g.year).filter((y): y is number => y != null)[0]
      : null;

  return (
    <SiteChrome journalName={journalName} active="archive">
      <section
        style={{
          padding: "32px 56px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 10 }}>
          Archive
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
          All issues of {journalName}
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
          Every published volume, grouped by year. Click into an issue to see
          its table of contents.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 1fr)",
          gap: 56,
          padding: "32px 56px 80px",
        }}
      >
        {/* Year jump-list */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            Years
          </div>
          {byYear.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                fontFamily: "var(--serif-body)",
                fontStyle: "italic",
              }}
            >
              No issues yet.
            </p>
          ) : (
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 13,
              }}
            >
              {byYear.map(({ year, items }, i) => (
                <a
                  key={year ?? "undated"}
                  href={`#year-${year ?? "undated"}`}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    justifyContent: "space-between",
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
                  <span>{year ?? "Undated"}</span>
                  <span
                    className="tnum"
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--muted)",
                    }}
                  >
                    {items.length}
                  </span>
                </a>
              ))}
            </nav>
          )}

          <div className="rule" style={{ margin: "20px 0 16px" }} />
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 8 }}>
            Span
          </div>
          <div
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--fg)",
              lineHeight: 1.1,
            }}
            className="tnum"
          >
            {earliestYear && latestYear
              ? earliestYear === latestYear
                ? earliestYear
                : `${earliestYear}–${latestYear}`
              : "—"}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              fontFamily: "var(--sans)",
              marginTop: 2,
            }}
          >
            {published.length} {published.length === 1 ? "issue" : "issues"}
          </div>
        </aside>

        {/* Main grid */}
        <div style={{ minWidth: 0 }}>
          {byYear.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 16,
                color: "var(--muted)",
                margin: 0,
              }}
            >
              No issues have been published yet.
            </p>
          ) : (
            byYear.map(({ year, items }) => (
              <section
                key={year ?? "undated"}
                id={`year-${year ?? "undated"}`}
                style={{ marginBottom: 48 }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 14,
                    marginBottom: 22,
                  }}
                >
                  <h2
                    className="tnum"
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontWeight: 500,
                      fontSize: 28,
                      letterSpacing: "-0.01em",
                      margin: 0,
                    }}
                  >
                    {year ?? "Undated"}
                  </h2>
                  <div
                    style={{
                      flex: 1,
                      height: 1,
                      background: "var(--border)",
                    }}
                  />
                  <span className="sc" style={{ color: "var(--muted)" }}>
                    {items.length} {items.length === 1 ? "issue" : "issues"}
                  </span>
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 24,
                  }}
                >
                  {items.map((issue) => {
                    const slug = issue.urlPath ?? String(issue.id);
                    const heading = pickLocale(issue.title, locale);
                    const lineParts = [
                      issue.volume ? `Vol. ${issue.volume}` : null,
                      issue.number ? `No. ${issue.number}` : null,
                    ].filter(Boolean);
                    return (
                      <li key={issue.id}>
                        <Link
                          href={`/issues/${slug}`}
                          style={{
                            display: "block",
                            padding: "16px 18px",
                            border: "1px solid var(--border)",
                            borderRadius: 6,
                            background: "var(--surface)",
                            textDecoration: "none",
                            color: "inherit",
                          }}
                        >
                          <div
                            className="marginalia-num"
                            style={{ marginBottom: 6 }}
                          >
                            {issue.datePublished
                              ? new Date(issue.datePublished).toLocaleDateString(
                                  locale,
                                  {
                                    day: "numeric",
                                    month: "long",
                                  },
                                )
                              : ""}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--serif-display)",
                              fontWeight: 500,
                              fontSize: 19,
                              lineHeight: 1.25,
                              color: "var(--fg)",
                              letterSpacing: "-0.005em",
                              marginBottom: heading && lineParts.length > 0 ? 4 : 0,
                            }}
                          >
                            {heading ||
                              lineParts.join(" · ") ||
                              `Issue ${issue.id}`}
                          </div>
                          {lineParts.length > 0 && heading ? (
                            <div
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 12,
                                color: "var(--muted)",
                              }}
                            >
                              {lineParts.join(" · ")}
                            </div>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </section>
    </SiteChrome>
  );
}

type Issue = NonNullable<Awaited<ReturnType<typeof fetchIssues>>>[number];

function groupByYear(issues: Issue[]): Array<{ year: number | null; items: Issue[] }> {
  const buckets = new Map<number | null, Issue[]>();
  for (const issue of issues) {
    const key = issue.year ?? null;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(issue);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (b[0] ?? -1) - (a[0] ?? -1))
    .map(([year, items]) => ({
      year,
      items: items.sort((a, b) =>
        (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
      ),
    }));
}
