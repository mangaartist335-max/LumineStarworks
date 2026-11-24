import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runGeneration } from "@/lib/run-generation";
import { checkAndRecordGeneration } from "@/lib/generation-limit";
import type { ProjectRow } from "@/lib/types";

// Generation runs in `after()`, which keeps going after the response is
// sent, so the browser never waits on Claude. Must match
// GENERATION_MAX_SECONDS in lib/types.ts (this value has to be a literal).
export const maxDuration = 300;

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/projects/[id]/regenerate">
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in." },
      { status: 401 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const limit = await checkAndRecordGeneration(
    supabase,
    user.id,
    "regenerate",
    project.id
  );
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

  const { error: markError } = await supabase
    .from("projects")
    .update({
      generation_status: "generating",
      generation_error: null,
      generation_started_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (markError) {
    console.error("[projects.regenerate.mark]", markError);
    return NextResponse.json(
      { error: "Couldn't start generation. Please try again." },
      { status: 500 }
    );
  }

  after(() =>
    runGeneration(
      supabase,
      project.id,
      {
        name: project.name,
        projectType: project.project_type,
        idea: project.idea,
        targetUser: project.target_user,
        preferredTech: project.preferred_tech,
        extraRequirements: project.extra_requirements,
      },
      { markReadyToBuild: !project.generated_brief }
    )
  );

  return NextResponse.json({ started: true });
}
