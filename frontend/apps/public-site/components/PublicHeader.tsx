import Link from "next/link";
import { headers } from "next/headers";
import { Rss, Search } from "lucide-react";
import { Button, LanguageSwitcher } from "@ajs/ui";
import { UserMenu } from "@/components/UserMenu";
import { resolveLocale } from "@/lib/locale";
import { cn } from "@/lib/cn";

const NAV_ITEMS: { label: string; href: string }[] = [
  { label: "About", href: "/about" },
  { label: "Current", href: "/current" },
  { label: "Archive", href: "/archive" },
  { label: "For Authors", href: "/for-authors" },
  { label: "Editorial", href: "/editorial" },
  { label: "Policies", href: "/policies" },
  { label: "Announcements", href: "/announcements" },
  { label: "Contact", href: "/contact" },
];

export interface PublicHeaderProps {
  /** Override the active path detection (defaults to current request path). */
  activePath?: string;
}

const ISSN = process.env.NEXT_PUBLIC_JOURNAL_ISSN ?? "2069-3417";
const JOURNAL_NAME = process.env.NEXT_PUBLIC_JOURNAL_NAME ?? "The Academic Journal";

export async function PublicHeader({ activePath: explicit }: PublicHeaderProps = {}) {
  // Next 15 doesn't expose pathname server-side via a hook; rely on the
  // `x-invoke-path` / `next-url` headers if present. Wrapped in try/catch
  // because headers() throws during static generation (e.g. /404).
  let activePath = explicit;
  if (!activePath) {
    try {
      const h = await headers();
      activePath =
        h.get("x-invoke-path") ?? h.get("next-url") ?? h.get("x-pathname") ?? "/";
    } catch {
      activePath = "/";
    }
  }
  const locale = await resolveLocale();

  return (
    <header className="border-b border-border bg-bg">
      {/* Top utility bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-2 text-[11px] tracking-[0.04em] text-muted lg:px-14">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            ISSN {ISSN}
          </span>
          <span className="hidden text-border-strong sm:inline">·</span>
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            Open Access
          </span>
          <span className="hidden text-border-strong sm:inline">·</span>
          <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]">
            Peer Reviewed
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/feed.xml"
            className="inline-flex items-center gap-1 text-[11px] hover:text-fg"
          >
            <Rss className="h-3 w-3" /> RSS
          </a>
          <LanguageSwitcher current={locale} />
          <UserMenu />
        </div>
      </div>

      {/* Masthead */}
      <div className="border-b border-border px-6 pt-7 pb-5 text-center lg:px-14">
        <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          EST. 1987 · BUCHAREST
        </div>
        <Link
          href="/"
          className="mt-2 block font-serif-display text-[44px] font-medium leading-[1.05] tracking-[-0.015em] text-fg hover:text-cobalt-deep"
        >
          {JOURNAL_NAME}
        </Link>
        <p className="mt-1 font-serif-body text-sm italic text-muted">
          A quarterly review of computational research, methods, and theory
        </p>
      </div>

      {/* Primary navigation */}
      <nav className="flex flex-wrap items-center px-6 lg:px-14">
        {NAV_ITEMS.map((item) => {
          const isActive =
            activePath === item.href ||
            (item.href !== "/" && activePath.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "-mb-px border-b-2 px-4 py-3.5 text-[13px] font-medium tracking-[0.01em] transition-colors lg:px-5",
                isActive
                  ? "border-amber text-fg"
                  : "border-transparent text-fg-2 hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="ml-auto py-2.5">
          <Button asChild variant="ghost" size="sm" className="gap-2 px-2 text-muted">
            <Link href="/search">
              <Search className="h-4 w-4" />
              <span>Search articles</span>
              <kbd className="ml-1 rounded-md border border-border bg-bg-tint px-1.5 py-0.5 font-mono text-[9px] tracking-normal text-muted">
                ⌘K
              </kbd>
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
