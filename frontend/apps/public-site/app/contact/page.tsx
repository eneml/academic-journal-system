import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Editorial office, mailing address, and email contacts for The Academic Journal.",
};

export const revalidate = 600;

export default async function ContactPage() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader activePath="/contact" />

      <section className="mx-auto max-w-[760px] px-6 pt-12 pb-6 text-center lg:px-14">
        <div className="mb-3 font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-deep">
          Contact
        </div>
        <h1 className="m-0 mb-3 font-serif-display text-[clamp(36px,5vw,48px)] font-medium leading-[1.05] tracking-[-0.02em]">
          Get in touch with the editorial office
        </h1>
        <p className="m-0 font-serif-body text-[18px] italic leading-[1.55] text-fg-2">
          For matters relating to a specific submission, please use the
          editorial portal so the message is attached to your file. For all
          other queries, the channels below reach the editorial office directly.
        </p>
      </section>

      <section className="mx-auto grid max-w-[920px] gap-5 px-6 pb-14 sm:grid-cols-2 lg:px-14">
        <ContactCard
          eyebrow="Editorial office"
          title="General enquiries"
          icon={<Mail className="h-4 w-4" />}
          line1="editor@academic-journal.example"
          line2="Replies within two working days"
          href="mailto:editor@academic-journal.example"
          external
        />
        <ContactCard
          eyebrow="Submissions"
          title="Submitting a manuscript"
          icon={<Mail className="h-4 w-4" />}
          line1="submissions@academic-journal.example"
          line2="Use the editorial portal whenever possible"
          href="/for-authors"
        />
        <ContactCard
          eyebrow="Mailing address"
          title="Editorial office"
          icon={<MapPin className="h-4 w-4" />}
          line1="University of Bucharest, Faculty of Mathematics and Computer Science"
          line2="14 Academiei Street, Bucharest 010014, Romania"
        />
        <ContactCard
          eyebrow="Press"
          title="Media enquiries"
          icon={<Phone className="h-4 w-4" />}
          line1="+40 21 314 35 08"
          line2="Open weekdays, 09:00–17:00 EET"
        />
      </section>

      <section className="mx-auto max-w-[760px] px-6 pb-14 lg:px-14">
        <div className="rounded-md border border-border bg-surface p-6 text-center">
          <h2 className="m-0 mb-2 font-serif-display text-[22px] font-medium">
            Looking for the right person?
          </h2>
          <p className="m-0 mb-3.5 font-serif-body text-[14.5px] leading-[1.6] text-fg-2">
            Our editorial board lists each editor with the topics they oversee.
            For domain-specific queries it&rsquo;s faster to write to the
            relevant section editor than the general office.
          </p>
          <Link
            href="/editorial"
            className="inline-flex items-center gap-1 font-medium text-cobalt hover:text-cobalt-deep no-underline"
          >
            View the editorial board →
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function ContactCard({
  eyebrow,
  title,
  icon,
  line1,
  line2,
  href,
  external,
}: {
  eyebrow: string;
  title: string;
  icon: ReactNode;
  line1: string;
  line2?: string;
  href?: string;
  external?: boolean;
}) {
  const Body = (
    <>
      <div className="mb-2 flex items-center gap-2 text-cobalt">
        {icon}
        <span className="font-sans text-[10.5px] font-semibold uppercase tracking-[0.12em]">
          {eyebrow}
        </span>
      </div>
      <h3 className="m-0 mb-2 font-serif-display text-[20px] font-medium tracking-[-0.005em]">
        {title}
      </h3>
      <div className="font-serif-body text-[14.5px] leading-[1.55] text-fg-2">
        <div>{line1}</div>
        {line2 ? (
          <div className="mt-1 text-[12.5px] italic text-muted">{line2}</div>
        ) : null}
      </div>
    </>
  );

  if (!href) {
    return <div className="rounded-md border border-border bg-bg p-6">{Body}</div>;
  }

  if (external) {
    return (
      <a
        href={href}
        className="rounded-md border border-border bg-bg p-6 transition-colors hover:border-cobalt no-underline text-inherit block"
      >
        {Body}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="rounded-md border border-border bg-bg p-6 transition-colors hover:border-cobalt no-underline text-inherit block"
    >
      {Body}
    </Link>
  );
}
