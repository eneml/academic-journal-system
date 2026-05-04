import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Bare full-screen wrapper used by /login and /register. Echoes the
 * editorial app's brand block (AJ cube + journal name + workbench
 * subtitle) so the auth pages don't feel like a separate site, then
 * renders the form card centered with reading-comfortable width.
 */
export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}): ReactNode {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        background: "var(--bg-tint)",
        fontFamily: "var(--sans)",
      }}
    >
      <header
        style={{
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 5,
              background: "var(--cobalt)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            AJ
          </span>
          <span>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1.1,
              }}
            >
              The Academic Journal
            </span>
            <span
              style={{
                display: "block",
                fontSize: 10.5,
                color: "var(--muted)",
                fontFamily: "var(--mono)",
              }}
            >
              Editorial workbench
            </span>
          </span>
        </Link>
      </header>

      <main
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "24px 24px 48px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "28px 28px 24px",
            boxShadow:
              "0 1px 2px oklch(20% 0.02 270 / 0.04), 0 0 0 1px oklch(91% 0.008 90)",
          }}
        >
          <p
            className="sc"
            style={{
              color: "var(--cobalt)",
              marginBottom: 8,
              fontSize: 9.5,
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
              margin: "0 0 6px",
              color: "var(--fg)",
            }}
          >
            {title}
          </h1>
          {description ? (
            <p
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--fg-2)",
                margin: "0 0 20px",
              }}
            >
              {description}
            </p>
          ) : (
            <div style={{ marginBottom: 20 }} />
          )}
          {children}
        </div>
      </main>

      <footer
        style={{
          padding: "16px 28px 24px",
          textAlign: "center",
          fontSize: 11.5,
          color: "var(--muted)",
        }}
      >
        {footer ?? (
          <span>
            © {new Date().getFullYear()} The Academic Journal
          </span>
        )}
      </footer>
    </div>
  );
}

// Shared field styles so /login and /register stay in sync without dup'd CSS.

export const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--border-strong)",
  borderRadius: 5,
  fontFamily: "var(--sans)",
  fontSize: 14,
  color: "var(--fg)",
  background: "var(--bg)",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "var(--fg-2)",
  marginBottom: 4,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export const errorBoxStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid oklch(85% 0.10 25)",
  background: "oklch(96% 0.04 25)",
  color: "oklch(40% 0.18 25)",
  borderRadius: 5,
  fontSize: 13,
  margin: "4px 0 14px",
};
