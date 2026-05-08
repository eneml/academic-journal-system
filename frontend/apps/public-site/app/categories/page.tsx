import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  fetchAllCategories,
  fetchJournalConfig,
  pickLocale,
  type CategorySummary,
} from "@/lib/api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse by category",
  description:
    "Curated taxonomy of subjects covered by the journal — pick a category to read every published article in that area.",
};

export default async function CategoriesPage(): Promise<ReactNode> {
  const [categories, config] = await Promise.all([
    fetchAllCategories(),
    fetchJournalConfig(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const all = categories ?? [];
  const roots = all.filter((c) => c.parentId == null).sort((a, b) => a.sequence - b.sequence);
  const childrenOf = new Map<number, CategorySummary[]>();
  for (const c of all) {
    if (c.parentId != null) {
      const list = childrenOf.get(c.parentId) ?? [];
      list.push(c);
      childrenOf.set(c.parentId, list);
    }
  }
  for (const list of childrenOf.values()) list.sort((a, b) => a.sequence - b.sequence);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-[1100px] px-6 py-12">
        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2 font-mono">
            Browse
          </p>
          <h1 className="font-serif-display text-[40px] font-semibold leading-tight m-0">
            Categories
          </h1>
          <p className="text-fg-2 max-w-[60ch] mt-3">
            Browse the journal by subject. Each category lists every published
            article assigned to it; subcategories drill down into more focused
            topics.
          </p>
        </header>

        {roots.length === 0 ? (
          <p className="text-muted">No categories configured yet.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
            {roots.map((root) => {
              const children = root.id != null ? (childrenOf.get(root.id) ?? []) : [];
              const title = pickLocale(root.title, locale) || root.code;
              const description = pickLocale(root.description, locale);
              return (
                <li
                  key={root.id}
                  className="rounded-lg border border-border bg-white px-5 py-4"
                >
                  <Link
                    href={`/categories/${root.path}`}
                    className="group flex items-baseline gap-2 no-underline text-fg"
                  >
                    <h2 className="font-serif-display text-[22px] font-semibold m-0 group-hover:text-cobalt">
                      {title}
                    </h2>
                    <ArrowRight className="size-4 text-cobalt opacity-0 group-hover:opacity-100" />
                  </Link>
                  {description && (
                    <p className="text-fg-2 text-[14px] mt-1 mb-0">{description}</p>
                  )}
                  {children.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2 list-none p-0">
                      {children.map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/categories/${c.path}`}
                            className="inline-block rounded-full border border-border px-3 py-1 text-[12px] no-underline text-fg-2 hover:border-cobalt hover:text-cobalt"
                          >
                            {pickLocale(c.title, locale) || c.code}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
