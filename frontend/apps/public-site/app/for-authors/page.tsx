import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Download } from "lucide-react";
import { StaticPage } from "@/components/StaticPage";
import { Button } from "@ajs/ui";
import { Badge } from "@ajs/ui";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

export const metadata: Metadata = {
  title: "For Authors",
  description:
    "Submission guidelines, manuscript preparation, peer review timeline, and author charges.",
};

export const revalidate = 600;

export default async function ForAuthorsPage() {
  return (
    <StaticPage
      activePath="/for-authors"
      eyebrow="For Authors"
      title="What you need to submit, and what to expect afterwards"
      lede={
        <>
          We aim to give every submitted manuscript a first editorial decision
          within fourteen days, and a final decision within ninety days of
          submission. The pages below explain the practical mechanics — file
          formats, anonymisation, ethics, and charges.
        </>
      }
      toc={[
        { id: "submit", label: "Submit a manuscript" },
        { id: "scope", label: "Scope and article types" },
        { id: "preparation", label: "Manuscript preparation" },
        { id: "peer-review", label: "Peer review timeline" },
        { id: "charges", label: "Author charges" },
        { id: "open-data", label: "Open data and code" },
      ]}
    >
      <section
        id="submit"
        className="not-prose mb-9 rounded-md border border-border bg-surface p-6"
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="m-0 font-serif-display text-[24px] font-medium tracking-[-0.01em]">
            Submit a manuscript
          </h2>
          <Badge variant="cobalt">Submission portal</Badge>
        </div>
        <p className="m-0 mb-4 font-serif-body text-[15px] leading-[1.6] text-fg-2">
          Submissions are handled through our editorial system. You&rsquo;ll need an
          ORCID iD; the system will collect manuscript files, supplementary
          materials, and conflict-of-interest declarations from each author.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={EDITORIAL_APP_URL} target="_blank" rel="noopener">
              Open submission portal <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/for-authors#preparation">
              <Download className="h-4 w-4" /> Manuscript template
            </Link>
          </Button>
        </div>
      </section>

      <h2 id="scope">Scope and article types</h2>
      <p>
        We accept five article types: <strong>original research</strong>,{" "}
        <strong>systematic review</strong>, <strong>methods</strong>,{" "}
        <strong>letter</strong>, and <strong>book review</strong>. Replications
        and methodological audits are explicitly within scope and are reviewed
        on the same footing as novel work — see our peer-review policy for
        details.
      </p>

      <h2 id="preparation">Manuscript preparation</h2>
      <ul>
        <li>Submit a single PDF anonymised for double-blind review.</li>
        <li>
          Use our LaTeX or Word template (link above). Keep the body under
          12,000 words including footnotes; supplementary material is unlimited
          in length but should be self-contained.
        </li>
        <li>
          Tables and figures must be embedded inline. Vector formats (PDF, SVG)
          are strongly preferred for figures.
        </li>
        <li>
          References must use the journal&rsquo;s house style — APA-7 with DOIs,
          where available — exported from any standard manager (BibTeX, RIS,
          EndNote).
        </li>
      </ul>

      <h2 id="peer-review">Peer review timeline</h2>
      <p>
        Our SLA: a first editorial triage decision within 14 days, and a
        complete first decision (with reviewer reports) within 90 days of
        submission. Median time from submission to publication, excluding
        author revision time, is 118 days as of the most recent annual report.
      </p>

      <h2 id="charges">Author charges</h2>
      <p>
        We do not charge submission, processing, or publication fees. The
        journal is fully funded by its sponsoring institutions; there is no
        article processing charge for authors.
      </p>

      <h2 id="open-data">Open data and code</h2>
      <p>
        Quantitative claims must be accompanied by deposited code and data,
        either in our preferred repositories (Zenodo, OSF) or in a similarly
        long-lived archive. Reviewers receive an anonymous link; the public DOI
        is minted at acceptance. See the{" "}
        <Link href="/policies">policies page</Link> for the full list of
        acceptable repositories and the embargo policy for sensitive data.
      </p>
    </StaticPage>
  );
}
