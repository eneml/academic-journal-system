import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronRight, Download, Rss } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Button, CoverArt } from "@ajs/ui";
import {
  fetchActiveSections,
  fetchIssueTableOfContents,
  fetchIssues,
  fetchJournalConfig,
  pickLocale,
  type PublicationSummary,
  type SectionSummary,
} from "@/lib/api";
import { articlePath, coverLabel, issuePath } from "@/lib/format";
import { SectionScrollSpy } from "@/components/SectionScrollSpy";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Current issue",
};

export default async function CurrentIssuePage(): Promise<ReactNode> {
  const [issues, sections, config] = await Promise.all([
    fetchIssues(),
    fetchActiveSections(),
    fetchJournalConfig(),
  ]);

  const issue = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) =>
      (b.datePublished ?? "").localeCompare(a.datePublished ?? ""),
    )[0];
  if (!issue) notFound();

  const locale = config?.defaultLocale ?? "en";
  const toc = (await fetchIssueTableOfContents(issue.id)) ?? [];
  const grouped = groupBySection(toc, sections ?? [], locale);

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/current" />

      <div className="flex flex-wrap items-center gap-1.5 px-6 pt-6 text-[12px] text-muted lg:px-14">
        <span className="font-medium text-fg">Current issue</span>
        <ChevronRight className="h-3 w-3" />
        {issue.volume ? <span>Volume {issue.volume}</span> : null}
        {issue.volume && issue.number ? <ChevronRight className="h-3 w-3" /> : null}
        <span className="font-medium text-fg">
          {issue.number ? `Number ${issue.number}` : "Issue"}
          {issue.datePublished
            ? ` · ${new Date(issue.datePublished).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
            : ""}
        </span>
      </div>

      <section className="grid items-start gap-14 px-6 pt-8 pb-10 lg:grid-cols-[260px_1fr] lg:px-14">
        <div className="flex flex-col items-center">
          <CoverArt
            width={260}
            height={364}
            label={coverLabel(issue.volume, issue.number)}
            year={issue.year ?? ""}
            src={issue.coverImageUrl ?? null}
          />
          <div className="mt-3.5 flex w-full flex-col gap-2">
            <Button asChild className="w-full justify-center">
              <a href="#table-of-contents">
                <Download className="h-4 w-4" /> Table of contents
              </a>
            </Button>
            <Button asChild variant="secondary" size="sm" className="w-full justify-center">
              <a href="/feed.xml">
                <Rss className="h-3 w-3" /> Subscribe
              </a>
            </Button>
          </div>
        </div>

        <div>
          <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
            Current Issue
            {issue.datePublished
              ? ` · ${new Date(issue.datePublished).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
              : ""}
          </div>
          <h1 className="m-0 mb-3.5 font-serif-display text-[clamp(32px,4vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
            {pickLocale(issue.title, locale) ||
              `Volume ${issue.volume ?? "—"}${issue.number ? `, Number ${issue.number}` : ""}`}
          </h1>
          <p className="m-0 mb-5 max-w-[640px] font-serif-body text-[16px] italic leading-[1.65] text-fg-2">
            Peer-reviewed original research, methods, and theory. Open access since
            1998 — no embargo, no article-processing charge.
          </p>
          <div className="flex flex-wrap gap-x-7 gap-y-3 border-t border-border pt-5 text-[12px] text-muted">
            <Stat
              value={String(toc.length)}
              label={toc.length === 1 ? "article" : "articles"}
            />
            <Stat
              value={issue.accessStatus === "OPEN" ? "Open" : "Restricted"}
              label="access"
            />
            <Stat value={String(issue.year ?? "—")} label="year" />
          </div>
          <div className="mt-5">
            <Link
              href={issuePath(issue)}
              className="text-[13px] font-medium text-cobalt hover:text-cobalt-deep no-underline"
            >
              Permalink to this issue →
            </Link>
          </div>
        </div>
      </section>

      <div className="px-6 lg:px-14">
        <div className="border-t-[3px] border-double border-border-strong" />
      </div>

      <section
        id="table-of-contents"
        className="grid gap-14 px-6 pt-9 pb-10 lg:grid-cols-[200px_1fr] lg:px-14"
      >
        <aside className="sticky top-8 self-start">
          <div className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Sections
          </div>
          <SectionScrollSpy
            items={grouped.map((g) => ({
              id: `section-${g.section.code}`,
              label: g.title,
              count: g.items.length,
            }))}
          />
        </aside>

        <div>
          {grouped.length === 0 ? (
            <p className="font-serif-body italic text-muted">
              No articles published in this issue yet.
            </p>
          ) : null}
          {grouped.map((g) => (
            <div
              key={g.section.id}
              id={`section-${g.section.code}`}
              className="mb-10"
            >
              <div className="mb-4 flex items-baseline gap-3">
                <h3 className="m-0 font-serif-display text-[22px] font-medium tracking-[-0.01em]">
                  {g.title}
                </h3>
                <div className="h-px flex-1 bg-border" />
                <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted">
                  {g.items.length}{" "}
                  {g.items.length === 1 ? "article" : "articles"}
                </span>
              </div>
              <ol className="m-0 p-0 list-none">
                {g.items.map((p, i) => (
                  <li
                    key={p.id}
                    className="grid grid-cols-[44px_1fr_110px] items-start gap-4 border-t border-border py-4"
                  >
                    <div className="pt-1 font-serif-display text-[12px] uppercase tracking-[0.04em] text-muted-2">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h4 className="m-0 mb-1 font-serif-display text-[17px] font-medium leading-[1.3]">
                        <Link
                          href={articlePath(p)}
                          className="hover:text-cobalt-deep no-underline text-inherit"
                        >
                          {pickLocale(p.title, locale) || `Article ${p.id}`}
                        </Link>
                      </h4>
                    </div>
                    <div className="flex justify-end gap-2 pt-0.5">
                      <Link
                        href={articlePath(p)}
                        className="text-[12px] text-cobalt hover:underline no-underline"
                      >
                        HTML
                      </Link>
                      <span className="text-border-strong">·</span>
                      <Link
                        href={`${articlePath(p)}#download`}
                        className="text-[12px] text-cobalt hover:underline no-underline"
                      >
                        PDF
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function groupBySection(
  toc: PublicationSummary[],
  sections: SectionSummary[],
  locale: string,
): Array<{
  section: { id: number; code: string };
  title: string;
  items: PublicationSummary[];
}> {
  const grouped = sections
    .map((sec) => ({
      section: { id: sec.id, code: sec.code },
      title: pickLocale(sec.title, locale) || sec.code,
      items: toc.filter((p) => p.sectionId === sec.id),
    }))
    .filter((g) => g.items.length > 0);

  const orphan = toc.filter(
    (p) =>
      p.sectionId === null ||
      p.sectionId === undefined ||
      !sections.some((s) => s.id === p.sectionId),
  );
  if (orphan.length) {
    grouped.push({
      section: { id: -1, code: "uncategorised" },
      title: "Other",
      items: orphan,
    });
  }
  return grouped;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-serif-display text-[22px] font-semibold tabular-nums text-fg">
        {value}
      </div>
      {label}
    </div>
  );
}
