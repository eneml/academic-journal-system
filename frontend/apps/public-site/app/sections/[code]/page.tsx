import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchJournalConfig,
  fetchPublicationsInSection,
  fetchSectionByCode,
  pickLocale,
} from "@/lib/api";

export const revalidate = 60;

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { code } = await params;
  const [section, config] = await Promise.all([
    fetchSectionByCode(code),
    fetchJournalConfig(),
  ]);
  if (!section) return { title: "Section not found" };
  const locale = config?.defaultLocale ?? "en";
  const title = pickLocale(section.title, locale) || section.code;
  return { title };
}

export default async function SectionPage({ params }: Props): Promise<ReactNode> {
  const { code } = await params;
  const [section, config] = await Promise.all([
    fetchSectionByCode(code),
    fetchJournalConfig(),
  ]);
  if (!section || section.inactive) notFound();

  const articles = (await fetchPublicationsInSection(section.id, 50)) ?? [];
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const title = pickLocale(section.title, locale) || section.code;

  return (
    <SiteChrome journalName={journalName}>
      <section className="border-b border-border">
          <div style={{ padding: "56px 56px" }}>
            <p
              className="sc text-cobalt mb-3"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Section
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
              {title}
            </h1>
          </div>
        </section>

        <section>
          <div style={{ padding: "40px 56px", maxWidth: 900 }}>
            {articles.length === 0 ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                No published articles in this section yet.
              </p>
            ) : (
              <ul className="grid grid-cols-1 gap-y-7">
                {articles.map((article) => {
                  const slug = article.urlPath ?? String(article.id);
                  const articleTitle =
                    pickLocale(article.title, locale) || `Article ${article.id}`;
                  const summary = pickLocale(article.abstractText, locale).slice(0, 220);
                  return (
                    <li key={article.id}>
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
                        {articleTitle}
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
                      {article.datePublished ? (
                        <p
                          className="text-muted mt-2"
                          style={{ fontFamily: "var(--mono)", fontSize: 11 }}
                        >
                          {new Date(article.datePublished).toLocaleDateString(locale, {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
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
