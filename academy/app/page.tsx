import Link from "next/link";
import { ArrowRight, Award, CalendarHeart, HeartHandshake, Laptop, MapPin, Quote, ShieldCheck, UsersRound } from "lucide-react";
import { CATEGORIES, courses } from "@/lib/courses";
import { CourseCard } from "@/components/CourseCard";

const STATS = [
  { value: String(courses.length), label: "Courses to explore" },
  { value: String(courses.reduce((n, c) => n + c.learningHours, 0)), label: "Learning hours available" },
  {
    value: `${Math.floor(courses.reduce((n, c) => n + c.learners, 0) / 1000)}k+`,
    label: "Nurses learning",
  },
  {
    value: (courses.reduce((n, c) => n + c.rating, 0) / courses.length).toFixed(1),
    label: "Average rating",
  },
];

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Standards you can trust",
    body: "Our respiratory protection programs follow CSA Z94.4-18, so what you learn carries straight into your workplace program.",
  },
  {
    icon: UsersRound,
    title: "Developed and delivered by RNs",
    body: "Every program is built and taught by Registered Nurses who fit test, teach and support healthcare teams every week.",
  },
  {
    icon: HeartHandshake,
    title: "A community that lifts you up",
    body: "NursesWeCare began by helping fellow nurses and internationally educated nurses grow, and peer support is still at our heart.",
  },
];

const STEPS = [
  { icon: Laptop, title: "Pick a course", body: "Browse by topic, level or format and start whenever it suits you." },
  { icon: CalendarHeart, title: "Learn on your schedule", body: "Online lessons fit between shifts, with hands-on practice at our Hamilton training space." },
  { icon: Award, title: "Earn and celebrate", body: "Collect certificates and learning hours for your CNO Quality Assurance reflection." },
];

export default function HomePage() {
  const featured = courses.filter((c) => c.featured);

  return (
    <>
      <section className="hero-wash relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs font-semibold text-brand-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              The learning home of NursesWeCare
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Advancing health, safety and wellness <span className="text-brand">in workplaces and communities.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              NursesWeCare Academy offers respiratory protection and occupational health
              education, developed and delivered by Registered Nurses. Learn online, practise
              hands-on in Hamilton, and bring what you learn back to your team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Browse the catalog <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border bg-surface px-6 py-3 text-sm font-semibold transition hover:border-brand/40"
              >
                Go to my learning
              </Link>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="rounded-3xl border bg-surface p-6 shadow-[0_30px_60px_-30px_rgba(15,110,106,0.35)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Popular right now</p>
              <ul className="mt-4 space-y-3">
                {featured.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/courses/${c.slug}`}
                      className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-background"
                    >
                      <span className={`cover-${c.cover} grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white`}>
                        {c.learningHours}h
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{c.title}</span>
                        <span className="block text-sm text-muted">
                          {c.category} · {c.format}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-2xl bg-brand-soft p-4 text-sm text-brand-dark">
                <span className="font-semibold">Now enrolling:</span> RN Respirator Fit Testing
                Train-the-Trainer. Group seats available for workplaces.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y bg-surface">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd className="font-display text-3xl font-semibold text-brand">{s.value}</dd>
              <dd className="mt-1 text-sm text-muted">{s.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">Featured courses</h2>
            <p className="mt-2 text-muted">Start with our most requested programs.</p>
          </div>
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
            See all courses <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Explore by topic</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const count = courses.filter((c) => c.category === cat).length;
            return (
              <Link
                key={cat}
                href={`/courses?category=${encodeURIComponent(cat)}`}
                className="rounded-2xl border bg-surface p-5 transition hover:border-brand/40 hover:bg-brand-soft/40"
              >
                <span className="block font-semibold">{cat}</span>
                <span className="mt-1 block text-sm text-muted">
                  {count} {count === 1 ? "course" : "courses"}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-surface p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-soft text-accent">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="overflow-hidden rounded-3xl bg-brand text-white">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight">How the Academy works</h2>
              <p className="mt-3 text-white/80">
                Three easy steps from curious to certified, all at your own pace.
              </p>
              <figure className="mt-8 rounded-2xl bg-white/10 p-5">
                <Quote className="h-5 w-5 text-sun" aria-hidden />
                <blockquote className="mt-2 text-sm leading-relaxed">
                  &ldquo;The practicum made fit testing click for me. I came back ready to train
                  our whole unit, and I felt supported the entire way.&rdquo;
                </blockquote>
                <figcaption className="mt-3 text-xs text-white/70">Sample learner quote · RN, Occupational Health</figcaption>
              </figure>
            </div>
            <ol className="space-y-4">
              {STEPS.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="flex gap-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sun">Step {i + 1}</p>
                    <h3 className="mt-1 font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-white/80">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">Need a fit test instead?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          NursesWeCare also offers N95 respirator fit testing for students and workplaces at our
          Hamilton office and on site.
        </p>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted">
          <MapPin className="h-4 w-4 text-accent" aria-hidden /> 702 Upper James St., Hamilton, ON
        </p>
        <Link
          href="https://www.nurseswecare.org/booking-workingplace-request-form"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          Book a fit test <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}
