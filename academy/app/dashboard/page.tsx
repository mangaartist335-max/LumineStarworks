import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, CalendarDays, Clock, Download, Flame, ShieldCheck, PlayCircle, Sparkles, Video } from "lucide-react";
import { getCourse, type Course } from "@/lib/courses";
import { certificates, enrollments, learner, liveSessions, recommendedSlugs } from "@/lib/learner";
import { CourseCover } from "@/components/CourseCover";
import { CourseCard } from "@/components/CourseCard";
import { ProgressBar } from "@/components/ProgressBar";

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
    .filter((c): c is Course => Boolean(c));
  const cePct = Math.round((learner.hoursEarned / learner.hoursGoal) * 100);
  const weekPct = Math.round((learner.minutesThisWeek / learner.weeklyGoalMinutes) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand text-lg font-semibold text-white">
            {learner.initials}
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              Welcome back, {learner.firstName}!
            </h1>
            <p className="text-sm text-muted">
              {learner.role} · Member since {learner.memberSince}
            </p>
          </div>
        </div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 rounded-full border bg-surface px-4 py-2 text-sm font-semibold transition hover:border-brand/40"
        >
          Browse courses <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
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

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-8">
          {current && (
            <section>
              <h2 className="font-display text-xl font-semibold">Pick up where you left off</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border bg-surface sm:flex">
                <CourseCover
                  theme={current.course.cover}
                  icon={current.course.icon}
                  className="h-36 sm:h-auto sm:w-56 sm:shrink-0"
                />
                <div className="flex-1 p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
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
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    <PlayCircle className="h-4 w-4" aria-hidden /> Continue learning
                  </Link>
                </div>
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold">Also in progress</h2>
              <ul className="mt-4 space-y-3">
                {others.map(({ course, progress, nextLesson, lastActive }) => (
                  <li key={course.slug}>
                    <Link
                      href={`/courses/${course.slug}`}
                      className="flex items-center gap-4 rounded-2xl border bg-surface p-4 transition hover:border-brand/40"
                    >
                      <CourseCover theme={course.cover} icon={course.icon} size="sm" className="h-14 w-14 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{course.title}</p>
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
              <h2 className="font-display text-xl font-semibold">Recommended for you</h2>
              <Link href="/courses" className="text-sm font-semibold text-brand hover:underline">
                See all
              </Link>
            </div>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {recommended.map((c) => (
                <CourseCard key={c.slug} course={c} />
              ))}
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-8">
          <section className="rounded-2xl border bg-surface p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <CalendarDays className="h-5 w-5 text-brand" aria-hidden /> Upcoming live sessions
            </h2>
            <ul className="mt-4 space-y-4">
              {liveSessions.map((s) => (
                <li key={s.title} className="rounded-xl bg-background p-4">
                  <p className="text-xs font-semibold text-accent">
                    {s.date} · {s.time}
                  </p>
                  <p className="mt-1 font-semibold">{s.title}</p>
                  <p className="text-sm text-muted">Hosted by {s.host}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      <Video className="h-3.5 w-3.5" aria-hidden /> Join link
                    </button>
                    <Link
                      href={`/courses/${s.courseSlug}`}
                      className="rounded-full border bg-surface px-3 py-1.5 text-xs font-semibold hover:border-brand/40"
                    >
                      View course
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-surface p-6">
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
                    className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-background hover:text-brand"
                  >
                    <Download className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-surface p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
              <ShieldCheck className="h-5 w-5 text-brand" aria-hidden /> Your fit test
            </h2>
            <p className="mt-2 text-sm text-muted">
              Last fit test: <span className="text-foreground">N95 respirator, passed Nov 2025</span>.
              Your yearly re-test is coming up next month.
            </p>
            <a
              href="https://www.nurseswecare.org/booking-workingplace-request-form"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:brightness-95"
            >
              Book a fit test
            </a>
          </section>

          <section className="rounded-2xl bg-brand-soft p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-dark">A little note</p>
            <p className="mt-2 font-display text-lg leading-snug text-brand-dark">
              Every lesson you finish is a gift to your patients and to yourself. We&rsquo;re so glad
              you&rsquo;re here.
            </p>
          </section>
        </aside>
      </div>
    </div>
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
    <div className="rounded-2xl border bg-surface p-5">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-4 w-4 text-brand" />
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}
