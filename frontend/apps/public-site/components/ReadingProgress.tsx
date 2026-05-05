"use client";

import { useEffect, useState } from "react";

/**
 * Hairline at the very top of the article that grows as the user scrolls
 * past the article body. Tracks the *article* rect (not the page) so the
 * masthead and footer don't pollute the percentage.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      const ratio = total <= 0 ? 1 : scrolled / total;
      setPct(Math.min(1, Math.max(0, ratio)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div className="sticky top-0 z-10 h-0.5 bg-border">
      <div
        className="h-full bg-amber transition-[width] duration-150"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}
