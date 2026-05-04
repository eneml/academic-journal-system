/**
 * Typed fetchers for the public reading site. Server-side only —
 * uses the backend's public read endpoints (no auth required).
 *
 * All fetches use Next.js's revalidate so pages stay statically
 * cacheable while picking up backend changes within a minute.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const REVALIDATE_SECONDS = 60;

export type JournalConfig = {
  name: Record<string, string>;
  defaultLocale: string;
  supportedLocales: string[];
  contactEmail: string | null;
  submissionsOpen: boolean;
};

export type SectionSummary = {
  id: number;
  code: string;
  seq: number;
  title: Record<string, string>;
  abbrev: Record<string, string>;
  inactive: boolean;
};

export type IssueSummary = {
  id: number;
  volume: number | null;
  number: string | null;
  year: number | null;
  title: Record<string, string>;
  urlPath: string | null;
  published: boolean;
  datePublished: string | null;
  accessStatus: "OPEN" | "RESTRICTED";
};

export type PublicationSummary = {
  id: number;
  submissionId: number;
  version: number;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED";
  accessStatus: "OPEN" | "RESTRICTED";
  sectionId: number;
  issueId: number | null;
  urlPath: string | null;
  title: Record<string, string>;
  abstractText: Record<string, string>;
  keywords: string[];
  locale: string;
  datePublished: string | null;
};

export type ArticleAuthor = {
  givenName: string | null;
  familyName: string | null;
  orcidId: string | null;
  affiliation: string | null;
  corresponding: boolean;
};

export type Article = {
  id: number;
  submissionId: number;
  version: number;
  status: PublicationSummary["status"];
  accessStatus: PublicationSummary["accessStatus"];
  sectionId: number;
  issueId: number | null;
  urlPath: string | null;
  licenseUrl: string | null;
  copyrightHolder: string | null;
  copyrightYear: number | null;
  pages: string | null;
  title: Record<string, string>;
  abstractText: Record<string, string>;
  keywords: string[];
  disciplines: string[];
  locale: string;
  datePublished: string | null;
  doi: string | null;
  authors: ArticleAuthor[];
};

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Backend unreachable — return null and let the page fall back to placeholders.
    return null;
  }
}

export const fetchJournalConfig = () =>
  getJson<JournalConfig>("/api/v1/journal/config");

export const fetchActiveSections = () =>
  getJson<SectionSummary[]>("/api/v1/journal/sections");

export const fetchSectionByCode = (code: string) =>
  getJson<SectionSummary>(`/api/v1/journal/sections/by-code/${encodeURIComponent(code)}`);

export const fetchPublicationsInSection = (sectionId: number, limit = 30) =>
  getJson<PublicationSummary[]>(
    `/api/v1/sections/${sectionId}/publications?limit=${limit}`,
  );

export type MastheadEntry = {
  id: number;
  userId: number;
  roleLabel: Record<string, string>;
  bioOverride: Record<string, string>;
  displayOrder: number;
  visible: boolean;
  givenName: string | null;
  familyName: string | null;
  orcidId: string | null;
};

export const fetchMasthead = () =>
  getJson<MastheadEntry[]>("/api/v1/journal/masthead?visibleOnly=true");

export type AnnouncementType =
  | "GENERAL"
  | "CALL_FOR_PAPERS"
  | "SPECIAL_ISSUE"
  | "POLICY";

export type Announcement = {
  id: number;
  type: AnnouncementType;
  title: Record<string, string>;
  body: Record<string, string>;
  urlPath: string | null;
  datePosted: string;
  dateExpires: string | null;
  pinned: boolean;
  visible: boolean;
};

export const fetchAnnouncements = (limit = 20) =>
  getJson<Announcement[]>(`/api/v1/announcements?limit=${limit}`);

export const fetchRecentPublications = (limit = 6) =>
  getJson<PublicationSummary[]>(`/api/v1/publications/recent?limit=${limit}`);

export const fetchIssues = () => getJson<IssueSummary[]>("/api/v1/issues");

export const fetchIssueBySlug = (slug: string) =>
  getJson<IssueSummary>(`/api/v1/issues/by-path/${encodeURIComponent(slug)}`);

export const fetchIssueById = (id: number) =>
  getJson<IssueSummary>(`/api/v1/issues/${id}`);

export const fetchIssueTableOfContents = (issueId: number) =>
  getJson<PublicationSummary[]>(`/api/v1/issues/${issueId}/publications`);

export const fetchActiveSectionsMap = async (): Promise<Map<number, SectionSummary>> => {
  const list = (await fetchActiveSections()) ?? [];
  return new Map(list.map((s) => [s.id, s]));
};

export const fetchArticle = (slugOrId: string) =>
  getJson<Article>(`/api/v1/articles/${encodeURIComponent(slugOrId)}`);

export const fetchArticleVersions = (slugOrId: string) =>
  getJson<PublicationSummary[]>(
    `/api/v1/articles/${encodeURIComponent(slugOrId)}/versions`,
  );

export type GalleySummary = {
  id: number;
  publicationId: number;
  submissionFileId: number | null;
  remoteUrl: string | null;
  locale: string | null;
  label: Record<string, string>;
  seq: number;
  approved: boolean;
  urlPath: string | null;
  doiId: number | null;
  updatedAt: string | null;
};

export const fetchArticleGalleys = (slugOrId: string) =>
  getJson<GalleySummary[]>(
    `/api/v1/articles/${encodeURIComponent(slugOrId)}/galleys`,
  );

export type AuthorProfile = {
  orcidUrl: string;
  givenName: string | null;
  familyName: string | null;
  affiliation: string | null;
  worksCount: number;
  works: PublicationSummary[];
};

export const fetchAuthorByOrcid = (orcid: string) =>
  getJson<AuthorProfile>(`/api/v1/authors/${encodeURIComponent(orcid)}`);

export type SearchHit = {
  publication: PublicationSummary;
  score: number;
  snippet: string | null;
};

export const search = (q: string, opts?: {
  section?: number;
  year?: number;
  page?: number;
  size?: number;
}) => {
  const params = new URLSearchParams({ q });
  if (opts?.section != null) params.set("section", String(opts.section));
  if (opts?.year != null) params.set("year", String(opts.year));
  if (opts?.page != null) params.set("page", String(opts.page));
  if (opts?.size != null) params.set("size", String(opts.size));
  return getJson<SearchHit[]>(`/api/v1/search?${params.toString()}`);
};

/**
 * Pick the best translation for the active locale, falling back to
 * the journal's default and finally any value present.
 */
export function pickLocale(
  values: Record<string, string> | null | undefined,
  preferred: string,
  fallback: string = "en",
): string {
  if (!values || Object.keys(values).length === 0) return "";
  return values[preferred] ?? values[fallback] ?? Object.values(values)[0] ?? "";
}
