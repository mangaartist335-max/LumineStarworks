"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck } from "lucide-react";

export function EnrollButton({ enrolled, label }: { enrolled: boolean; label: string }) {
  const [joined, setJoined] = useState(enrolled);

  if (joined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">
          <CircleCheck className="h-4 w-4" aria-hidden />
          {enrolled ? "You're enrolled in this course" : "You're in! Welcome aboard."}
        </div>
        <Link
          href="/dashboard"
          className="block w-full rounded-full bg-brand py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Continue in My learning
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setJoined(true)}
      className="w-full rounded-full bg-accent py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
    >
      {label}
    </button>
  );
}
