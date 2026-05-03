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

export async function signIn(): Promise<void> {
  await getUserManager().signinRedirect();
}

export async function signOut(): Promise<void> {
  await getUserManager().signoutRedirect();
}
