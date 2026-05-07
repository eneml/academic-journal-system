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
  /** Menu items shown above the sign-out action. */
  items?: UserMenuItem[];
  /** Callback for the destructive sign-out action. Renders the row when set. */
  onSignOut?: () => void;
  signOutLabel?: string;
  /** Sign-in CTA href when {@link user} is null. */
  signInHref: string;
  signInLabel?: string;
  /** Trigger variant: chip = compact top-bar pill, badge = full-width sidebar row. */
  variant?: "chip" | "badge";
}

export function UserMenu({
  user,
  items = [],
  onSignOut,
  signOutLabel = "Sign out",
  signInHref,
  signInLabel = "Sign in",
  variant = "chip",
}: UserMenuProps): ReactNode {
  if (!user) {
    return variant === "badge" ? (
      <Button asChild className="w-full">
        <a href={signInHref}>{signInLabel}</a>
      </Button>
    ) : (
      <Button asChild variant="ghost" size="sm">
        <a href={signInHref}>{signInLabel}</a>
      </Button>
    );
  }

  const trigger =
    variant === "badge" ? (
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
    ) : (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-[3px] text-[11px] font-medium text-fg-2 hover:bg-bg-tint hover:text-fg transition-colors"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cobalt-soft text-[9px] font-semibold text-cobalt-deep">
          {user.initials}
        </span>
        <span className="max-w-[140px] truncate">{user.displayName}</span>
        <ChevronDown className="h-3 w-3 text-muted" />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side={variant === "badge" ? "top" : "bottom"}
        className="w-[260px]"
      >
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
                    {...(it.external
                      ? { rel: "noopener noreferrer" }
                      : null)}
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
    </DropdownMenu>
  );
}
