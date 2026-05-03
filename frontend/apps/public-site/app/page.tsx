import Link from "next/link";
import type { ReactNode } from "react";

export default function HomePage(): ReactNode {
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
            <Link href="/about" className="text-fg-2 hover:text-cobalt">
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-24">
            <p
              className="text-cobalt mb-4"
              style={{
                fontFamily: "var(--sans)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Volume 12 &middot; 2026
            </p>
            <h1
              className="text-fg"
              style={{
                fontFamily: "var(--serif-display)",
                fontWeight: 500,
                fontSize: "clamp(40px, 6vw, 72px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                maxWidth: "16ch",
              }}
            >
              Academic Journal
            </h1>
            <p
              className="text-fg-2 mt-6"
              style={{
                fontFamily: "var(--serif-body)",
                fontSize: 20,
                lineHeight: 1.55,
                maxWidth: "60ch",
              }}
            >
              A scholarly journal of original peer-reviewed research.
            </p>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
            <article>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Latest issue</p>
              <h2
                className="text-fg mb-2"
                style={{ fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 22 }}
              >
                Issue placeholder
              </h2>
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)", fontSize: 15 }}>
                The most recent issue will be surfaced here once content is wired through the API.
              </p>
            </article>
            <article>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">Featured articles</p>
              <h2
                className="text-fg mb-2"
                style={{ fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 22 }}
              >
                Article placeholder
              </h2>
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)", fontSize: 15 }}>
                Editor-curated articles will appear in this slot.
              </p>
            </article>
            <article>
              <p className="text-xs uppercase tracking-widest text-muted mb-3">About</p>
              <h2
                className="text-fg mb-2"
                style={{ fontFamily: "var(--serif-display)", fontWeight: 600, fontSize: 22 }}
              >
                About the journal
              </h2>
              <p className="text-fg-2" style={{ fontFamily: "var(--serif-body)", fontSize: 15 }}>
                Mission statement, scope, and editorial board will live here.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>© {new Date().getFullYear()} Academic Journal. All rights reserved.</p>
          <p style={{ fontFamily: "var(--mono)", fontSize: 12 }}>ISSN placeholder</p>
        </div>
      </footer>
    </div>
  );
}
