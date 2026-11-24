import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  BriefGenerationError,
  generateBuildBrief,
  type GenerateBriefParams,
} from "@/lib/anthropic";

// Runs inside after(), once the API response has already been sent, and
// records the outcome on the project row so the client's poll can show it.
export async function runGeneration(
  supabase: SupabaseClient,
  projectId: string,
  params: GenerateBriefParams,
  { markReadyToBuild }: { markReadyToBuild: boolean }
): Promise<void> {
  try {
    const brief = await generateBuildBrief(params);
    const { error } = await supabase
      .from("projects")
      .update({
        generated_brief: brief,
        generation_status: "done",
        generation_error: null,
        ...(markReadyToBuild ? { status: "ready_to_build" } : {}),
      })
      .eq("id", projectId);
    if (error) {
      console.error("[generation.save]", error);
      await markFailed(supabase, projectId, "Your BuildBrief was generated but couldn't be saved. Please try again.");
    }
  } catch (error) {
    console.error("[generation.run]", error);
    const message =
      error instanceof BriefGenerationError
        ? error.message
        : "Something went wrong while generating your BuildBrief. Please try again.";
    await markFailed(supabase, projectId, message);
  }
}

async function markFailed(
  supabase: SupabaseClient,
  projectId: string,
  message: string
) {
  const { error } = await supabase
    .from("projects")
    .update({ generation_status: "failed", generation_error: message })
    .eq("id", projectId);
  if (error) console.error("[generation.markFailed]", error);
}
