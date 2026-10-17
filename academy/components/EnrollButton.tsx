"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CircleCheck } from "lucide-react";

export function EnrollButton({ enrolled, label }: { enrolled: boolean; label: string }) {
  const [joined, setJoined] = useState(enrolled);
  const [justJoined, setJustJoined] = useState(false);
  const nextRef = useRef<HTMLAnchorElement>(null);

  // The button disappears once you enroll, so keyboard focus moves to the
  // next step instead of getting lost.
  useEffect(() => {
    if (justJoined) nextRef.current?.focus();
  }, [justJoined]);

  return (
    <div aria-live="polite">
      {joined ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand-dark">
            <CircleCheck className="h-4 w-4" aria-hidden />
            {enrolled ? "You're enrolled in this course" : "You're in! Welcome aboard."}
          </p>
          <Link ref={nextRef} href="/dashboard" className="btn-secondary w-full py-3 text-sm">
            Continue in My learning
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setJoined(true);
            setJustJoined(true);
          }}
          className="btn-primary w-full py-3 text-sm"
        >
          {label}
        </button>
      )}
    </div>
  );
}
