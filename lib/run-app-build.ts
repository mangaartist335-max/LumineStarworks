import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BriefGenerationError } from "@/lib/anthropic";
import { buildAppHtml, type BuildAppParams } from "@/lib/app-builder";
import { notifyUser } from "@/lib/push";

// Runs inside after(), once the API response has been sent, and records the
// outcome on the project row for the client's poll to pick up.
export async function runAppBuild(
  supabase: SupabaseClient,
  projectId: string,
  params: BuildAppParams
): Promise<void> {
  try {
    const html = await buildAppHtml(params);
    const { error } = await supabase
      .from("projects")
      .update({ app_html: html, app_status: "done", app_error: null })
      .eq("id", projectId);
    if (error) {
      console.error("[app-build.save]", error);
      await markFailed(supabase, projectId, "Your app was built but couldn't be saved. Please try again.");
      return;
    }
    await notifyUser(supabase, {
      title: "Your app is ready 🎉",
      body: `${params.name} is built and ready to play.`,
      projectId,
    });
  } catch (error) {
    console.error("[app-build.run]", error);
    const message =
      error instanceof BriefGenerationError
        ? error.message
        : "Something went wrong while building your app. Please try again.";
    await markFailed(supabase, projectId, message);
    await notifyUser(supabase, {
      title: "Your app build didn't finish",
      body: `${params.name}: tap to try again.`,
      projectId,
    });
  }
}

async function markFailed(supabase: SupabaseClient, projectId: string, message: string) {
  const { error } = await supabase
    .from("projects")
    .update({ app_status: "failed", app_error: message })
    .eq("id", projectId);
  if (error) console.error("[app-build.markFailed]", error);
}
