import { NextResponse, after } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request";
import { runAppBuild } from "@/lib/run-app-build";
import { checkAndRecordGeneration } from "@/lib/generation-limit";
import { isMissingColumnError, MISSING_APP_MIGRATION_MESSAGE } from "@/lib/db-errors";
import { GENERATION_MAX_SECONDS, type ProjectRow } from "@/lib/types";

// The build runs in `after()`, so the browser never waits on Claude. Must
// match GENERATION_MAX_SECONDS in lib/types.ts (this value has to be a literal).
export const maxDuration = 300;

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[id]/build-app">
) {
  const { id } = await ctx.params;
  const { supabase, user } = await getRequestAuth(request);

  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (!project.generated_brief) {
    return NextResponse.json(
      { error: "Generate the BuildBrief first, then build the app." },
      { status: 400 }
    );
  }

  // Don't start a second build while one is genuinely still running.
  const startedAt = project.app_started_at ? new Date(project.app_started_at).getTime() : 0;
  if (
    project.app_status === "building" &&
    Date.now() - startedAt < (GENERATION_MAX_SECONDS + 20) * 1000
  ) {
    return NextResponse.json({ started: true, alreadyRunning: true });
  }

  const { error: markError } = await supabase
    .from("projects")
    .update({
      app_status: "building",
      app_error: null,
      app_started_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (markError) {
    console.error("[projects.build-app.mark]", markError);
    return NextResponse.json(
      {
        error: isMissingColumnError(markError)
          ? MISSING_APP_MIGRATION_MESSAGE
          : "Couldn't start the build. Please try again.",
      },
      { status: 500 }
    );
  }

  // Counted once the project is marked, so a setup problem above doesn't use
  // up one of the user's daily builds.
  const limit = await checkAndRecordGeneration(supabase, user.id, "build", project.id);
  if (!limit.allowed) {
    await supabase
      .from("projects")
      .update({
        app_status: project.app_status,
        app_error: project.app_error,
        app_started_at: project.app_started_at,
      })
      .eq("id", id);
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  after(() =>
    runAppBuild(supabase, project.id, {
      name: project.name,
      projectType: project.project_type,
      idea: project.idea,
      brief: project.generated_brief!,
    })
  );

  return NextResponse.json({ started: true });
}
