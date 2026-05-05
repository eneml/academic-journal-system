import Link from "next/link";
import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = {
  title: "About",
  description: "About The Academic Journal — mission, history, scope, and indexing.",
};

export const revalidate = 600;

export default async function AboutPage() {
  return (
    <StaticPage
      activePath="/about"
      eyebrow="About"
      title="A peer-reviewed quarterly since 1987"
      lede={
        <>
          The Academic Journal publishes original research, systematic reviews,
          and methodological contributions in computational science. Open access
          since 1998, we are indexed in Scopus, Web of Science, Google Scholar,
          and the DOAJ.
        </>
      }
      toc={[
        { id: "mission", label: "Our mission" },
        { id: "scope", label: "Scope" },
        { id: "history", label: "Brief history" },
        { id: "indexing", label: "Indexing" },
        { id: "license", label: "License" },
      ]}
    >
      <h2 id="mission">Our mission</h2>
      <p>
        We exist to make computational research more reproducible, more
        comparable across labs, and more accessible — both to readers and to the
        next generation of authors. To that end we maintain a strict
        double-blind peer review process, require code and data deposit for
        every quantitative claim, and publish all accepted articles under an
        open license.
      </p>

      <h2 id="scope">Scope</h2>
      <p>
        We publish across the breadth of computational science: foundations of
        machine learning, methods for empirical reproducibility, theoretical
        statistics, optimisation and numerical methods, programming language
        semantics, and the social context of computing research. Our priority is
        work that pushes the field toward stronger empirical and methodological
        standards — replications and audits are first-class submissions, not an
        afterthought.
      </p>

      <h2 id="history">Brief history</h2>
      <p>
        Founded in 1987 at the University of Bucharest as a quarterly review of
        the then-emerging field of computational research, the journal moved to
        full open access in 1998 — among the earliest in the discipline to do
        so. Volumes 1 through 11 are available in their entirety in our archive,
        and the <Link href="/archive">archive page</Link> includes a full
        publication history.
      </p>

      <h2 id="indexing">Indexing</h2>
      <p>
        The Academic Journal is indexed in Scopus, Web of Science, Google
        Scholar, DOAJ, PubMed Central, EBSCO, Crossref, and DBLP. Article-level
        DOIs are minted at publication and Open Researcher and Contributor IDs
        (ORCID) are required for all corresponding authors.
      </p>

      <h2 id="license">License</h2>
      <p>
        Unless otherwise noted on a specific article, all material is published
        under a Creative Commons Attribution 4.0 International (CC BY 4.0)
        license. Authors retain copyright; the license grants any reader the
        right to share and adapt the work, with attribution.
      </p>
    </StaticPage>
  );
}
