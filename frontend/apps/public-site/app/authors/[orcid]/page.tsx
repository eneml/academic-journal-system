import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchAuthorByOrcid,
  fetchJournalConfig,
  pickLocale,
} from "@/lib/api";

export const revalidate = 300;

type Props = { params: Promise<{ orcid: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { orcid } = await params;
  const author = await fetchAuthorByOrcid(decodeURIComponent(orcid));
  if (!author) return { title: "Author not found" };
  const name = [author.givenName, author.familyName].filter(Boolean).join(" ").trim();
  return {
    title: name || "Author",
    description: author.affiliation ?? undefined,
  };
}

export default async function AuthorProfilePage({ params }: Props): Promise<ReactNode> {
  const { orcid } = await params;
  const decoded = decodeURIComponent(orcid);
  const [author, config] = await Promise.all([
    fetchAuthorByOrcid(decoded),
    fetchJournalConfig(),
  ]);
  if (!author) notFound();

  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const fullName = [author.givenName, author.familyName].filter(Boolean).join(" ").trim();
  const orcidShort = author.orcidUrl.replace(/^https?:\/\/orcid\.org\//, "");

  return (
    <SiteChrome journalName={journalName}>
      <section className="border-b border-border">
        <div style={{ padding: "48px var(--page-gutter)", maxWidth: 900 }}>
          <p
            className="sc text-cobalt mb-3"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Author profile
          </p>
          <h1
            className="text-fg"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {fullName || `Author ${orcidShort}`}
          </h1>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            <a
              href={author.orcidUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cobalt"
              style={{ textDecoration: "none" }}
            >
              ORCID: {orcidShort}
            </a>
            {author.affiliation ? <span>{author.affiliation}</span> : null}
            <span>
              {author.worksCount} published article{author.worksCount === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      </section>

      <section>
        <div style={{ padding: "48px var(--page-gutter)", maxWidth: 900 }}>
          {author.works.length === 0 ? (
            <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
              No published articles in this journal yet.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-y-7">
              {author.works.map((w) => {
                const slug = w.urlPath ?? String(w.id);
                const title = pickLocale(w.title, locale) || `Article ${w.id}`;
                const summary = pickLocale(w.abstractText, locale).slice(0, 220);
                return (
                  <li key={w.id}>
                    <Link
                      href={`/articles/${encodeURIComponent(slug)}`}
                      className="text-fg hover:text-cobalt"
                      style={{
                        fontFamily: "var(--serif-display)",
                        fontWeight: 600,
                        fontSize: 22,
                        lineHeight: 1.25,
                        display: "inline-block",
                      }}
                    >
                      {title}
                    </Link>
                    {summary ? (
                      <p
                        className="text-fg-2 mt-2"
                        style={{
                          fontFamily: "var(--serif-body)",
                          fontSize: 15,
                          lineHeight: 1.55,
                        }}
                      >
                        {summary}
                        {summary.length === 220 ? "…" : ""}
                      </p>
                    ) : null}
                    {w.datePublished ? (
                      <p
                        className="text-muted mt-2"
                        style={{ fontFamily: "var(--mono)", fontSize: 11 }}
                      >
                        {new Date(w.datePublished).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                        {w.version > 1 ? ` · v${w.version}` : ""}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </SiteChrome>
  );
}
