import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-sans text-sm font-medium leading-none transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "text-white border border-cobalt-deep bg-[linear-gradient(180deg,oklch(48%_0.19_255)_0%,var(--cobalt)_50%,var(--cobalt-deep)_100%)] shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.18),0_1px_0_0_oklch(20%_0.16_258/0.4),0_4px_12px_-4px_oklch(35%_0.16_258/0.45)] hover:bg-[linear-gradient(180deg,var(--cobalt)_0%,var(--cobalt-deep)_100%)] hover:shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.18),0_1px_0_0_oklch(20%_0.16_258/0.4),0_8px_16px_-4px_oklch(35%_0.16_258/0.5)] active:translate-y-px",
        amber:
          "border border-amber-deep text-[oklch(20%_0.06_65)] font-semibold bg-[linear-gradient(180deg,oklch(76%_0.16_75)_0%,var(--amber)_50%,var(--amber-deep)_100%)] shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.25),0_1px_0_0_oklch(35%_0.13_60/0.3),0_4px_12px_-4px_oklch(56%_0.16_65/0.35)] hover:bg-[linear-gradient(180deg,var(--amber)_0%,var(--amber-deep)_100%)] active:translate-y-px",
        secondary:
          "bg-paper text-fg border border-border-strong shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.6),0_1px_0_0_oklch(20%_0.02_270/0.02)] hover:bg-surface hover:border-border-ink hover:-translate-y-px hover:shadow-[inset_0_1px_0_0_oklch(100%_0_0/0.6),0_4px_8px_-2px_oklch(20%_0.02_270/0.08)] active:translate-y-px",
        outline:
          "bg-transparent text-fg-2 border border-border hover:bg-bg-tint hover:text-fg",
        ghost:
          "bg-transparent text-fg-2 hover:bg-bg-tint hover:text-fg",
        link: "bg-transparent text-cobalt underline-offset-4 hover:underline px-0 h-auto",
        destructive:
          "bg-paper text-danger-deep border border-danger-border hover:bg-danger-soft",
        invert:
          "bg-white text-cobalt-deep hover:bg-bg-tint border border-white",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12.5px]",
        lg: "h-11 px-5 text-[14px]",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
