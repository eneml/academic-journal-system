import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Optional small-caps eyebrow above the title. */
  eyebrow?: string;
  title: string;
  /** Subtitle line — short editorial summary like "47 active manuscripts across 5 stages". */
  description?: string;
  /** Right-aligned actions row (e.g. Filter / Sort / New submission buttons). */
  actions?: ReactNode;
}

/**
 * Page header used inside the editorial app shell. 22px sans headline (not
 * the marketing-site serif), tight tracking, gray subtitle, optional actions
 * slot pinned to the right. Sans here is intentional — the editorial app is
 * utility, not editorial display.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps): ReactNode {
  return (
    <div className="mb-[18px] flex items-end justify-between gap-4">
      <div className="flex-1 min-w-0">
        {eyebrow ? (
          <p className="sc text-muted mb-1.5 text-[9.5px]">{eyebrow}</p>
        ) : null}
        <h1 className="m-0 font-sans text-[22px] font-semibold tracking-[-0.015em] text-ink">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 mb-0 max-w-[720px] font-sans text-[13px] leading-[1.55] text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-none items-center gap-1.5">{actions}</div>
      ) : null}
    </div>
  );
}
