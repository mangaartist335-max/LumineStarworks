// Release-state controls.
//
// Material for a later development phase stays in the repository (data,
// assets, docs, tests) but is left out of the active site, the seed SQL and
// search until its phase is switched on:
//
//   NEXT_PUBLIC_LUMINE_FUTURE_PHASES=impact-of-eden npm run dev
//
// Records opt in by carrying `phase`. Collections are exported twice: `all*`
// with everything, and the plain name filtered to what is active.

export type FuturePhase = "impact-of-eden";

export const FUTURE_PHASES: Record<FuturePhase, string> = {
  "impact-of-eden": "Impact of Eden and its associated material, introduced in a later phase",
};

export const IOE_PHASE: FuturePhase = "impact-of-eden";

export function phaseEnabled(phase: FuturePhase): boolean {
  // Spelled out in full so Next.js can inline it into client bundles.
  const raw = process.env.NEXT_PUBLIC_LUMINE_FUTURE_PHASES ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .includes(phase);
}

export const isActive = (r: { phase?: FuturePhase }) => !r.phase || phaseEnabled(r.phase);

export const active = <T extends { phase?: FuturePhase }>(items: T[]): T[] => items.filter(isActive);

/** Text that mentions future-phase material only while that phase is on. */
export const phaseText = (phase: FuturePhase, whenEnabled: string, otherwise: string) =>
  phaseEnabled(phase) ? whenEnabled : otherwise;
