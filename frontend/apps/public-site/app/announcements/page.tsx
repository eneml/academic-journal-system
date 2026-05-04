import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchAnnouncements,
  fetchJournalConfig,
  pickLocale,
  type Announcement,
  type AnnouncementType,
} from "@/lib/api";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Announcements",
  description: "Calls for papers, journal news, special-issue invitations.",
};

const TYPE_LABEL: Record<AnnouncementType, string> = {
  GENERAL: "News",
  CALL_FOR_PAPERS: "Call for papers",
  SPECIAL_ISSUE: "Special issue",
  POLICY: "Policy",
};

export default async function AnnouncementsPage(): Promise<ReactNode> {
  const [config, list] = await Promise.all([
    fetchJournalConfig(),
    fetchAnnouncements(50),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";
  const items = list ?? [];

  // Type histogram for the sidebar.
  const typeCounts = new Map<AnnouncementType, number>();
  for (const a of items) {
    typeCounts.set(a.type, (typeCounts.get(a.type) ?? 0) + 1);
  }

  const submissionsOpen = config?.submissionsOpen ?? false;

  return (
    <SiteChrome journalName={journalName}>
      <section
        style={{
          padding: "32px var(--page-gutter) 24px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 10 }}>
          Announcements
        </div>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 500,
            fontSize: "clamp(34px, 4.6vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            margin: "0 0 10px",
          }}
        >
          News &amp; calls for papers
        </h1>
        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 17,
            lineHeight: 1.55,
            color: "var(--fg-2)",
            margin: 0,
            maxWidth: 720,
            fontStyle: "italic",
          }}
        >
          Open calls, special-issue invitations, policy updates, and other
          announcements from the editorial office.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 720px) 1fr",
          gap: 56,
          padding: "32px var(--page-gutter) 80px",
        }}
      >
        {/* Sidebar: type filter (visual) + count */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 14 }}>
            Categories
          </div>
          <nav
            style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}
          >
            <CategoryRow label="All" count={items.length} active />
            {(Object.keys(TYPE_LABEL) as AnnouncementType[])
              .filter((t) => (typeCounts.get(t) ?? 0) > 0)
              .map((t) => (
                <CategoryRow
                  key={t}
                  label={TYPE_LABEL[t]}
                  count={typeCounts.get(t) ?? 0}
                />
              ))}
          </nav>
          <div className="rule" style={{ margin: "20px 0 16px" }} />
          <div className="sc" style={{ color: "var(--muted)", marginBottom: 8 }}>
            Stay updated
          </div>
          <a
            href="/feed.xml"
            style={{
              fontSize: 12,
              color: "var(--cobalt)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <RssIcon /> Subscribe via RSS
          </a>
        </aside>

        {/* Main column */}
        <div style={{ minWidth: 0 }}>
          {items.length === 0 ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 16,
                color: "var(--muted)",
                margin: 0,
              }}
            >
              No announcements at the moment. Check back soon.
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: 0,
              }}
            >
              {items.map((a, i) => (
                <li
                  key={a.id}
                  style={{
                    borderTop:
                      i === 0 ? "none" : "1px solid var(--border)",
                    padding: i === 0 ? "0 0 28px" : "28px 0",
                  }}
                >
                  <AnnouncementItem item={a} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right rail: submission CTA */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div
            style={{
              border: "1px solid var(--border-strong)",
              borderRadius: 6,
              padding: 18,
              background: submissionsOpen
                ? "var(--cobalt-soft)"
                : "var(--surface)",
              marginBottom: 14,
            }}
          >
            <div
              className="sc"
              style={{
                color: submissionsOpen ? "var(--cobalt-deep)" : "var(--muted)",
                marginBottom: 8,
              }}
            >
              {submissionsOpen
                ? "Submissions are open"
                : "Submissions are closed"}
            </div>
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 13.5,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                margin: "0 0 12px",
              }}
            >
              {submissionsOpen
                ? "Start a new submission in the editorial app, or read the author guide first."
                : "Watch this page for the next call for papers."}
            </p>
            {submissionsOpen ? (
              <a
                href={EDITORIAL_APP_URL}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Submit a manuscript
              </a>
            ) : (
              <Link
                href="/for-authors"
                className="btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Author guide
              </Link>
            )}
          </div>
        </aside>
      </section>
    </SiteChrome>
  );
}

function CategoryRow({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}): ReactNode {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        color: active ? "var(--fg)" : "var(--fg-2)",
        fontWeight: active ? 600 : 400,
        borderLeft: active
          ? "2px solid var(--amber)"
          : "2px solid var(--border)",
        padding: "1px 0 1px 10px",
        fontFamily: "var(--sans)",
        fontSize: 13,
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      <span
        className="tnum"
        style={{
          fontFamily: "var(--mono)",
          fontSize: 11,
          color: "var(--muted)",
        }}
      >
        {count}
      </span>
    </span>
  );
}

function AnnouncementItem({
  item,
  locale,
}: {
  item: Announcement;
  locale: string;
}): ReactNode {
  const title = pickLocale(item.title, locale) || `Announcement #${item.id}`;
  const body = pickLocale(item.body, locale);

  return (
    <article>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          className="chip"
          style={{
            fontFamily: "var(--sans)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--cobalt)",
            background: "var(--surface)",
          }}
        >
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
        {item.pinned ? (
          <span
            className="chip"
            style={{
              fontFamily: "var(--sans)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: "var(--cobalt)",
              color: "white",
              border: "1px solid var(--cobalt)",
            }}
          >
            Pinned
          </span>
        ) : null}
        <span
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--muted)",
          }}
        >
          {new Date(item.datePosted).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <h2
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: 24,
          lineHeight: 1.25,
          margin: "0 0 8px",
          letterSpacing: "-0.005em",
          color: "var(--fg)",
        }}
      >
        {title}
      </h2>
      {body ? (
        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 16,
            lineHeight: 1.65,
            color: "var(--fg-2)",
            whiteSpace: "pre-wrap",
            margin: 0,
            maxWidth: 700,
          }}
        >
          {body}
        </p>
      ) : null}
      {item.dateExpires ? (
        <p
          style={{
            fontFamily: "var(--mono)",
            fontSize: 11,
            color: "var(--muted)",
            marginTop: 10,
          }}
        >
          Closes{" "}
          {new Date(item.dateExpires).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      ) : null}
    </article>
  );
}

function RssIcon(): ReactNode {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 19a2 2 0 1 0 .001-3.999A2 2 0 0 0 5 19ZM4 12a8 8 0 0 1 8 8M4 5a15 15 0 0 1 15 15" />
    </svg>
  );
}
