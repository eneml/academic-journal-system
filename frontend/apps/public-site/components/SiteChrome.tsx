import Link from "next/link";
import type { ReactNode } from "react";
import { locales, type Locale } from "@ajs/i18n";
import { getT } from "@/lib/locale";

export interface SiteChromeProps {
  journalName: string;
  /** Highlights the matching nav item. */
  active?: "home" | "issues" | "announcements" | "search" | "about" | null;
  children: ReactNode;
}

/**
 * Shared header + footer wrapper for every public-site page. Keeps
 * navigation consistent without duplicating the chrome on each page.
 * Reads the active locale via cookie / Accept-Language so nav labels and
 * the locale switcher always match the user's preference.
 */
export async function SiteChrome({
  journalName,
  active = null,
  children,
}: SiteChromeProps): Promise<ReactNode> {
  const { locale, t } = await getT();
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
              {t("nav.home")}
            </NavLink>
            <NavLink href="/issues" active={active === "issues"}>
              {t("nav.issues")}
            </NavLink>
            <NavLink href="/announcements" active={active === "announcements"}>
              {t("nav.announcements")}
            </NavLink>
            <NavLink href="/search" active={active === "search"}>
              {t("common.search")}
            </NavLink>
            <NavLink href="/about" active={active === "about"}>
              {t("nav.about")}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>
            © {new Date().getFullYear()} {journalName}. {t("footer.allRightsReserved")}
          </p>
          <p style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/for-authors" className="hover:text-cobalt">
              {t("nav.forAuthors")}
            </Link>
            <Link href="/contact" className="hover:text-cobalt">
              {t("nav.contact")}
            </Link>
            <a href="/feed.xml" className="hover:text-cobalt">
              RSS
            </a>
            <LocaleSwitch active={locale} />
          </p>
        </div>
      </footer>
    </div>
  );
}

function LocaleSwitch({ active }: { active: Locale }): ReactNode {
  return (
    <span
      style={{
        display: "inline-flex",
        gap: 4,
        marginLeft: 8,
        paddingLeft: 12,
        borderLeft: "1px solid var(--border)",
        fontFamily: "var(--mono)",
        fontSize: 11,
      }}
    >
      {locales.map((l, i) => (
        <span key={l}>
          {i > 0 ? <span style={{ color: "var(--border)" }}>·</span> : null}
          <a
            href={`/api/locale?to=${l}`}
            className={l === active ? "text-cobalt" : "hover:text-cobalt"}
            style={{
              padding: "0 4px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: l === active ? 600 : 400,
            }}
          >
            {l}
          </a>
        </span>
      ))}
    </span>
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
