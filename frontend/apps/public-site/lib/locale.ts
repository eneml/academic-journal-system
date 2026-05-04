import { cookies, headers } from "next/headers";
import {
  defaultLocale,
  getMessages,
  locales,
  type Locale,
  type Messages,
} from "@ajs/i18n";

const COOKIE_NAME = "NEXT_LOCALE";

/**
 * Resolve the active locale for a request.
 * Order of preference:
 *   1. {@code NEXT_LOCALE} cookie (set by the locale switcher)
 *   2. {@code Accept-Language} header — first matching supported locale
 *   3. {@link defaultLocale}
 */
export async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  const cookieValue = c.get(COOKIE_NAME)?.value;
  if (cookieValue && (locales as readonly string[]).includes(cookieValue)) {
    return cookieValue as Locale;
  }
  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0]!.trim().toLowerCase();
    const short = tag.slice(0, 2);
    if ((locales as readonly string[]).includes(short)) {
      return short as Locale;
    }
  }
  return defaultLocale;
}

/**
 * Build a typed lookup helper for a given locale. Falls back to the
 * default locale when a key is missing in the requested one.
 */
export async function getT(): Promise<{
  locale: Locale;
  t: (path: TPath) => string;
}> {
  const locale = await resolveLocale();
  const active = getMessages(locale);
  const fallback = getMessages(defaultLocale);
  return {
    locale,
    t: (path) => readPath(active, path) ?? readPath(fallback, path) ?? path,
  };
}

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? P extends ""
      ? K
      : `${P}.${K}`
    : Leaves<T[K], P extends "" ? K : `${P}.${K}`>;
}[keyof T & string];

export type TPath = Leaves<Messages>;

function readPath(obj: unknown, path: string): string | undefined {
  const segments = path.split(".");
  let cursor: unknown = obj;
  for (const seg of segments) {
    if (cursor && typeof cursor === "object" && seg in (cursor as object)) {
      cursor = (cursor as Record<string, unknown>)[seg];
    } else {
      return undefined;
    }
  }
  return typeof cursor === "string" ? cursor : undefined;
}

export const LOCALE_COOKIE_NAME = COOKIE_NAME;
