import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { fetchJournalConfig, pickLocale } from "@/lib/api";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Policies",
  description: "Peer review, ethics, open access, copyright, and archiving.",
};

export default async function PoliciesPage(): Promise<ReactNode> {
  const config = await fetchJournalConfig();
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";

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
          About
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
          Policies
        </h1>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Peer review</h2>
        <p style={paragraphStyle}>
          Submissions undergo <strong style={{ color: "var(--fg)" }}>double-anonymous peer review</strong>.
          Manuscripts are screened by an editor for fit and basic quality, then sent to two
          independent reviewers selected for relevant expertise. Authors and reviewers do
          not know each other&rsquo;s identities.
        </p>
        <p style={paragraphStyle}>
          Typical review timeline: editorial triage in 1–2 weeks, external review in 8–12
          weeks, decision shortly after. Authors receive the full reviewer reports along
          with the editor&rsquo;s decision.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Open access</h2>
        <p style={paragraphStyle}>
          Every accepted article is published open access — readers pay nothing, authors
          pay nothing. Articles are released under a Creative Commons licence
          (CC&nbsp;BY&nbsp;4.0 by default; CC&nbsp;BY-NC, CC&nbsp;BY-SA, or CC0 also
          available at the author&rsquo;s request) chosen during production.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Copyright</h2>
        <p style={paragraphStyle}>
          Authors retain copyright of their work. By publishing with us, authors grant the
          journal a non-exclusive licence to publish, distribute, and archive the work
          under the chosen Creative Commons licence. Authors may post pre-prints, working
          versions, and the final article on personal, institutional, or subject-based
          repositories at any time.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Publication ethics</h2>
        <p style={paragraphStyle}>
          We follow the principles of the Committee on Publication Ethics (COPE).
          Manuscripts must be the original work of the listed authors. Plagiarism,
          fabricated data, and undeclared conflicts of interest are grounds for rejection
          or post-publication retraction.
        </p>
        <ul style={listStyle}>
          <li>Authors disclose all funding sources and competing interests at submission.</li>
          <li>Reviewers decline assignments where they have a conflict of interest.</li>
          <li>Editors recuse themselves from manuscripts where they are a co-author or have a personal relationship with the authors.</li>
          <li>Allegations of misconduct are handled following COPE flowcharts; the corresponding author is given the chance to respond before any public action.</li>
        </ul>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Authorship</h2>
        <p style={paragraphStyle}>
          The author byline lists everyone who made a substantial contribution to the
          conception, design, execution, or interpretation of the work. Acknowledgements
          recognise contributors who don&rsquo;t meet the authorship criteria. Contributor
          changes after acceptance require a written justification countersigned by all
          listed authors.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Archiving &amp; preservation</h2>
        <p style={paragraphStyle}>
          Published articles are deposited with{" "}
          <a
            href="https://www.crossref.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cobalt"
          >
            CrossRef
          </a>{" "}
          for DOI registration and metadata interchange. The full corpus is harvested by
          academic indexers (CLOCKSS, LOCKSS, PKP&nbsp;PN where applicable) so that
          articles remain accessible even if the journal&rsquo;s hosting changes.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Corrections &amp; retractions</h2>
        <p style={paragraphStyle}>
          Articles are immutable once published; corrections appear as a new version
          (v2, v3, …) on the same article page so the version history is clear to
          readers and citation tools. Retractions are issued only for findings of
          serious error or misconduct and the original article is preserved with a
          clearly visible retraction notice.
        </p>

        <h2 className="text-fg mt-10 mb-3" style={h2Style}>Privacy</h2>
        <p style={paragraphStyle}>
          We collect only the data needed to run the editorial process: names, email
          addresses, ORCID iDs, manuscripts, and reviewer reports. We do not sell or
          share author or reviewer information with third parties. Authentication uses
          your institutional or ORCID account through the journal&rsquo;s identity provider.
        </p>
      </article>
    </SiteChrome>
  );
}

const h2Style = {
  fontFamily: "var(--serif-display)",
  fontWeight: 600,
  fontSize: 22,
  lineHeight: 1.25,
};

const paragraphStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: "var(--fg-2)",
  marginBottom: 14,
  fontFamily: "var(--serif-body)",
};

const listStyle: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.7,
  color: "var(--fg-2)",
  paddingLeft: 18,
  marginBottom: 14,
};
