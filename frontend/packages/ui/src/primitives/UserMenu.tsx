"use client";

import {
  type ComponentType,
  type ReactNode,
} from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Button } from "./Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";

type IconCmp = ComponentType<{ className?: string }>;

export type UserMenuItem =
  | {
      type: "link";
      label: string;
      href: string;
      icon?: IconCmp;
      external?: boolean;
    }
  | {
      type: "action";
      label: string;
      onSelect: () => void;
      icon?: IconCmp;
      variant?: "default" | "danger";
    };

export interface UserMenuUser {
  displayName: string;
  email: string;
  initials: string;
  /** Optional role / context line shown under the name (e.g. "Editor"). */
  subtitle?: string;
}

export interface UserMenuProps {
  user: UserMenuUser | null;
  /**
   * Trigger variant.
   *  - chip: compact text-link button used for cross-app navigation
   *    (public site → editorial dashboard).
   *  - inline: small avatar + caret trigger used in a top utility bar.
   *    Opens the full dropdown with profile, items, sign-out.
   *  - badge: full-width sidebar dropdown (avatar + name + role).
   */
  variant?: "chip" | "inline" | "badge";
  /** Sign-in CTA href when {@link user} is null. */
  signInHref: string;
  signInLabel?: string;
  /** Chip-only: where the "Dashboard" link points when signed in. Defaults to {@link signInHref}. */
  dashboardHref?: string;
  dashboardLabel?: string;
  /** Items shown above the sign-out action (inline + badge variants). */
  items?: UserMenuItem[];
  /** Sign-out callback. Renders the destructive row when set (inline + badge variants). */
  onSignOut?: () => void;
  signOutLabel?: string;
}

export function UserMenu({
  user,
  variant = "chip",
  signInHref,
  signInLabel = "Sign in",
  dashboardHref,
  dashboardLabel = "Dashboard",
  items = [],
  onSignOut,
  signOutLabel = "Sign out",
}: UserMenuProps): ReactNode {
  if (variant === "chip") {
    if (!user) {
      return (
        <Button asChild variant="ghost" size="sm">
          <a href={signInHref}>{signInLabel}</a>
        </Button>
      );
    }
    return (
      <Button asChild variant="ghost" size="sm">
        <a href={dashboardHref ?? signInHref}>{dashboardLabel} →</a>
      </Button>
    );
  }

  if (variant === "inline") {
    if (!user) {
      return (
        <Button asChild variant="ghost" size="sm">
          <a href={signInHref}>{signInLabel}</a>
        </Button>
      );
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Open user menu"
            className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt"
          >
            <span className="size-5 rounded-full bg-cobalt-soft text-cobalt-deep border border-cobalt/15 grid place-items-center font-semibold text-[9.5px] flex-none">
              {user.initials}
            </span>
            <ChevronDown className="size-2.5 text-muted" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        {renderDropdown(user, items, onSignOut, signOutLabel, "bottom")}
      </DropdownMenu>
    );
  }

  if (!user) {
    return (
      <Button asChild className="w-full">
        <a href={signInHref}>{signInLabel}</a>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-bg-tint transition-colors text-left"
        >
          <span className="size-8 rounded-full bg-cobalt-soft text-cobalt-deep border border-cobalt/15 grid place-items-center font-semibold text-[11.5px] flex-none">
            {user.initials}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[12.5px] font-medium text-fg truncate">
              {user.displayName}
            </span>
            {user.subtitle ? (
              <span className="block text-[10.5px] text-muted truncate">
                {user.subtitle}
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-3.5 text-muted shrink-0" />
        </button>
      </DropdownMenuTrigger>
      {renderDropdown(user, items, onSignOut, signOutLabel, "top")}
    </DropdownMenu>
  );
}

function renderDropdown(
  user: UserMenuUser,
  items: UserMenuItem[],
  onSignOut: (() => void) | undefined,
  signOutLabel: string,
  side: "top" | "bottom",
): ReactNode {
  return (
    <DropdownMenuContent align="end" side={side} className="w-[260px]">
      <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
      <div className="px-2.5 pb-2">
        <div className="text-[12.5px] font-medium text-fg truncate">
          {user.displayName}
        </div>
        <div className="truncate font-mono text-[11px] text-muted">
          {user.email}
        </div>
      </div>
      {items.length > 0 ? (
        <>
          <DropdownMenuSeparator />
          {items.map((it, i) =>
            it.type === "link" ? (
              <DropdownMenuItem key={i} asChild>
                <a
                  href={it.href}
                  {...(it.external ? { rel: "noopener noreferrer" } : null)}
                >
                  {it.icon ? <it.icon /> : null}
                  {it.label}
                </a>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={i}
                onSelect={it.onSelect}
                className={
                  it.variant === "danger"
                    ? "text-danger-deep focus:text-danger-deep focus:bg-danger-soft [&_svg]:text-danger-deep"
                    : undefined
                }
              >
                {it.icon ? <it.icon /> : null}
                {it.label}
              </DropdownMenuItem>
            ),
          )}
        </>
      ) : null}
      {onSignOut ? (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onSignOut}
            className="text-danger-deep focus:text-danger-deep focus:bg-danger-soft [&_svg]:text-danger-deep"
          >
            <LogOut />
            {signOutLabel}
          </DropdownMenuItem>
        </>
      ) : null}
    </DropdownMenuContent>
  );
}
