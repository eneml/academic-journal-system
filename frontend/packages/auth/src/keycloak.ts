import {
  UserManager,
  WebStorageStateStore,
  type UserManagerSettings,
} from "oidc-client-ts";

export interface KeycloakClientConfig {
  /** Full issuer URL, e.g. http://localhost:8081/realms/academic-journal */
  issuer: string;
  /** OIDC client id registered in Keycloak (public client). */
  clientId: string;
  /** Origin where the SPA is served, e.g. http://localhost:5173 */
  appBaseUrl: string;
  /** OIDC scopes; defaults cover identity + roles + refresh. */
  scope?: string;
}

/**
 * Build oidc-client-ts settings for a Keycloak realm.
 *
 * Designed for a public SPA client using Authorization Code flow with PKCE.
 * Tokens are stored in `localStorage` so they survive a tab refresh; if the
 * deployment context calls for stricter handling, swap the store before
 * passing to UserManager.
 */
export function buildKeycloakSettings(cfg: KeycloakClientConfig): UserManagerSettings {
  const scope = cfg.scope ?? "openid profile email offline_access";
  return {
    authority: cfg.issuer,
    client_id: cfg.clientId,
    redirect_uri: `${cfg.appBaseUrl}/auth/callback`,
    post_logout_redirect_uri: cfg.appBaseUrl,
    silent_redirect_uri: `${cfg.appBaseUrl}/auth/silent-callback`,
    response_type: "code",
    scope,
    automaticSilentRenew: true,
    loadUserInfo: true,
    userStore:
      typeof window !== "undefined"
        ? new WebStorageStateStore({ store: window.localStorage })
        : undefined,
  };
}

/**
 * Create a UserManager pre-wired with Keycloak settings.
 * Pass the manager into your auth context / hook layer.
 */
export function createKeycloakUserManager(cfg: KeycloakClientConfig): UserManager {
  return new UserManager(buildKeycloakSettings(cfg));
}
