"use client";

import { useEffect, useState } from "react";
import { hasSessionCookie } from "@ajs/auth";
import { UserMenu as SharedUserMenu } from "@ajs/ui";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

/**
 * Header chip that flips between "Sign in" and "Dashboard →" depending on
 * whether the user is signed into the editorial app. Detection runs off a
 * shared {@code AJ_SESSION_ACTIVE} cookie that editorial writes after a
 * successful Direct-Grant login (and clears on sign-out). Direct-Grant
 * doesn't establish a Keycloak browser session cookie, so silent SSO via
 * an iframe wouldn't work for this auth model.
 */
export function UserMenu() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const refresh = (): void => setAuthed(hasSessionCookie());
    refresh();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <SharedUserMenu
      variant="chip"
      user={
        authed
          ? { displayName: "", email: "", initials: "" }
          : null
      }
      signInHref={EDITORIAL_APP_URL}
      dashboardHref={EDITORIAL_APP_URL}
    />
  );
}
