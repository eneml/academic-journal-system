import type { IssueSummary, PublicationSummary } from "./api";

export function issueLabel(opts: {
  volume?: number | null;
  number?: number | string | null;
  year?: number | null;
  datePublished?: string | null;
  showVolume?: boolean;
  showNumber?: boolean;
  showYear?: boolean;
}): string {
  const parts: string[] = [];
  if (opts.showVolume !== false && opts.volume) parts.push(`Vol. ${opts.volume}`);
  if (opts.showNumber !== false && opts.number) parts.push(`No. ${opts.number}`);
  if (opts.datePublished) {
    const d = new Date(opts.datePublished);
    if (!Number.isNaN(d.getTime())) {
      const month = d.toLocaleDateString("en-US", { month: "long" });
      const year = d.getFullYear();
      parts.push(`${month} ${year}`);
      return parts.join(" · ");
    }
  }
  if (opts.showYear !== false && opts.year) parts.push(String(opts.year));
  return parts.join(" · ");
}

export function coverLabel(
  volume?: number | null,
  number?: number | string | null,
): string {
  if (volume && number) return `Vol. ${volume} № ${number}`;
  if (volume) return `Vol. ${volume}`;
  if (number) return `No. ${number}`;
  return "Issue";
}

export function issuePath(issue: Pick<IssueSummary, "urlPath" | "volume" | "number" | "id">): string {
  if (issue.urlPath) return `/archive/${issue.urlPath}`;
  if (issue.volume && issue.number) {
    return `/archive/vol-${issue.volume}-no-${issue.number}`;
  }
  return `/archive/${issue.id}`;
}

export function articlePath(p: Pick<PublicationSummary, "urlPath" | "id">): string {
  return `/articles/${p.urlPath ?? p.id}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
