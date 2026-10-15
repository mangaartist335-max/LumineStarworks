import Link from "next/link";
import {
  ArrowRight,
  Award,
  Check,
  Clock,
  Globe,
  Hand,
  HandHeart,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { courses, getCourse } from "@/lib/courses";
import { CourseCard } from "@/components/CourseCard";
import { AerosolLabSection, HeroScene } from "@/components/three";

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
      {/* Cinematic hero: a twilight stage with 3D shapes you can drag around */}
      <section className="night grain relative -mt-[72px] overflow-hidden text-white">
        <div className="animate-scene-in absolute inset-x-0 top-[72px] h-[360px] sm:h-[420px] lg:inset-0 lg:h-auto">
          <HeroScene className="h-full w-full" />
        </div>
        <div className="vignette pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-b from-transparent to-background" />

        <div className="hero-drift pointer-events-none relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-center px-4 pb-36 pt-[452px] sm:px-6 sm:pt-[512px] lg:pb-32 lg:pt-28">
          <div className="max-w-xl">
            <span className="eyebrow-dark animate-fade-up">RN-led learning · Hamilton, Ontario</span>
            <h1 className="mt-6 font-display text-[2.9rem] font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              <span className="line-mask">
                <span>
                  Protect every <span className="gradient-text-light">breath.</span>
                </span>
              </span>
              <span className="line-mask">
                <span className="[animation-delay:180ms]">
                  Grow every <span className="gradient-text-light">skill.</span>
                </span>
              </span>
            </h1>
            <p className="animate-fade-up mt-6 max-w-lg text-lg leading-relaxed text-white/75 [animation-delay:450ms]">
              NursesWeCare Academy helps nurses and healthcare teams build real confidence in
              respiratory protection and occupational health, with online lessons, hands-on
              practicums and a warm community cheering you on.
            </p>
            <div className="animate-fade-up pointer-events-auto mt-8 flex flex-wrap gap-3 [animation-delay:600ms]">
              <Link href="/courses" className="btn-primary px-6 py-3.5 text-sm">
                Explore courses <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={`/courses/${FLAGSHIP_SLUG}`} className="btn-ghost-light px-6 py-3.5 text-sm">
                Become a fit test trainer
              </Link>
            </div>
            <ul className="animate-fade-up mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70 [animation-delay:750ms]">
              {["Taught by RNs", "CSA Z94.4 aligned", "Certificates included"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-pink" aria-hidden /> {t}
                </li>
              ))}
            </ul>
            <p className="animate-hint mt-10 hidden items-center gap-2 text-sm text-white/60 lg:flex">
              <Hand className="h-4 w-4" aria-hidden /> Drag the scene to look around, or click a shape to spin it
            </p>
          </div>
        </div>

        <p className="animate-hint pointer-events-none absolute left-1/2 top-[404px] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/15 backdrop-blur sm:top-[464px] lg:hidden">
          <Hand className="h-3.5 w-3.5" aria-hidden /> Tap a shape to spin it
        </p>
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
        <div className="reveal mx-auto max-w-2xl text-center">
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
            <li key={path.title} className="card reveal relative flex flex-col p-6 pt-0">
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
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Popular right now</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">Featured courses</h2>
          </div>
          <Link href="/courses" className="btn-secondary px-5 py-2.5 text-sm">
            Browse all courses <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="reveal mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </section>

      {/* Interactive aerosol lab */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="reveal">
          <AerosolLabSection />
        </div>
      </section>

      {/* Flagship spotlight */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="reveal overflow-hidden rounded-[2.5rem] bg-accent-soft">
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
        <div className="reveal max-w-2xl">
          <span className="eyebrow">Why learn with us</span>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
            Made by nurses who do this every day
          </h2>
        </div>
        <div className="mt-10 grid auto-rows-[minmax(150px,auto)] gap-5 md:grid-cols-4">
          <div className="cover-sky reveal relative overflow-hidden rounded-[2rem] p-8 md:col-span-2 md:row-span-2">
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
      <section className="reveal mx-auto max-w-3xl px-4 pt-24 text-center sm:px-6">
        <HandHeart className="mx-auto h-10 w-10 text-accent" aria-hidden />
        <blockquote className="mt-6 font-display text-2xl font-medium leading-snug sm:text-3xl">
          &ldquo;I walked in nervous about teaching fit testing and walked out excited to run our
          first session. The whole team made it feel easy.&rdquo;
        </blockquote>
        <p className="mt-4 text-sm text-muted">Sample learner · RN, Occupational Health</p>
      </section>

      {/* Fit test call to action */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="mesh reveal relative overflow-hidden rounded-[2.5rem] px-8 py-14 ring-1 ring-border sm:px-14">
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
    <div className={`${tones[tone]} reveal rounded-[2rem] p-6`}>
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-accent shadow-sm">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}
