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
}

export function LanguageSwitcher({ current: initial }: LanguageSwitcherProps = {}) {
  const [current, setCurrent] = useState<Locale>(initial ?? defaultLocale);

  useEffect(() => {
    if (initial) return;
    const fromCookie = readLocaleCookie();
    if (fromCookie && fromCookie !== current) setCurrent(fromCookie);
  }, [initial, current]);

  function pick(next: Locale): void {
    if (next === current) return;
    setLocaleCookie(next);
    if (typeof window !== "undefined") window.location.reload();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-[11.5px] uppercase tracking-wider"
          aria-label="Change language"
        >
          <Globe className="size-3.5" />
          {current}
          <ChevronDown className="size-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {locales.map((loc) => (
          <DropdownMenuItem key={loc} onClick={() => pick(loc)}>
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
