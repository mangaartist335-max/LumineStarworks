"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import {
  CATEGORIES,
  FORMATS,
  LEVELS,
  type Category,
  type Course,
  type Format,
  type Level,
} from "@/lib/courses";
import { CourseCard } from "./CourseCard";

type SortKey = "popular" | "rating" | "ce" | "short";

export function CatalogBrowser({
  courses,
  initialCategory,
}: {
  courses: Course[];
  initialCategory?: Category;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "All">(initialCategory ?? "All");
  const [level, setLevel] = useState<Level | "All">("All");
  const [format, setFormat] = useState<Format | "All">("All");
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("popular");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = courses.filter((c) => {
      if (category !== "All" && c.category !== category) return false;
      if (level !== "All" && c.level !== level) return false;
      if (format !== "All" && c.format !== format) return false;
      if (freeOnly && (c.price ?? 1) !== 0) return false;
      if (!q) return true;
      return [c.title, c.tagline, c.category, c.instructor.name]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return filtered.sort((a, b) => {
      switch (sort) {
        case "rating":
          return b.rating - a.rating;
        case "ce":
          return b.learningHours - a.learningHours;
        case "short":
          return a.weeks - b.weeks;
        default:
          return b.learners - a.learners;
      }
    });
  }, [courses, query, category, level, format, freeOnly, sort]);

  const hasFilters = category !== "All" || level !== "All" || format !== "All" || freeOnly || query;

  function reset() {
    setQuery("");
    setCategory("All");
    setLevel("All");
    setFormat("All");
    setFreeOnly(false);
  }

  return (
    <div>
      <div className="rounded-2xl border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search courses</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, skill or instructor"
              className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="hidden h-4 w-4 text-muted sm:block" aria-hidden />
            <Select label="Level" value={level} options={LEVELS} onChange={(v) => setLevel(v as Level | "All")} />
            <Select label="Format" value={format} options={FORMATS} onChange={(v) => setFormat(v as Format | "All")} />
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border bg-background px-3 text-sm">
              <input
                type="checkbox"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--brand)]"
              />
              Free courses
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Category">
          {(["All", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={clsx(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                category === c
                  ? "border-brand bg-brand text-white"
                  : "bg-background text-muted hover:border-brand/40 hover:text-foreground"
              )}
            >
              {c === "All" ? "All topics" : c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{results.length}</span>{" "}
          {results.length === 1 ? "course" : "courses"}
          {hasFilters && (
            <>
              {" · "}
              <button type="button" onClick={reset} className="font-medium text-brand hover:underline">
                Clear filters
              </button>
            </>
          )}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-9 rounded-lg border bg-surface px-2 text-sm text-foreground outline-none focus:border-brand"
          >
            <option value="popular">Most popular</option>
            <option value="rating">Highest rated</option>
            <option value="ce">Most learning hours</option>
            <option value="short">Shortest first</option>
          </select>
        </label>
      </div>

      {results.length > 0 ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">Nothing matches just yet</p>
          <p className="mt-2 text-sm text-muted">Try a different search or loosen a filter or two.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Show all courses
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="inline-flex h-11 items-center gap-2 rounded-xl border bg-background pl-3 pr-1 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg bg-transparent pr-1 font-medium outline-none"
      >
        <option value="All">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
