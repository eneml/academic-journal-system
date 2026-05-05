import { cn } from "@/lib/cn";

export interface DoiChipProps {
  doi: string;
  className?: string;
}

export function DoiChip({ doi, className }: DoiChipProps) {
  return (
    <a
      href={`https://doi.org/${doi}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border-strong bg-bg px-2 font-mono text-[10.5px] text-fg-2 transition-colors hover:border-cobalt hover:text-cobalt no-underline",
        className,
      )}
    >
      <span className="font-bold text-cobalt">DOI</span>
      <span className="h-3 w-px bg-border" />
      {doi}
    </a>
  );
}
