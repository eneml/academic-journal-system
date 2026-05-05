import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

/**
 * Compact pill used for status / chip / metadata. Variants align with the
 * cobalt-amber palette so the same component covers our editorial states
 * without one-off color overrides.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-bg-tint text-muted border border-border",
        cobalt: "bg-cobalt-soft text-cobalt-deep border border-cobalt/20",
        amber: "bg-amber-soft text-amber-deep border border-amber/30",
        success:
          "bg-[oklch(95%_0.05_155)] text-[oklch(38%_0.13_155)] border border-success/20",
        danger:
          "bg-[#fff5f5] text-[#b91c1c] border border-[#fca5a5]",
        outline:
          "bg-white text-fg-2 border border-border-strong",
        ghost: "bg-transparent text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
