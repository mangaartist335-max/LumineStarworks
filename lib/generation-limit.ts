import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_GENERATION_LIMIT = 5;
export const DAILY_APP_BUILD_LIMIT = 5;

type EventKind = "create" | "regenerate" | "build";

// Briefs and app builds each have their own daily allowance.
const POOLS: Record<EventKind, { kinds: EventKind[]; limit: number; noun: string }> = {
  create: { kinds: ["create", "regenerate"], limit: DAILY_GENERATION_LIMIT, noun: "BuildBriefs" },
  regenerate: { kinds: ["create", "regenerate"], limit: DAILY_GENERATION_LIMIT, noun: "BuildBriefs" },
  build: { kinds: ["build"], limit: DAILY_APP_BUILD_LIMIT, noun: "app builds" },
};
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type GenerationLimitResult =
  | { allowed: true }
  | { allowed: false; message: string };

// Counts the user's generations in the last 24 hours and, if they're under
// the limit, records this one. Recording at request time (not on success)
// means firing many requests at once can't slip past the check while the
// earlier ones are still generating.
export async function checkAndRecordGeneration(
  supabase: SupabaseClient,
  userId: string,
  kind: EventKind,
  projectId: string | null
): Promise<GenerationLimitResult> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const pool = POOLS[kind];

  const { count, error: countError } = await supabase
    .from("generation_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("kind", pool.kinds)
    .gte("created_at", since);

  if (countError) {
    console.error("[generation-limit.count]", countError);
    return {
      allowed: false,
      message: "Couldn't check your generation limit. Please try again.",
    };
  }

  if ((count ?? 0) >= pool.limit) {
    return {
      allowed: false,
      message: `You've reached the limit of ${pool.limit} ${pool.noun} per 24 hours. Please try again later.`,
    };
  }

  const { error: insertError } = await supabase
    .from("generation_events")
    .insert({ user_id: userId, project_id: projectId, kind });

  if (insertError) {
    console.error("[generation-limit.insert]", insertError);
    return {
      allowed: false,
      message: "Couldn't check your generation limit. Please try again.",
    };
  }

  return { allowed: true };
}
