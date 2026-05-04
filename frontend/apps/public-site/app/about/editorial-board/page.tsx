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

type Tier = "senior" | "associate" | "advisory";

type EnrichedEntry = MastheadEntry & {
  roleLabel: Record<string, string>;
  initials: string;
  hue: number;
  fullName: string;
  bio: string;
  role: string;
};

export default async function EditorialBoardPage(): Promise<ReactNode> {
  const [config, masthead] = await Promise.all([
    fetchJournalConfig(),
    fetchMasthead(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const journalName = pickLocale(config?.name, locale) || "The Academic Journal";

  const all = (masthead ?? [])
    .filter((e) => e.visible)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((e, idx, arr) => enrich(e, idx, arr.length, locale));

  const senior = all.filter((e) => e._tier === "senior");
  const associate = all.filter((e) => e._tier === "associate");
  const advisory = all.filter((e) => e._tier === "advisory");

  const counts = {
    senior: senior.length,
    associate: associate.length,
    advisory: advisory.length,
  };
  const totalDescription = countsLine(counts);

  return (
    <SiteChrome journalName={journalName} active="editorial-board">
      <section
        style={{
          padding: "40px 56px 24px",
        }}
      >
        <div
          className="sc"
          style={{ color: "var(--amber-deep)", marginBottom: 12 }}
        >
          About · Editorial Board
        </div>
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: "clamp(36px, 5vw, 48px)",
            fontWeight: 500,
            margin: "0 0 14px",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          The editors who steward this journal
        </h1>
        <p
          style={{
            fontFamily: "var(--serif-body)",
            fontSize: 18,
            lineHeight: 1.55,
            color: "var(--fg-2)",
            margin: 0,
            fontStyle: "italic",
            maxWidth: 720,
          }}
        >
          {totalDescription} oversee peer review across all sections of {journalName}.
        </p>
      </section>

      {all.length === 0 ? (
        <section style={{ padding: "32px 56px 80px" }}>
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 16,
              color: "var(--muted)",
              textAlign: "center",
            }}
          >
            The editorial board listing will be published soon.
          </p>
        </section>
      ) : (
        <>
          {senior.length > 0 ? (
            <section
              style={{ padding: "32px 56px 0" }}
            >
              <SectionHead title="Senior editors" count={`${senior.length} editors`} />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                  gap: 24,
                }}
              >
                {senior.map((e) => (
                  <SeniorCard key={e.id} e={e} />
                ))}
              </div>
            </section>
          ) : null}

          {associate.length > 0 ? (
            <section
              style={{ padding: "44px 56px 0" }}
            >
              <SectionHead
                title="Associate editors"
                count={`${associate.length} ${associate.length === 1 ? "editor" : "editors"}`}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
                  gap: "0 40px",
                }}
              >
                {associate.map((e) => (
                  <AssociateRow key={e.id} e={e} />
                ))}
              </div>
            </section>
          ) : null}

          {advisory.length > 0 ? (
            <section
              style={{ padding: "44px 56px 0" }}
            >
              <SectionHead
                title="Editorial advisory board"
                count={`${advisory.length} ${advisory.length === 1 ? "member" : "members"}`}
                size="sm"
              />
              <div
                style={{
                  fontFamily: "var(--serif-body)",
                  fontSize: 14,
                  lineHeight: 2,
                  color: "var(--fg-2)",
                  columnCount: 3,
                  columnGap: 40,
                  columnRule: "1px solid var(--border)",
                }}
              >
                {advisory.map((e) => (
                  <div
                    key={e.id}
                    style={{ breakInside: "avoid", display: "block" }}
                  >
                    <span style={{ color: "var(--fg)", fontWeight: 500 }}>
                      {e.fullName}
                    </span>
                    {e.role ? (
                      <span style={{ color: "var(--muted)" }}> · {e.role}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      <div style={{ height: 80 }} />
    </SiteChrome>
  );
}

// -------- helpers --------

function SectionHead({
  title,
  count,
  size = "lg",
}: {
  title: string;
  count: string;
  size?: "lg" | "sm";
}): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 14,
        marginBottom: size === "lg" ? 22 : 16,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--serif-display)",
          fontSize: size === "lg" ? 26 : 22,
          fontWeight: 500,
          margin: 0,
          letterSpacing: "-0.005em",
        }}
      >
        {title}
      </h2>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span className="sc" style={{ color: "var(--muted)" }}>
        {count}
      </span>
    </div>
  );
}

function SeniorCard({ e }: { e: EnrichedEntry & { _tier: Tier } }): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 20,
        padding: 20,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "var(--bg)",
      }}
    >
      <GradientAvatar initials={e.initials} hue={e.hue} />
      <div>
        {e.role ? (
          <div className="sc" style={{ color: "var(--cobalt)", marginBottom: 6 }}>
            {e.role}
          </div>
        ) : null}
        <h3
          style={{
            fontFamily: "var(--serif-display)",
            fontSize: 22,
            fontWeight: 500,
            margin: "0 0 4px",
            letterSpacing: "-0.005em",
          }}
        >
          {e.fullName}
        </h3>
        {e.bio ? (
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 13.5,
              lineHeight: 1.55,
              color: "var(--fg-2)",
              margin: "0 0 12px",
            }}
          >
            {e.bio}
          </p>
        ) : null}
        {e.orcidId ? <OrcidBadge orcidId={e.orcidId} /> : null}
      </div>
    </div>
  );
}

function AssociateRow({
  e,
}: {
  e: EnrichedEntry & { _tier: Tier };
}): ReactNode {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr auto",
        gap: 12,
        padding: "14px 0",
        borderTop: "1px solid var(--border)",
        alignItems: "center",
      }}
    >
      <div
        className="avatar"
        style={{
          width: 36,
          height: 36,
          fontSize: 12,
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
        }}
        aria-hidden
      >
        {e.initials}
      </div>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--sans)",
            color: "var(--fg)",
          }}
        >
          {e.fullName}
        </div>
        {e.bio ? (
          <div
            style={{
              fontFamily: "var(--serif-body)",
              fontStyle: "italic",
              color: "var(--muted)",
              fontSize: 12,
            }}
          >
            {truncate(e.bio, 80)}
          </div>
        ) : null}
      </div>
      {e.role ? (
        <div
          style={{
            fontSize: 12,
            color: "var(--cobalt)",
            textAlign: "right",
            maxWidth: 160,
          }}
        >
          {e.role}
        </div>
      ) : null}
    </div>
  );
}

function GradientAvatar({
  initials,
  hue,
}: {
  initials: string;
  hue: number;
}): ReactNode {
  return (
    <div
      style={{
        width: 120,
        height: 150,
        borderRadius: 4,
        background: `linear-gradient(155deg, oklch(80% 0.06 ${hue}) 0%, oklch(60% 0.10 ${(hue + 10) % 360}) 100%)`,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 10,
        position: "relative",
        overflow: "hidden",
      }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 5px)",
        }}
      />
      <div
        style={{
          position: "relative",
          fontFamily: "var(--serif-display)",
          color: "white",
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          textShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        {initials}
      </div>
    </div>
  );
}

function OrcidBadge({ orcidId }: { orcidId: string }): ReactNode {
  const short = orcidId.replace(/^https?:\/\/orcid\.org\//, "");
  const href = orcidId.startsWith("http") ? orcidId : `https://orcid.org/${short}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "var(--mono)",
        fontSize: 11,
        color: "var(--muted)",
        textDecoration: "none",
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "oklch(72% 0.16 130)",
          display: "inline-block",
        }}
      />
      <span style={{ color: "var(--cobalt)" }}>{short}</span>
    </a>
  );
}

// -------- data shaping --------

function enrich(
  e: MastheadEntry,
  idx: number,
  total: number,
  locale: string,
): EnrichedEntry & { _tier: Tier } {
  const role = pickLocale(e.roleLabel, locale) || "";
  const fullName =
    [e.givenName, e.familyName].filter(Boolean).join(" ").trim() ||
    `Member #${e.userId}`;
  const initials = makeInitials(fullName);
  const bio = pickLocale(e.bioOverride, locale) || "";
  const hue = (e.userId * 47) % 360; // deterministic spread
  return {
    ...e,
    roleLabel: e.roleLabel,
    role,
    fullName,
    initials,
    bio,
    hue,
    _tier: tierFor(role, idx, total),
  };
}

function tierFor(role: string, idx: number, total: number): Tier {
  const r = role.toLowerCase();
  if (/advisor|advisory/.test(r)) return "advisory";
  if (/^associate\b|board\s+member/.test(r)) return "associate";
  if (
    /\b(?:editor[\s-]in[\s-]chief|chief\s+editor|managing\s+editor|senior\s+editor|methods\s+editor|statistics\s+editor|section\s+editor)\b/.test(
      r,
    )
  )
    return "senior";
  // Fall back to a rank-based partition: top 4 senior, next 10 associate.
  if (idx < 4) return "senior";
  if (idx < Math.min(total, 4 + 14)) return "associate";
  return "advisory";
}

function makeInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .filter(Boolean)
    .slice(0, 2)
    .join("");
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return `${s.slice(0, n - 1).trimEnd()}…`;
}

function countsLine(counts: {
  senior: number;
  associate: number;
  advisory: number;
}): string {
  const parts: string[] = [];
  if (counts.senior > 0)
    parts.push(`${counts.senior} senior editor${counts.senior === 1 ? "" : "s"}`);
  if (counts.associate > 0)
    parts.push(
      `${counts.associate} associate editor${counts.associate === 1 ? "" : "s"}`,
    );
  if (counts.advisory > 0)
    parts.push(
      `${counts.advisory} advisory board member${counts.advisory === 1 ? "" : "s"}`,
    );
  if (parts.length === 0) return "Our editors";
  if (parts.length === 1) return capitalize(parts[0]!);
  if (parts.length === 2) return capitalize(`${parts[0]} and ${parts[1]}`);
  return capitalize(`${parts.slice(0, -1).join(", ")}, and ${parts.at(-1)}`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
