import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchJournalConfig, pickLocale } from "@/lib/api";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the journal's editorial office.",
};

export default async function ContactPage(): Promise<ReactNode> {
  const config = await fetchJournalConfig();
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const contactEmail = config?.contactEmail ?? "editors@example.org";

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-fg"
            style={{ fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 18 }}
          >
            {journalName}
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-fg-2 hover:text-cobalt">Home</Link>
            <Link href="/issues" className="text-fg-2 hover:text-cobalt">Archive</Link>
            <Link href="/search" className="text-fg-2 hover:text-cobalt">Search</Link>
            <Link href="/about" className="text-fg-2 hover:text-cobalt">About</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-2xl mx-auto px-6 py-16 reading">
          <p
            className="sc text-cobalt mb-3"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Contact
          </p>
          <h1
            className="text-fg mb-8"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Get in touch
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--fg-2)" }}>
            For editorial enquiries — submission status, peer review, or
            production — reach the editors directly:
          </p>

          <p
            style={{
              margin: "24px 0",
              padding: "18px 20px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-2)",
              background: "var(--surface)",
              fontFamily: "var(--sans)",
              fontSize: 15,
            }}
          >
            <a
              href={`mailto:${contactEmail}`}
              className="text-cobalt"
              style={{ fontWeight: 500 }}
            >
              {contactEmail}
            </a>
          </p>

          <h2
            className="text-fg mt-10 mb-3"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 22,
            }}
          >
            What to include
          </h2>
          <ul
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "var(--fg-2)",
              paddingLeft: 18,
            }}
          >
            <li>Your full name and institutional affiliation.</li>
            <li>The submission id or article title, if your message concerns
              an in-flight manuscript.</li>
            <li>A clear subject line — we triage the inbox manually.</li>
          </ul>

          <h2
            className="text-fg mt-10 mb-3"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 22,
            }}
          >
            Are you submitting an article?
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--fg-2)" }}>
            Don&rsquo;t email manuscripts to the editorial inbox. See the{" "}
            <Link href="/for-authors" className="text-cobalt">
              author guide
            </Link>{" "}
            for the submission workflow — drafts go through the editorial app so
            assignments, reviews, and decisions stay tracked in one place.
          </p>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} {journalName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
