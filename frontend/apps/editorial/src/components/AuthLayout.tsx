import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Input } from "@ajs/ui";
import { cn } from "../lib/cn";

const JOURNAL_NAME =
  (import.meta.env.VITE_JOURNAL_NAME as string | undefined) ??
  "The Academic Journal";
const JOURNAL_ISSN =
  (import.meta.env.VITE_JOURNAL_ISSN as string | undefined) ?? "2069-3417";

export interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Two-column auth scaffold: brand panel on the left (masthead identity),
 * form panel on the right. Stacks on mobile with a compact wordmark above
 * the form. Both panels live inside one card so the page reads as a single
 * editorial surface, not a tacked-on form.
 */
export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps): ReactNode {
  return (
    <div className="min-h-screen bg-bg-tint font-sans flex flex-col">
      <main className="flex-1 grid place-items-center px-4 py-8 md:px-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-md border border-border bg-bg shadow-[0_4px_24px_rgba(15,23,42,0.04)] grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
          <BrandPanel />
          <section className="relative flex flex-col p-8 md:p-12">
            <div className="mb-7 flex items-center gap-2.5 md:hidden">
              <span className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-cobalt to-cobalt-deep font-serif-display text-[14px] font-semibold text-white">
                AJ
              </span>
              <span className="text-[13px] font-semibold tracking-tight text-fg">
                {JOURNAL_NAME}
              </span>
            </div>
            <p className="sc mb-2 text-cobalt">{eyebrow}</p>
            <h1 className="m-0 font-serif-display text-[28px] font-medium leading-[1.1] tracking-[-0.015em] text-fg">
              {title}
            </h1>
            {description ? (
              <p className="mt-1.5 mb-6 font-serif-body text-[14px] leading-[1.55] text-fg-2">
                {description}
              </p>
            ) : (
              <div className="mb-6" />
            )}
            <div className="flex-1">{children}</div>
            {footer ? (
              <div className="mt-8 border-t border-border pt-4 text-center text-[12px] text-muted">
                {footer}
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <footer className="px-6 pb-6 text-center text-[11px] text-muted">
        © {new Date().getFullYear()} {JOURNAL_NAME}
      </footer>
    </div>
  );
}

function BrandPanel(): ReactNode {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-bg-tint p-10 md:flex">
      <Link
        to="/"
        className="relative z-10 inline-flex items-center gap-2.5 no-underline"
      >
        <span className="grid size-8 place-items-center rounded-md bg-gradient-to-br from-cobalt to-cobalt-deep font-serif-display text-[16px] font-semibold text-white">
          AJ
        </span>
        <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          EST. 1987 · BUCHAREST
        </span>
      </Link>

      <div className="relative z-10">
        <h2 className="m-0 font-serif-display text-[36px] font-medium leading-[1.05] tracking-[-0.02em] text-fg">
          {JOURNAL_NAME}
        </h2>
        <p className="mt-3 max-w-xs font-serif-body text-[15px] italic leading-[1.55] text-fg-2">
          A quarterly review of computational research, methods, and theory.
        </p>
      </div>

      <div className="relative z-10 space-y-1.5">
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          ISSN {JOURNAL_ISSN}
        </div>
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Open Access · Peer Reviewed
        </div>
        <div className="font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
          Indexed in Scopus, WoS, Google Scholar
        </div>
      </div>

      <div
        aria-hidden
        className="placeholder-stripes pointer-events-none absolute inset-0 opacity-40"
      />
    </aside>
  );
}

export interface AuthFieldProps {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: ReactNode;
}

export function AuthField({
  label,
  htmlFor,
  children,
  hint,
}: AuthFieldProps): ReactNode {
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-2"
      >
        {label}
      </label>
      {children}
      {hint ? (
        <p className="mt-1 text-[11.5px] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface AuthErrorProps {
  children: ReactNode;
}

export function AuthError({ children }: AuthErrorProps): ReactNode {
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-danger-border bg-danger-soft px-3 py-2 text-[13px] text-danger-deep"
    >
      {children}
    </div>
  );
}

export type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

/** Password field with show/hide eye toggle. Manages reveal state internally. */
export function PasswordField({
  className,
  id,
  ...rest
}: PasswordFieldProps): ReactNode {
  const [reveal, setReveal] = useState(false);
  const reactId = useId();
  const inputId = id ?? reactId;
  return (
    <div className="relative">
      <Input
        id={inputId}
        type={reveal ? "text" : "password"}
        className={cn("pr-10", className)}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? "Hide password" : "Show password"}
        aria-pressed={reveal}
        tabIndex={-1}
        className="absolute inset-y-0 right-0 grid w-9 place-items-center text-muted hover:text-fg-2"
      >
        {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
