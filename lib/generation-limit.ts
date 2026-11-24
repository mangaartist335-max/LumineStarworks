import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const DAILY_GENERATION_LIMIT = 5;
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
  kind: "create" | "regenerate",
  projectId: string | null
): Promise<GenerationLimitResult> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count, error: countError } = await supabase
    .from("generation_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (countError) {
    console.error("[generation-limit.count]", countError);
    return {
      allowed: false,
      message: "Couldn't check your generation limit. Please try again.",
    };
  }

  if ((count ?? 0) >= DAILY_GENERATION_LIMIT) {
    return {
      allowed: false,
      message: `You've reached the limit of ${DAILY_GENERATION_LIMIT} BuildBriefs per 24 hours. Please try again later.`,
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
