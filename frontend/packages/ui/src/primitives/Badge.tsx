import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors whitespace-nowrap leading-none h-5",
  {
    variants: {
      variant: {
        default: "bg-bg-tint text-muted border border-border",
        cobalt: "bg-cobalt-soft text-cobalt-deep border border-cobalt/20",
        amber: "bg-amber-soft text-amber-deep border border-amber/30",
        success: "bg-success-soft text-success-deep border border-success-border",
        danger: "bg-danger-soft text-danger-deep border border-danger-border",
        outline: "bg-white text-fg-2 border border-border-strong",
        ghost: "bg-transparent text-muted",
        mono: "bg-bg-tint text-muted border border-border font-mono normal-case tracking-normal text-[10.5px]",
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
