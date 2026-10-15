import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarClock,
  Check,
  Clock,
  Globe,
  HandHeart,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { courses, getCourse } from "@/lib/courses";
import { CourseCard } from "@/components/CourseCard";
import { ProgressBar } from "@/components/ProgressBar";

const FIT_TEST_URL = "https://www.nurseswecare.org/booking-workingplace-request-form";
const FLAGSHIP_SLUG = "rn-respirator-fit-testing-train-the-trainer";

const STATS = [
  { value: String(courses.length), label: "Courses and workshops" },
  { value: String(courses.reduce((n, c) => n + c.learningHours, 0)), label: "Hours of learning" },
  { value: `${Math.floor(courses.reduce((n, c) => n + c.learners, 0) / 1000)}k+`, label: "Learners so far" },
  { value: (courses.reduce((n, c) => n + c.rating, 0) / courses.length).toFixed(1), label: "Average rating" },
];

const PATHS = [
  {
    step: 1,
    title: "Foundations",
    blurb: "Get comfortable with respirators, PPE and everyday infection prevention.",
    slugs: ["respiratory-protection-essentials", "ipac-foundations"],
  },
  {
    step: 2,
    title: "Practitioner",
    blurb: "Grow into occupational health and the clinical skills workplaces count on.",
    slugs: ["occupational-health-nursing-essentials", "advanced-wound-care-fundamentals"],
  },
  {
    step: 3,
    title: "Trainer",
    blurb: "Lead fit testing for your organization and teach others to do it well.",
    slugs: [FLAGSHIP_SLUG],
  },
];

export default function HomePage() {
  const featured = courses.filter((c) => c.featured);
  const flagship = getCourse(FLAGSHIP_SLUG)!;

  return (
    <>
      {/* Hero */}
      <section className="mesh relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-28 pt-14 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="animate-fade-up">
            <span className="eyebrow">RN-led learning · Hamilton, Ontario</span>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
              Protect every <span className="gradient-text">breath.</span>
              <br />
              Grow every <span className="gradient-text">skill.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              NursesWeCare Academy helps nurses and healthcare teams build real confidence in
              respiratory protection and occupational health, with online lessons, hands-on
              practicums and a warm community cheering you on.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/courses" className="btn-primary px-6 py-3.5 text-sm">
                Explore courses <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={`/courses/${FLAGSHIP_SLUG}`} className="btn-secondary px-6 py-3.5 text-sm">
                Become a fit test trainer
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {["Taught by RNs", "CSA Z94.4 aligned", "Certificates included"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-accent" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* A little collage of what learning here feels like. */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms] lg:max-w-none">
            <div className="cover-blend relative aspect-[4/3.4] overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-40px_rgba(42,134,194,0.7)]">
              <div className="dot-grid absolute inset-0" />
              <div className="absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-white/30" />
              <div className="absolute inset-0 grid place-items-center">
                <span className="grid h-28 w-28 place-items-center rounded-[2rem] bg-white/40 text-white ring-1 ring-white/70 backdrop-blur">
                  <ShieldCheck className="h-14 w-14" strokeWidth={1.5} aria-hidden />
                </span>
              </div>
            </div>

            <div className="glass animate-float absolute -left-4 top-6 w-56 rounded-3xl p-4 sm:-left-10">
              <p className="flex items-center gap-2 text-xs font-semibold text-accent-dark">
                <CalendarClock className="h-4 w-4" aria-hidden /> Next practicum
              </p>
              <p className="mt-1.5 font-display text-sm font-semibold">Hands-on fit testing</p>
              <p className="text-xs text-muted">Thursday · 9:00 AM · Hamilton</p>
            </div>

            <div className="glass animate-float absolute -right-2 bottom-10 w-64 rounded-3xl p-4 [animation-delay:1.5s] sm:-right-8">
              <p className="text-xs font-semibold text-brand-dark">Your progress</p>
              <p className="mt-1 font-display text-sm font-semibold">{flagship.title}</p>
              <div className="mt-3 flex items-center gap-2">
                <ProgressBar value={62} label="Sample progress" />
                <span className="text-xs font-semibold">62%</span>
              </div>
            </div>

            <div className="absolute -bottom-5 left-8 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-lg">
              <BadgeCheck className="h-4 w-4" aria-hidden /> Certificate earned!
            </div>
          </div>
        </div>
      </section>

      {/* Stats ribbon overlapping the hero */}
      <section className="relative z-10 mx-auto -mt-14 max-w-5xl px-4 sm:px-6">
        <dl className="card grid grid-cols-2 gap-y-6 px-6 py-7 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={s.label} className={`text-center ${i > 0 ? "md:border-l" : ""}`}>
              <dd className="gradient-text font-display text-4xl font-semibold">{s.value}</dd>
              <dt className="mt-1 text-sm text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* Learning paths */}
      <section id="paths" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Learning paths</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
            Find your path, one step at a time
          </h2>
          <p className="mt-3 text-muted">
            Start where you are. Each step builds on the last, all the way to training others.
          </p>
        </div>
        <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
          <span
            className="absolute left-[16%] right-[16%] top-0 hidden border-t-2 border-dashed border-sky md:block"
            aria-hidden
          />
          {PATHS.map((path) => (
            <li key={path.title} className="card relative flex flex-col p-6 pt-0">
              <span className="gradient-fill mx-auto grid h-16 w-16 -translate-y-1/2 place-items-center rounded-full font-display text-2xl font-semibold text-white ring-8 ring-background">
                {path.step}
              </span>
              <h3 className="-mt-4 text-center font-display text-xl font-semibold">{path.title}</h3>
              <p className="mt-2 text-center text-sm leading-relaxed text-muted">{path.blurb}</p>
              <ul className="mt-5 space-y-2">
                {path.slugs.map((slug) => {
                  const c = getCourse(slug);
                  if (!c) return null;
                  return (
                    <li key={slug}>
                      <Link
                        href={`/courses/${slug}`}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm font-medium transition hover:bg-accent-soft"
                      >
                        <span>{c.title}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      {/* Featured courses */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Popular right now</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">Featured courses</h2>
          </div>
          <Link href="/courses" className="btn-secondary px-5 py-2.5 text-sm">
            Browse all courses <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      {/* Flagship spotlight */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="overflow-hidden rounded-[2.5rem] bg-accent-soft">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                <Star className="h-3.5 w-3.5 fill-white" aria-hidden /> Flagship program
              </span>
              <h2 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight">
                {flagship.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted">
                Leave ready to run fit testing in your own workplace. You&rsquo;ll learn the science,
                practise the hands-on steps with RN faculty, and pick up the teaching skills to
                train your colleagues with confidence.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white px-3 py-1.5 font-medium">{flagship.learningHours} learning hours</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-medium">{flagship.format}</span>
                <span className="rounded-full bg-white px-3 py-1.5 font-medium">Group seats for workplaces</span>
              </div>
              <Link href={`/courses/${FLAGSHIP_SLUG}`} className="btn-primary mt-8 px-6 py-3.5 text-sm">
                See the program <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <ol className="space-y-3">
              {flagship.modules.map((m, i) => (
                <li key={m.title} className="flex items-start gap-4 rounded-3xl bg-white p-4 shadow-[0_10px_30px_-24px_rgba(198,63,156,0.8)]">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-semibold text-brand-dark">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display font-semibold">{m.title}</p>
                    <p className="text-sm text-muted">{m.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Why learn with us, as a bento grid */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="max-w-2xl">
          <span className="eyebrow">Why learn with us</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
            Made by nurses who do this every day
          </h2>
        </div>
        <div className="mt-10 grid auto-rows-[minmax(150px,auto)] gap-5 md:grid-cols-4">
          <div className="cover-sky relative overflow-hidden rounded-[2rem] p-8 md:col-span-2 md:row-span-2">
            <div className="dot-grid absolute inset-0 opacity-60" />
            <div className="relative flex h-full flex-col">
              <MapPin className="h-8 w-8 text-brand-dark" aria-hidden />
              <h3 className="mt-auto pt-16 font-display text-3xl font-semibold leading-tight">
                Practise for real, right here in Hamilton
              </h3>
              <p className="mt-3 max-w-sm text-foreground/80">
                Online lessons get you ready, then small-group practicums let you build skills with
                RN faculty beside you.
              </p>
            </div>
          </div>
          <BentoTile icon={Clock} title="Learn between shifts" body="Short lessons you can finish on a break." tone="pink" />
          <BentoTile icon={ShieldCheck} title="Standards built in" body="Respiratory content follows CSA Z94.4." tone="white" />
          <BentoTile icon={Globe} title="Welcoming to IENs" body="Peer support for internationally educated nurses." tone="white" />
          <BentoTile icon={Award} title="Certificates for CNO QA" body="Log your learning hours with ease." tone="sky" />
        </div>
      </section>

      {/* Kind words */}
      <section className="mx-auto max-w-3xl px-4 pt-24 text-center sm:px-6">
        <HandHeart className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <blockquote className="mt-6 font-display text-2xl font-medium leading-snug sm:text-3xl">
          &ldquo;I walked in nervous about teaching fit testing and walked out excited to run our
          first session. The whole team made it feel easy.&rdquo;
        </blockquote>
        <p className="mt-4 text-sm text-muted">Sample learner · RN, Occupational Health</p>
      </section>

      {/* Fit test call to action */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="mesh relative overflow-hidden rounded-[2.5rem] px-8 py-14 ring-1 ring-border sm:px-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Need an N95 fit test?
              </h2>
              <p className="mt-3 max-w-lg text-muted">
                Students and workplaces can book a fit test with our RN team, in Hamilton or on site.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <a href={FIT_TEST_URL} target="_blank" rel="noreferrer" className="btn-primary px-6 py-3.5 text-sm">
                Book a fit test
              </a>
              <Link href="/courses?category=Respiratory%20Protection" className="btn-secondary px-6 py-3.5 text-sm">
                Learn about respirators
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function BentoTile({
  icon: Icon,
  title,
  body,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  tone: "pink" | "sky" | "white";
}) {
  const tones = {
    pink: "bg-accent-soft",
    sky: "bg-brand-soft",
    white: "card",
  };
  return (
    <div className={`${tones[tone]} rounded-[2rem] p-6`}>
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
