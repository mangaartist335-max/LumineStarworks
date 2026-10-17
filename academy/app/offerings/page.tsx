import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { offerings } from "@/lib/offerings";
import { OfferingCard } from "@/components/OfferingCard";

export const metadata: Metadata = {
  title: "What we offer",
  description:
    "Fit testing, CPR and BLS, wound care, wellness workshops, health fairs and a peer-support community from NursesWeCare.",
};

export default function OfferingsPage() {
  return (
    <>
      <section className="mesh">
        <header className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6">
          <span className="eyebrow">What we offer</span>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Everything NursesWeCare <span className="gradient-text">offers you</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Programs, services, workshops and community, all led by Registered Nurses in Hamilton,
            Ontario. Some pages are still growing, so you&rsquo;ll see a few &ldquo;coming
            soon&rdquo; notes while we gather the details.
          </p>
        </header>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offerings.map((o) => (
            <li key={o.slug} className="reveal flex">
              <OfferingCard offering={o} />
            </li>
          ))}
        </ul>

        <div className="reveal mt-14 flex flex-wrap items-center justify-between gap-4 rounded-[2rem] bg-brand-soft px-8 py-7">
          <p className="max-w-xl text-foreground">
            Looking for courses you can start today? The catalog has every course, from respirator
            basics to the Train-the-Trainer program.
          </p>
          <Link href="/courses" className="btn-primary px-6 py-3 text-sm">
            Browse courses <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </>
  );
}
