import { cn } from "../lib/cn";

export interface DoiChipProps {
  doi: string;
  className?: string;
  asText?: boolean;
}

export function DoiChip({ doi, className, asText = false }: DoiChipProps) {
  const inner = (
    <>
      <span className="font-bold text-cobalt">DOI</span>
      <span className="h-3 w-px bg-border" />
      {doi}
    </>
  );
  const baseClass = cn(
    "inline-flex h-[22px] items-center gap-1.5 rounded-md border border-border-strong bg-bg px-2 font-mono text-[10.5px] text-fg-2",
    className,
  );
  if (asText) {
    return <span className={baseClass}>{inner}</span>;
  }
  return (
    <a
      href={`https://doi.org/${doi}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(baseClass, "transition-colors hover:border-cobalt hover:text-cobalt no-underline")}
    >
      {inner}
    </a>
  );
}
