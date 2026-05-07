import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Avatar } from "@/components/Avatar";
import { OrcidBadge } from "@ajs/ui";
import {
  fetchJournalConfig,
  fetchMasthead,
  pickLocale,
  type MastheadEntry,
} from "@/lib/api";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Editorial Board",
  description:
    "Editor-in-Chief, senior editors, associate editors, and editorial advisory board.",
};

const SENIOR_KEYWORDS = [
  "editor-in-chief",
  "senior editor",
  "methods editor",
  "statistics editor",
  "managing editor",
  "deputy editor",
];

const ADVISORY_KEYWORDS = ["advisor", "advisory"];

function classify(role: string): "senior" | "advisory" | "associate" {
  const r = role.toLowerCase();
  if (ADVISORY_KEYWORDS.some((k) => r.includes(k))) return "advisory";
  if (SENIOR_KEYWORDS.some((k) => r.includes(k))) return "senior";
  return "associate";
}

function fullName(entry: MastheadEntry): string {
  return [entry.givenName, entry.familyName].filter(Boolean).join(" ").trim();
}

const HUE_BY_INDEX = [270, 240, 200, 60, 320, 100];

export default async function EditorialBoardPage(): Promise<ReactNode> {
  const [masthead, config] = await Promise.all([
    fetchMasthead(),
    fetchJournalConfig(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const visible = (masthead ?? []).filter((m) => m.visible);
  const grouped = {
    senior: [] as MastheadEntry[],
    advisory: [] as MastheadEntry[],
    associate: [] as MastheadEntry[],
  };
  visible.forEach((e) => {
    grouped[classify(pickLocale(e.roleLabel, locale))].push(e);
  });

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/editorial" />

      <section className="mx-auto max-w-[760px] px-6 pt-12 pb-7 text-center lg:px-14">
        <div className="sc mb-3 text-amber-deep">About · Editorial Board</div>
        <h1 className="m-0 mb-3.5 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em] text-ink">
          The editors who steward this journal
        </h1>
        <p className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
          {grouped.senior.length} senior {pluralize(grouped.senior.length, "editor", "editors")},{" "}
          {grouped.associate.length} associate{" "}
          {pluralize(grouped.associate.length, "editor", "editors")}
          {grouped.advisory.length
            ? `, and ${grouped.advisory.length} ${pluralize(grouped.advisory.length, "member", "members")} of the editorial advisory board`
            : ""}
          {" "}oversee peer review across all sections of the journal.
        </p>
      </section>

      <section className="px-6 pt-9 lg:px-14">
        <SectionHeader title="Senior editors" count={grouped.senior.length} />
        {grouped.senior.length === 0 ? (
          <p className="font-serif-body italic text-muted">
            Senior editor listing coming soon.
          </p>
        ) : (
          <ul className="m-0 grid gap-6 p-0 list-none lg:grid-cols-2">
            {grouped.senior.map((e, i) => {
              const name = fullName(e) || `Member #${e.userId}`;
              const role = pickLocale(e.roleLabel, locale);
              const bio = pickLocale(e.bioOverride, locale);
              return (
                <li
                  key={e.id}
                  className="grid grid-cols-[120px_1fr] gap-5 rounded-md border border-border bg-bg p-5"
                >
                  <Avatar
                    name={name}
                    size={120}
                    hue={HUE_BY_INDEX[i % HUE_BY_INDEX.length]}
                  />
                  <div>
                    <div className="sc mb-1.5 text-cobalt">{role}</div>
                    <h3 className="m-0 mb-1 font-serif-display text-[22px] font-medium tracking-[-0.005em] text-ink">
                      {name}
                    </h3>
                    <div className="mb-2.5 font-serif-body text-[13px] italic text-muted">
                      {bio ? extractAffiliation(bio) : "Editorial board member"}
                    </div>
                    {bio ? (
                      <p className="m-0 mb-3 font-serif-body text-[13.5px] leading-[1.55] text-fg-2">
                        {bio}
                      </p>
                    ) : null}
                    {e.orcidId ? <OrcidBadge id={e.orcidId} /> : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="px-6 pt-12 lg:px-14">
        <SectionHeader
          title="Associate editors"
          count={grouped.associate.length}
        />
        {grouped.associate.length === 0 ? (
          <p className="font-serif-body italic text-muted">
            Associate editor listing coming soon.
          </p>
        ) : (
          <div className="grid gap-x-10 sm:grid-cols-2">
            {grouped.associate.map((p) => {
              const name = fullName(p) || `Member #${p.userId}`;
              const roleStr = pickLocale(p.roleLabel, locale);
              const [role, area] = roleStr.split("·").map((s) => s.trim());
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[44px_1fr_1fr] items-center gap-3 border-t border-border py-3.5"
                >
                  <Avatar name={name} size={36} />
                  <div>
                    <div className="text-[14px] font-semibold text-ink">
                      {name}
                    </div>
                    <div className="font-serif-body text-[12px] italic text-muted">
                      {role ?? roleStr}
                    </div>
                  </div>
                  <div className="text-right text-[12px] text-cobalt">
                    {area ?? ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {grouped.advisory.length > 0 ? (
        <section className="px-6 pt-12 lg:px-14">
          <SectionHeader
            title="Editorial advisory board"
            count={grouped.advisory.length}
            unit="member"
          />
          <div className="font-serif-body text-[14px] leading-loose text-fg-2 columns-1 [column-gap:40px] [column-rule:1px_solid_var(--border)] sm:columns-2 lg:columns-3">
            {grouped.advisory.map((p) => {
              const name = fullName(p) || `Member #${p.userId}`;
              const role = pickLocale(p.roleLabel, locale);
              return (
                <div key={p.id}>
                  {name}
                  {role ? (
                    <span className="text-muted-2">, {role}</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <PublicFooter />
    </div>
  );
}

function SectionHeader({
  title,
  count,
  unit = "editor",
}: {
  title: string;
  count: number;
  unit?: string;
}) {
  return (
    <div className="mb-5 flex items-baseline gap-3.5">
      <h2 className="m-0 font-serif-display text-[26px] font-medium tracking-[-0.01em] text-ink">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
      <span className="sc text-muted">
        {count} {pluralize(count, unit, `${unit}s`)}
      </span>
    </div>
  );
}

function pluralize(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

function extractAffiliation(bio: string): string {
  const sentence = bio
    .split(".")
    .find((s) =>
      /university|institute|school|college|laboratory|department|école|center|centre|cmap|csail|deepmind|inria|mit|kth|kaist/i.test(
        s,
      ),
    );
  return sentence ? sentence.trim() : "Editorial board member";
}
