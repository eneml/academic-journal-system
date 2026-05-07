import Link from "next/link";
import type { ReactNode } from "react";

const FOOTER_COLUMNS = [
  {
    title: "Browse",
    links: [
      { label: "Current Issue", href: "/current" },
      { label: "Archive", href: "/archive" },
      { label: "By Section", href: "/archive?view=sections" },
      { label: "By Author", href: "/archive?view=authors" },
      { label: "Announcements", href: "/announcements" },
    ],
  },
  {
    title: "For Authors",
    links: [
      { label: "Submission Guidelines", href: "/for-authors" },
      { label: "Submit Manuscript", href: "/for-authors#submit" },
      { label: "Author Charges", href: "/for-authors#charges" },
      { label: "Copyright", href: "/policies#copyright" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Editorial Board", href: "/editorial" },
      { label: "Peer Review", href: "/policies#peer-review" },
      { label: "Ethics Statement", href: "/policies#ethics" },
      { label: "Privacy", href: "/policies#privacy" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

const ISSN = process.env.NEXT_PUBLIC_JOURNAL_ISSN ?? null;
const JOURNAL_NAME = process.env.NEXT_PUBLIC_JOURNAL_NAME ?? "The Academic Journal";

export interface PublicFooterProps {
  /** Optional Latin / motto line rendered with flanking rules. Hidden when null. */
  tagline?: string | null;
  /** Optional indexing chips strip (rendered next to the journal blurb). */
  indexedIn?: string[];
}

export function PublicFooter({
  tagline = null,
  indexedIn = [],
}: PublicFooterProps = {}) {
  const year = new Date().getFullYear();
  const { lead, accent, trail } = splitAccent(JOURNAL_NAME);

  return (
    <footer className="ink-bg mt-24 px-6 pt-14 pb-7 text-[oklch(82%_0.01_270)] lg:px-14">
      {tagline ? (
        <div className="mb-9 flex items-center justify-center gap-3 text-[oklch(70%_0.02_270)]">
          <span
            className="basis-16 border-t border-[oklch(40%_0.02_270)]"
            aria-hidden
          />
          <span
            className="font-sans text-[10.5px] font-semibold uppercase"
            style={{ letterSpacing: "0.22em" }}
          >
            {tagline}
          </span>
          <span
            className="basis-16 border-t border-[oklch(40%_0.02_270)]"
            aria-hidden
          />
        </div>
      ) : null}

      <div className="grid gap-12 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-2.5 font-serif-display text-[26px] font-medium leading-[1.05] tracking-[-0.015em] text-white">
            {lead}
            {accent ? (
              <span className="font-normal italic"> {accent}</span>
            ) : null}
            {trail ? <> {trail}</> : null}
          </div>
          <p className="m-0 mb-4 max-w-md font-serif-body text-[13.5px] leading-[1.65] text-[oklch(74%_0.01_270)]">
            A peer-reviewed journal of computational research, methods, and
            theory. Open access — no embargo, no article processing charges.
          </p>
          {indexedIn.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2.5">
              {indexedIn.map((s) => (
                <IndexingChip key={s} label={s} />
              ))}
            </div>
          ) : null}
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="sc mb-3.5 text-white" style={{ letterSpacing: "0.16em" }}>
              {col.title}
            </div>
            <ul className="m-0 space-y-2 p-0 list-none">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-serif-body text-[13px] text-[oklch(78%_0.01_270)] no-underline hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-[oklch(28%_0.02_270)] pt-5 text-[11px] tracking-[0.04em] text-[oklch(60%_0.01_270)] sm:flex-row sm:items-center">
        <div className="sc" style={{ letterSpacing: "0.14em" }}>
          © {year} · CC BY 4.0{ISSN ? ` · ISSN ${ISSN}` : ""}
        </div>
        <div className="flex flex-wrap gap-4 font-mono text-[10.5px] tracking-[0.04em]">
          <span>DOI Foundation Member</span>
          <span aria-hidden>·</span>
          <span>COPE Signatory</span>
          <span aria-hidden>·</span>
          <span>OAI-PMH 2.0</span>
        </div>
      </div>
    </footer>
  );
}

function IndexingChip({ label }: { label: string }): ReactNode {
  return (
    <span
      className="rounded-sm border px-2.5 py-1 font-sans text-[9.5px] font-semibold uppercase tracking-[0.1em]"
      style={{
        borderColor: "oklch(40% 0.02 270)",
        background: "oklch(22% 0.025 270)",
        color: "oklch(78% 0.02 270)",
      }}
    >
      {label}
    </span>
  );
}

/**
 * Splits a journal name like "The Academic Journal" into parts so we can
 * italicise a single accent word the way the handoff masthead does. If the
 * name has fewer than 2 words we leave the accent and trail empty and just
 * render the lead.
 */
function splitAccent(name: string): {
  lead: string;
  accent: string | null;
  trail: string | null;
} {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 3) {
    return { lead: name, accent: null, trail: null };
  }
  const [lead, accent, ...rest] = parts;
  return {
    lead: lead!,
    accent: accent ?? null,
    trail: rest.length > 0 ? rest.join(" ") : null,
  };
}
