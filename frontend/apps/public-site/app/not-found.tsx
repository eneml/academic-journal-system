import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function NotFound(): ReactNode {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-6 py-20 text-center">
      <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
        404 · Not found
      </div>
      <h1 className="mt-3 max-w-2xl font-serif-display text-[44px] font-medium leading-[1.05] tracking-[-0.02em]">
        The page you were looking for could not be located in our archive.
      </h1>
      <p className="mt-4 max-w-xl font-serif-body text-[17px] italic leading-relaxed text-fg-2">
        The article may have been withdrawn, the URL may have changed, or the
        link you followed was incorrect.
      </p>
      <div className="mt-7 flex gap-2">
        <Button asChild>
          <Link href="/">Return to current issue</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/search">Search the archive</Link>
        </Button>
      </div>
    </div>
  );
}
