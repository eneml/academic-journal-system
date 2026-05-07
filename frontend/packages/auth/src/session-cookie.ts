/**
 * Cross-app session marker. The editorial app uses a Direct-Grant token
 * exchange which does NOT establish a Keycloak browser-session cookie, so
 * the public site can't detect logins via silent SSO. Editorial writes
 * this cookie when a user signs in and clears it on sign-out; the public
 * site reads it to flip the header chip from "Sign in" to "Dashboard".
 *
 * Cookie scope is the bare host (no domain attribute). On localhost this
 * means port differences (3000 vs 5173) still share the cookie because
 * cookies are scoped by host, not by port. In production the apps are
 * expected to live under sibling subdomains; set a custom domain via
 * `setSessionCookie({ domain: ".journal.example.com" })` if needed.
 */

export const SESSION_COOKIE_NAME = "AJ_SESSION_ACTIVE";

const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

export interface SessionCookieOptions {
  /** Cookie Domain attribute (e.g. ".journal.example.com"). Omitted on host-only cookies. */
  domain?: string;
}

export function setSessionCookie(options: SessionCookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${SESSION_COOKIE_NAME}=1`,
    "path=/",
    `max-age=${SEVEN_DAYS_SECONDS}`,
    "SameSite=Lax",
  ];
  if (options.domain) parts.push(`domain=${options.domain}`);
  document.cookie = parts.join("; ");
}

export function clearSessionCookie(options: SessionCookieOptions = {}): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "path=/",
    "max-age=0",
    "SameSite=Lax",
  ];
  if (options.domain) parts.push(`domain=${options.domain}`);
  document.cookie = parts.join("; ");
}

export function hasSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(/;\s*/)
    .some((c) => c === `${SESSION_COOKIE_NAME}=1`);
}
