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
          "bg-cobalt text-white shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_1px_2px_rgba(0,0,0,0.06)] hover:bg-cobalt-deep active:translate-y-px",
        secondary:
          "bg-white text-fg-2 border border-border hover:border-border-strong hover:text-fg active:translate-y-px",
        outline:
          "bg-transparent text-fg-2 border border-border hover:bg-bg-tint hover:text-fg",
        ghost:
          "bg-transparent text-fg-2 hover:bg-bg-tint hover:text-fg",
        link: "bg-transparent text-cobalt underline-offset-4 hover:underline px-0 h-auto",
        destructive:
          "bg-white text-danger-deep border border-danger-border hover:bg-danger-soft",
        invert:
          "bg-white text-cobalt-deep hover:bg-bg-tint border border-white",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-[12.5px]",
        lg: "h-10 px-5 text-[14px]",
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
