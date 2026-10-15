import Link from "next/link";
import { Award, Clock, Star } from "lucide-react";
import { formatPrice, type Course } from "@/lib/courses";
import { CourseCover } from "./CourseCover";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-[0_1px_2px_rgba(31,42,46,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-12px_rgba(15,110,106,0.25)]"
    >
      <CourseCover theme={course.cover} icon={course.icon} className="h-36" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-brand-soft px-2.5 py-1 text-brand-dark">{course.category}</span>
          <span className="rounded-full bg-surface-muted px-2.5 py-1 text-muted">{course.level}</span>
        </div>
        <h3 className="mt-3 font-display text-lg font-semibold leading-snug group-hover:text-brand">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{course.tagline}</p>

        <div className="mt-auto pt-5">
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-accent" aria-hidden />
              {course.learningHours} learning hrs
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {course.weeks} {course.weeks === 1 ? "week" : "weeks"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-sun text-sun" aria-hidden />
              {course.rating.toFixed(1)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
            <span className="text-muted">{course.format}</span>
            <span className={course.price === 0 || course.price === null ? "font-semibold text-brand" : "font-semibold"}>
              {formatPrice(course.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
