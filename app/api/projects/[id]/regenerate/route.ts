import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBuildBrief } from "@/lib/anthropic";
import type { ProjectRow } from "@/lib/types";

// The actual generation work happens in `after()`, which keeps running
// for up to this long after the response is already sent — the browser
// never has to hold a request open while Claude works, so it can't time
// out or fail with a bare network error no matter how long generation takes.
export const maxDuration = 60;

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

  after(async () => {
    try {
      const brief = await generateBuildBrief({
        name: project.name,
        projectType: project.project_type,
        idea: project.idea,
        targetUser: project.target_user,
        preferredTech: project.preferred_tech,
        extraRequirements: project.extra_requirements,
      });

      const { error: updateError } = await supabase
        .from("projects")
        .update({ generated_brief: brief })
        .eq("id", id);

      if (updateError) {
        console.error("[projects.regenerate.update]", updateError);
      }
    } catch (error) {
      console.error("[projects.regenerate.generate]", error);
    }
  });

  return NextResponse.json({ started: true });
}
