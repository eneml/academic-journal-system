import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { DoiChip } from "@ajs/ui";
import {
  fetchArticle,
  fetchPublicationMetrics,
  pickLocale,
} from "@/lib/api";
import { articlePath, formatDate } from "@/lib/format";

export const revalidate = 120;

const NUM = new Intl.NumberFormat("en-US");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: "Article not found" };
  const title = pickLocale(article.title, article.locale) || "Untitled";
  return {
    title: `${title} — statistics`,
    description: `Reading and citation metrics for "${title}".`,
  };
}

export default async function ArticleStatsPage({
  params,
}: Props): Promise<ReactNode> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const metrics = await fetchPublicationMetrics(article.id);
  const locale = article.locale ?? "en";
  const title = pickLocale(article.title, locale) || "Untitled";

  const daysOnline = article.datePublished
    ? Math.max(0, Math.round((Date.now() - Date.parse(article.datePublished)) / 86_400_000))
    : null;

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/archive" />

      <div className="flex flex-wrap items-center gap-1.5 px-6 pt-6 text-[12px] text-muted lg:px-14">
        <Link href="/archive" className="hover:text-fg no-underline text-inherit">
          Articles
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={articlePath(article)} className="hover:text-fg no-underline text-inherit truncate max-w-[280px]">
          {title}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-fg">Statistics</span>
      </div>

      <section className="px-6 pt-8 pb-6 lg:px-14">
        <div className="sc mb-2 text-amber-deep">Article statistics · live data</div>
        <h1 className="m-0 mb-1.5 max-w-[920px] font-serif-display text-[clamp(28px,4vw,40px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
          {title}
        </h1>
        <div className="mb-3 font-serif-body text-[14px] italic text-muted">
          {(article.authors ?? [])
            .map((a) => [a.givenName, a.familyName].filter(Boolean).join(" "))
            .join(", ")}
          {article.datePublished
            ? ` · Published ${formatDate(article.datePublished)}`
            : ""}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {article.doi ? <DoiChip doi={article.doi} /> : null}
          {article.accessStatus === "OPEN" ? (
            <span className="oa-badge">Open Access</span>
          ) : null}
          {daysOnline != null ? (
            <span className="cite-pill">
              {daysOnline} {daysOnline === 1 ? "day" : "days"} online
            </span>
          ) : null}
        </div>
      </section>

      <div className="px-6 lg:px-14">
        <div className="rule" />
      </div>

      <section className="px-6 pt-8 lg:px-14">
        <div className="grid gap-3 mb-7 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Total views" value={NUM.format(metrics?.viewCount ?? 0)} accent="var(--cobalt)" />
          <Kpi label="PDF downloads" value={NUM.format(metrics?.downloadCount ?? 0)} accent="var(--amber-deep)" />
          <Kpi label="Citations" value="—" hint="See Crossref" accent="var(--success)" />
          <Kpi label="Last activity" value={metrics?.lastViewedAt ? formatRelative(metrics.lastViewedAt) : "—"} accent="oklch(55% 0.16 320)" />
        </div>

        <div className="rounded-md border border-border bg-bg p-6">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="sc text-muted">Activity over time</div>
              <h3 className="m-0 mt-0.5 font-serif-display text-[22px] font-medium tracking-[-0.01em] text-ink">
                Views &amp; downloads
              </h3>
            </div>
          </div>
          <Empty
            heading="Detailed timeseries not yet available"
            body="The per-article 12-month chart wires up after the publication metrics timeseries endpoint lands. The cumulative totals above always reflect live data."
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-md border border-border bg-bg p-5">
            <div className="sc text-muted">Readers · top countries</div>
            <Empty
              heading="Geographic breakdown not yet available"
              body="Once a privacy-preserving analytics provider is wired, this card lists the top reading regions with proportional bars."
            />
          </div>
          <div className="rounded-md border border-border bg-bg p-5">
            <div className="sc text-muted">Discovery sources</div>
            <Empty
              heading="Discovery breakdown not yet available"
              body="Inbound source attribution (Google Scholar, direct, social) appears here once analytics ingestion is wired."
            />
          </div>
        </div>

        <div className="mt-6 rounded-md border border-border bg-bg p-5 mb-12">
          <div className="sc text-muted">Cited by</div>
          <Empty
            heading="No citations recorded yet"
            body="Crossref-tracked citations will populate this list as they accrue. Add your DOI to a published article for inclusion."
          />
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-bg p-4">
      <div className="sc text-muted">{label}</div>
      <div
        className="lnum tnum mt-1.5 font-serif-display text-[30px] font-medium leading-none tracking-[-0.02em]"
        style={{ color: accent }}
      >
        {value}
      </div>
      {hint ? <div className="mt-1.5 font-mono text-[10.5px] text-muted">{hint}</div> : null}
    </div>
  );
}

function Empty({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="mt-3 rounded-[4px] border border-dashed border-border-strong bg-bg-tint p-6 text-center">
      <p className="m-0 font-serif-body text-[14px] font-semibold italic text-fg-2">
        {heading}
      </p>
      <p className="m-0 mt-1.5 max-w-md mx-auto font-serif-body text-[12.5px] italic text-muted">
        {body}
      </p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const diff = Date.now() - t;
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
