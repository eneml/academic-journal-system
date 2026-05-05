import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { SectionScrollSpy } from "./SectionScrollSpy";

export interface StaticPageProps {
  activePath?: string;
  eyebrow?: string;
  title: string;
  lede?: ReactNode;
  /** Optional table of contents shown in the left rail. */
  toc?: { id: string; label: string }[];
  children: ReactNode;
}

export async function StaticPage({
  activePath,
  eyebrow,
  title,
  lede,
  toc,
  children,
}: StaticPageProps) {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath={activePath} />

      <section className="mx-auto max-w-[760px] px-6 pt-12 pb-6 text-center lg:px-14">
        {eyebrow ? (
          <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="m-0 mb-3 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
          {title}
        </h1>
        {lede ? (
          <div className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
            {lede}
          </div>
        ) : null}
      </section>

      <section className="grid gap-14 px-6 pt-6 pb-14 lg:grid-cols-[200px_minmax(0,720px)] lg:justify-center lg:px-14">
        {toc ? (
          <aside className="sticky top-8 self-start">
            <div className="mb-3.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              On this page
            </div>
            <SectionScrollSpy
              items={toc.map((it) => ({ id: it.id, label: it.label }))}
              activeClassName="border-amber font-semibold text-fg"
              inactiveClassName="border-border text-fg-2 hover:border-amber hover:text-fg"
            />
          </aside>
        ) : (
          <div className="hidden lg:block" />
        )}

        <div className="prose-reading">{children}</div>
      </section>

      <PublicFooter />
    </div>
  );
}
