"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export interface SectionItem {
  /** DOM id of the section heading anchor (without the leading `#`). */
  id: string;
  label: string;
  count?: number;
}

export interface SectionScrollSpyProps {
  items: SectionItem[];
  /** Optional class for the active link (defaults to amber border + bold). */
  activeClassName?: string;
  /** Optional class for inactive links (defaults to muted). */
  inactiveClassName?: string;
}

/**
 * Scroll-spy navigation for the in-issue / on-this-page section sidebars.
 * Uses IntersectionObserver to keep the highlighted entry in sync with the
 * section the reader is currently looking at, so the amber underline isn't
 * stuck on the first section forever.
 *
 * The component falls back to the first item when nothing is intersecting
 * (e.g. above the first section) so the rail never reads as "all greyed
 * out" — the amber bar is always anchored somewhere.
 */
export function SectionScrollSpy({
  items,
  activeClassName = "border-amber font-semibold text-fg",
  inactiveClassName = "border-transparent text-fg-2 hover:text-fg",
}: SectionScrollSpyProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0) return;

    const targets = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (targets.length === 0) return;

    // Recompute the highlight from the current geometry of every target —
    // more robust than relying purely on IntersectionObserver entries,
    // especially at page top/bottom and immediately after anchor jumps.
    function recomputeFromScroll(): void {
      // Activation line sits ~30% from the top of the viewport. The
      // section whose top has crossed that line (and is closest to it
      // from above) is the "current" one. If nothing has crossed yet
      // (we're above the first heading), fall back to the first item.
      const activationLine = window.innerHeight * 0.3;
      let bestId = items[0]?.id ?? "";
      let bestTop = -Infinity;
      let crossed = false;
      for (const t of targets) {
        const top = t.getBoundingClientRect().top;
        if (top - activationLine <= 0 && top > bestTop) {
          bestTop = top;
          bestId = t.id;
          crossed = true;
        }
      }
      if (!crossed) bestId = items[0]?.id ?? "";
      setActiveId(bestId);
    }

    recomputeFromScroll();

    // Re-run whenever any heading enters/leaves the viewport, plus on
    // raw scroll/resize events for the edge cases the observer misses.
    const observer = new IntersectionObserver(recomputeFromScroll, {
      rootMargin: "-30% 0px -60% 0px",
      threshold: [0, 0.25, 0.5, 0.75, 1],
    });
    targets.forEach((t) => observer.observe(t));

    window.addEventListener("scroll", recomputeFromScroll, { passive: true });
    window.addEventListener("resize", recomputeFromScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", recomputeFromScroll);
      window.removeEventListener("resize", recomputeFromScroll);
    };
  }, [items]);

  return (
    <ul className="flex flex-col gap-2 text-[13px] m-0 p-0 list-none">
      {items.map((it) => {
        const active = it.id === activeId;
        return (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              className={cn(
                "flex justify-between border-l-2 pl-2.5 no-underline",
                active ? activeClassName : inactiveClassName,
              )}
            >
              <span>{it.label}</span>
              {typeof it.count === "number" ? (
                <span className="font-mono text-[11px] tabular-nums text-muted">
                  {it.count}
                </span>
              ) : null}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
