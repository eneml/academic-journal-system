"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Resolves the presigned download URL for the article's PDF galley and
 * embeds it via a native browser PDF viewer (`<object>` falls back to
 * the system reader). When the browser can't render PDFs inline, the
 * fallback Markdown links to the same URL.
 *
 * The article page passes us the unsigned API URL; we hit it from the
 * client to get the short-lived presigned URL fresh on each load (the
 * SSR cache would otherwise serve a long-expired link).
 */
export function PdfViewerClient({ pdfHref }: { pdfHref: string }): ReactNode {
  const [resolved, setResolved] = useState<string | null | "ERR">(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(pdfHref, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          if (!cancelled) setResolved("ERR");
          return;
        }
        const body = await res.json().catch(() => null);
        const url = body?.url ?? null;
        if (!cancelled) setResolved(url ?? "ERR");
      } catch {
        if (!cancelled) setResolved("ERR");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pdfHref]);

  if (resolved === null) {
    return (
      <div className="rounded-md border border-border bg-bg-tint p-8 text-center text-[12.5px] text-muted">
        Loading PDF…
      </div>
    );
  }
  if (resolved === "ERR") {
    return (
      <div className="rounded-md border border-border bg-bg-tint p-8 text-center text-[12.5px] text-muted">
        Couldn't load the PDF inline. Use the Galleys panel on the right to
        download it directly.
      </div>
    );
  }
  return (
    <div className="rounded-md border border-border overflow-hidden bg-bg-tint">
      <object
        data={resolved}
        type="application/pdf"
        className="block h-[80vh] w-full"
        aria-label="Article PDF"
      >
        <div className="p-8 text-center text-[12.5px] text-muted">
          Your browser can't display this PDF inline. {" "}
          <a
            href={resolved}
            target="_blank"
            rel="noreferrer"
            className="text-cobalt underline"
          >
            Open it in a new tab
          </a>
          .
        </div>
      </object>
    </div>
  );
}
