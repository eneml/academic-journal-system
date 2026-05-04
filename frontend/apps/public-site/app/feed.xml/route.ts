import { NextResponse } from "next/server";
import {
  fetchJournalConfig,
  fetchRecentPublications,
  pickLocale,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 600; // 10 minutes

/**
 * RSS 2.0 feed of the most recent published articles. Mirrors what the
 * homepage shows so subscribers can pull updates without polling the
 * site. Limited to 50 items so the payload stays cacheable.
 */
export async function GET(): Promise<NextResponse> {
  const [config, articles] = await Promise.all([
    fetchJournalConfig(),
    fetchRecentPublications(50),
  ]);
  const base = SITE_URL.replace(/\/$/, "");
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";

  const items = (articles ?? [])
    .map((a) => {
      const slug = a.urlPath ?? String(a.id);
      const title = pickLocale(a.title, locale) || `Article ${a.id}`;
      const summary = pickLocale(a.abstractText, locale).slice(0, 600);
      const link = `${base}/articles/${encodeURIComponent(slug)}`;
      const pubDate = a.datePublished
        ? new Date(a.datePublished).toUTCString()
        : new Date().toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        summary ? `      <description>${escapeXml(summary)}</description>` : "",
        ...(a.keywords ?? []).map(
          (k) => `      <category>${escapeXml(k)}</category>`,
        ),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(journalName)}</title>
    <link>${escapeXml(base)}</link>
    <atom:link href="${escapeXml(base + "/feed.xml")}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml("Recent articles from " + journalName)}</description>
    <language>${escapeXml(locale)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=600",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
