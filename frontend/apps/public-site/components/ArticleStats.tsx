import type { PublicationMetrics } from "@/lib/api";

export interface ArticleStatsProps {
  metrics: PublicationMetrics | undefined;
  citationCount?: number | null;
}

const NUM = new Intl.NumberFormat("en-US");

/**
 * Right-aligned metric column for an article card. Renders the cumulative
 * view count and (when wired) a citation total. Hidden on mobile to keep
 * card real-estate for title + abstract.
 */
export function ArticleStats({
  metrics,
  citationCount,
}: ArticleStatsProps) {
  const views = metrics?.viewCount ?? null;
  if (views == null && (citationCount == null || citationCount === 0)) {
    return <div className="hidden md:block" aria-hidden />;
  }
  return (
    <div className="hidden shrink-0 self-start text-right md:block">
      {views != null ? (
        <>
          <div className="tnum font-serif-display text-[26px] font-medium leading-none text-fg">
            {NUM.format(views)}
          </div>
          <div className="mt-1 font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Views
          </div>
        </>
      ) : null}
      {citationCount != null ? (
        <div className="mt-2 font-mono text-[11px] text-muted">
          {NUM.format(citationCount)} citation{citationCount === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
