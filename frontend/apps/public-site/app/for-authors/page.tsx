import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchJournalConfig, pickLocale } from "@/lib/api";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "For Authors",
  description: "Submission guidelines, peer review process, and what authors can expect.",
};

export default async function ForAuthorsPage(): Promise<ReactNode> {
  const config = await fetchJournalConfig();
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const submissionsOpen = config?.submissionsOpen ?? false;

  return (
    <SiteChrome journalName={journalName}>
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
            For Authors
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
            How to submit your work
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.7, color: "var(--fg-2)" }}>
            <strong style={{ color: "var(--fg)" }}>{journalName}</strong> publishes
            peer-reviewed scholarly articles. We welcome original research,
            theoretical pieces, and review essays from researchers at every stage
            of their career.
          </p>

          <div
            style={{
              margin: "24px 0",
              padding: "14px 18px",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-2)",
              background: "var(--surface)",
              fontFamily: "var(--sans)",
              fontSize: 13,
              color: submissionsOpen ? "var(--fg)" : "var(--muted)",
            }}
          >
            <strong>{submissionsOpen ? "✓ Submissions are open." : "Submissions are currently closed."}</strong>{" "}
            {submissionsOpen
              ? "Sign in to the editorial app and start a new submission."
              : "Check back during the next call for papers."}
          </div>

          <h2 className="text-fg mt-10 mb-3" style={h2Style}>What we accept</h2>
          <ul style={listStyle}>
            <li>Original research articles (6,000–10,000 words including notes and references)</li>
            <li>Review essays of recent books in the field (2,000–4,000 words)</li>
            <li>Theoretical or methodological notes (3,000–5,000 words)</li>
          </ul>

          <h2 className="text-fg mt-10 mb-3" style={h2Style}>Manuscript preparation</h2>
          <ul style={listStyle}>
            <li>Submit in PDF, DOCX, or LaTeX (PDF preferred for review).</li>
            <li>Anonymise the file for double-anonymous peer review — remove
              author names, affiliations, and self-identifying acknowledgements.</li>
            <li>Use a recognised citation style consistently (Chicago, APA, MLA).</li>
            <li>Include an abstract of up to 250 words and 4–8 keywords.</li>
          </ul>

          <h2 className="text-fg mt-10 mb-3" style={h2Style}>Peer review process</h2>
          <ol style={listStyle}>
            <li><strong>Editorial triage</strong> (1–2 weeks): an editor screens for fit and basic quality.</li>
            <li><strong>External review</strong> (8–12 weeks): we recruit two anonymous reviewers; their reports are shared with you alongside the editor&rsquo;s decision.</li>
            <li><strong>Revisions</strong>: most accepted manuscripts undergo at least one round of revision.</li>
            <li><strong>Production</strong>: copy-editing and proof review take roughly 4 weeks before the article appears in an issue.</li>
          </ol>

          <h2 className="text-fg mt-10 mb-3" style={h2Style}>Open access &amp; copyright</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--fg-2)" }}>
            All accepted articles are published under a Creative Commons licence
            chosen by the author at the production stage. Authors retain copyright
            and grant {journalName} a non-exclusive licence to publish.
          </p>

          <h2 className="text-fg mt-10 mb-3" style={h2Style}>Questions?</h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "var(--fg-2)" }}>
            Email{" "}
            <a
              href={`mailto:${config?.contactEmail ?? "editors@example.org"}`}
              className="text-cobalt"
            >
              {config?.contactEmail ?? "editors@example.org"}
            </a>{" "}
            or visit the <Link href="/contact" className="text-cobalt">contact page</Link>.
          </p>
      </article>
    </SiteChrome>
  );
}

const h2Style = {
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 24,
  lineHeight: 1.2,
};

const listStyle = {
  fontSize: 16,
  lineHeight: 1.7,
  color: "var(--fg-2)",
  paddingLeft: 18,
  marginBottom: 0,
};
