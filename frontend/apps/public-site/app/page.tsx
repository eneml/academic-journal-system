import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, Download, Quote, Rss } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Avatar } from "@/components/Avatar";
import { Button, CoverArt, Fleuron } from "@ajs/ui";
import {
  fetchActiveSections,
  fetchAnnouncements,
  fetchIssueTableOfContents,
  fetchIssues,
  fetchJournalConfig,
  fetchMasthead,
  fetchPublicationMetricsBatch,
  pickLocale,
  type PublicationMetrics,
  type PublicationSummary,
} from "@/lib/api";
import { articlePath, coverLabel, issueLabel, issuePath, truncate } from "@/lib/format";

export const revalidate = 60;

const ROMAN_NUMS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const NUMBER = new Intl.NumberFormat("en-US");
const ISSN = process.env.NEXT_PUBLIC_JOURNAL_ISSN ?? null;

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
      countsBySection.set(p.sectionId, (countsBySection.get(p.sectionId) ?? 0) + 1);
    }
  });

  const featured = pickFeatured(toc);
  const sectionsList = sections ?? [];
  const featuredMetrics = await fetchPublicationMetricsBatch(featured.map((p) => p.id));
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
  const totalAuthors = countDistinctAuthors(toc);

  return (
    <div className="paper min-h-screen bg-bg">
      <PublicHeader activePath="/" />

      {issue ? (
        <Hero
          issue={issue}
          totalArticles={totalArticles}
          totalAuthors={totalAuthors}
          totalIssues={publishedIssues.length}
          totalEditors={visibleMasthead.length}
          locale={locale}
          issn={ISSN}
        />
      ) : (
        <ForthcomingHero />
      )}

      <div className="px-6 lg:px-14">
        <div className="triple-rule" />
      </div>

      {issue ? (
        <FeaturedSection
          issue={issue}
          featured={featured}
          sectionsList={sectionsList}
          countsBySection={countsBySection}
          featuredMetrics={featuredMetrics}
          locale={locale}
        />
      ) : null}

      <Fleuron className="mx-6 mt-16 mb-8 lg:mx-14" />

      <section className="px-6 lg:px-14">
        <div className="mx-auto grid max-w-[1280px] gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-3">
          <Panel title="Scope">
            <p className="m-0 font-serif-body text-[15px] leading-[1.6] text-fg-2">
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
              <ul className="m-0 flex flex-col gap-2.5 p-0 text-[13px] list-none">
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
              className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-cobalt no-underline hover:text-cobalt-deep"
            >
              View full editorial board <ArrowRight className="h-3 w-3" />
            </Link>
          </Panel>
          <Panel title="Indexed in">
            {/* TODO(phase-F): wire to indexing_membership table (V128). */}
            <p className="m-0 font-serif-body text-[13px] italic text-muted">
              Indexing details coming soon.
            </p>
          </Panel>
        </div>
      </section>

      {announcement ? (
        <section className="mt-14 px-6 lg:px-14">
          <OpenCallCard
            title={pickLocale(announcement.title, locale) || "Special call for papers"}
            body={pickLocale(announcement.body, locale)}
            dueAt={announcement.dateExpires}
            ctaLabel="Submit a manuscript"
            ctaHref="/for-authors"
            locale={locale}
          />
        </section>
      ) : null}

      <PublicFooter />
    </div>
  );
}

// ----------------------------------------------------------------------------
// Hero
// ----------------------------------------------------------------------------

function Hero({
  issue,
  totalArticles,
  totalAuthors,
  totalIssues,
  totalEditors,
  locale,
  issn,
}: {
  issue: NonNullable<Awaited<ReturnType<typeof fetchIssues>>>[number];
  totalArticles: number;
  totalAuthors: number;
  totalIssues: number;
  totalEditors: number;
  locale: string;
  issn: string | null;
}) {
  return (
    <section className="relative px-6 pt-14 pb-12 lg:px-14">
      <div className="grid items-start gap-14 lg:grid-cols-[1fr_320px]">
        <div className="pt-2">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-sans text-[12px] font-medium uppercase tracking-[0.18em] text-amber-deep">
              Current Issue
            </span>
            <span className="h-px w-8 bg-amber" />
            <span className="cite-pill bg-transparent">
              {issueLabel({
                volume: issue.volume,
                number: issue.number,
                year: issue.year,
                datePublished: issue.datePublished,
              })}
            </span>
          </div>

          <h2 className="m-0 max-w-[760px] text-balance font-serif-display text-[clamp(40px,5.5vw,64px)] font-medium leading-[1.02] tracking-[-0.025em] text-ink">
            {pickLocale(issue.title, locale) || "Current issue"}
          </h2>

          <p className="mt-4 max-w-[640px] font-serif-body text-[19px] italic font-normal leading-[1.55] text-fg-2">
            <span className="lnum tnum font-medium not-italic text-ink">
              {totalArticles}
            </span>{" "}
            article{totalArticles === 1 ? "" : "s"} across{" "}
            <span className="lnum tnum font-medium not-italic text-ink">
              {totalIssues}
            </span>{" "}
            published issue{totalIssues === 1 ? "" : "s"}, with contributions from{" "}
            <span className="lnum tnum font-medium not-italic text-ink">
              {totalAuthors}
            </span>{" "}
            authors.
          </p>

          <div className="mt-1 flex items-center gap-2 font-serif-body text-[13px] italic text-muted">
            <Quote className="h-3 w-3 text-amber-deep" />
            Edited by the standing board of{" "}
            <span className="not-italic font-mono text-fg-2">
              {NUMBER.format(totalEditors)}
            </span>{" "}
            editor{totalEditors === 1 ? "" : "s"}
          </div>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button asChild size="lg">
              <Link href={issuePath(issue)}>
                Read this issue <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href={issuePath(issue)}>
                <Download className="h-4 w-4" /> Table of contents
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="/feed.xml">
                <Rss className="h-4 w-4" /> Subscribe
              </a>
            </Button>
          </div>

          <div className="mt-10 grid gap-6 border-t border-border-strong pt-6 sm:grid-cols-4">
            <BigStat n={String(totalArticles)} label={`article${totalArticles === 1 ? "" : "s"} in issue`} />
            <BigStat n={String(issue.year ?? "—")} label="year" />
            <BigStat n={String(totalAuthors)} label={`author${totalAuthors === 1 ? "" : "s"}`} />
            <BigStat n={String(totalIssues)} label="issues to date" />
          </div>
        </div>

        <div className="flex flex-col items-center pt-6">
          <div className="relative">
            <div
              className="absolute left-[-16px] top-3 h-[336px] w-[240px] rounded-[1px] opacity-60 shadow-cover"
              style={{
                background: "oklch(85% 0.05 60)",
                transform: "rotate(-2.5deg)",
              }}
              aria-hidden
            />
            <div
              className="absolute left-[-8px] top-1.5 h-[340px] w-[244px] rounded-[1px] opacity-75 shadow-cover"
              style={{
                background: "oklch(80% 0.10 250)",
                transform: "rotate(-1.2deg)",
              }}
              aria-hidden
            />
            <div className="relative shadow-cover" style={{ transform: "rotate(0.4deg)" }}>
              <CoverArt
                width={248}
                height={348}
                label={coverLabel(issue.volume, issue.number)}
                year={issue.year ?? ""}
                src={issue.coverImageUrl ?? null}
              />
            </div>
          </div>
          <div className="mt-5 text-center font-mono text-[11px] leading-[1.7] tracking-[0.06em] text-muted">
            {issn ? <>ISSN {issn}</> : null}
          </div>
          <div className="mt-3.5 inline-flex items-center gap-2 rounded-md border border-cobalt/20 bg-cobalt-tint px-3.5 py-2 text-[11px] font-medium text-cobalt-deep">
            <BookOpen className="h-3.5 w-3.5" /> HTML · PDF · JATS
          </div>
        </div>
      </div>
    </section>
  );
}

function ForthcomingHero() {
  return (
    <section className="px-6 pt-14 pb-12 lg:px-14">
      <div className="max-w-[720px]">
        <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-amber-deep">
          Forthcoming
        </div>
        <h1 className="m-0 mb-4 font-serif-display text-[clamp(40px,5.5vw,64px)] font-medium leading-[1.02] tracking-[-0.025em] text-ink">
          The Academic Journal
        </h1>
        <p className="m-0 mb-7 font-serif-body text-[19px] italic leading-[1.55] text-fg-2">
          Peer-reviewed original research, methods, and theory. The first issue
          is forthcoming.
        </p>
        <Button asChild>
          <Link href="/archive">
            Browse archive <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function BigStat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="lnum tnum font-serif-display text-[36px] font-medium leading-none tracking-[-0.02em] text-ink">
        {n}
      </div>
      <div className="mt-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.14em] text-cobalt">
        {label}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Featured section
// ----------------------------------------------------------------------------

function FeaturedSection({
  issue,
  featured,
  sectionsList,
  countsBySection,
  featuredMetrics,
  locale,
}: {
  issue: NonNullable<Awaited<ReturnType<typeof fetchIssues>>>[number];
  featured: PublicationSummary[];
  sectionsList: NonNullable<Awaited<ReturnType<typeof fetchActiveSections>>>;
  countsBySection: Map<number, number>;
  featuredMetrics: Map<number, PublicationMetrics>;
  locale: string;
}) {
  return (
    <section className="grid gap-14 px-6 pt-11 lg:grid-cols-[220px_1fr] lg:px-14">
      <aside className="sticky top-8 self-start">
        <div className="sc mb-4 text-muted">In this issue</div>
        <ul className="m-0 flex flex-col gap-px p-0 text-[13px] list-none">
          {sectionsList.map((s) => {
            const count = countsBySection.get(s.id) ?? 0;
            if (count === 0) return null;
            const title = pickLocale(s.title, locale) || s.code;
            return (
              <li key={s.id}>
                <Link
                  href={`${issuePath(issue)}#section-${s.code}`}
                  className="flex items-baseline justify-between border-l-2 border-border py-1.5 pl-3 text-fg-2 no-underline transition-colors hover:border-amber hover:text-fg"
                >
                  <span>{title}</span>
                  <span className="lnum tnum font-mono text-[11px] text-muted-2">
                    {count.toString().padStart(2, "0")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <h3 className="m-0 font-serif-display text-[32px] font-medium tracking-[-0.018em] text-ink">
              Featured in this issue
            </h3>
            <div className="mt-1 font-serif-body text-[14px] italic text-muted">
              Selected from the table of contents
            </div>
          </div>
          <Link
            href={issuePath(issue)}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-cobalt no-underline hover:text-cobalt-deep"
          >
            Full table of contents <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <ol className="m-0 flex flex-col p-0 list-none">
          {featured.length === 0 ? (
            <li className="border-t border-border py-6">
              <p className="m-0 font-serif-body italic text-muted">
                Featured articles will appear here as the issue lands.
              </p>
            </li>
          ) : (
            featured.map((p, i) => (
              <FeaturedRow
                key={p.id}
                article={p}
                index={i}
                first={i === 0}
                section={sectionsList.find((s) => s.id === p.sectionId)}
                metrics={featuredMetrics.get(p.id)}
                locale={locale}
              />
            ))
          )}
        </ol>
      </div>
    </section>
  );
}

function FeaturedRow({
  article,
  index,
  first,
  section,
  metrics,
  locale,
}: {
  article: PublicationSummary;
  index: number;
  first: boolean;
  section: NonNullable<Awaited<ReturnType<typeof fetchActiveSections>>>[number] | undefined;
  metrics: PublicationMetrics | undefined;
  locale: string;
}) {
  const sectionTitle = section ? pickLocale(section.title, locale) || section.code : "Article";
  const abstract = pickLocale(article.abstractText, locale);
  const numeral = ROMAN_NUMS[index] ?? String(index + 1);
  return (
    <li
      className={`toc-row grid gap-6 py-7 lg:grid-cols-[60px_1fr_160px] ${
        first ? "border-t border-border-ink" : "border-t border-border"
      }`}
    >
      <div className="pt-1.5">
        <div className="numeral italic text-[28px] leading-none">{numeral}</div>
      </div>
      <div>
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="sc text-cobalt">{sectionTitle}</span>
          {article.accessStatus === "OPEN" ? (
            <span className="oa-badge">OA</span>
          ) : null}
          {article.urlPath ? (
            <>
              <span className="h-3 w-px bg-border" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.04em] text-muted-2">
                /{article.urlPath}
              </span>
            </>
          ) : null}
        </div>
        <h4 className="m-0 mb-2.5 font-serif-display text-[24px] font-medium leading-[1.22] tracking-[-0.012em] text-ink">
          <Link
            href={articlePath(article)}
            className="text-inherit no-underline hover:text-cobalt-deep"
          >
            {pickLocale(article.title, locale) || `Article ${article.id}`}
          </Link>
        </h4>
        {abstract ? (
          <p className="m-0 max-w-[640px] font-serif-body text-[15px] leading-[1.6] text-fg-2">
            {truncate(abstract, 260)}
          </p>
        ) : null}
        <div className="mt-3.5 flex items-center gap-3.5 text-[11px]">
          <Link
            href={articlePath(article)}
            className="inline-flex items-center gap-1 text-[12px] font-semibold text-cobalt-deep no-underline"
          >
            Read article <ArrowRight className="h-3 w-3" />
          </Link>
          <span className="text-border-strong">·</span>
          <Link
            href={articlePath(article)}
            className="text-[11.5px] text-cobalt no-underline hover:underline"
          >
            HTML
          </Link>
          <Link
            href={`${articlePath(article)}#download`}
            className="text-[11.5px] text-cobalt no-underline hover:underline"
          >
            PDF
          </Link>
          <Link
            href={`${articlePath(article)}#cite`}
            className="text-[11.5px] text-cobalt no-underline hover:underline"
          >
            Cite
          </Link>
        </div>
      </div>
      <FeaturedRailMetrics metrics={metrics} />
    </li>
  );
}

function FeaturedRailMetrics({ metrics }: { metrics: PublicationMetrics | undefined }) {
  if (!metrics) {
    return <div className="hidden lg:block" aria-hidden />;
  }
  return (
    <div className="hidden flex-col gap-3 border-l border-border pl-4 pt-1.5 lg:flex">
      <div>
        <div className="lnum tnum font-serif-display text-[26px] font-medium leading-none tracking-[-0.01em] text-ink">
          {NUMBER.format(metrics.viewCount)}
        </div>
        <div className="sc mt-1 text-muted text-[9.5px]">views · cumulative</div>
      </div>
      {metrics.downloadCount > 0 ? (
        <div className="grid grid-cols-1 gap-1.5 border-t border-border pt-2.5">
          <div>
            <div className="lnum tnum font-serif-display text-[17px] font-medium text-cobalt-deep">
              {NUMBER.format(metrics.downloadCount)}
            </div>
            <div className="sc text-muted text-[9px]">downloads</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Open Call card (ink-bg)
// ----------------------------------------------------------------------------

function OpenCallCard({
  title,
  body,
  dueAt,
  ctaLabel,
  ctaHref,
  locale,
}: {
  title: string;
  body: string | null;
  dueAt: string | null;
  ctaLabel: string;
  ctaHref: string;
  locale: string;
}) {
  const dueLabel = dueAt
    ? new Date(dueAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  const daysRemaining = dueAt ? daysUntil(dueAt) : null;
  return (
    <div className="ink-bg grid items-center gap-8 rounded-lg p-9 shadow-cover lg:grid-cols-[1fr_auto]">
      <div>
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className="sc text-amber" style={{ letterSpacing: "0.18em" }}>
            Open Call
          </span>
          <span className="h-px w-6 bg-[oklch(50%_0.05_270)]" />
          {dueLabel ? (
            <span className="font-mono text-[11px] tracking-[0.06em] text-[oklch(80%_0.02_270)]">
              {`Due ${dueLabel.toUpperCase()}`}
              {daysRemaining != null && daysRemaining > 0
                ? ` · ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining`
                : ""}
            </span>
          ) : null}
        </div>
        <div className="font-serif-display text-[28px] font-medium leading-[1.12] tracking-[-0.018em] text-white">
          {title}
        </div>
        {body ? (
          <p className="m-0 mt-2 max-w-[600px] font-serif-body text-[14px] italic leading-[1.55] text-[oklch(80%_0.02_270)]">
            {truncate(body, 220)}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col items-end gap-2.5">
        <Button asChild variant="amber" size="lg">
          <Link href={ctaHref}>
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Link
          href="/announcements"
          className="text-[12px] text-[oklch(80%_0.02_270)] underline decoration-[oklch(50%_0.05_270)] underline-offset-[3px] hover:decoration-amber"
        >
          Read the full call →
        </Link>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

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

function countDistinctAuthors(toc: PublicationSummary[]): number {
  // Heuristic: not exposed on PublicationSummary today. Until per-issue
  // author aggregation is wired, fall back to article count as an upper
  // bound proxy. Replace once the issue endpoint exposes a real total.
  return toc.length;
}

function daysUntil(iso: string): number | null {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  const now = Date.now();
  return Math.max(0, Math.ceil((t - now) / 86_400_000));
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-paper p-7 lg:p-8">
      <div className="sc mb-3.5 text-cobalt">{title}</div>
      {children}
    </div>
  );
}
