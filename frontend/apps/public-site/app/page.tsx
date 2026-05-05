import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Download, Rss } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CoverArt } from "@/components/CoverArt";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchActiveSections,
  fetchAnnouncements,
  fetchIssueTableOfContents,
  fetchIssues,
  fetchJournalConfig,
  fetchMasthead,
  pickLocale,
  type PublicationSummary,
} from "@/lib/api";
import { articlePath, coverLabel, issueLabel, issuePath } from "@/lib/format";

export const revalidate = 60;

const ISSN = process.env.NEXT_PUBLIC_JOURNAL_ISSN ?? "2069-3417";

export default async function HomePage(): Promise<ReactNode> {
  const [config, issues, sections, masthead, announcements] = await Promise.all(
    [
      fetchJournalConfig(),
      fetchIssues(),
      fetchActiveSections(),
      fetchMasthead(),
      fetchAnnouncements(1),
    ],
  );

  const locale = config?.defaultLocale ?? "en";

  const publishedIssues = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    );
  const issue = publishedIssues[0] ?? null;

  const toc = issue ? ((await fetchIssueTableOfContents(issue.id)) ?? []) : [];
  const announcement = (announcements ?? []).find((a) => a.visible);

  const countsBySection = new Map<number, number>();
  toc.forEach((p) => {
    if (p.sectionId !== null && p.sectionId !== undefined) {
      countsBySection.set(
        p.sectionId,
        (countsBySection.get(p.sectionId) ?? 0) + 1,
      );
    }
  });

  const featured = pickFeatured(toc);
  const sectionsList = sections ?? [];
  const visibleMasthead = (masthead ?? []).filter((m) => m.visible);
  const seniorEditors = visibleMasthead.filter((m) => {
    const role = pickLocale(m.roleLabel, locale).toLowerCase();
    return (
      role.includes("editor-in-chief") ||
      role.startsWith("senior") ||
      role.includes("methods editor") ||
      role.includes("statistics editor") ||
      role.includes("managing editor")
    );
  });
  const totalArticles = toc.length;

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/" />

      {issue ? (
        <section className="px-6 pt-14 pb-10 lg:px-14">
          <div className="grid items-start gap-14 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
                  Current Issue
                </span>
                <span className="h-px w-8 bg-border-strong" />
                <span className="font-mono text-[13px] text-muted">
                  {issueLabel({
                    volume: issue.volume,
                    number: issue.number,
                    year: issue.year,
                    datePublished: issue.datePublished,
                  })}
                </span>
              </div>
              <h2 className="m-0 max-w-[720px] text-balance font-serif-display text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.02em] text-fg">
                {pickLocale(issue.title, locale) || "Current issue"}
              </h2>
              <p className="mt-4 max-w-[620px] font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
                Peer-reviewed original research, methods, and theory. Open access
                since 1998 — no embargo, no article-processing charge.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href={issuePath(issue)}>
                    Read this issue <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={issuePath(issue)}>
                    <Download className="h-4 w-4" /> Table of contents
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <a href="/feed.xml">
                    <Rss className="h-4 w-4" /> Subscribe
                  </a>
                </Button>
              </div>
              <div className="mt-9 flex flex-wrap gap-7 text-[12px] text-muted">
                <Stat
                  value={String(totalArticles)}
                  label={totalArticles === 1 ? "article" : "articles"}
                />
                <Stat
                  value={String(publishedIssues.length)}
                  label="issues published"
                />
                <Stat
                  value={String(visibleMasthead.length)}
                  label="editorial board"
                />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <CoverArt
                width={220}
                height={308}
                label={coverLabel(issue.volume, issue.number)}
                year={issue.year ?? ""}
                src={issue.coverImageUrl ?? null}
              />
              <div className="mt-3.5 font-mono text-[11px] text-muted">
                ISSN {ISSN}
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="px-6 pt-14 pb-10 lg:px-14">
          <div className="max-w-[720px]">
            <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
              Forthcoming
            </div>
            <h1 className="m-0 mb-4 font-serif-display text-[clamp(36px,5vw,56px)] font-medium leading-[1.05] tracking-[-0.02em]">
              The Academic Journal
            </h1>
            <p className="m-0 mb-7 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
              Peer-reviewed original research, methods, and theory. The first
              issue is forthcoming.
            </p>
            <Button asChild>
              <Link href="/archive">
                Browse archive <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <div className="px-6 lg:px-14">
        <div className="border-t-[3px] border-double border-border-strong" />
      </div>

      {issue ? (
        <section className="grid gap-14 px-6 pt-8 lg:grid-cols-[200px_1fr] lg:px-14">
          <aside className="sticky top-8 self-start">
            <div className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              In this issue
            </div>
            <ul className="flex flex-col gap-2 text-[13px] m-0 p-0 list-none">
              {sectionsList.map((s) => {
                const count = countsBySection.get(s.id) ?? 0;
                if (count === 0) return null;
                const title = pickLocale(s.title, locale) || s.code;
                return (
                  <li key={s.id}>
                    <Link
                      href={`${issuePath(issue)}#section-${s.code}`}
                      className="block border-l-2 border-border pl-2.5 text-fg-2 hover:border-amber hover:text-fg no-underline"
                    >
                      {title} ({count})
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="my-5 border-t border-border" />
            <div className="mb-2.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              Filters
            </div>
            <p className="text-[12px] leading-[1.7] text-muted m-0">
              Year · Section · Author
              <br />
              <span className="text-fg-2">Open access only ✓</span>
            </p>
          </aside>

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="m-0 font-serif-display text-[26px] font-medium tracking-[-0.01em]">
                Featured in this issue
              </h3>
              <Link
                href={issuePath(issue)}
                className="text-[12px] font-medium text-cobalt hover:text-cobalt-deep no-underline"
              >
                View full table of contents{" "}
                <ArrowRight className="-mb-px ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            <ol className="flex flex-col m-0 p-0 list-none">
              {featured.length === 0 ? (
                <li className="border-t border-border py-5">
                  <p className="m-0 font-serif-body italic text-muted">
                    The next issue is in production. Featured articles will
                    appear here when the issue lands.
                  </p>
                </li>
              ) : (
                featured.map((p, i) => {
                  const sec = sectionsList.find((s) => s.id === p.sectionId);
                  const sectionTitle =
                    sec ? pickLocale(sec.title, locale) || sec.code : "Article";
                  const abstract = pickLocale(p.abstractText, locale);
                  return (
                    <li
                      key={p.id}
                      className="grid grid-cols-[44px_1fr] gap-5 border-t border-border py-5"
                    >
                      <div className="pt-1 font-serif-display text-[12px] uppercase tracking-[0.04em] text-muted-2">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2.5">
                          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cobalt">
                            {sectionTitle}
                          </span>
                          {p.accessStatus === "OPEN" ? (
                            <Badge variant="mono">OA</Badge>
                          ) : null}
                        </div>
                        <h4 className="m-0 mb-1 font-serif-display text-[22px] font-medium leading-[1.25] tracking-[-0.005em]">
                          <Link
                            href={articlePath(p)}
                            className="hover:text-cobalt-deep no-underline text-inherit"
                          >
                            {pickLocale(p.title, locale) ||
                              `Article ${p.id}`}
                          </Link>
                        </h4>
                        {abstract ? (
                          <p className="m-0 max-w-[640px] font-serif-body text-[14.5px] leading-[1.55] text-fg-2">
                            {truncate(abstract, 240)}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center gap-3.5 text-[11px]">
                          {p.urlPath ? (
                            <span className="font-mono text-[10.5px] text-muted">
                              /{p.urlPath}
                            </span>
                          ) : null}
                          <span className="text-border-strong">·</span>
                          <Link
                            href={articlePath(p)}
                            className="text-cobalt hover:underline no-underline"
                          >
                            HTML
                          </Link>
                          <Link
                            href={`${articlePath(p)}#download`}
                            className="text-cobalt hover:underline no-underline"
                          >
                            PDF
                          </Link>
                          <Link
                            href={`${articlePath(p)}#cite`}
                            className="text-cobalt hover:underline no-underline"
                          >
                            Cite
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ol>
          </div>
        </section>
      ) : null}

      <section className="mt-16 grid gap-px bg-border lg:grid-cols-3">
        <Panel title="Scope">
          <p className="m-0 font-serif-body text-[14.5px] leading-[1.6] text-fg-2">
            We publish original research, systematic reviews, and methodological
            contributions across the journal&rsquo;s active sections. Articles
            are peer-reviewed under a double-anonymous protocol and released
            open access.
          </p>
        </Panel>
        <Panel title="Editorial board">
          {seniorEditors.length === 0 ? (
            <p className="m-0 font-serif-body text-[13px] italic text-muted">
              Editorial board listing coming soon.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5 text-[13px] m-0 p-0 list-none">
              {seniorEditors.slice(0, 4).map((p) => {
                const name = `${p.givenName ?? ""} ${p.familyName ?? ""}`.trim();
                return (
                  <li key={p.id} className="flex items-center gap-2.5">
                    <Avatar name={name || "—"} size={28} />
                    <div>
                      <div className="text-[13px] font-semibold">{name || "—"}</div>
                      <div className="text-[11px] text-muted">
                        {pickLocale(p.roleLabel, locale)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <Link
            href="/editorial"
            className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-cobalt hover:text-cobalt-deep no-underline"
          >
            View full editorial board <ArrowRight className="h-3 w-3" />
          </Link>
        </Panel>
        <Panel title="Indexed in">
          <div className="flex flex-wrap gap-2">
            {[
              "Scopus",
              "Web of Science",
              "Google Scholar",
              "DOAJ",
              "PubMed Central",
              "EBSCO",
              "Crossref",
              "DBLP",
            ].map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </Panel>
      </section>

      {announcement ? (
        <section className="px-6 pt-14 lg:px-14">
          <Link
            href="/announcements"
            className="flex flex-col items-start justify-between gap-5 rounded-md p-7 text-white no-underline sm:flex-row sm:items-center"
            style={{ background: "var(--cobalt-deep)" }}
          >
            <div>
              <div
                className="mb-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "var(--amber)", opacity: 0.9 }}
              >
                Open call
                {announcement.dateExpires
                  ? ` · Due ${new Date(
                      announcement.dateExpires,
                    ).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}`
                  : ""}
              </div>
              <div className="font-serif-display text-[24px] font-medium tracking-[-0.01em]">
                {pickLocale(announcement.title, locale) ||
                  "Special call for papers"}
              </div>
            </div>
            <Button asChild variant="invert" size="lg">
              <span className="inline-flex items-center gap-2">
                Submit a manuscript <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </section>
      ) : null}

      <PublicFooter />
    </div>
  );
}

function pickFeatured(toc: PublicationSummary[]): PublicationSummary[] {
  const seen = new Set<number>();
  const out: PublicationSummary[] = [];
  for (const p of toc) {
    if (p.sectionId === null || p.sectionId === undefined) continue;
    if (seen.has(p.sectionId)) continue;
    seen.add(p.sectionId);
    out.push(p);
    if (out.length === 3) break;
  }
  return out.length ? out : toc.slice(0, 3);
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <span className="mr-1 font-serif-display text-[18px] font-semibold tabular-nums text-fg">
        {value}
      </span>{" "}
      {label}
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-bg p-7 lg:p-8">
      <div className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cobalt">
        {title}
      </div>
      {children}
    </div>
  );
}
