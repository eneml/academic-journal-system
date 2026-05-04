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
              An open-access scholarly journal publishing peer-reviewed
              research. Articles are released as soon as they clear
              production — there is no embargo and no article-processing
              charge for authors.
            </p>
            <p style={{ marginTop: 18 }}>
              Mission, scope, and section descriptions will be sourced from
              the backend in a later iteration.
            </p>
          </div>

          <ul
            style={{
              listStyle: "none",
              margin: "32px 0 0",
              padding: 0,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            {[
              { href: "/about/editorial-board", title: "Editorial Board", body: "Editors, advisors, and section editors." },
              { href: "/for-authors", title: "For Authors", body: "How to submit, peer review, open access." },
              { href: "/contact", title: "Contact", body: "How to reach the editorial office." },
              { href: "/issues", title: "Archive", body: "Browse all published issues." },
            ].map((card) => (
              <li key={card.href}>
                <Link
                  href={card.href}
                  style={{
                    display: "block",
                    padding: "14px 16px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--r-2)",
                    background: "var(--surface)",
                    textDecoration: "none",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "var(--serif-display)",
                      fontWeight: 600,
                      fontSize: 17,
                      color: "var(--fg)",
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontFamily: "var(--sans)",
                      fontSize: 13,
                      color: "var(--muted)",
                    }}
                  >
                    {card.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
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
