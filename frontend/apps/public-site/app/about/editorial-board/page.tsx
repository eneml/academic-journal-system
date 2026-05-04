import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import {
  fetchJournalConfig,
  fetchMasthead,
  pickLocale,
  type MastheadEntry,
} from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Editorial Board",
  description: "The editors and advisors who run the journal.",
};

export default async function EditorialBoardPage(): Promise<ReactNode> {
  const [config, masthead] = await Promise.all([
    fetchJournalConfig(),
    fetchMasthead(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "Academic Journal";
  const entries = (masthead ?? []).filter((e) => e.visible);
  const grouped = groupByRole(entries, locale);

  return (
    <SiteChrome journalName={journalName} active="about">
      <section className="border-b border-border">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <p
              className="sc text-cobalt mb-3"
              style={{
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              About
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
              Editorial Board
            </h1>
            <p
              className="text-fg-2 mt-4"
              style={{ fontFamily: "var(--serif-body)", fontSize: 17, lineHeight: 1.65 }}
            >
              The people who set the direction of {journalName}, recruit
              reviewers, and steward each manuscript through peer review.
            </p>
          </div>
        </section>

        <section>
          <div className="max-w-3xl mx-auto px-6 py-14">
            {grouped.length === 0 ? (
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)" }}>
                The editorial board listing will be published soon.
              </p>
            ) : (
              grouped.map((group) => (
                <section key={group.label || "members"} className="mb-12 last:mb-0">
                  <h2
                    className="text-fg mb-5"
                    style={{
                      fontFamily: "var(--serif-display)",
                      fontWeight: 600,
                      fontSize: 22,
                      borderBottom: "1px solid var(--border)",
                      paddingBottom: 6,
                    }}
                  >
                    {group.label || "Members"}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                    {group.items.map((m) => (
                      <li key={m.id}>
                        <p
                          className="text-fg"
                          style={{
                            fontFamily: "var(--serif-display)",
                            fontWeight: 600,
                            fontSize: 17,
                            lineHeight: 1.3,
                          }}
                        >
                          {fullName(m)}
                        </p>
                        {m.orcidId ? (
                          <p
                            className="text-muted mt-1"
                            style={{
                              fontFamily: "var(--mono)",
                              fontSize: 11,
                            }}
                          >
                            ORCID:{" "}
                            <a
                              href={
                                m.orcidId.startsWith("http")
                                  ? m.orcidId
                                  : `https://orcid.org/${m.orcidId}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cobalt"
                            >
                              {m.orcidId.replace(/^https?:\/\/orcid\.org\//, "")}
                            </a>
                          </p>
                        ) : null}
                        {pickLocale(m.bioOverride, locale) ? (
                          <p
                            className="text-fg-2 mt-2"
                            style={{
                              fontFamily: "var(--serif-body)",
                              fontSize: 14,
                              lineHeight: 1.55,
                            }}
                          >
                            {pickLocale(m.bioOverride, locale)}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            )}
          </div>
        </section>
    </SiteChrome>
  );
}

function fullName(m: MastheadEntry): string {
  if (m.givenName || m.familyName) {
    return [m.givenName, m.familyName].filter(Boolean).join(" ");
  }
  return `Member #${m.userId}`;
}

function groupByRole(
  entries: MastheadEntry[],
  locale: string,
): Array<{ label: string; items: MastheadEntry[] }> {
  const buckets = new Map<string, MastheadEntry[]>();
  for (const e of entries) {
    const label = pickLocale(e.roleLabel, locale) || "";
    if (!buckets.has(label)) buckets.set(label, []);
    buckets.get(label)!.push(e);
  }
  return Array.from(buckets.entries())
    .map(([label, items]) => ({
      label,
      items: items.sort((a, b) => a.displayOrder - b.displayOrder),
    }));
}
