"use client";

import { Search, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function SearchInput({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params?.toString() ?? "");
    if (value.trim()) next.set("q", value.trim());
    else next.delete("q");
    next.delete("page");
    const qs = next.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex max-w-3xl items-center gap-2.5 rounded-md border border-border-strong bg-bg px-3.5 py-2.5"
    >
      <Search className="h-4 w-4 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search articles, authors, keywords..."
        className="flex-1 border-0 bg-transparent font-serif-body text-[16px] text-fg outline-none placeholder:text-muted-2"
        aria-label="Search articles"
      />
      {value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="flex h-5 w-5 items-center justify-center rounded-[4px] text-muted hover:bg-bg-tint hover:text-fg"
          aria-label="Clear"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <kbd className="hidden rounded-md border border-border bg-bg-tint px-1.5 py-0.5 font-mono text-[9.5px] tracking-normal text-muted sm:inline">
        ⌘K
      </kbd>
    </form>
  );
}
