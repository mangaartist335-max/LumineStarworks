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
    <div className="divide-y overflow-hidden rounded-2xl border bg-surface">
      {modules.map((mod, i) => {
        const isOpen = open.includes(i);
        const minutes = mod.lessons.reduce((n, l) => n + l.minutes, 0);
        return (
          <div key={mod.title}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-surface-muted/50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
                {i + 1}
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{mod.title}</span>
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
                <p className="mb-3 pl-13 text-sm text-muted">{mod.summary}</p>
                <ul className="space-y-1 pl-13">
                  {mod.lessons.map((lesson) => {
                    const Icon = KIND_ICON[lesson.kind];
                    return (
                      <li
                        key={lesson.title}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-background"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-brand" aria-hidden />
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
