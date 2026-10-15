import Link from "next/link";
import { ArrowUpRight, Award, Star } from "lucide-react";
import { formatPrice, type Course } from "@/lib/courses";
import { CourseCover } from "./CourseCover";
import { Tilt } from "./Tilt";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Tilt className="flex">
      <Link href={`/courses/${course.slug}`} className="card group flex w-full flex-col p-2 transition hover:-translate-y-1">
        <div className="relative">
          <CourseCover theme={course.cover} icon={course.icon} className="h-40 rounded-[1.4rem]" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-brand-dark backdrop-blur">
              {course.category}
            </span>
            {course.flagship && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                Flagship
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col px-4 pb-4 pt-5">
          <h3 className="font-display text-lg font-semibold leading-snug">{course.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{course.tagline}</p>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 font-medium text-accent-dark">
              <Award className="h-3.5 w-3.5" aria-hidden />
              {course.learningHours} hrs
            </span>
            <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-dark">{course.level}</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-1 font-medium text-muted">{course.format}</span>
          </div>

          <div className="mt-auto flex items-center justify-between pt-5">
            <div>
              <p className="font-display text-base font-semibold">{formatPrice(course.price)}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Star className="h-3.5 w-3.5 fill-accent text-accent" aria-hidden />
                {course.rating.toFixed(1)} · {course.learners.toLocaleString("en-US")} learners
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-muted text-foreground transition group-hover:bg-accent group-hover:text-white">
              <ArrowUpRight className="h-5 w-5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </Tilt>
  );
}
