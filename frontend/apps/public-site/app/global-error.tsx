"use client";

import type { ReactNode } from "react";

/**
 * Top-level error boundary. Required for Next 15 App Router builds —
 * without it the static export of `/_error → /404` pulls in the legacy
 * pages-router `<Html>` shell and fails the build.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          background: "oklch(99% 0.003 90)",
          color: "oklch(20% 0.02 270)",
          margin: 0,
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontSize: 11,
            fontWeight: 600,
            color: "oklch(45% 0.18 255)",
            margin: 0,
          }}
        >
          Something went wrong
        </p>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 500,
            margin: 0,
            fontFamily: "Newsreader, Georgia, serif",
          }}
        >
          We couldn’t load this page
        </h1>
        <p
          style={{
            color: "oklch(35% 0.02 270)",
            maxWidth: 480,
            textAlign: "center",
            fontFamily: "Source Serif 4, Georgia, serif",
            margin: 0,
          }}
        >
          A temporary error prevented the page from rendering.
          {error?.digest ? ` Reference: ${error.digest}.` : null}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 8,
            padding: "8px 16px",
            background: "oklch(45% 0.18 255)",
            border: "none",
            borderRadius: 6,
            color: "white",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
