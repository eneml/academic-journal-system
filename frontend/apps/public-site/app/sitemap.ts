import type { MetadataRoute } from "next";
import { fetchIssues, fetchRecentPublications } from "@/lib/api";
import { issuePath } from "@/lib/format";

const SITE_URL =
  process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE_URL.replace(/\/$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/announcements`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/current`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/search`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/for-authors`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/editorial`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/policies`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const [issues, articles] = await Promise.all([
    fetchIssues(),
    fetchRecentPublications(200),
  ]);

  const issueEntries: MetadataRoute.Sitemap = (issues ?? [])
    .filter((i) => i.published)
    .map((issue) => ({
      url: `${base}${issuePath(issue)}`,
      lastModified: issue.datePublished ? new Date(issue.datePublished) : now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const articleEntries: MetadataRoute.Sitemap = (articles ?? []).map((article) => {
    const slug = article.urlPath ?? String(article.id);
    return {
      url: `${base}/articles/${encodeURIComponent(slug)}`,
      lastModified: article.datePublished ? new Date(article.datePublished) : now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    };
  });

  return [...staticEntries, ...issueEntries, ...articleEntries];
}
