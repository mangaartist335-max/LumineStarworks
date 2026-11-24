"use client";

import { useSyncExternalStore } from "react";

// Small, gentle UI sounds synthesized with the Web Audio API (no audio
// files to load). Off-switch is a per-browser preference in localStorage.

export type SfxName =
  | "tap"
  | "copy"
  | "start"
  | "success"
  | "complete"
  | "fanfare"
  | "error";

const STORAGE_KEY = "buildbrief:sfx";
const MASTER_VOLUME = 0.5;

let enabledCache: boolean | null = null;
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;
let output: AudioNode | null = null;

function readEnabled(): boolean {
  if (enabledCache !== null) return enabledCache;
  try {
    enabledCache = window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

export function setSfxEnabled(enabled: boolean): void {
  enabledCache = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Storage blocked: the setting just lasts for this visit.
  }
  listeners.forEach((listener) => listener());
  if (enabled) playSfx("tap");
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSfxEnabled(): boolean {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
      // A gentle limiter so louder, overlapping notes stay clean.
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.knee.value = 6;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.15;
      limiter.connect(ctx.destination);
      output = limiter;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  /** Glide to this frequency over the note. */
  slideTo?: number;
}

function playNotes(notes: Note[]) {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.01;
  for (const note of notes) {
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    const start = now + note.at;
    const end = start + note.dur;
    const peak = MASTER_VOLUME * (note.gain ?? 1);

    osc.type = note.type ?? "sine";
    osc.frequency.setValueAtTime(note.freq, start);
    if (note.slideTo) osc.frequency.exponentialRampToValueAtTime(note.slideTo, end);

    // Quick attack, smooth release: no clicks.
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(amp).connect(output ?? ac.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568;

const SOUNDS: Record<SfxName, Note[]> = {
  tap: [{ freq: 880, at: 0, dur: 0.06, type: "sine", gain: 0.5 }],
  copy: [
    { freq: 1175, at: 0, dur: 0.05, type: "triangle", gain: 0.6 },
    { freq: 1568, at: 0.06, dur: 0.07, type: "triangle", gain: 0.6 },
  ],
  start: [{ freq: 320, at: 0, dur: 0.28, type: "sine", gain: 0.7, slideTo: 760 }],
  success: [
    { freq: E5, at: 0, dur: 0.12, type: "triangle" },
    { freq: G5 * 1.0, at: 0.09, dur: 0.18, type: "triangle" },
  ],
  complete: [
    { freq: C5, at: 0, dur: 0.14, type: "triangle" },
    { freq: E5, at: 0.09, dur: 0.14, type: "triangle" },
    { freq: G5, at: 0.18, dur: 0.14, type: "triangle" },
    { freq: C6, at: 0.27, dur: 0.4, type: "triangle" },
  ],
  fanfare: [
    { freq: G5, at: 0, dur: 0.12, type: "triangle" },
    { freq: C6, at: 0.1, dur: 0.12, type: "triangle" },
    { freq: E6, at: 0.2, dur: 0.12, type: "triangle" },
    { freq: G6, at: 0.3, dur: 0.5, type: "triangle", gain: 0.8 },
    { freq: C6, at: 0.3, dur: 0.5, type: "sine", gain: 0.6 },
    { freq: E6, at: 0.3, dur: 0.5, type: "sine", gain: 0.5 },
  ],
  error: [
    { freq: 392, at: 0, dur: 0.16, type: "sine", gain: 0.7 },
    { freq: 294, at: 0.14, dur: 0.26, type: "sine", gain: 0.7 },
  ],
};

export function playSfx(name: SfxName): void {
  if (typeof window === "undefined" || !readEnabled()) return;
  try {
    playNotes(SOUNDS[name]);
  } catch {
    // Sound is a bonus; never let it break anything.
  }
}
