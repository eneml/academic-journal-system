"use client";

import { useMemo, useState } from "react";
import {
  Bookmark,
  Copy,
  Download,
  Printer,
  Quote,
  Share2,
} from "lucide-react";
import { Button } from "@ajs/ui";
import { cn } from "@/lib/cn";
import type { Article } from "@/lib/api";
import { pickLocale } from "@/lib/api";

const FORMATS = [
  "APA",
  "MLA",
  "Chicago",
  "Vancouver",
  "BibTeX",
  "RIS",
  "EndNote",
] as const;

type Format = (typeof FORMATS)[number];

export interface ArticleToolbarProps {
  article: Article;
  volume: number | null;
  issue: number | string | null;
  pages: string | null;
  /** Direct URL to the PDF galley download (presigned). */
  pdfHref?: string | null;
}

function fullName(a: { givenName: string | null; familyName: string | null }): string {
  return [a.givenName, a.familyName].filter(Boolean).join(" ");
}

export function ArticleToolbar({
  article,
  volume,
  issue,
  pages,
  pdfHref,
}: ArticleToolbarProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<Format>("APA");

  const title = pickLocale(article.title, article.locale);
  const journal = process.env.NEXT_PUBLIC_JOURNAL_NAME ?? "The Academic Journal";
  const year =
    article.copyrightYear ??
    (article.datePublished ? new Date(article.datePublished).getFullYear() : "");

  const citation = useMemo(() => {
    const authors = article.authors.map(fullName);
    const last = authors.pop();
    const authorsList = authors.length
      ? `${authors.join(", ")}, & ${last}`
      : last;
    const pageRange = pages ?? article.pages ?? "";
    const v = volume ?? "";
    const n = issue ?? "";
    const doi = article.doi ? `https://doi.org/${article.doi}` : "";

    switch (format) {
      case "MLA":
        return `${authorsList ?? ""}. "${title}." ${journal}, vol. ${v}, no. ${n}, ${year}, pp. ${pageRange}. ${doi}`;
      case "Chicago":
        return `${authorsList ?? ""}. "${title}." ${journal} ${v}, no. ${n} (${year}): ${pageRange}. ${doi}`;
      case "Vancouver":
        return `${authorsList ?? ""}. ${title}. ${journal}. ${year};${v}(${n}):${pageRange}. ${doi}`;
      case "BibTeX":
        return `@article{${article.id},\n  author = {${article.authors
          .map((a) => `${a.familyName ?? ""}, ${a.givenName ?? ""}`)
          .join(" and ")}},\n  title  = {${title}},\n  journal= {${journal}},\n  volume = {${v}},\n  number = {${n}},\n  pages  = {${pageRange}},\n  year   = {${year}},\n  doi    = {${article.doi ?? ""}}\n}`;
      case "RIS":
        return `TY  - JOUR\nT1  - ${title}\nJO  - ${journal}\nVL  - ${v}\nIS  - ${n}\nSP  - ${pageRange}\nPY  - ${year}\nDO  - ${article.doi ?? ""}\nER  -`;
      case "EndNote":
        return `%0 Journal Article\n%T ${title}\n%J ${journal}\n%V ${v}\n%N ${n}\n%P ${pageRange}\n%D ${year}\n%R ${article.doi ?? ""}`;
      case "APA":
      default:
        return `${authorsList ?? ""} (${year}). ${title}. ${journal}, ${v}(${n}), ${pageRange}. ${doi}`;
    }
  }, [article, format, year, volume, issue, pages, title, journal]);

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {pdfHref ? (
          <Button asChild>
            <a href={pdfHref} target="_blank" rel="noopener">
              <Download className="h-4 w-4" /> Read PDF
            </a>
          </Button>
        ) : (
          <Button>
            <Download className="h-4 w-4" /> Read PDF
          </Button>
        )}
        <Button variant="secondary" onClick={() => window.print()}>
          <Download className="h-4 w-4" /> Download
        </Button>
        <Button
          variant="secondary"
          aria-expanded={open}
          aria-controls="cite"
          onClick={() => setOpen((v) => !v)}
        >
          <Quote className="h-4 w-4" /> Cite this
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title, url: window.location.href }).catch(() => {});
            } else {
              navigator.clipboard?.writeText(window.location.href);
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
        <Button variant="secondary">
          <Bookmark className="h-4 w-4" /> Save
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      {open ? (
        <div
          id="cite"
          className="mt-3 rounded-md border border-border bg-surface p-4"
        >
          <div className="mb-3 flex flex-wrap gap-1.5">
            {FORMATS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  "h-7 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                  format === f
                    ? "border-cobalt bg-cobalt text-white"
                    : "border-border-strong bg-bg text-fg hover:border-cobalt hover:text-cobalt",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <pre
            className="mb-3 whitespace-pre-wrap rounded-[4px] border border-border bg-bg p-3 font-serif-body text-[13.5px] leading-[1.55] text-fg"
            aria-label={`${format} citation`}
          >
            {citation}
          </pre>
          <p className="m-0 mb-3 text-[12px] italic text-muted">
            For: {article.authors.map(fullName).join(" · ")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigator.clipboard?.writeText(citation)}
            >
              <Copy className="h-3 w-3" /> Copy citation
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadCitation(citation, format)}
            >
              <Download className="h-3 w-3" /> Download .{extensionFor(format)}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function extensionFor(f: Format): string {
  switch (f) {
    case "BibTeX":
      return "bib";
    case "RIS":
      return "ris";
    case "EndNote":
      return "enw";
    default:
      return "txt";
  }
}

function downloadCitation(text: string, format: Format) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `citation.${extensionFor(format)}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
