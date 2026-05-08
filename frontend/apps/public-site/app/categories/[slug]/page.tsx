import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import {
  fetchAllCategories,
  fetchCategoryByPath,
  fetchJournalConfig,
  fetchPublicationsInCategory,
  pickLocale,
  type CategorySummary,
  type PublicationSummary,
} from "@/lib/api";
import { articlePath, formatDate, truncate } from "@/lib/format";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategoryByPath(slug);
  if (!category) return { title: "Category" };
  const title = pickLocale(category.title, "en") || category.code;
  const description = pickLocale(category.description, "en");
  return {
    title: `${title} — Browse`,
    description: description || `Articles in the "${title}" category.`,
  };
}

export default async function CategoryDetailPage({ params }: Props): Promise<ReactNode> {
  const { slug } = await params;
  const [category, allCategories, config] = await Promise.all([
    fetchCategoryByPath(slug),
    fetchAllCategories(),
    fetchJournalConfig(),
  ]);
  if (!category) notFound();

  const publications = await fetchPublicationsInCategory(category.id);

  const locale = config?.defaultLocale ?? "en";
  const title = pickLocale(category.title, locale) || category.code;
  const description = pickLocale(category.description, locale);
  const list = publications ?? [];
  const all = allCategories ?? [];
  const children = all
    .filter((c) => c.parentId === category.id)
    .sort((a, b) => a.sequence - b.sequence);
  const parent = category.parentId != null
    ? all.find((c) => c.id === category.parentId)
    : null;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-[900px] px-6 py-12">
        <nav className="mb-4 text-[12px] text-muted">
          <Link href="/categories" className="hover:text-cobalt no-underline">
            Categories
          </Link>
          {parent && (
            <>
              {" / "}
              <Link
                href={`/categories/${parent.path}`}
                className="hover:text-cobalt no-underline"
              >
                {pickLocale(parent.title, locale) || parent.code}
              </Link>
            </>
          )}
          {" / "}
          <span>{title}</span>
        </nav>

        <header className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-2 font-mono">
            Category
          </p>
          <h1 className="font-serif-display text-[40px] font-semibold leading-tight m-0">
            {title}
          </h1>
          {description && (
            <p className="text-fg-2 mt-3 max-w-[60ch]">{description}</p>
          )}
        </header>

        {children.length > 0 && (
          <section className="mb-8">
            <h2 className="font-serif-display text-[18px] font-semibold m-0 mb-3">
              Subcategories
            </h2>
            <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
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
          </section>
        )}

        <section>
          <h2 className="font-serif-display text-[18px] font-semibold m-0 mb-3">
            Articles ({list.length})
          </h2>
          {list.length === 0 ? (
            <p className="text-muted">No articles in this category yet.</p>
          ) : (
            <ul className="list-none p-0 m-0 divide-y divide-border">
              {list.map((p: PublicationSummary) => {
                const articleTitle =
                  pickLocale(p.title, locale) || `Article #${p.id}`;
                const abstract = truncate(pickLocale(p.abstractText, locale), 240);
                return (
                  <li key={p.id} className="py-4">
                    <Link
                      href={articlePath(p)}
                      className="group block no-underline text-fg"
                    >
                      <h3 className="font-serif-display text-[20px] font-semibold m-0 group-hover:text-cobalt">
                        {articleTitle}
                      </h3>
                      {abstract && (
                        <p className="text-fg-2 text-[14px] mt-2 mb-0">
                          {abstract}
                        </p>
                      )}
                      <p className="text-[12px] text-muted mt-1 mb-0 font-mono">
                        {p.datePublished
                          ? formatDate(p.datePublished)
                          : "—"}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
      <PublicFooter />
    </>
  );
}

// Keep the param record used to satisfy Next 15's typed-route inference.
export type _CategoryParam = { slug: string };
export type _Cat = CategorySummary;
