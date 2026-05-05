"use client";

import { createKeycloakUserManager, type KeycloakClientConfig } from "@ajs/auth";
import type { UserManager } from "oidc-client-ts";

/**
 * Public-site OIDC integration. We never trigger an interactive login from
 * here — sign-in is delegated to the editorial app at a separate origin.
 * The only OIDC flow we run is silent SSO (`signinSilent`) so that, if the
 * user already has a Keycloak session from logging into the editorial app,
 * the public site can detect it and surface their identity.
 */

let _userManager: UserManager | null = null;

function readConfig(): KeycloakClientConfig {
  const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER;
  const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID;
  const appBaseUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL;
  if (!issuer || !clientId || !appBaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_KEYCLOAK_ISSUER / NEXT_PUBLIC_KEYCLOAK_CLIENT_ID / NEXT_PUBLIC_PUBLIC_SITE_URL.",
    );
  }
  return { issuer, clientId, appBaseUrl };
}

export function getUserManager(): UserManager {
  if (typeof window === "undefined") {
    throw new Error("getUserManager() must only be called from the browser.");
  }
  if (!_userManager) {
    _userManager = createKeycloakUserManager(readConfig());
  }
  return _userManager;
}
