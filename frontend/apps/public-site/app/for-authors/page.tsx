import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchJournalConfig, pickLocale } from "@/lib/api";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "For Authors",
  description:
    "Submission guidelines, peer review process, and what authors can expect.",
};

const SECTIONS: Array<{ id: string; label: string }> = [
  { id: "what-we-accept", label: "What we accept" },
  { id: "preparation", label: "Manuscript preparation" },
  { id: "peer-review", label: "Peer review" },
  { id: "open-access", label: "Open access & copyright" },
  { id: "questions", label: "Questions" },
];

export default async function ForAuthorsPage(): Promise<ReactNode> {
  const config = await fetchJournalConfig();
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const submissionsOpen = config?.submissionsOpen ?? false;
  const contactEmail = config?.contactEmail ?? "editors@example.org";

  return (
    <SiteChrome journalName={journalName} active="for-authors">
      <section
        style={{
          padding: "32px 56px 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 10 }}>
          For Authors
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
          How to submit your work
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
          {journalName} publishes peer-reviewed scholarly articles. We welcome
          original research, theoretical pieces, and review essays from
          researchers at every stage of their career.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 720px) 1fr",
          gap: 56,
          padding: "32px 56px 80px",
        }}
      >
        {/* Sticky On this page */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            On this page
          </div>
          <nav
            style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}
          >
            {SECTIONS.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                style={{
                  textDecoration: "none",
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
                {s.label}
              </a>
            ))}
          </nav>
          <div className="rule" style={{ margin: "20px 0 16px" }} />
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 8 }}>
            Editorial contact
          </div>
          <a
            href={`mailto:${contactEmail}`}
            style={{
              fontFamily: "var(--mono)",
              fontSize: 11,
              color: "var(--cobalt)",
              textDecoration: "none",
              wordBreak: "break-all",
            }}
          >
            {contactEmail}
          </a>
        </aside>

        {/* Main reading column */}
        <article className="reading" style={{ minWidth: 0 }}>
          <h2 id="what-we-accept" style={h2Style}>What we accept</h2>
          <ul style={listStyle}>
            <li>Original research articles (6,000–10,000 words including notes and references)</li>
            <li>Review essays of recent books in the field (2,000–4,000 words)</li>
            <li>Theoretical or methodological notes (3,000–5,000 words)</li>
          </ul>

          <h2 id="preparation" style={h2Style}>Manuscript preparation</h2>
          <ul style={listStyle}>
            <li>Submit in PDF, DOCX, or LaTeX (PDF preferred for review).</li>
            <li>
              Anonymise the file for double-anonymous peer review — remove author
              names, affiliations, and self-identifying acknowledgements.
            </li>
            <li>Use a recognised citation style consistently (Chicago, APA, MLA).</li>
            <li>Include an abstract of up to 250 words and 4–8 keywords.</li>
          </ul>

          <h2 id="peer-review" style={h2Style}>Peer review process</h2>
          <ol style={listStyle}>
            <li>
              <strong>Editorial triage</strong> (1–2 weeks): an editor screens for
              fit and basic quality.
            </li>
            <li>
              <strong>External review</strong> (8–12 weeks): we recruit two
              anonymous reviewers; their reports are shared with you alongside the
              editor&rsquo;s decision.
            </li>
            <li>
              <strong>Revisions</strong>: most accepted manuscripts undergo at
              least one round of revision.
            </li>
            <li>
              <strong>Production</strong>: copy-editing and proof review take
              roughly 4 weeks before the article appears in an issue.
            </li>
          </ol>

          <h2 id="open-access" style={h2Style}>Open access &amp; copyright</h2>
          <p style={paragraphStyle}>
            All accepted articles are published under a Creative Commons licence
            chosen by the author at the production stage. Authors retain copyright
            and grant {journalName} a non-exclusive licence to publish.
          </p>

          <h2 id="questions" style={h2Style}>Questions?</h2>
          <p style={paragraphStyle}>
            Email{" "}
            <a href={`mailto:${contactEmail}`} style={{ color: "var(--cobalt)" }}>
              {contactEmail}
            </a>{" "}
            or visit the{" "}
            <Link href="/contact" style={{ color: "var(--cobalt)" }}>
              contact page
            </Link>
            .
          </p>
        </article>

        {/* Right rail — submission CTA card */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              padding: 18,
              background: submissionsOpen
                ? "var(--cobalt-soft)"
                : "var(--surface)",
              marginBottom: 14,
            }}
          >
            <div
              className="sc"
              style={{
                color: submissionsOpen ? "var(--cobalt-deep)" : "var(--muted)",
                marginBottom: 10,
              }}
            >
              {submissionsOpen
                ? "Submissions are open"
                : "Submissions are closed"}
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
              {submissionsOpen
                ? "Sign in to the editorial app and start a new submission. Drafts can be saved at any stage."
                : "Watch the announcements page for the next call for papers."}
            </p>
            {submissionsOpen ? (
              <a
                href={EDITORIAL_APP_URL}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Submit a manuscript
              </a>
            ) : (
              <Link
                href="/announcements"
                className="btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                See announcements
              </Link>
            )}
          </div>

          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 16,
              background: "var(--bg)",
            }}
          >
            <div
              className="sc"
              style={{ color: "var(--cobalt)", marginBottom: 8 }}
            >
              Before you submit
            </div>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                fontSize: 13,
                lineHeight: 1.65,
                color: "var(--fg-2)",
                fontFamily: "var(--sans)",
              }}
            >
              {[
                "Anonymised file",
                "Abstract ≤ 250 words",
                "4–8 keywords",
                "Consistent citation style",
                "Funding & conflicts disclosed",
              ].map((item) => (
                <li
                  key={item}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "baseline",
                    padding: "3px 0",
                  }}
                >
                  <span
                    style={{
                      color: "var(--cobalt)",
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                    }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/policies"
              style={{
                fontSize: 12,
                color: "var(--cobalt)",
                textDecoration: "none",
                marginTop: 12,
                display: "inline-block",
              }}
            >
              Full policies →
            </Link>
          </div>
        </aside>
      </section>
    </SiteChrome>
  );
}

const h2Style: React.CSSProperties = {
  fontFamily: "var(--serif-display)",
  fontWeight: 500,
  fontSize: 24,
  lineHeight: 1.25,
  letterSpacing: "-0.005em",
  margin: "32px 0 12px",
  color: "var(--fg)",
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: "var(--fg-2)",
  margin: "0 0 14px",
  fontFamily: "var(--serif-body)",
};

const listStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: "var(--fg-2)",
  paddingLeft: 18,
  marginBottom: 14,
  fontFamily: "var(--serif-body)",
};
