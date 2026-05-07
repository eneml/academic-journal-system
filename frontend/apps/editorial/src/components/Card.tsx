import type { CSSProperties, ReactNode } from "react";
import { cn } from "../lib/cn";

export interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Padded inner content; default true. */
  padded?: boolean;
}

export function Card({
  children,
  className,
  style,
  padded = true,
}: CardProps): ReactNode {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-bg",
        padded && "px-[22px] py-5",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
