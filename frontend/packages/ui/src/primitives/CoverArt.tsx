import { cn } from "../lib/cn";

export interface CoverArtProps {
  width?: number | string;
  height?: number | string;
  hue?: number;
  label?: string;
  year?: number | string | null;
  src?: string | null;
  className?: string;
}

/**
 * Issue cover. With `src`, renders the supplied image inside an aspect-locked
 * frame; without, falls back to the cobalt-gradient placeholder cover.
 */
export function CoverArt({
  width = 220,
  height = 308,
  hue = 255,
  label = "Vol. 12",
  year = "",
  src,
  className,
}: CoverArtProps) {
  if (src) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[2px] bg-cover bg-center shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
          className,
        )}
        role="img"
        aria-label={label}
        style={{ width, height, backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2px] shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.15),inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        className,
      )}
      style={{
        width,
        height,
        background: `linear-gradient(155deg, oklch(35% 0.16 ${hue}) 0%, oklch(28% 0.14 ${hue + 10}) 100%)`,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 6px)",
        }}
      />
      <div className="absolute left-2 right-2 top-2 border-y border-white/25 py-1 text-center font-serif-display text-[9px] font-medium uppercase tracking-[0.18em] text-white">
        Academic Journal
      </div>
      <div className="absolute bottom-3 left-2 right-2 font-serif-display text-[22px] font-medium leading-tight tracking-[-0.01em] text-white">
        {label}
      </div>
      {year ? (
        <div className="absolute bottom-1.5 right-2 font-mono text-[8px] tracking-[0.05em] text-white/70">
          {year}
        </div>
      ) : null}
    </div>
  );
}
