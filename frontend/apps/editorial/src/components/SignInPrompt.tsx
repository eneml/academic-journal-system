import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@ajs/ui";

/**
 * Fallback prompt for routes that render before AppShell's redirect-to-login
 * fires (or when the gate is bypassed). Inline link to /login since we own
 * the login UI.
 */
export function SignInPrompt(): ReactNode {
  const location = useLocation();
  const dest = location.pathname;
  return (
    <div className="max-w-[540px]">
      <p className="sc text-muted mb-1.5">Sign in required</p>
      <h1 className="m-0 mb-2.5 font-serif-display text-[30px] font-medium tracking-[-0.01em]">
        Authenticate to continue
      </h1>
      <p className="mb-5 font-serif-body text-[16px] leading-[1.6] text-fg-2">
        This area of the workbench is gated by the journal&rsquo;s identity
        provider.
      </p>
      <Button asChild>
        <Link
          to="/login"
          search={{ redirect: dest === "/" ? undefined : dest }}
        >
          Sign in
        </Link>
      </Button>
    </div>
  );
}
