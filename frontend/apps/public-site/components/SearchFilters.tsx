"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import type { SectionSummary } from "@/lib/api";
import { pickLocale } from "@/lib/api";

interface FilterGroup {
  title: string;
  param: string;
  options: { label: string; value: string; count: number }[];
}

export function SearchFilters({
  sections,
  facetCounts,
}: {
  sections: SectionSummary[];
  facetCounts: {
    years: { label: string; value: string; count: number }[];
    types: { label: string; value: string; count: number }[];
    openAccess: number;
  };
}) {
  const params = useSearchParams();
  const groups: FilterGroup[] = [
    { title: "Year", param: "year", options: facetCounts.years },
    {
      title: "Section",
      param: "section",
      options: sections.map((s) => ({
        label: pickLocale(s.title, "en") || s.code,
        value: String(s.id),
        count: 0,
      })),
    },
    { title: "Type", param: "type", options: facetCounts.types },
    {
      title: "Open Access",
      param: "oa",
      options: [
        { label: "OA only", value: "true", count: facetCounts.openAccess },
      ],
    },
  ];

  function isChecked(param: string, value: string): boolean {
    if (!params) return false;
    if (param === "oa") return params.get("oa") === "true";
    return params.getAll(param).includes(value);
  }

  function toggleHref(param: string, value: string): string {
    const next = new URLSearchParams(params?.toString() ?? "");
    const current = next.getAll(param);
    if (param === "oa") {
      if (next.get("oa") === "true") next.delete("oa");
      else next.set("oa", "true");
    } else if (current.includes(value)) {
      const remaining = current.filter((c) => c !== value);
      next.delete(param);
      remaining.forEach((r) => next.append(param, r));
    } else {
      next.append(param, value);
    }
    next.delete("page");
    const qs = next.toString();
    return `/search${qs ? `?${qs}` : ""}`;
  }

  return (
    <aside>
      <div className="sc mb-3.5 text-muted">Refine</div>
      {groups.map((group) => (
        <div key={group.title} className="mb-6">
          <div className="mb-2 text-[11.5px] font-semibold text-fg-2">
            {group.title}
          </div>
          <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
            {group.options.map((opt) => {
              const checked = isChecked(group.param, opt.value);
              return (
                <li key={opt.value}>
                  <Link
                    href={toggleHref(group.param, opt.value)}
                    scroll={false}
                    className="flex cursor-pointer items-center gap-2 text-[12.5px] text-fg-2 hover:text-fg no-underline"
                  >
                    <span
                      className={cn(
                        "flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[3px] border-[1.5px] transition-colors",
                        checked
                          ? "border-cobalt bg-cobalt"
                          : "border-border-strong bg-bg",
                      )}
                    >
                      {checked ? (
                        <Check
                          className="h-2.5 w-2.5 text-white"
                          strokeWidth={3}
                        />
                      ) : null}
                    </span>
                    <span className="flex-1">{opt.label}</span>
                    {opt.count ? (
                      <span className="font-mono text-[10.5px] tabular-nums text-muted">
                        {opt.count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
