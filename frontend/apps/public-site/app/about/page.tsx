import Link from "next/link";
import type { ReactNode } from "react";

export default function AboutPage(): ReactNode {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-fg"
            style={{ fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 18 }}
          >
            Academic Journal
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/" className="text-fg-2 hover:text-cobalt">
              Home
            </Link>
            <Link href="/about" className="text-cobalt">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <article className="max-w-2xl mx-auto px-6 py-20">
          <p className="text-xs uppercase tracking-widest text-muted mb-4">About</p>
          <h1
            className="text-fg mb-8"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 500,
              fontSize: 48,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            About the journal
          </h1>
          <div
            style={{
              fontFamily: "var(--serif-body)",
              fontSize: 18,
              lineHeight: 1.72,
              color: "var(--fg)",
            }}
          >
            <p>
              Mission, scope, and editorial board content will be sourced from the backend in a
              later iteration.
            </p>
          </div>
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted">
          <p>© {new Date().getFullYear()} Academic Journal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
