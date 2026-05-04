import { NextResponse, type NextRequest } from "next/server";
import { locales } from "@ajs/i18n";
import { LOCALE_COOKIE_NAME } from "@/lib/locale";

/**
 * Locale switcher endpoint. Sets the `NEXT_LOCALE` cookie and redirects
 * back to the page the user came from.
 *
 *   GET /api/locale?to=ro&next=/issues
 */
export function GET(request: NextRequest): NextResponse {
  const url = new URL(request.url);
  const to = url.searchParams.get("to") ?? "";
  const next = url.searchParams.get("next") ?? "/";
  if (!(locales as readonly string[]).includes(to)) {
    return NextResponse.redirect(new URL(next, request.url), 302);
  }
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const response = NextResponse.redirect(new URL(safeNext, request.url), 302);
  response.cookies.set({
    name: LOCALE_COOKIE_NAME,
    value: to,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
