import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "Policies",
  description:
    "Editorial, ethics, peer review, copyright, and privacy policies for The Academic Journal.",
};

export const revalidate = 600;

export default async function PoliciesPage() {
  return (
    <StaticPage
      activePath="/policies"
      eyebrow="Policies"
      title="Editorial, ethics, and licensing policies"
      lede={
        <>
          The journal abides by the principles of the Committee on Publication
          Ethics (COPE) and the recommendations of the International Committee
          of Medical Journal Editors. Each policy below is reviewed annually by
          the senior editorial board.
        </>
      }
      toc={[
        { id: "peer-review", label: "Peer review" },
        { id: "ethics", label: "Ethics" },
        { id: "authorship", label: "Authorship" },
        { id: "conflicts", label: "Conflicts of interest" },
        { id: "data", label: "Data and code" },
        { id: "corrections", label: "Corrections and retractions" },
        { id: "copyright", label: "Copyright" },
        { id: "privacy", label: "Privacy" },
      ]}
    >
      <h2 id="peer-review">Peer review</h2>
      <p>
        We use double-blind peer review for original research, methods, and
        review articles. Editorials and book reviews are subject to editorial
        review only. Each submission receives at least two independent
        reviewers; a third is sought when the first two diverge significantly
        on recommendation.
      </p>

      <h2 id="ethics">Ethics</h2>
      <p>
        Authors are expected to comply with COPE&rsquo;s Core Practices:
        integrity of the work and the publication process, accurate authorship,
        declaration of conflicts of interest, and accountability for the
        published record. Allegations of misconduct trigger COPE&rsquo;s
        standard flowchart.
      </p>

      <h2 id="authorship">Authorship</h2>
      <p>
        Authorship is reserved for those who have made substantial contributions
        to the conception or design of the work; or the acquisition, analysis,
        or interpretation of the data; AND have drafted or revised the
        manuscript critically; AND have approved the final version; AND agree
        to be accountable for the work. Contributors who meet some but not all
        of these criteria are listed in the Acknowledgements.
      </p>

      <h2 id="conflicts">Conflicts of interest</h2>
      <p>
        All authors must declare actual or perceived conflicts of interest at
        submission time, including financial relationships, employment, and
        personal relationships that could be seen to influence the work.
        Reviewers and editors recuse themselves where a conflict exists with
        any author, institution, or topic of the manuscript.
      </p>

      <h2 id="data">Data and code</h2>
      <p>
        Quantitative claims must be supported by deposited code and data. We
        recommend Zenodo and the OSF as the default repositories. Sensitive
        data (e.g., human subjects data) may be deposited in restricted-access
        repositories with a documented access procedure.
      </p>

      <h2 id="corrections">Corrections and retractions</h2>
      <p>
        Errors discovered after publication are addressed through one of three
        instruments: a Correction (for typographical or attribution errors), an
        Erratum (for substantive errors that do not affect conclusions), or a
        Retraction (for errors that invalidate the conclusions). All three are
        linked from the original article through Crossref and never break the
        original DOI.
      </p>

      <h2 id="copyright">Copyright</h2>
      <p>
        Authors retain copyright of their work; articles are licensed to readers
        under CC BY 4.0 unless the article page indicates otherwise. The journal
        retains a non-exclusive perpetual right to archive and distribute the
        work.
      </p>

      <h2 id="privacy">Privacy</h2>
      <p>
        We collect only the personal data needed to operate the journal: author
        and reviewer contact details, and aggregate analytics on article usage.
        We never sell or share personal data with third parties. The full
        privacy policy is available on request.
      </p>
    </StaticPage>
  );
}
