import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { CoverArt } from "@/components/CoverArt";
import { Badge } from "@/components/ui/badge";
import {
  fetchIssues,
  fetchJournalConfig,
  pickLocale,
  type IssueSummary,
} from "@/lib/api";
import { coverLabel, formatDate, issuePath } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Archive",
  description:
    "Every issue of The Academic Journal — full open-access archive grouped by year.",
};

export default async function ArchivePage(): Promise<ReactNode> {
  const [issues, config] = await Promise.all([
    fetchIssues(),
    fetchJournalConfig(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const published = (issues ?? [])
    .filter((i) => i.published)
    .sort((a, b) => {
      const ay = a.year ?? 0;
      const by = b.year ?? 0;
      if (by !== ay) return by - ay;
      return (b.datePublished ?? "").localeCompare(a.datePublished ?? "");
    });

  const byYear = new Map<number, IssueSummary[]>();
  for (const issue of published) {
    const y = issue.year ?? 0;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(issue);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/archive" />

      <section className="mx-auto max-w-[760px] px-6 pt-12 pb-6 text-center lg:px-14">
        <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
          Archive
        </div>
        <h1 className="m-0 mb-3 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
          Every issue, every article
        </h1>
        <p className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
          Browse {published.length}{" "}
          {published.length === 1 ? "issue" : "issues"} of The Academic Journal —
          from the inaugural Volume 1 (1987) through the current quarterly.
          Every published article is open access under CC BY 4.0.
        </p>
      </section>

      <section className="px-6 pt-6 pb-10 lg:px-14">
        {years.length === 0 ? (
          <p className="text-center font-serif-body italic text-muted">
            No issues have been published yet.
          </p>
        ) : null}

        {years.map((year) => {
          const list = byYear.get(year)!;
          return (
            <div key={year} className="mb-12">
              <div className="mb-5 flex items-baseline gap-4">
                <h2 className="m-0 font-serif-display text-[28px] font-medium tracking-[-0.01em]">
                  {year || "Undated"}
                </h2>
                <div className="h-px flex-1 bg-border" />
                <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted">
                  {list.length} {list.length === 1 ? "issue" : "issues"}
                </span>
              </div>
              <ul className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4 m-0 p-0 list-none">
                {list.map((issue, i) => (
                  <li key={issue.id} className="flex flex-col">
                    <Link href={issuePath(issue)} className="group no-underline">
                      <CoverArt
                        width={180}
                        height={252}
                        label={coverLabel(issue.volume, issue.number)}
                        year={issue.year ?? ""}
                        src={issue.coverImageUrl ?? null}
                        className="mx-auto transition-transform duration-200 group-hover:-translate-y-1"
                      />
                    </Link>
                    <div className="mt-3 flex items-center gap-1.5">
                      <Link
                        href={issuePath(issue)}
                        className="font-serif-display text-[15px] font-medium hover:text-cobalt-deep no-underline text-inherit"
                      >
                        {issue.volume ? `Vol. ${issue.volume}` : ""}
                        {issue.volume && issue.number ? " · " : ""}
                        {issue.number ? `No. ${issue.number}` : ""}
                      </Link>
                      {year === years[0] && i === 0 ? (
                        <Badge variant="amber">Current</Badge>
                      ) : null}
                    </div>
                    <div className="font-mono text-[12px] text-muted">
                      {formatDate(issue.datePublished)}
                    </div>
                    {pickLocale(issue.title, locale) ? (
                      <p className="mt-1.5 m-0 font-serif-body text-[13.5px] italic leading-[1.45] text-fg-2 line-clamp-3">
                        {pickLocale(issue.title, locale)}
                      </p>
                    ) : null}
                    <Link
                      href={issuePath(issue)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-cobalt hover:text-cobalt-deep no-underline"
                    >
                      Table of contents <ArrowRight className="h-3 w-3" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <PublicFooter />
    </div>
  );
}
