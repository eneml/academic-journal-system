import Link from "next/link";

const FOOTER_COLUMNS = [
  {
    title: "Browse",
    links: [
      { label: "Current Issue", href: "/current" },
      { label: "Archive", href: "/archive" },
      { label: "By Section", href: "/archive?view=sections" },
      { label: "By Author", href: "/archive?view=authors" },
      { label: "Announcements", href: "/announcements" },
    ],
  },
  {
    title: "For Authors",
    links: [
      { label: "Submission Guidelines", href: "/for-authors" },
      { label: "Submit Manuscript", href: "/for-authors#submit" },
      { label: "Author Charges", href: "/for-authors#charges" },
      { label: "Copyright", href: "/policies#copyright" },
    ],
  },
  {
    title: "Editorial",
    links: [
      { label: "Editorial Board", href: "/editorial" },
      { label: "Peer Review", href: "/policies#peer-review" },
      { label: "Ethics Statement", href: "/policies#ethics" },
      { label: "Privacy", href: "/policies#privacy" },
      { label: "Contact", href: "/contact" },
    ],
  },
] as const;

const ISSN = process.env.NEXT_PUBLIC_JOURNAL_ISSN ?? "2069-3417";
const JOURNAL_NAME = process.env.NEXT_PUBLIC_JOURNAL_NAME ?? "The Academic Journal";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 bg-footer-bg px-6 pt-12 pb-7 text-footer-fg lg:px-14">
      <div className="grid gap-10 pb-9 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-2 font-serif-display text-[22px] font-medium tracking-[-0.01em] text-white">
            {JOURNAL_NAME}
          </div>
          <p className="m-0 max-w-md font-serif-body text-[13px] leading-relaxed text-footer-fg-2">
            A quarterly peer-reviewed journal of computational research, methods,
            and theory. Open access since 1998, indexed in Scopus, Web of Science,
            and Google Scholar.
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white">
              {col.title}
            </div>
            <ul className="space-y-1.5 m-0 p-0 list-none">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-footer-fg hover:text-white no-underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-footer-border pt-4 text-[11px] tracking-[0.04em] text-footer-fg-muted sm:flex-row sm:items-center">
        <div className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          © {year} · CC BY 4.0 · ISSN {ISSN}
        </div>
        <div className="flex flex-wrap gap-4">
          <span>DOI Foundation Member</span>
          <span>COPE Signatory</span>
          <span>OAI-PMH</span>
        </div>
      </div>
    </footer>
  );
}
