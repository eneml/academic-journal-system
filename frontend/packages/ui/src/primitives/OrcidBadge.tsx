import { cn } from "../lib/cn";

export interface OrcidBadgeProps {
  id: string;
  className?: string;
  /** When true, renders as a non-interactive span instead of an outbound link. */
  asText?: boolean;
}

const ORCID_GREEN = "oklch(70% 0.18 130)";

export function OrcidBadge({ id, className, asText = false }: OrcidBadgeProps) {
  const inner = (
    <>
      <span
        className="inline-flex h-[11px] w-[11px] items-center justify-center rounded-full text-[7px] font-bold text-white"
        style={{ background: ORCID_GREEN, fontFamily: "var(--sans)" }}
      >
        iD
      </span>
      {id}
    </>
  );
  const baseClass = cn(
    "inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted",
    className,
  );
  if (asText) {
    return <span className={baseClass}>{inner}</span>;
  }
  return (
    <a
      href={`https://orcid.org/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(baseClass, "transition-colors hover:text-fg no-underline")}
    >
      {inner}
    </a>
  );
}
