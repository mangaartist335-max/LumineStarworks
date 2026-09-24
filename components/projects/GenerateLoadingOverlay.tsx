"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";

const MESSAGES = [
  "Understanding your idea…",
  "Defining the MVP…",
  "Mapping the architecture…",
  "Designing the database…",
  "Creating your build plan…",
  "Preparing your Claude prompt…",
];

export function GenerateLoadingOverlay({ active }: { active: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_10%,transparent_75%)]" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <Logo className="mb-10" wordmarkClassName="text-lg" />
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-surface">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
        <p key={index} className="animate-fade-up text-base font-medium text-foreground">
          {MESSAGES[index]}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This usually takes under a minute.
        </p>
      </div>
    </div>
  );
}
