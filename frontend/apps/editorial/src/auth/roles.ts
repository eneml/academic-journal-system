import type { User } from "oidc-client-ts";

export type RealmRole =
  | "ADMIN"
  | "EDITOR"
  | "SECTION_EDITOR"
  | "AUTHOR"
  | "REVIEWER"
  | "PRODUCTION_STAFF";

interface JwtPayload {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  sub?: string;
}

/**
 * Decode a JWT payload without verifying the signature. Verification happens
 * server-side; here we only need to read the claims. Returns null on any
 * parse error so callers can degrade gracefully.
 */
function decodeJwtPayload(token: string | undefined | null): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1] ?? "";
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const base64 = padded.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract realm roles from the access token. Profile/userinfo claims do not
 * include realm_access by default in Keycloak, so we read directly from the
 * JWT payload.
 */
export function getRolesFromUser(user: User | null): RealmRole[] {
  if (!user) return [];
  const payload = decodeJwtPayload(user.access_token);
  const realmRoles = payload?.realm_access?.roles ?? [];
  // Filter to known roles so consumers can switch on a closed union.
  const known: RealmRole[] = [
    "ADMIN",
    "EDITOR",
    "SECTION_EDITOR",
    "AUTHOR",
    "REVIEWER",
    "PRODUCTION_STAFF",
  ];
  return known.filter((r) => realmRoles.includes(r));
}

export function hasRole(roles: RealmRole[], role: RealmRole): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: RealmRole[], wanted: RealmRole[]): boolean {
  return wanted.some((r) => roles.includes(r));
}

export function isEditorial(roles: RealmRole[]): boolean {
  return hasAnyRole(roles, ["ADMIN", "EDITOR", "SECTION_EDITOR"]);
}
