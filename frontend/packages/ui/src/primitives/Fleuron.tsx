import { cn } from "../lib/cn";

export interface FleuronProps {
  /** Centered glyph. Default `❦`. Pass any decorative ornament. */
  ornament?: string;
  className?: string;
  /** Tailwind text-size class for the ornament glyph. */
  ornamentClassName?: string;
}

/**
 * Centered ornament divider — two flanking hairlines with a glyph in the middle.
 * Used as a soft section break on the public homepage.
 */
export function Fleuron({
  ornament = "❦",
  className,
  ornamentClassName = "text-[18px]",
}: FleuronProps) {
  return (
    <div className={cn("fleuron", className)} role="presentation">
      <span className={ornamentClassName} aria-hidden>
        {ornament}
      </span>
    </div>
  );
}
