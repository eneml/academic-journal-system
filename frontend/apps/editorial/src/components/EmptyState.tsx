import type { ReactNode } from "react";
import { Icon, type IconName } from "@ajs/ui/primitives";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps): ReactNode {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "44px 24px",
        border: "1px dashed var(--border-strong)",
        borderRadius: "var(--r-2)",
        background: "var(--surface)",
        color: "var(--fg-2)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-2)",
          color: "var(--muted)",
          marginBottom: 12,
        }}
      >
        <Icon name={icon} size={18} />
      </div>
      <p
        style={{
          fontFamily: "var(--serif-display)",
          fontSize: 17,
          fontWeight: 500,
          color: "var(--fg)",
          margin: 0,
        }}
      >
        {title}
      </p>
      {description ? (
        <p style={{ fontSize: 13, marginTop: 6, maxWidth: 380, lineHeight: 1.55 }}>
          {description}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}
