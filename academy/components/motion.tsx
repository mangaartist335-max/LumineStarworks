"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Pause, Play } from "lucide-react";
import clsx from "clsx";

// One shared "should things move?" setting for the whole site.
// - By default we follow the device's reduce-motion setting.
// - "Pause animations" stops everything; "Play animations" opts back in.
// The choice is remembered in this browser and mirrored onto <html> as
// data-motion so the CSS animations follow it too.

type Choice = "paused" | "playing" | null;

const KEY = "academy-motion";
const listeners = new Set<() => void>();
let choice: Choice = null;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "paused" || saved === "playing") choice = saved;
  } catch {
    // Storage can be unavailable (private mode); the default still works.
  }
  apply();
}

function apply() {
  const html = document.documentElement;
  if (choice) html.dataset.motion = choice;
  else delete html.dataset.motion;
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setChoice(next: Choice) {
  choice = next;
  try {
    if (next) window.localStorage.setItem(KEY, next);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Ignore storage errors; the setting still applies for this visit.
  }
  apply();
  listeners.forEach((l) => l());
}

function useChoice() {
  return useSyncExternalStore(
    subscribe,
    () => choice,
    () => null
  );
}

function useSystemReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

/** True when animations should hold still. */
export function useMotionStill() {
  const c = useChoice();
  const reduced = useSystemReducedMotion();
  return c === "paused" || (c !== "playing" && reduced);
}

/** Reads the current setting outside React (for event handlers). */
export function isMotionStill() {
  load();
  if (choice === "paused") return true;
  if (choice === "playing") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A button that pauses or plays every animation on the site. */
export function MotionToggle({
  className,
  tone = "light",
  compact = false,
}: {
  className?: string;
  tone?: "light" | "dark" | "plain";
  compact?: boolean;
}) {
  const still = useMotionStill();
  const label = still ? "Play animations" : "Pause animations";
  const Icon = still ? Play : Pause;

  return (
    <button
      type="button"
      onClick={() => setChoice(still ? "playing" : "paused")}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
        compact ? "h-9 w-9" : tone === "plain" ? "py-1" : "px-4 py-2",
        tone === "dark" && "bg-white/12 text-white ring-1 ring-white/25 backdrop-blur hover:bg-white/20",
        tone === "light" && "bg-white/80 text-foreground ring-1 ring-border backdrop-blur hover:bg-white",
        tone === "plain" && "text-muted hover:text-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {!compact && label}
    </button>
  );
}
