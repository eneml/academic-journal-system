import Link from "next/link";
import type { ReactNode } from "react";
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
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const published = (issues ?? []).filter((i) => i.published);
  const byYear = groupByYear(published);

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
            <Link href="/issues" className="text-fg hover:text-cobalt">
              Archive
            </Link>
            <Link href="/about" className="text-fg-2 hover:text-cobalt">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <p
              className="sc text-cobalt mb-3"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Archive
            </p>
            <h1
              className="text-fg"
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(36px, 5vw, 56px)",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              All issues of {journalName}
            </h1>
          </div>
        </section>

        <section>
          <div className="max-w-4xl mx-auto px-6 py-16">
            {byYear.length === 0 ? (
              <p
                className="text-fg-2"
                style={{ fontFamily: "var(--serif-body)" }}
              >
                No issues have been published yet.
              </p>
            ) : (
              byYear.map(({ year, items }) => (
                <section key={year} className="mb-14 last:mb-0">
                  <h2
                    className="text-fg mb-6"
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontWeight: 600,
                      fontSize: 28,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 8,
                    }}
                  >
                    {year ?? "Undated"}
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                    {items.map((issue) => {
                      const slug = issue.urlPath ?? String(issue.id);
                      const heading = pickLocale(issue.title, locale);
                      const lineParts = [
                        issue.volume ? `Vol. ${issue.volume}` : null,
                        issue.number ? `No. ${issue.number}` : null,
                      ].filter(Boolean);
                      return (
                        <li key={issue.id}>
                          <p
                            className="marginalia-num mb-1"
                            style={{ fontFamily: "var(--serif-display)" }}
                          >
                            {issue.datePublished
                              ? new Date(issue.datePublished).toLocaleDateString(
                                  locale,
                                  { day: "numeric", month: "long" },
                                )
                              : ""}
                          </p>
                          <Link
                            href={`/issues/${slug}`}
                            className="text-fg hover:text-cobalt"
                            style={{
                              fontFamily: "var(--serif-display)",
                              fontWeight: 600,
                              fontSize: 22,
                              lineHeight: 1.25,
                              display: "inline-block",
                            }}
                          >
                            {heading || lineParts.join(" · ") || `Issue ${issue.id}`}
                          </Link>
                          {lineParts.length > 0 && heading ? (
                            <p
                              className="text-fg-2 mt-1"
                              style={{
                                fontFamily: "var(--sans)",
                                fontSize: 13,
                              }}
                            >
                              {lineParts.join(" · ")}
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
            © {new Date().getFullYear()} {journalName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
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
