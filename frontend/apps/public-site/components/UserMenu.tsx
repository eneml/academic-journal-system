"use client";

import { useEffect, useState } from "react";
import type { User } from "oidc-client-ts";
import { UserMenu as SharedUserMenu } from "@ajs/ui";
import { getUserManager } from "@/lib/oidc";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

/**
 * OIDC integration shim around the shared {@link SharedUserMenu}. Runs a
 * silent SSO probe on mount so a Keycloak session established by the
 * editorial app surfaces here. When signed in, the chip becomes a
 * "Dashboard →" link to the editorial workbench; when signed out it stays
 * a "Sign in" link. Sign-out and profile management live in the editorial
 * app to keep the public site free of session UI.
 */
export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    const manager = getUserManager();

    async function detect(): Promise<void> {
      try {
        const stored = await manager.getUser();
        if (stored && !stored.expired) {
          if (!cancelled) setUser(stored);
          return;
        }
        const refreshed = await manager.signinSilent();
        if (!cancelled) setUser(refreshed ?? null);
      } catch (err) {
        const msg = String((err as Error)?.message ?? err ?? "");
        if (!/login_required|interaction_required/.test(msg)) {
          console.warn("Silent SSO failed:", err);
        }
        if (!cancelled) setUser(null);
      }
    }

    void detect();

    const onLoaded = (u: User): void => {
      if (!cancelled) setUser(u);
    };
    const onUnloaded = (): void => {
      if (!cancelled) setUser(null);
    };
    manager.events.addUserLoaded(onLoaded);
    manager.events.addUserUnloaded(onUnloaded);
    manager.events.addAccessTokenExpired(onUnloaded);

    return () => {
      cancelled = true;
      manager.events.removeUserLoaded(onLoaded);
      manager.events.removeUserUnloaded(onUnloaded);
      manager.events.removeAccessTokenExpired(onUnloaded);
    };
  }, []);

  const profile = (user?.profile ?? {}) as Record<string, unknown>;
  const given = (profile.given_name as string | undefined) ?? "";
  const family = (profile.family_name as string | undefined) ?? "";
  const username = (profile.preferred_username as string | undefined) ?? "user";
  const email = (profile.email as string | undefined) ?? username;
  const displayName = `${given} ${family}`.trim() || username;
  const initials = computeInitials(given, family, username);

  return (
    <SharedUserMenu
      variant="chip"
      user={user ? { displayName, email, initials } : null}
      signInHref={EDITORIAL_APP_URL}
      dashboardHref={EDITORIAL_APP_URL}
    />
  );
}

function computeInitials(given: string, family: string, username: string): string {
  const g = given.trim();
  const f = family.trim();
  if (g || f) return ((g.charAt(0) || "") + (f.charAt(0) || "")).toUpperCase() || "?";
  return (username.trim().charAt(0) || "?").toUpperCase();
}
