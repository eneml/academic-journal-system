import type { ReactNode } from "react";
import { Icon, type IconName } from "@ajs/ui/primitives";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: EmptyStateProps): ReactNode {
  return (
    <div className="flex flex-col items-center text-center px-6 py-11 rounded-md border border-dashed border-border-strong bg-surface text-fg-2">
      <div className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-bg text-muted mb-3">
        <Icon name={icon} size={18} />
      </div>
      <p className="m-0 font-serif-display text-[17px] font-medium text-fg">
        {title}
      </p>
      {description ? (
        <p className="mt-1.5 max-w-[380px] text-[13px] leading-[1.55]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-3.5">{action}</div> : null}
    </div>
  );
}
