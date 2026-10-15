"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck } from "lucide-react";

export function EnrollButton({ enrolled, label }: { enrolled: boolean; label: string }) {
  const [joined, setJoined] = useState(enrolled);

  if (joined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">
          <CircleCheck className="h-4 w-4" aria-hidden />
          {enrolled ? "You're enrolled in this course" : "You're in! Welcome aboard."}
        </div>
        <Link
          href="/dashboard"
          className="btn-secondary w-full py-3 text-sm"
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
      className="btn-primary w-full py-3 text-sm"
    >
      {label}
    </button>
  );
}
