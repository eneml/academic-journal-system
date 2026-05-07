import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { Badge } from "@ajs/ui";
import { Button } from "@ajs/ui";
import {
  fetchAnnouncements,
  fetchJournalConfig,
  pickLocale,
  type Announcement,
  type AnnouncementType,
} from "@/lib/api";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Announcements",
  description:
    "Latest announcements from The Academic Journal — calls for papers, special issues, indexing changes, and policy updates.",
};

const TYPE_LABELS: Record<AnnouncementType, string> = {
  GENERAL: "News",
  CALL_FOR_PAPERS: "Call for papers",
  SPECIAL_ISSUE: "Special issue",
  POLICY: "Policy",
};

const TYPE_VARIANTS: Record<
  AnnouncementType,
  "amber" | "cobalt" | "default" | "outline"
> = {
  GENERAL: "cobalt",
  CALL_FOR_PAPERS: "amber",
  SPECIAL_ISSUE: "amber",
  POLICY: "outline",
};

export default async function AnnouncementsPage(): Promise<ReactNode> {
  const [announcements, config] = await Promise.all([
    fetchAnnouncements(50),
    fetchJournalConfig(),
  ]);
  const locale = config?.defaultLocale ?? "en";
  const items = (announcements ?? []).filter((a) => a.visible);

  // Sort: pinned first, then most recent. Keep calls for papers visually
  // grouped at the top by recency, alongside other announcement types.
  const sorted = items
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.datePosted ?? "").localeCompare(a.datePosted ?? "");
    });

  const callsForPapers = sorted.filter(
    (a) => a.type === "CALL_FOR_PAPERS" || a.type === "SPECIAL_ISSUE",
  );
  const others = sorted.filter(
    (a) => a.type !== "CALL_FOR_PAPERS" && a.type !== "SPECIAL_ISSUE",
  );

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/announcements" />

      <section className="mx-auto max-w-[760px] px-6 pt-12 pb-6 text-center lg:px-14">
        <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
          Announcements
        </div>
        <h1 className="m-0 mb-3 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
          News from the editorial office
        </h1>
        <p className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
          Calls for papers, special-issue invitations, policy updates, and other
          news from the journal — all in one place.
        </p>
      </section>

      <section className="mx-auto max-w-[920px] px-6 pb-14 lg:px-14">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-surface px-7 py-10 text-center">
            <p className="m-0 font-serif-body italic text-muted">
              There are no current announcements.
            </p>
          </div>
        ) : null}

        {callsForPapers.length > 0 ? (
          <>
            <SectionHead
              title="Open calls for papers"
              count={callsForPapers.length}
            />
            <ul className="mb-10 grid gap-5 m-0 p-0 list-none">
              {callsForPapers.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} />
              ))}
            </ul>
          </>
        ) : null}

        {others.length > 0 ? (
          <>
            <SectionHead title="Latest news" count={others.length} />
            <ul className="grid gap-5 m-0 p-0 list-none">
              {others.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} />
              ))}
            </ul>
          </>
        ) : null}
      </section>

      <PublicFooter />
    </div>
  );
}

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="m-0 font-serif-display text-[22px] font-medium tracking-[-0.01em]">
        {title}
      </h2>
      <div className="h-px flex-1 bg-border" />
      <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] tabular-nums text-muted">
        {count}
      </span>
    </div>
  );
}

function AnnouncementCard({
  announcement: a,
  locale,
}: {
  announcement: Announcement;
  locale: string;
}) {
  const title = pickLocale(a.title, locale);
  const body = pickLocale(a.body, locale);
  const isCall = a.type === "CALL_FOR_PAPERS" || a.type === "SPECIAL_ISSUE";

  return (
    <li className="rounded-md border border-border bg-bg p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TYPE_VARIANTS[a.type] ?? "default"}>
            {TYPE_LABELS[a.type] ?? a.type}
          </Badge>
          {a.pinned ? <Badge variant="cobalt">Pinned</Badge> : null}
          {a.dateExpires ? (
            <Badge variant="outline">Due {formatDate(a.dateExpires)}</Badge>
          ) : null}
          {a.datePosted ? (
            <span className="font-mono text-[11px] text-muted">
              {formatDate(a.datePosted)}
            </span>
          ) : null}
        </div>
        {isCall ? (
          <Button asChild size="sm">
            <Link href="/for-authors">
              Submit a manuscript <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        ) : null}
      </div>
      <h3 className="m-0 mb-2 font-serif-display text-[24px] font-medium tracking-[-0.01em]">
        {title}
      </h3>
      {body ? (
        <p className="m-0 max-w-[640px] font-serif-body text-[15px] leading-[1.6] text-fg-2">
          {body}
        </p>
      ) : null}
    </li>
  );
}
