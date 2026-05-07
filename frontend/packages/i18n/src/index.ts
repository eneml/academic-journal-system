import en from "./en.json" with { type: "json" };
import ro from "./ro.json" with { type: "json" };

export const locales = ["en", "ro"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Messages = typeof en;

export const messages: Record<Locale, Messages> = {
  en,
  ro: ro as Messages,
};

export function getMessages(locale: Locale): Messages {
  return messages[locale];
}

export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function readLocaleFromCookieString(
  cookieString: string,
): Locale | null {
  const cookies = cookieString.split(/;\s*/);
  for (const c of cookies) {
    const eq = c.indexOf("=");
    if (eq < 0) continue;
    if (c.slice(0, eq) === LOCALE_COOKIE_NAME) {
      const value = c.slice(eq + 1);
      if ((locales as readonly string[]).includes(value)) {
        return value as Locale;
      }
    }
  }
  return null;
}

export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  return readLocaleFromCookieString(document.cookie);
}

export function setLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
}

export function resolveLocaleFromAcceptLanguage(accept: string): Locale | null {
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]?.trim().toLowerCase() ?? "";
    const short = tag.slice(0, 2);
    if ((locales as readonly string[]).includes(short)) {
      return short as Locale;
    }
  }
  return null;
}
