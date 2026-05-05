import { cn } from "@/lib/cn";

export interface AvatarProps {
  name: string;
  size?: number;
  hue?: number;
  className?: string;
}

export function Avatar({ name, size = 36, hue, className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (hue !== undefined) {
    return (
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] font-serif-display font-medium text-white",
          className,
        )}
        style={{
          width: size,
          height: Math.round(size * 1.25),
          fontSize: Math.round(size * 0.42),
          letterSpacing: "-0.02em",
          background: `linear-gradient(155deg, oklch(80% 0.06 ${hue}) 0%, oklch(60% 0.10 ${hue + 10}) 100%)`,
          textShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 5px)",
          }}
        />
        <span className="relative">{initials}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-semibold text-fg-2",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.4)) }}
    >
      {initials}
    </div>
  );
}
