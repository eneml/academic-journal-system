import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Optional small-caps eyebrow above the title. */
  eyebrow?: string;
  title: string;
  /** Subtitle line — short editorial summary like "47 active manuscripts across 5 stages". */
  description?: string;
  /** Right-aligned actions row (e.g. Filter / Sort / New submission buttons). */
  actions?: ReactNode;
}

/**
 * Page header used inside {@code AppShell}'s main column. Matches the design
 * handoff: 22px sans headline (not the marketing-site serif), tight tracking,
 * gray subtitle, and an optional actions slot pinned to the right. Dropping
 * down to sans here is intentional — the editorial app is utility, not
 * editorial display.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps): ReactNode {
  return (
    <div
      style={{
        marginBottom: 18,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 16,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {eyebrow ? (
          <p
            className="sc"
            style={{
              color: "var(--muted)",
              marginBottom: 6,
              fontSize: 9.5,
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            fontFamily: "var(--sans)",
            color: "var(--fg)",
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            style={{
              fontSize: 13,
              color: "var(--muted)",
              margin: "4px 0 0",
              fontFamily: "var(--sans)",
              maxWidth: 720,
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ display: "flex", gap: 6, flex: "none" }}>{actions}</div>
      ) : null}
    </div>
  );
}
