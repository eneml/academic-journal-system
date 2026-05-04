import Link from "next/link";
import type { ReactNode } from "react";

export default function NotFound(): ReactNode {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <p className="text-cobalt text-xs uppercase tracking-widest">404</p>
      <h1
        className="text-fg"
        style={{
          fontFamily: "var(--serif-display)",
          fontWeight: 500,
          fontSize: "clamp(40px, 6vw, 64px)",
        }}
      >
        Page not found
      </h1>
      <p
        className="text-fg-2 text-center max-w-md"
        style={{ fontFamily: "var(--serif-body)" }}
      >
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link href="/" className="text-cobalt mt-2">
        ← Back to home
      </Link>
    </div>
  );
}
