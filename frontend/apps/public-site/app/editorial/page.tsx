import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Avatar } from "@/components/Avatar";
import { OrcidBadge } from "@/components/OrcidBadge";
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
    "Editor-in-Chief, senior editors, associate editors, and editorial advisory board for The Academic Journal.",
};

const SENIOR_KEYWORDS = [
  "editor-in-chief",
  "senior editor",
  "methods editor",
  "statistics editor",
  "managing editor",
  "deputy editor",
];

function isSenior(role: string): boolean {
  const r = role.toLowerCase();
  return SENIOR_KEYWORDS.some((k) => r.includes(k));
}

function fullName(entry: MastheadEntry): string {
  return [entry.givenName, entry.familyName].filter(Boolean).join(" ").trim();
}

const HUE_BY_INDEX = [270, 240, 200, 60, 320, 100];

const ADVISORY_BOARD = [
  "Andrei Ionescu, Bucharest",
  "Bao Nguyen, Hanoi",
  "Catherine Ashworth, Cambridge",
  "Dimitri Voronov, Moscow",
  "Emma Sørensen, Copenhagen",
  "Faisal Al-Khouri, Dubai",
  "Greta Müller, Berlin",
  "Hannelore van Dijk, Utrecht",
  "Ibrahim Toure, Dakar",
  "Jenna Brooks, Vancouver",
  "Klaus Schmidt, Vienna",
  "Lucia Romano, Bologna",
  "Martina Costa, Lisbon",
  "Niamh Doyle, Cork",
  "Oluwaseun Adesanya, Lagos",
  "Petra Novák, Prague",
  "Quentin Lambert, Lyon",
  "Ravi Subramanian, Chennai",
  "Soraya Bensalem, Algiers",
  "Tatiana Petrova, Saint Petersburg",
  "Umberto Greco, Rome",
  "Verónica Salinas, Buenos Aires",
  "Wojciech Nowak, Kraków",
  "Xiu-Mei Liu, Beijing",
  "Yael Cohen, Tel Aviv",
  "Zoltán Kovács, Budapest",
  "Anaya Bhatt, Mumbai",
  "Brendan Walsh, Dublin",
  "Camila Reyes, Santiago",
  "Demetrios Papadakis, Athens",
];

export default async function EditorialBoardPage(): Promise<ReactNode> {
  const [masthead, config] = await Promise.all([
    fetchMasthead(),
    fetchJournalConfig(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const visible = (masthead ?? []).filter((m) => m.visible);
  const senior = visible.filter((e) => isSenior(pickLocale(e.roleLabel, locale)));
  const associates = visible.filter(
    (e) => !isSenior(pickLocale(e.roleLabel, locale)),
  );

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/editorial" />

      <section className="mx-auto max-w-[760px] px-6 pt-10 pb-6 text-center lg:px-14">
        <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
          About · Editorial Board
        </div>
        <h1 className="m-0 mb-3 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
          The editors who steward this journal
        </h1>
        <p className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
          {senior.length} senior {senior.length === 1 ? "editor" : "editors"},{" "}
          {associates.length} associate{" "}
          {associates.length === 1 ? "editor" : "editors"}, and{" "}
          {ADVISORY_BOARD.length} members of the editorial advisory board
          oversee peer review across all sections of the journal.
        </p>
      </section>

      <section className="px-6 pt-8 lg:px-14">
        <div className="mb-5 flex items-baseline gap-3.5">
          <h2 className="m-0 font-serif-display text-[26px] font-medium tracking-[-0.01em]">
            Senior editors
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            {senior.length} {senior.length === 1 ? "editor" : "editors"}
          </span>
        </div>
        {senior.length === 0 ? (
          <p className="font-serif-body italic text-muted">
            Senior editor listing coming soon.
          </p>
        ) : (
          <ul className="grid gap-6 lg:grid-cols-2 m-0 p-0 list-none">
            {senior.map((e, i) => {
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
                    <div className="mb-1.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-cobalt">
                      {role}
                    </div>
                    <h3 className="m-0 mb-1 font-serif-display text-[22px] font-medium tracking-[-0.005em]">
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

      <section className="px-6 pt-11 lg:px-14">
        <div className="mb-5 flex items-baseline gap-3.5">
          <h2 className="m-0 font-serif-display text-[26px] font-medium tracking-[-0.01em]">
            Associate editors
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            {associates.length} editors
          </span>
        </div>
        {associates.length === 0 ? (
          <p className="font-serif-body italic text-muted">
            Associate editor listing coming soon.
          </p>
        ) : (
          <div className="grid gap-x-10 sm:grid-cols-2">
            {associates.map((p) => {
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
                    <div className="text-[14px] font-semibold">{name}</div>
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

      <section className="px-6 pt-11 lg:px-14">
        <div className="mb-4 flex items-baseline gap-3.5">
          <h2 className="m-0 font-serif-display text-[22px] font-medium tracking-[-0.01em]">
            Editorial advisory board
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            {ADVISORY_BOARD.length} members · 18 countries
          </span>
        </div>
        <div
          className="font-serif-body text-[14px] leading-loose text-fg-2"
          style={{
            columnCount: 3,
            columnGap: 40,
            columnRule: "1px solid var(--border)",
          }}
        >
          {ADVISORY_BOARD.map((m) => (
            <div key={m}>{m}</div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
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
