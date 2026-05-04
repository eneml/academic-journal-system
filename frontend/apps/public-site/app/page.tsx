import Link from "next/link";
import type { ReactNode } from "react";
import {
  fetchIssues,
  fetchJournalConfig,
  fetchRecentPublications,
  pickLocale,
} from "@/lib/api";

export const revalidate = 60;

export default async function HomePage(): Promise<ReactNode> {
  const [config, recent, issues] = await Promise.all([
    fetchJournalConfig(),
    fetchRecentPublications(6),
    fetchIssues(),
  ]);

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const currentIssue = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    )[0];
  const currentIssueLine = currentIssue
    ? [
        currentIssue.volume ? `Vol. ${currentIssue.volume}` : null,
        currentIssue.number ? `No. ${currentIssue.number}` : null,
        currentIssue.year ? `${currentIssue.year}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Forthcoming";

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
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <p
              className="text-cobalt mb-4"
              style={{
                fontFamily: "var(--sans)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {currentIssueLine}
            </p>
            <h1
              className="text-fg"
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                maxWidth: "16ch",
              }}
            >
              {journalName}
            </h1>
            <p
              className="text-fg-2 mt-6"
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 20,
                lineHeight: 1.55,
                maxWidth: "60ch",
              }}
            >
              A scholarly journal of original peer-reviewed research.
              {config?.submissionsOpen ? " Submissions are open." : ""}
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex items-baseline justify-between mb-8">
              <p className="text-xs uppercase tracking-widest text-muted">
                Latest articles
              </p>
              {currentIssue ? (
                <Link
                  href={`/issues/${currentIssue.urlPath ?? currentIssue.id}`}
                  className="text-cobalt text-sm"
                  style={{ fontFamily: "var(--sans)" }}
                >
                  Read the current issue →
                </Link>
              ) : null}
            </div>

            {recent && recent.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12">
                {recent.map((p) => (
                  <li key={p.id}>
                    <p
                      className="marginalia-num mb-2"
                      style={{ fontFamily: "var(--serif-display)" }}
                    >
                      {p.datePublished
                        ? new Date(p.datePublished).getFullYear()
                        : ""}
                    </p>
                    <h2
                      className="text-fg mb-3"
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontWeight: 600,
                        fontSize: 22,
                        lineHeight: 1.25,
                      }}
                    >
                      <Link
                        href={`/articles/${p.urlPath ?? p.id}`}
                        className="hover:text-cobalt"
                      >
                        {pickLocale(p.title, locale) || "Untitled"}
                      </Link>
                    </h2>
                    <p
                      className="text-fg-2"
                      style={{
                        fontFamily: "var(--serif-body)",
                        fontSize: 15,
                        lineHeight: 1.55,
                      }}
                    >
                      {truncate(pickLocale(p.abstractText, locale), 220)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className="text-fg-2"
                style={{ fontFamily: "var(--serif-body)" }}
              >
                No articles published yet. Check back soon.
              </p>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} {journalName}. All rights reserved.
          </p>
          {config?.contactEmail ? (
            <a
              href={`mailto:${config.contactEmail}`}
              className="hover:text-cobalt"
              style={{ fontFamily: "var(--mono)", fontSize: 12 }}
            >
              {config.contactEmail}
            </a>
          ) : null}
        </div>
      </footer>
    </div>
  );
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
