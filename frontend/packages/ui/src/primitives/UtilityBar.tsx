import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface UtilityBarProps {
  /** ISSN string rendered as the first small-caps token. Optional. */
  issn?: string | null;
  /** Show the green Open Access pill. Default true. */
  openAccess?: boolean;
  /** "Peer Reviewed", "Indexed Scopus · WoS", etc. — rendered after the OA pill. */
  ribbons?: string[];
  /** RSS feed link target. Pass `null` to hide. Default `/feed.xml`. */
  rssHref?: string | null;
  /** The right-side slot — language switcher + sign-in / user menu. Caller composes. */
  rightSlot?: ReactNode;
  /** Extra left-side content rendered after the indexing ribbons. */
  leftExtras?: ReactNode;
  className?: string;
}

const DOT = (
  <span className="text-border-strong" aria-hidden>
    ·
  </span>
);

/**
 * Top utility row used on both the public site header and the editorial shell.
 * Layout-only — the caller wires up the language switcher and user menu.
 */
export function UtilityBar({
  issn,
  openAccess = true,
  ribbons = [],
  rssHref = "/feed.xml",
  rightSlot,
  leftExtras,
  className,
}: UtilityBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-y-1 border-b border-border bg-bg-tint px-6 py-2 font-sans text-[11px] text-muted lg:px-14",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {issn ? (
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">
            ISSN {issn}
          </span>
        ) : null}
        {issn && (openAccess || ribbons.length > 0) ? DOT : null}
        {openAccess ? <span className="oa-badge h-[17px]">OPEN ACCESS</span> : null}
        {ribbons.map((label, i) => (
          <span key={`${label}-${i}`} className="flex items-center gap-3 sm:gap-4">
            {DOT}
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em]">
              {label}
            </span>
          </span>
        ))}
        {leftExtras ? <span className="ml-1 inline-flex items-center">{leftExtras}</span> : null}
      </div>
      <div className="flex items-center gap-3">
        {rssHref ? (
          <a
            href={rssHref}
            className="inline-flex items-center gap-1 text-[11px] hover:text-fg"
            aria-label="RSS feed"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11a9 9 0 0 1 9 9" />
              <path d="M4 4a16 16 0 0 1 16 16" />
              <circle cx="5" cy="19" r="1.5" />
            </svg>
            RSS
          </a>
        ) : null}
        {rssHref && rightSlot ? (
          <span className="hidden h-3.5 w-px bg-border sm:inline-block" aria-hidden />
        ) : null}
        {rightSlot}
      </div>
    </div>
  );
}
