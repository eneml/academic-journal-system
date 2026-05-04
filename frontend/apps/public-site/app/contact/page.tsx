import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchJournalConfig, pickLocale } from "@/lib/api";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach the journal's editorial office.",
};

const SECTIONS: Array<{ id: string; label: string }> = [
  { id: "editorial", label: "Editorial enquiries" },
  { id: "what-to-include", label: "What to include" },
  { id: "submitting", label: "Submitting an article" },
];

export default async function ContactPage(): Promise<ReactNode> {
  const config = await fetchJournalConfig();
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const contactEmail = config?.contactEmail ?? "editors@example.org";

  return (
    <SiteChrome journalName={journalName} active="contact">
      <section
        style={{
          padding: "32px var(--page-gutter) 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 10 }}>
          Contact
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
          Get in touch
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
          The editorial office at {journalName} handles everything from
          submission queries to production timelines. The fastest route is email
          — we triage the inbox manually.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 720px) 1fr",
          gap: 56,
          padding: "32px var(--page-gutter) 80px",
        }}
      >
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
        </aside>

        <article className="reading" style={{ minWidth: 0 }}>
          <h2 id="editorial" style={h2Style}>Editorial enquiries</h2>
          <p style={paragraphStyle}>
            For submission status, peer review, production timelines, or anything
            else the editorial office can answer, write to the team directly.
          </p>
          <div
            style={{
              margin: "16px 0 24px",
              padding: "18px 20px",
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              background: "var(--surface)",
              fontFamily: "var(--sans)",
              fontSize: 15,
            }}
          >
            <div
              className="sc"
              style={{ color: "var(--muted)", marginBottom: 6 }}
            >
              Email
            </div>
            <a
              href={`mailto:${contactEmail}`}
              style={{
                color: "var(--cobalt)",
                fontWeight: 500,
                textDecoration: "none",
                fontFamily: "var(--mono)",
                fontSize: 15,
              }}
            >
              {contactEmail}
            </a>
          </div>

          <h2 id="what-to-include" style={h2Style}>What to include</h2>
          <ul style={listStyle}>
            <li>Your full name and institutional affiliation.</li>
            <li>
              The submission id or article title, if your message concerns an
              in-flight manuscript.
            </li>
            <li>A clear subject line — we triage the inbox manually.</li>
          </ul>

          <h2 id="submitting" style={h2Style}>Submitting an article?</h2>
          <p style={paragraphStyle}>
            Don&rsquo;t email manuscripts to the editorial inbox. See the{" "}
            <Link href="/for-authors" style={{ color: "var(--cobalt)" }}>
              author guide
            </Link>{" "}
            for the submission workflow — drafts go through the editorial app so
            assignments, reviews, and decisions stay tracked in one place.
          </p>
        </article>

        {/* Right rail */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 16,
              background: "var(--bg)",
              marginBottom: 14,
            }}
          >
            <div
              className="sc"
              style={{ color: "var(--cobalt)", marginBottom: 8 }}
            >
              Quick links
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                fontSize: 13,
                lineHeight: 1.8,
                color: "var(--fg-2)",
                fontFamily: "var(--sans)",
              }}
            >
              <li>
                <Link
                  href="/for-authors"
                  style={{ color: "var(--cobalt)", textDecoration: "none" }}
                >
                  Submission guidelines →
                </Link>
              </li>
              <li>
                <Link
                  href="/policies"
                  style={{ color: "var(--cobalt)", textDecoration: "none" }}
                >
                  Editorial policies →
                </Link>
              </li>
              <li>
                <Link
                  href="/about/editorial-board"
                  style={{ color: "var(--cobalt)", textDecoration: "none" }}
                >
                  Editorial board →
                </Link>
              </li>
              <li>
                <a
                  href={EDITORIAL_APP_URL}
                  style={{ color: "var(--cobalt)", textDecoration: "none" }}
                >
                  Editorial app →
                </a>
              </li>
            </ul>
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
              style={{ color: "var(--muted)", marginBottom: 8 }}
            >
              Response time
            </div>
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                margin: 0,
              }}
            >
              We aim to respond within five working days. Status updates on
              in-flight submissions are also visible in the editorial app.
            </p>
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
