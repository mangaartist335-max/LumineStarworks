import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Laptop,
  ListChecks,
  Star,
  UsersRound,
} from "lucide-react";
import { courses, formatPrice, getCourse, lessonCount, totalMinutes } from "@/lib/courses";
import { enrollments } from "@/lib/learner";
import { CourseCover } from "@/components/CourseCover";
import { CourseCard } from "@/components/CourseCard";
import { CurriculumAccordion } from "@/components/CurriculumAccordion";
import { EnrollButton } from "@/components/EnrollButton";
import { ProgressBar } from "@/components/ProgressBar";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const course = getCourse(slug);
  return course ? { title: course.title, description: course.tagline } : {};
}

export default async function CoursePage(props: PageProps<"/courses/[slug]">) {
  const { slug } = await props.params;
  const course = getCourse(slug);
  if (!course) notFound();

  const enrollment = enrollments.find((e) => e.slug === course.slug);
  const minutes = totalMinutes(course);
  const hours = Math.round((minutes / 60) * 10) / 10;
  const related = courses
    .filter((c) => c.slug !== course.slug && c.category === course.category)
    .concat(courses.filter((c) => c.slug !== course.slug && c.category !== course.category))
    .slice(0, 3);

  const facts = [
    { icon: Award, label: "Learning hours", value: `${course.learningHours} learning hours + certificate` },
    { icon: CalendarDays, label: "Duration", value: `${course.weeks} ${course.weeks === 1 ? "week" : "weeks"}` },
    { icon: Clock, label: "Learning time", value: `About ${hours} hours` },
    { icon: ListChecks, label: "Lessons", value: `${lessonCount(course)} lessons in ${course.modules.length} modules` },
    { icon: Laptop, label: "Format", value: course.format },
    { icon: BarChart3, label: "Level", value: course.level },
  ];

  return (
    <>
      <section className="border-b bg-surface">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6">
          <nav className="flex items-center gap-1 text-sm text-muted" aria-label="Breadcrumb">
            <Link href="/courses" className="hover:text-foreground">Courses</Link>
            <ChevronRight className="h-4 w-4" aria-hidden />
            <Link
              href={`/courses?category=${encodeURIComponent(course.category)}`}
              className="hover:text-foreground"
            >
              {course.category}
            </Link>
          </nav>

          <div className="mt-6 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand-dark">{course.category}</span>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-muted">{course.level}</span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">{course.format}</span>
              </div>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {course.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted">{course.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-sun text-sun" aria-hidden />
                  <span className="font-semibold">{course.rating.toFixed(1)}</span>
                  <span className="text-muted">rating</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <UsersRound className="h-4 w-4" aria-hidden />
                  {course.learners.toLocaleString("en-US")} learners
                </span>
                <span className="inline-flex items-center gap-2 text-muted">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[11px] font-semibold text-white">
                    {course.instructor.initials}
                  </span>
                  Taught by <span className="font-medium text-foreground">{course.instructor.name}</span>
                </span>
              </div>
            </div>
            <CourseCover theme={course.cover} icon={course.icon} size="lg" className="hidden h-60 rounded-3xl lg:block" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-12">
          <section>
            <h2 className="font-display text-2xl font-semibold">About this course</h2>
            <p className="mt-3 leading-relaxed text-muted">{course.description}</p>
          </section>

          <section className="rounded-2xl border bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold">What you&rsquo;ll learn</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  {o}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-2xl font-semibold">Curriculum</h2>
              <p className="text-sm text-muted">
                {course.modules.length} modules · {lessonCount(course)} lessons · {minutes} min
              </p>
            </div>
            <div className="mt-5">
              <CurriculumAccordion modules={course.modules} />
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">Who it&rsquo;s for</h2>
            <ul className="mt-4 space-y-2">
              {course.audience.map((a) => (
                <li key={a} className="flex items-center gap-3 text-sm text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {a}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-surface p-6">
            <h2 className="font-display text-2xl font-semibold">Your instructor</h2>
            <div className="mt-5 flex gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand font-semibold text-white">
                {course.instructor.initials}
              </span>
              <div>
                <p className="font-semibold">
                  {course.instructor.name}, {course.instructor.credentials}
                </p>
                <p className="text-sm text-accent">{course.instructor.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">{course.instructor.bio}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border bg-surface p-6 shadow-[0_20px_40px_-24px_rgba(15,110,106,0.3)]">
            {enrollment ? (
              <div className="mb-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Your progress</span>
                  <span className="text-muted">{enrollment.progress}%</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={enrollment.progress} label="Course progress" />
                </div>
                <p className="mt-3 text-sm text-muted">
                  Up next: <span className="text-foreground">{enrollment.nextLesson}</span>
                </p>
              </div>
            ) : (
              <div className="mb-5">
                <p className="font-display text-3xl font-semibold">
                  {formatPrice(course.price)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {course.price === null
                    ? "Group and workplace pricing available on request"
                    : course.price === 0
                      ? "Free for the NursesWeCare community"
                      : "Prices in Canadian dollars"}
                </p>
              </div>
            )}

            <EnrollButton
              enrolled={Boolean(enrollment)}
              label={course.price === null ? "Request a seat" : course.format === "Virtual" ? "Enroll now" : "Reserve my seat"}
            />

            <dl className="mt-6 space-y-3 border-t pt-5">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 text-sm">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <dt className="sr-only">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <h2 className="font-display text-2xl font-semibold">You might also enjoy</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </>
  );
}
