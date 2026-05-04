import type { CSSProperties, ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  /** Padded inner content; default true. */
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps): ReactNode {
  return (
    <div
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2)",
        padding: padded ? "20px 22px" : 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
