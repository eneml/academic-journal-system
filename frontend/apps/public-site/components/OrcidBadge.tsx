import { cn } from "@/lib/cn";

export interface OrcidBadgeProps {
  id: string;
  className?: string;
}

export function OrcidBadge({ id, className }: OrcidBadgeProps) {
  return (
    <a
      href={`https://orcid.org/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10.5px] text-muted transition-colors hover:text-fg no-underline",
        className,
      )}
    >
      <span
        className="inline-flex h-[11px] w-[11px] items-center justify-center rounded-full text-[7px] font-bold text-white"
        style={{ background: "oklch(70% 0.18 130)", fontFamily: "var(--sans)" }}
      >
        iD
      </span>
      {id}
    </a>
  );
}
