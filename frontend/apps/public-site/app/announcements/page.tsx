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
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const items = list ?? [];

  return (
    <SiteChrome journalName={journalName} active="announcements">
      <section className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-14">
          <p
            className="sc text-cobalt mb-3"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Announcements
          </p>
          <h1
            className="text-fg"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: "clamp(34px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            News &amp; calls
          </h1>
        </div>
      </section>

      <section>
        <div className="max-w-3xl mx-auto px-6 py-12">
          {items.length === 0 ? (
            <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
              No announcements at the moment. Check back soon.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-y-10">
              {items.map((a) => (
                <li key={a.id}>
                  <AnnouncementItem item={a} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteChrome>
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
      <div className="flex items-baseline gap-3 mb-2">
        <span
          className="chip"
          style={{
            fontFamily: "var(--sans)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "3px 8px",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-1)",
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
              padding: "3px 8px",
              borderRadius: "var(--r-1)",
              background: "var(--cobalt)",
              color: "white",
            }}
          >
            Pinned
          </span>
        ) : null}
        <p
          className="text-muted"
          style={{ fontFamily: "var(--mono)", fontSize: 11 }}
        >
          {new Date(item.datePosted).toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
      <h2
        className="text-fg mb-2"
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 600,
          fontSize: 24,
          lineHeight: 1.25,
        }}
      >
        {title}
      </h2>
      {body ? (
        <p
          className="text-fg-2"
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 16,
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {body}
        </p>
      ) : null}
      {item.dateExpires ? (
        <p
          className="text-muted mt-3"
          style={{ fontFamily: "var(--mono)", fontSize: 11 }}
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
