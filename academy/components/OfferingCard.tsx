import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import clsx from "clsx";
import { STATUS_LABEL, offerings, type Offering } from "@/lib/offerings";
import { CourseCover } from "./CourseCover";
import { Tilt } from "./Tilt";

export function StatusChip({ status, large = false }: { status: Offering["status"]; large?: boolean }) {
  return (
    <span
      className={clsx(
        "rounded-full font-semibold",
        large ? "px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]",
        status === "coming-soon" ? "bg-white text-accent-dark ring-1 ring-pink" : "bg-brand-dark text-white"
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OfferingCard({ offering }: { offering: Offering }) {
  return (
    <Tilt className="flex">
      <Link
        href={`/offerings/${offering.slug}`}
        className="card group flex w-full flex-col p-2 transition hover:-translate-y-1"
      >
        <div className="relative">
          <CourseCover theme={offering.cover} icon={offering.icon} className="h-36 rounded-[1.4rem]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-brand-dark backdrop-blur">
              {offering.kind}
            </span>
            <StatusChip status={offering.status} />
          </div>
        </div>
        <div className="flex flex-1 items-end justify-between gap-4 px-4 pb-4 pt-5">
          <div>
            <h2 className="font-display text-lg font-semibold leading-snug">{offering.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{offering.tagline}</p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-muted text-foreground transition group-hover:bg-accent-strong group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" aria-hidden />
          </span>
        </div>
      </Link>
    </Tilt>
  );
}

// A compact row-style link, used on the home page and in the catalog.
export function OfferingTile({ offering }: { offering: Offering }) {
  return (
    <Link
      href={`/offerings/${offering.slug}`}
      className="card group flex h-full items-center gap-4 rounded-3xl p-3 pr-5 transition hover:-translate-y-0.5"
    >
      <CourseCover theme={offering.cover} icon={offering.icon} size="sm" className="h-16 w-16 shrink-0 rounded-2xl" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-accent-dark">{offering.kind}</span>
        <span className="mt-0.5 block font-display font-semibold leading-snug">{offering.title}</span>
        {offering.status === "coming-soon" && <span className="mt-0.5 block text-xs text-muted">Coming soon</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-accent-dark transition group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export function OfferingTiles({ className }: { className?: string }) {
  return (
    <ul className={clsx("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {offerings.map((o) => (
        <li key={o.slug}>
          <OfferingTile offering={o} />
        </li>
      ))}
    </ul>
  );
}
