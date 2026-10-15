import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CalendarDays, Clock, Download, Flame, ShieldCheck, PlayCircle, Sparkles, Video } from "lucide-react";
import { getCourse, type Course } from "@/lib/courses";
import { certificates, enrollments, learner, liveSessions, recommendedSlugs } from "@/lib/learner";
import { CourseCover } from "@/components/CourseCover";
import { CourseCard } from "@/components/CourseCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Medal } from "@/components/three";

export const metadata: Metadata = {
  title: "My learning",
};

function byCourse<T extends { slug: string }>(items: T[]) {
  return items.flatMap((item) => {
    const course = getCourse(item.slug);
    return course ? [{ ...item, course }] : [];
  });
}

export default function DashboardPage() {
  const active = byCourse(enrollments);
  const [current, ...others] = active;
  const recommended = recommendedSlugs
    .map((slug) => getCourse(slug))
    .filter((c): c is Course => Boolean(c))
    .slice(0, 2);
  const cePct = Math.round((learner.hoursEarned / learner.hoursGoal) * 100);
  const weekPct = Math.round((learner.minutesThisWeek / learner.weeklyGoalMinutes) * 100);

  return (
    <>
      <section className="mesh px-4 pb-12 pt-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="gradient-fill grid h-16 w-16 place-items-center rounded-full font-display text-lg font-semibold text-white ring-4 ring-white">
            {learner.initials}
          </span>
          <div>
            <p className="text-sm text-muted">Good to see you again</p>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              Welcome back, <span className="gradient-text">{learner.firstName}</span>!
            </h1>
            <p className="text-sm text-muted">
              {learner.role} · Member since {learner.memberSince}
            </p>
          </div>
        </div>
        {/* Next milestone, with a little 3D medal to play with */}
        <div className="glass flex items-center gap-2 rounded-[2rem] py-2 pl-2 pr-6">
          <div className="cover-blend relative h-28 w-28 shrink-0 overflow-hidden rounded-[1.5rem]">
            <div className="dot-grid absolute inset-0 opacity-50" />
            <Medal className="absolute inset-0" />
          </div>
          <div className="pl-2">
            <p className="text-xs font-semibold text-accent-dark">Next milestone</p>
            <p className="mt-0.5 font-display font-semibold leading-snug">
              {learner.hoursGoal - learner.hoursEarned} hours to your yearly goal
            </p>
            <p className="mt-0.5 text-xs text-muted">Give the medal a spin!</p>
            <Link href="/courses" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
              Browse courses <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Your stats">
        <StatCard icon={Award} label="Learning hours this year" value={`${learner.hoursEarned} / ${learner.hoursGoal}`}>
          <ProgressBar value={cePct} label="Learning hours goal" />
        </StatCard>
        <StatCard icon={Clock} label="Learning this week" value={`${learner.minutesThisWeek} min`}>
          <ProgressBar value={weekPct} label="Weekly learning goal" />
          <p className="mt-2 text-xs text-muted">Goal: {learner.weeklyGoalMinutes} min</p>
        </StatCard>
        <StatCard icon={Flame} label="Learning streak" value={`${learner.streakDays} days`}>
          <p className="text-xs text-muted">You&rsquo;re on a roll. Keep it going!</p>
        </StatCard>
        <StatCard icon={Sparkles} label="Certificates earned" value={String(certificates.length)}>
          <p className="text-xs text-muted">{active.length} courses in progress</p>
        </StatCard>
      </section>
      </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-8">
          {current && (
            <section>
              <h2 className="font-display text-2xl font-semibold">Pick up where you left off</h2>
              <div className="card mt-4 overflow-hidden p-2 sm:flex">
                <CourseCover
                  theme={current.course.cover}
                  icon={current.course.icon}
                  className="h-40 rounded-[1.4rem] sm:h-auto sm:w-56 sm:shrink-0"
                />
                <div className="flex-1 p-6">
                  <p className="text-xs font-semibold text-accent-dark">
                    {current.course.category}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold">{current.course.title}</h3>
                  <p className="mt-2 text-sm text-muted">
                    Up next: <span className="text-foreground">{current.nextLesson}</span>
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <ProgressBar value={current.progress} label="Course progress" />
                    <span className="text-sm font-medium">{current.progress}%</span>
                  </div>
                  <Link
                    href={`/courses/${current.course.slug}`}
                    className="btn-primary mt-5 px-5 py-2.5 text-sm"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden /> Continue learning
                  </Link>
                </div>
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-semibold">Also in progress</h2>
              <ul className="mt-4 space-y-3">
                {others.map(({ course, progress, nextLesson, lastActive }) => (
                  <li key={course.slug}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="card flex items-center gap-4 rounded-3xl p-3 pr-5 transition hover:-translate-y-0.5"
                    >
                      <CourseCover theme={course.cover} icon={course.icon} size="sm" className="h-16 w-16 shrink-0 rounded-2xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display font-semibold">{course.title}</p>
                        <p className="truncate text-sm text-muted">
                          Next: {nextLesson} · {lastActive}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <ProgressBar value={progress} label={`${course.title} progress`} />
                          <span className="text-xs font-medium">{progress}%</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold">Recommended for you</h2>
              <Link href="/courses" className="text-sm font-semibold text-accent hover:underline">
                See all
              </Link>
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {recommended.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <CalendarDays className="h-5 w-5 text-accent" aria-hidden /> Upcoming live sessions
            </h2>
            <ul className="mt-4 space-y-4">
              {liveSessions.map((s) => (
                <li key={s.title} className="rounded-3xl bg-surface-muted p-4">
                  <p className="text-xs font-semibold text-accent-dark">
                    {s.date} · {s.time}
                  </p>
                  <p className="mt-1 font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">Hosted by {s.host}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      <Video className="h-3.5 w-3.5" aria-hidden /> Join link
                    </button>
                    <Link
                      href={`/courses/${s.courseSlug}`}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      View course
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="certificates" className="card scroll-mt-24 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <Award className="h-5 w-5 text-accent" aria-hidden /> Your certificates
            </h2>
            <ul className="mt-4 divide-y">
              {certificates.map((c) => (
                <li key={c.courseTitle} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.courseTitle}</p>
                    <p className="text-xs text-muted">
                      {c.hours} learning hours · Earned {c.earned}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Download certificate for ${c.courseTitle}`}
                    className="grid h-9 w-9 place-items-center rounded-full bg-surface-muted text-muted hover:bg-accent hover:text-white"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.75rem] bg-brand-soft p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <ShieldCheck className="h-5 w-5 text-brand-dark" aria-hidden /> Your fit test
            </h2>
            <p className="mt-2 text-sm text-muted">
              Last fit test: <span className="text-foreground">N95 respirator, passed Nov 2025</span>.
              Your yearly re-test is coming up next month.
            </p>
            <a
              href="https://www.nurseswecare.org/booking-workingplace-request-form"
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-4 px-4 py-2 text-sm"
            >
              Book a fit test
            </a>
          </section>

          <section className="rounded-[1.75rem] bg-accent-soft p-6">
            <p className="text-xs font-semibold text-accent-dark">A little note</p>
            <p className="mt-2 font-display text-lg font-medium leading-snug">
              Every lesson you finish is a gift to your patients and to yourself. We&rsquo;re so glad
              you&rsquo;re here.
            </p>
          </section>
        </aside>
      </div>
    </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card rounded-3xl p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="grid h-7 w-7 place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="h-4 w-4" /></span>
        {label}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
