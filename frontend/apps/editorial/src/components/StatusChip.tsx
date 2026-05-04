import type { ReactNode } from "react";

/**
 * Map a status / stage string onto one of the design-token chip variants.
 * Unknown values fall through to the neutral chip.
 */
function variantFor(status: string): string {
  const s = status.toUpperCase();
  if (s === "PUBLISHED" || s === "ACCEPTED" || s === "COMPLETED" || s === "ACTIVE") {
    return "chip-green";
  }
  if (s === "DECLINED" || s === "WITHDRAWN" || s === "REJECTED" || s === "CANCELLED") {
    return "chip-red";
  }
  if (s === "QUEUED" || s === "IN_REVIEW" || s === "REVIEW") {
    return "chip-cobalt";
  }
  if (s === "DRAFT" || s === "PENDING" || s === "INVITED" || s === "AWAITING_RESPONSE") {
    return "chip-amber";
  }
  return "";
}

export interface StatusChipProps {
  status: string | null | undefined;
  label?: string;
  /** Add a leading dot for at-a-glance status indicators. */
  dot?: boolean;
}

export function StatusChip({ status, label, dot = false }: StatusChipProps): ReactNode {
  if (!status) return null;
  const variant = variantFor(status);
  const display = label ?? status.replace(/_/g, " ").toLowerCase();
  return (
    <span className={`chip ${variant} ${dot ? "chip-dot" : ""}`.trim()}>{display}</span>
  );
}
