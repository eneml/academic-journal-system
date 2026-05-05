"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, LogOut, UserCog } from "lucide-react";
import type { User } from "oidc-client-ts";
import { getUserManager } from "@/lib/oidc";

const EDITORIAL_APP_URL =
  process.env.NEXT_PUBLIC_EDITORIAL_APP_URL ?? "http://localhost:5173";

/**
 * Top-right header widget. Two states:
 *   • signed out — renders a plain link to the editorial app's login flow.
 *   • signed in  — renders a dropdown trigger with the user's name + email,
 *                  plus links to the editorial workbench and a sign-out
 *                  action that propagates through Keycloak so the editorial
 *                  app session is torn down too.
 *
 * We never run an interactive login on the public site. The only OIDC call
 * is `signinSilent()`, which uses an iframe to Keycloak's auth endpoint
 * with `prompt=none`. If the user already has a Keycloak session (from the
 * editorial app or another tab), the iframe completes silently and we
 * surface the user. If not, we just stay in the signed-out state.
 */
export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

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
        // No live token in our localStorage — try silent SSO against the
        // shared Keycloak session. login_required is expected when not
        // signed in anywhere; swallow it.
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

  // Click-outside to dismiss the dropdown.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent): void {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <a
        href={EDITORIAL_APP_URL}
        className="text-[11px] font-medium text-fg-2 hover:text-fg no-underline"
      >
        Sign in
      </a>
    );
  }

  const profile = user.profile as Record<string, unknown>;
  const given = (profile.given_name as string | undefined) ?? "";
  const family = (profile.family_name as string | undefined) ?? "";
  const username = (profile.preferred_username as string | undefined) ?? "user";
  const email = (profile.email as string | undefined) ?? username;
  const displayName = `${given} ${family}`.trim() || username;
  const initials = computeInitials(given, family, username);

  async function handleSignOut(): Promise<void> {
    setOpen(false);
    try {
      await getUserManager().signoutRedirect({
        post_logout_redirect_uri: window.location.href,
      });
    } catch (err) {
      console.warn("Sign-out failed, clearing local session:", err);
      await getUserManager().removeUser();
      setUser(null);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-[3px] text-[11px] font-medium text-fg-2 hover:bg-bg-tint hover:text-fg transition-colors"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cobalt-soft text-[9px] font-semibold text-cobalt-deep">
          {initials}
        </span>
        <span className="max-w-[140px] truncate">{displayName}</span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[260px] rounded-md border border-border bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
        >
          <div className="px-3 py-2.5 border-b border-border">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
              Signed in as
            </div>
            <div className="mt-1 truncate text-[13px] font-medium text-fg">
              {displayName}
            </div>
            <div className="truncate font-mono text-[11px] text-muted">
              {email}
            </div>
          </div>
          <div className="py-1.5">
            <a
              href={EDITORIAL_APP_URL}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-fg-2 no-underline hover:bg-bg-tint hover:text-fg"
              role="menuitem"
            >
              <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
              Open editorial workbench
            </a>
            <a
              href={`${EDITORIAL_APP_URL}/profile`}
              className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-fg-2 no-underline hover:bg-bg-tint hover:text-fg"
              role="menuitem"
            >
              <UserCog className="h-3.5 w-3.5 text-muted" />
              Profile settings
            </a>
          </div>
          <div className="border-t border-border py-1.5">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#b91c1c] hover:bg-[#fff5f5]"
              role="menuitem"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function computeInitials(given: string, family: string, username: string): string {
  const g = given.trim();
  const f = family.trim();
  if (g || f) return ((g.charAt(0) || "") + (f.charAt(0) || "")).toUpperCase() || "?";
  return (username.trim().charAt(0) || "?").toUpperCase();
}
