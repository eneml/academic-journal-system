import Link from "next/link";
import type { ReactNode } from "react";

export interface SiteChromeProps {
  journalName: string;
  /** Highlights the matching nav item. */
  active?: "home" | "issues" | "announcements" | "search" | "about" | null;
  children: ReactNode;
}

/**
 * Shared header + footer wrapper for every public-site page. Keeps
 * navigation consistent without duplicating the chrome on each page.
 */
export function SiteChrome({
  journalName,
  active = null,
  children,
}: SiteChromeProps): ReactNode {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-fg"
            style={{
              fontFamily: "var(--serif-display)",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {journalName}
          </Link>
          <nav className="flex gap-6 text-sm">
            <NavLink href="/" active={active === "home"}>
              Home
            </NavLink>
            <NavLink href="/issues" active={active === "issues"}>
              Archive
            </NavLink>
            <NavLink href="/announcements" active={active === "announcements"}>
              News
            </NavLink>
            <NavLink href="/search" active={active === "search"}>
              Search
            </NavLink>
            <NavLink href="/about" active={active === "about"}>
              About
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} {journalName}. All rights reserved.
          </p>
          <p style={{ display: "flex", gap: 12 }}>
            <Link href="/for-authors" className="hover:text-cobalt">
              For Authors
            </Link>
            <Link href="/contact" className="hover:text-cobalt">
              Contact
            </Link>
            <a href="/feed.xml" className="hover:text-cobalt">
              RSS
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}): ReactNode {
  return (
    <Link
      href={href}
      className={active ? "text-cobalt" : "text-fg-2 hover:text-cobalt"}
    >
      {children}
    </Link>
  );
}
