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
  Hand,
  Laptop,
  ListChecks,
  Star,
  UsersRound,
} from "lucide-react";
import { courses, formatPrice, getCourse, lessonCount, totalMinutes } from "@/lib/courses";
import { enrollments } from "@/lib/learner";
import { CourseCard } from "@/components/CourseCard";
import { CurriculumAccordion } from "@/components/CurriculumAccordion";
import { EnrollButton } from "@/components/EnrollButton";
import { ProgressBar } from "@/components/ProgressBar";
import { CourseObject } from "@/components/three";

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
    { icon: Award, label: "Certificate", value: `${course.learningHours} learning hrs` },
    { icon: CalendarDays, label: "Duration", value: `${course.weeks} ${course.weeks === 1 ? "week" : "weeks"}` },
    { icon: Clock, label: "Time", value: `About ${hours} hrs` },
    { icon: ListChecks, label: "Lessons", value: `${lessonCount(course)} lessons` },
    { icon: Laptop, label: "Format", value: course.format },
    { icon: BarChart3, label: "Level", value: course.level },
  ];

  return (
    <>
      <section className="mesh">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6">
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

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white px-3 py-1.5 text-brand-dark ring-1 ring-border">{course.category}</span>
                <span className="rounded-full bg-white px-3 py-1.5 text-muted ring-1 ring-border">{course.level}</span>
                <span className="rounded-full bg-accent-strong px-3 py-1.5 text-white">{course.format}</span>
              </div>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                {course.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted">{course.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-accent text-accent" aria-hidden />
                  <span className="font-semibold">{course.rating.toFixed(1)}</span>
                  <span className="text-muted">rating</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <UsersRound className="h-4 w-4" aria-hidden />
                  {course.learners.toLocaleString("en-US")} learners
                </span>
                <span className="inline-flex items-center gap-2 text-muted">
                  <span className="gradient-fill grid h-8 w-8 place-items-center rounded-full font-display text-[11px] font-semibold text-white">
                    {course.instructor.initials}
                  </span>
                  Taught by <span className="font-medium text-foreground">{course.instructor.name}</span>
                </span>
              </div>
            </div>
            {/* A 3D model of the course, ready to be dragged around */}
            <div className="relative">
              <div
                className={`cover-${course.cover} relative h-64 overflow-hidden rounded-[2.5rem] shadow-[0_40px_80px_-40px_rgba(42,134,194,0.7)] sm:h-72 lg:h-80`}
              >
                <div className="dot-grid absolute inset-0 opacity-50" />
                <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-white/30 blur-2xl" />
                <CourseObject icon={course.icon} theme={course.cover} courseTitle={course.title} className="absolute inset-0 rounded-[2.5rem]" />
                <p className="animate-hint pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1 text-[11px] font-semibold text-brand-dark backdrop-blur">
                  <Hand className="h-3.5 w-3.5" aria-hidden /> Drag or use arrow keys to spin
                </p>
              </div>
              <div className="glass pointer-events-none absolute -bottom-5 left-4 flex items-center gap-3 rounded-3xl px-4 py-3 sm:-left-6">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <Award className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm">
                  <span className="block font-display font-semibold">{course.learningHours} learning hours</span>
                  <span className="text-muted">Certificate included</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 sm:px-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="min-w-0 space-y-14">
          <section>
            <h2 className="font-display text-2xl font-semibold">About this course</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted">{course.description}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold">What you&rsquo;ll learn</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 rounded-3xl bg-surface-muted p-4 text-sm leading-relaxed">
                  <span className="gradient-fill mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white">
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

          <section className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-[2rem] bg-brand-soft p-6">
              <h2 className="font-display text-xl font-semibold">Who it&rsquo;s for</h2>
              <ul className="mt-4 space-y-2.5">
                {course.audience.map((a) => (
                  <li key={a} className="flex gap-3 text-sm">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-deep" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[2rem] bg-accent-soft p-6">
              <h2 className="font-display text-xl font-semibold">Your instructors</h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="gradient-fill grid h-12 w-12 shrink-0 place-items-center rounded-full font-display font-semibold text-white">
                  {course.instructor.initials}
                </span>
                <div>
                  <p className="font-semibold">{course.instructor.name}</p>
                  <p className="text-xs text-accent-dark">{course.instructor.role}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{course.instructor.bio}</p>
            </div>
          </section>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="card overflow-hidden p-0">
            <div className="gradient-fill h-2" />
            <div className="p-6">
              {enrollment ? (
                <div className="mb-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-display font-semibold">Your progress</span>
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
                  <p className="font-display text-3xl font-semibold">{formatPrice(course.price)}</p>
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

              <dl className="mt-6 grid grid-cols-2 gap-3">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-2xl bg-surface-muted p-3">
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <Icon className="h-3.5 w-3.5 text-accent" aria-hidden /> {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </aside>
      </div>

      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight">You might also enjoy</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </>
  );
}
