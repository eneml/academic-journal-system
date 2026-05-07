"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import {
  defaultLocale,
  locales,
  readLocaleCookie,
  setLocaleCookie,
  type Locale,
} from "@ajs/i18n";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./DropdownMenu";

const LANG_LABEL: Record<Locale, string> = {
  en: "English",
  ro: "Română",
};

const LANG_FLAG: Record<Locale, string> = {
  en: "🇬🇧",
  ro: "🇷🇴",
};

export interface LanguageSwitcherProps {
  /** Pre-resolved locale (used by SSR contexts to avoid hydration flash). */
  current?: Locale;
  /**
   * Visual style. `compact` is the default (button trigger showing the active
   * code). `inline` renders the masthead-style row: globe + active code + a
   * muted tail of decorative locale codes + chevron.
   */
  variant?: "compact" | "inline";
  /**
   * Codes shown muted after the active one in `inline` mode. Decorative only —
   * picking one of these is a no-op until translations exist.
   */
  decorativeLocales?: string[];
  /**
   * Optional hook invoked after the cookie is set and before the page reloads.
   * Apps with an authenticated session use this to persist the choice on the
   * user record (e.g. `PATCH /api/v1/users/me/preferences`). Errors here do
   * not block the cookie write — the UI flips locale either way.
   */
  onPick?: (next: Locale) => void | Promise<void>;
}

const DECORATIVE_DEFAULT = ["DE", "FR"];

export function LanguageSwitcher({
  current: initial,
  variant = "compact",
  decorativeLocales = DECORATIVE_DEFAULT,
  onPick,
}: LanguageSwitcherProps = {}) {
  const [current, setCurrent] = useState<Locale>(initial ?? defaultLocale);

  useEffect(() => {
    if (initial) return;
    const fromCookie = readLocaleCookie();
    if (fromCookie && fromCookie !== current) setCurrent(fromCookie);
  }, [initial, current]);

  async function pick(next: Locale): Promise<void> {
    if (next === current) return;
    setLocaleCookie(next);
    try {
      await onPick?.(next);
    } catch {
      // Persistence failure is non-fatal — cookie + reload still apply locally.
    }
    if (typeof window !== "undefined") window.location.reload();
  }

  const trigger =
    variant === "inline" ? (
      <button
        type="button"
        aria-label="Change language"
        className="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 font-sans text-[11px] text-fg-2 transition-colors hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
      >
        <Globe className="size-3 text-muted" aria-hidden />
        <span className="font-semibold text-fg uppercase">{current}</span>
        {decorativeLocales.length > 0 ? (
          <span className="text-[10px] text-muted-2" aria-hidden>
            {decorativeLocales.map((c) => `· ${c}`).join(" ")}
          </span>
        ) : null}
        <ChevronDown className="size-2.5 text-muted" aria-hidden />
      </button>
    ) : (
      <Button
        variant="ghost"
        size="sm"
        className="text-[11.5px] uppercase tracking-wider"
        aria-label="Change language"
      >
        {current}
      </Button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {locales.map((loc) => (
          <DropdownMenuItem key={loc} onClick={() => void pick(loc)}>
            <span aria-hidden className="mr-1 text-[14px] leading-none">
              {LANG_FLAG[loc]}
            </span>
            <span className="flex-1">{LANG_LABEL[loc]}</span>
            {current === loc ? (
              <span aria-hidden className="text-cobalt">
                ✓
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
