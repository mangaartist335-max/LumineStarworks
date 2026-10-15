"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
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

type SortKey = "popular" | "rating" | "hours" | "short";

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
      if (freeOnly && c.price !== 0) return false;
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
        case "hours":
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
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <label className="relative block">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
            className="h-12 w-full rounded-full border bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-muted focus:border-sky-deep focus:ring-4 focus:ring-sky/40"
          />
        </label>

        <FilterGroup title="Topic">
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1" role="group" aria-label="Topic">
            {(["All", ...CATEGORIES] as const).map((c) => {
              const count = c === "All" ? courses.length : courses.filter((x) => x.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={clsx(
                    "flex items-center justify-between gap-3 rounded-full px-4 py-2 text-left text-sm font-medium transition lg:rounded-2xl",
                    category === c
                      ? "bg-accent-strong text-white shadow-[0_8px_18px_-10px_rgba(204,51,153,0.9)]"
                      : "bg-white text-muted ring-1 ring-border hover:text-foreground lg:bg-transparent lg:ring-0 lg:hover:bg-white"
                  )}
                >
                  {c === "All" ? "All topics" : c}
                  <span className={clsx("text-xs", category === c ? "text-white/85" : "text-muted")}>{count}</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>

        <FilterGroup title="Level">
          <Segmented label="Level" options={LEVELS} value={level} onChange={(v) => setLevel(v as Level | "All")} />
        </FilterGroup>

        <FilterGroup title="Format">
          <Segmented label="Format" options={FORMATS} value={format} onChange={(v) => setFormat(v as Format | "All")} />
        </FilterGroup>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-border">
          Free courses only
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(e) => setFreeOnly(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent-strong)]"
          />
        </label>
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            <span className="font-semibold text-foreground">{results.length}</span>{" "}
            {results.length === 1 ? "course" : "courses"}
            {hasFilters && (
              <>
                {" · "}
                <button type="button" onClick={reset} className="font-semibold text-accent-dark hover:underline">
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
              className="h-10 rounded-full border bg-white px-3 text-sm text-foreground outline-none focus:border-sky-deep"
            >
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="hours">Most learning hours</option>
              <option value="short">Shortest first</option>
            </select>
          </label>
        </div>

        {results.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {results.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
        ) : (
          <div className="card mt-6 px-6 py-16 text-center">
            <p className="font-display text-xl font-semibold">Nothing matches just yet</p>
            <p className="mt-2 text-sm text-muted">Try a different search or loosen a filter or two.</p>
            <button type="button" onClick={reset} className="btn-primary mt-5 px-5 py-2.5 text-sm">
              Show all courses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2.5 px-1 font-display text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Segmented({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1 ring-1 ring-border" role="group" aria-label={label}>
      {["All", ...options].map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={clsx(
            "rounded-xl px-3 py-2 text-xs font-semibold transition",
            value === o ? "bg-white text-brand-dark shadow-sm" : "text-muted hover:text-foreground"
          )}
        >
          {o === "All" ? "Any" : o}
        </button>
      ))}
    </div>
  );
}
