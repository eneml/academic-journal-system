import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps): ReactNode {
  return (
    <header style={{ marginBottom: 28, display: "flex", alignItems: "flex-end", gap: 16 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <p className="sc" style={{ color: "var(--muted)", marginBottom: 6 }}>
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            fontFamily: "var(--serif-display)",
            fontWeight: 500,
            fontSize: 32,
            letterSpacing: "-0.01em",
            margin: 0,
            color: "var(--fg)",
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--fg-2)",
              margin: "8px 0 0",
              maxWidth: 720,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div style={{ display: "flex", gap: 8 }}>{actions}</div> : null}
    </header>
  );
}
