import { User } from "oidc-client-ts";
import { createKeycloakUserManager, type KeycloakClientConfig } from "@ajs/auth";

// Pull config from Vite env. Throw early if anything's missing so misconfiguration
// fails loudly instead of producing cryptic OIDC errors at the redirect step.
function readConfig(): KeycloakClientConfig {
  const issuer = import.meta.env.VITE_KEYCLOAK_ISSUER;
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
  const appBaseUrl = import.meta.env.VITE_EDITORIAL_BASE_URL;

  if (!issuer || !clientId || !appBaseUrl) {
    throw new Error(
      "Missing OIDC env vars: VITE_KEYCLOAK_ISSUER, VITE_KEYCLOAK_CLIENT_ID, VITE_EDITORIAL_BASE_URL must be set.",
    );
  }
  return { issuer, clientId, appBaseUrl };
}

// Single shared UserManager instance. Build on first access.
let _userManager: ReturnType<typeof createKeycloakUserManager> | null = null;

export function getUserManager(): ReturnType<typeof createKeycloakUserManager> {
  if (!_userManager) {
    _userManager = createKeycloakUserManager(readConfig());
  }
  return _userManager;
}

/**
 * Authorization-code-with-PKCE flow (redirect to Keycloak's hosted login).
 * Kept around for prod / SSO scenarios — the editorial app primarily uses
 * the Direct-Grant {@link loginWithPassword} so we can render our own
 * login UI in-app.
 */
export async function signIn(): Promise<void> {
  await getUserManager().signinRedirect();
}

export async function signOut(): Promise<void> {
  await getUserManager().signoutRedirect();
}

/**
 * Direct Access Grant — exchange email + password for tokens against
 * Keycloak's token endpoint, then construct an oidc-client-ts {@link User}
 * and persist it via the existing {@code UserManager}. After this resolves,
 * {@code AuthContext} fires its {@code addUserLoaded} listener and the rest
 * of the SPA sees the user as signed in — no redirect, no callback.
 *
 * <p>Used by the in-app /login page so we can render the form ourselves
 * instead of bouncing the user through Keycloak's hosted login UI. The
 * realm must allow Direct Access Grants on the SPA client (Keycloak's
 * default for public clients in dev).
 *
 * @throws Error with a user-friendly message on bad credentials, network
 *         failure, or rate-limit. Caller should catch + display it.
 */
export async function loginWithPassword(
  email: string,
  password: string,
): Promise<User> {
  const cfg = readConfig();
  const tokenUrl = `${cfg.issuer.replace(/\/$/, "")}/protocol/openid-connect/token`;

  const body = new URLSearchParams();
  body.set("grant_type", "password");
  body.set("client_id", cfg.clientId);
  body.set("username", email);
  body.set("password", password);
  body.set("scope", "openid profile email");

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch (err) {
    throw new Error(
      "Couldn't reach the identity provider. Check your connection and try again.",
    );
  }

  const payload: TokenResponse | KeycloakError = await response
    .json()
    .catch(() => ({ error: "invalid_token", error_description: "Invalid response" }));

  if (!response.ok || "error" in payload) {
    const message = describeAuthError(payload as KeycloakError, response.status);
    throw new Error(message);
  }

  const tokens = payload as TokenResponse;
  const profile = decodeIdToken(tokens.id_token);
  const user = new User({
    id_token: tokens.id_token,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_type: tokens.token_type ?? "Bearer",
    scope: tokens.scope ?? "openid profile email",
    expires_at: Math.floor(Date.now() / 1000) + (tokens.expires_in ?? 300),
    profile,
    session_state: tokens.session_state ?? null,
  });

  // Persist + emit a "user loaded" event so AuthContext picks it up.
  const manager = getUserManager();
  await manager.storeUser(user);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (manager.events as any)?.load?.(user);
  return user;
}

interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
  session_state?: string | null;
}

interface KeycloakError {
  error?: string;
  error_description?: string;
}

function describeAuthError(err: KeycloakError, status: number): string {
  if (err?.error === "invalid_grant") {
    return "Email or password is incorrect.";
  }
  if (err?.error === "invalid_client") {
    return "The editorial app isn't authorized for password login. Contact an administrator.";
  }
  if (err?.error === "unsupported_grant_type") {
    return "Direct password login isn't enabled for this realm.";
  }
  if (status === 429) {
    return "Too many failed attempts. Try again in a minute.";
  }
  return err?.error_description ?? err?.error ?? `Sign-in failed (HTTP ${status}).`;
}

/**
 * Decode the id_token's claim payload (no signature verification — we only
 * need the user-displayable claims; the access token is verified by the
 * resource server on every call).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeIdToken(idToken: string | undefined): any {
  if (!idToken) return {};
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return {};
    const padded = parts[1] + "=".repeat((4 - (parts[1]!.length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return {};
  }
}
