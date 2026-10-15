import Link from "next/link";
import { Award, Clock, Star } from "lucide-react";
import { formatPrice, type Course } from "@/lib/courses";
import { CourseCover } from "./CourseCover";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-sky bg-brand-soft shadow-[0_4px_14px_-8px_rgba(47,147,207,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_rgba(47,147,207,0.6)]"
    >
      <CourseCover theme={course.cover} icon={course.icon} className="h-36" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="caps rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-sky-deep">
            {course.category}
          </span>
          {course.flagship && (
            <span className="caps rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-white">
              Flagship
            </span>
          )}
        </div>
        <h3 className="mt-3 font-display text-lg font-bold leading-snug text-foreground group-hover:text-brand-dark">
          {course.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{course.tagline}</p>

        <div className="mt-auto pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-accent" aria-hidden />
              {course.learningHours} learning hrs
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-sky-deep" aria-hidden />
              {course.level}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
              {course.rating.toFixed(1)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-sky pt-4 text-sm">
            <span className="font-semibold text-brand-dark">
              {course.format} · {formatPrice(course.price)}
            </span>
            <span className="btn-pink px-4 py-1.5 text-xs">View</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
