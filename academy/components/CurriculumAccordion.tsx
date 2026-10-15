"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, CircleCheck, PenLine, PlayCircle, Radio } from "lucide-react";
import clsx from "clsx";
import type { Lesson, Module } from "@/lib/courses";

const KIND_ICON = {
  video: PlayCircle,
  reading: BookOpen,
  practice: PenLine,
  quiz: CircleCheck,
  live: Radio,
} satisfies Record<Lesson["kind"], unknown>;

const KIND_LABEL: Record<Lesson["kind"], string> = {
  video: "Video",
  reading: "Reading",
  practice: "Practice",
  quiz: "Quiz",
  live: "Live session",
};

export function CurriculumAccordion({ modules }: { modules: Module[] }) {
  const [open, setOpen] = useState<number[]>([0]);

  function toggle(i: number) {
    setOpen((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  }

  return (
    <div className="space-y-3">
      {modules.map((mod, i) => {
        const isOpen = open.includes(i);
        const minutes = mod.lessons.reduce((n, l) => n + l.minutes, 0);
        return (
          <div
            key={mod.title}
            className={clsx(
              "overflow-hidden rounded-3xl bg-white ring-1 transition",
              isOpen ? "ring-pink shadow-[0_16px_36px_-24px_rgba(236,95,191,0.8)]" : "ring-border"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-muted/60"
            >
              <span
                className={clsx(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-display text-sm font-semibold",
                  isOpen ? "gradient-fill text-white" : "bg-brand-soft text-brand-dark"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex-1">
                <span className="block font-display font-semibold">{mod.title}</span>
                <span className="mt-0.5 block text-sm text-muted">
                  {mod.lessons.length} lessons · {minutes} min
                </span>
              </span>
              <ChevronDown
                className={clsx("h-5 w-5 text-muted transition-transform", isOpen && "rotate-180")}
                aria-hidden
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-4">
                <p className="mb-3 pl-14 text-sm text-muted">{mod.summary}</p>
                <ul className="space-y-1 pl-14">
                  {mod.lessons.map((lesson) => {
                    const Icon = KIND_ICON[lesson.kind];
                    return (
                      <li
                        key={lesson.title}
                        className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-surface-muted"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="hidden text-xs text-muted sm:inline">{KIND_LABEL[lesson.kind]}</span>
                        <span className="w-14 text-right text-xs text-muted">{lesson.minutes} min</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
