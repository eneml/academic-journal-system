import Link from "next/link";
import type { ReactNode } from "react";
import { locales, type Locale } from "@ajs/i18n";
import { getT } from "@/lib/locale";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

export type ActiveNav =
  | "current"
  | "archive"
  | "about"
  | "editorial-board"
  | "for-authors"
  | "for-reviewers"
  | "contact"
  | null;

export interface SiteChromeProps {
  journalName: string;
  /** Highlights the matching tab. */
  active?: ActiveNav;
  /** Optional tagline shown under the masthead title. */
  tagline?: string;
  children: ReactNode;
}

const NAV_ITEMS: Array<{ key: ActiveNav; href: string; label: string }> = [
  { key: "current",         href: "/",                       label: "Current" },
  { key: "archive",         href: "/issues",                 label: "Archive" },
  { key: "about",           href: "/about",                  label: "About" },
  { key: "editorial-board", href: "/about/editorial-board",  label: "Editorial Board" },
  { key: "for-authors",     href: "/for-authors",            label: "For Authors" },
  { key: "for-reviewers",   href: "/policies",               label: "For Reviewers" },
  { key: "contact",         href: "/contact",                label: "Contact" },
];

/**
 * Site chrome modeled on the design handoff: top metadata bar, centered
 * masthead, tabbed nav with amber underline, dark global footer.
 */
export async function SiteChrome({
  journalName,
  active = null,
  tagline,
  children,
}: SiteChromeProps): Promise<ReactNode> {
  const { locale } = await getT();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
      }}
    >
      <header
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Top metadata strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 56px",
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--muted)",
            letterSpacing: "0.04em",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <span className="sc">Open Access</span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span className="sc">Peer Reviewed</span>
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <a
              href="/feed.xml"
              style={{
                fontSize: 11,
                fontWeight: 500,
                textDecoration: "none",
                color: "var(--fg-2)",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <RssIcon /> RSS
            </a>
            <LocaleSwitcher active={locale} />
            <a
              href={EDITORIAL_APP_URL}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--fg)",
                textDecoration: "none",
                padding: "4px 10px",
              }}
            >
              Sign in
            </a>
          </div>
        </div>

        {/* Centered masthead */}
        <div
          style={{
            padding: "32px 56px 24px",
            textAlign: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Link
            href="/"
            style={{
              display: "inline-block",
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: 44,
              margin: 0,
              letterSpacing: "-0.015em",
              color: "var(--fg)",
              lineHeight: 1.05,
              textDecoration: "none",
            }}
          >
            {journalName}
          </Link>
          {tagline ? (
            <div
              style={{
                marginTop: 6,
                fontFamily: "var(--serif-body)",
                fontStyle: "italic",
                color: "var(--muted)",
                fontSize: 14,
              }}
            >
              {tagline}
            </div>
          ) : null}
        </div>

        {/* Tab nav */}
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 0,
            padding: "0 56px",
          }}
        >
          {NAV_ITEMS.map((n) => {
            const isActive = active === n.key;
            return (
              <Link
                key={n.key}
                href={n.href}
                style={{
                  padding: "14px 22px",
                  fontSize: 13,
                  fontWeight: 500,
                  color: isActive ? "var(--fg)" : "var(--fg-2)",
                  textDecoration: "none",
                  borderBottom: isActive
                    ? "2px solid var(--amber)"
                    : "2px solid transparent",
                  marginBottom: -1,
                  letterSpacing: "0.01em",
                }}
              >
                {n.label}
              </Link>
            );
          })}
          <div style={{ flex: 1 }} />
          <Link
            href="/search"
            style={{
              padding: "10px 8px",
              color: "var(--muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <SearchIcon />
            Search articles
            <span
              className="chip chip-mono"
              style={{ fontSize: 9, height: 16, padding: "0 5px" }}
            >
              ⌘K
            </span>
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <SiteFooter journalName={journalName} />
    </div>
  );
}

function SiteFooter({ journalName }: { journalName: string }): ReactNode {
  return (
    <footer
      style={{
        background: "oklch(18% 0.018 270)",
        color: "oklch(80% 0.01 270)",
        padding: "48px 56px 28px",
        marginTop: 80,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
          gap: 40,
          paddingBottom: 36,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--serif-display)",
              fontSize: 22,
              color: "white",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              marginBottom: 8,
            }}
          >
            {journalName}
          </div>
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 13,
              lineHeight: 1.6,
              color: "oklch(72% 0.01 270)",
              margin: 0,
              maxWidth: 360,
            }}
          >
            A peer-reviewed, open-access scholarly journal. Articles are
            released as soon as they clear production — no embargo, no
            article-processing charge.
          </p>
        </div>
        {[
          {
            t: "Browse",
            l: [
              { label: "Current Issue", href: "/" },
              { label: "Archive", href: "/issues" },
              { label: "Search", href: "/search" },
              { label: "Announcements", href: "/announcements" },
            ],
          },
          {
            t: "For Authors",
            l: [
              { label: "Submission Guidelines", href: "/for-authors" },
              { label: "Submit Manuscript", href: EDITORIAL_APP_URL },
              { label: "Policies", href: "/policies" },
            ],
          },
          {
            t: "Editorial",
            l: [
              { label: "Editorial Board", href: "/about/editorial-board" },
              { label: "Peer Review", href: "/policies" },
              { label: "Contact", href: "/contact" },
            ],
          },
        ].map((c) => (
          <div key={c.t}>
            <div
              className="sc"
              style={{ color: "white", marginBottom: 12 }}
            >
              {c.t}
            </div>
            {c.l.map((x) => (
              <div
                key={x.label}
                style={{
                  fontSize: 13,
                  marginBottom: 7,
                  color: "oklch(75% 0.01 270)",
                }}
              >
                <a
                  href={x.href}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {x.label}
                </a>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          borderTop: "1px solid oklch(28% 0.02 270)",
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 11,
          color: "oklch(58% 0.01 270)",
          letterSpacing: "0.04em",
        }}
      >
        <div className="sc">
          © {new Date().getFullYear()} {journalName}
        </div>
        <div style={{ display: "flex", gap: 18 }}>
          <span>COPE Signatory</span>
          <span>OAI-PMH</span>
        </div>
      </div>
    </footer>
  );
}

function LocaleSwitcher({ active }: { active: Locale }): ReactNode {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        border: "1px solid var(--border)",
        borderRadius: 4,
        padding: "3px 8px",
        fontSize: 11,
        fontWeight: 500,
        color: "var(--fg-2)",
        fontFamily: "var(--sans)",
      }}
    >
      <GlobeIcon />
      {locales.map((l, i) => (
        <span key={l}>
          {i > 0 ? <span style={{ color: "var(--border)" }}>·</span> : null}
          <a
            href={`/api/locale?to=${l}`}
            style={{
              padding: "0 3px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: l === active ? "var(--fg)" : "var(--muted)",
              fontWeight: l === active ? 600 : 400,
              textDecoration: "none",
            }}
          >
            {l}
          </a>
        </span>
      ))}
    </span>
  );
}

function GlobeIcon(): ReactNode {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function SearchIcon(): ReactNode {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx={11} cy={11} r={7} />
      <path d="m20 20-3.5-3.5" />
    </svg>
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
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 19a2 2 0 1 0 .001-3.999A2 2 0 0 0 5 19ZM4 12a8 8 0 0 1 8 8M4 5a15 15 0 0 1 15 15" />
    </svg>
  );
}
