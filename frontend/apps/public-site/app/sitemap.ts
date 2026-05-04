import type { MetadataRoute } from "next";
import {
  fetchActiveSections,
  fetchIssues,
  fetchRecentPublications,
} from "@/lib/api";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Server-rendered sitemap.xml. Includes the static pages (home, archive,
 * about), every published issue, and the most recent published articles.
 * Refreshes hourly via Next's revalidate window.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/issues`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/announcements`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/for-authors`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/about/editorial-board`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [issues, articles, sections] = await Promise.all([
    fetchIssues(),
    fetchRecentPublications(200),
    fetchActiveSections(),
  ]);

  const issueEntries: MetadataRoute.Sitemap = (issues ?? [])
    .filter((i) => i.published)
    .map((issue) => {
      const slug = issue.urlPath ?? String(issue.id);
      return {
        url: `${base}/issues/${encodeURIComponent(slug)}`,
        lastModified: issue.datePublished ? new Date(issue.datePublished) : now,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    });

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((article) => {
    const slug = article.urlPath ?? String(article.id);
    return {
      url: `${base}/articles/${encodeURIComponent(slug)}`,
      lastModified: article.datePublished ? new Date(article.datePublished) : now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    };
  });

  const sectionEntries: MetadataRoute.Sitemap = (sections ?? [])
    .filter((s) => !s.inactive)
    .map((s) => ({
      url: `${base}/sections/${encodeURIComponent(s.code)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  return [...staticEntries, ...sectionEntries, ...issueEntries, ...articleEntries];
}
