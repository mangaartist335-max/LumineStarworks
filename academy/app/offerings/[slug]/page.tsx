import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, ChevronRight, ExternalLink, Hand, Hourglass, Mail } from "lucide-react";
import { getCourse, type Course } from "@/lib/courses";
import { getOffering, offerings } from "@/lib/offerings";
import { CourseCard } from "@/components/CourseCard";
import { NotifyButton } from "@/components/NotifyButton";
import { StatusChip } from "@/components/OfferingCard";
import { CourseObject } from "@/components/three";

const CONTACT_URL = "https://www.nurseswecare.org/contact-5";

export function generateStaticParams() {
  return offerings.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata(props: PageProps<"/offerings/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const offering = getOffering(slug);
  return offering ? { title: offering.title, description: offering.tagline } : {};
}

export default async function OfferingPage(props: PageProps<"/offerings/[slug]">) {
  const { slug } = await props.params;
  const offering = getOffering(slug);
  if (!offering) notFound();

  const courses = offering.courseSlugs.map(getCourse).filter((c): c is Course => Boolean(c));
  const others = offerings.filter((o) => o.slug !== offering.slug);
  const action = offering.action;

  return (
    <>
      <section className="mesh">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6">
          <nav className="flex items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/offerings" className="hover:text-foreground">What we offer</Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <span aria-current="page" className="text-foreground">{offering.title}</span>
          </nav>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white px-3 py-1.5 text-brand-dark ring-1 ring-border">{offering.kind}</span>
                <StatusChip status={offering.status} large />
              </div>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                {offering.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted">{offering.tagline}</p>
              <p className="mt-3 max-w-xl leading-relaxed">{offering.summary}</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {action ? (
                  action.external ? (
                    <a href={action.href} target="_blank" rel="noreferrer" className="btn-primary px-6 py-3.5 text-sm">
                      {action.label} <ExternalLink className="h-4 w-4" aria-hidden />
                      <span className="sr-only">(opens nurseswecare.org in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={action.href} className="btn-primary px-6 py-3.5 text-sm">
                      {action.label} <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  )
                ) : (
                  <NotifyButton what="the community" />
                )}
                <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="btn-secondary px-6 py-3.5 text-sm">
                  <Mail className="h-4 w-4" aria-hidden /> Ask the team
                  <span className="sr-only">(opens nurseswecare.org in a new tab)</span>
                </a>
              </div>
            </div>

            {/* The same playful 3D model as the course pages */}
            <div className="relative">
              <div
                className={`cover-${offering.cover} relative h-64 overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-40px_rgba(42,134,194,0.7)] sm:h-72 lg:h-80`}
              >
                <div className="dot-grid absolute inset-0 opacity-50" />
                <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-2xl" />
                <CourseObject
                  icon={offering.icon}
                  theme={offering.cover}
                  courseTitle={offering.title}
                  className="absolute inset-0 rounded-[2.5rem]"
                />
                <p className="animate-hint pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1 text-[11px] font-semibold text-brand-dark backdrop-blur">
                  <Hand className="h-3.5 w-3.5" aria-hidden /> Drag or use arrow keys to spin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-14 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="reveal">
          <h2 className="font-display text-2xl font-semibold">What we can share so far</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {offering.highlights.map((h) => (
              <li key={h} className="flex gap-3 rounded-3xl bg-surface-muted p-4 text-sm leading-relaxed">
                <span className="gradient-fill mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </section>

        {/* A warm placeholder for the details we don't have yet */}
        <section className="reveal self-start rounded-[2rem] bg-accent-soft p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Hourglass className="h-5 w-5 text-accent-dark" aria-hidden /> More details on the way
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            We&rsquo;re still gathering a few things for this page. Soon you&rsquo;ll find:
          </p>
          <ul className="mt-3 space-y-2">
            {offering.comingSoon.map((c) => (
              <li key={c} className="flex gap-2.5 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-strong" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">
            Have a question in the meantime?{" "}
            <a href={CONTACT_URL} target="_blank" rel="noreferrer" className="font-semibold text-accent-dark underline-offset-2 hover:underline">
              Say hello to the team
              <span className="sr-only"> (opens nurseswecare.org in a new tab)</span>
            </a>
            .
          </p>
        </section>
      </div>

      {courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <h2 className="reveal font-display text-3xl font-semibold tracking-tight">Courses you can take</h2>
          <div className="reveal mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="reveal font-display text-2xl font-semibold tracking-tight">More from NursesWeCare</h2>
        <ul className="reveal mt-6 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link
                href={`/offerings/${o.slug}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium ring-1 ring-border transition hover:bg-accent-soft"
              >
                {o.title} <ArrowRight className="h-4 w-4 text-accent-dark" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
