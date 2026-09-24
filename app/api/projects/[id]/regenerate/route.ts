import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBuildBrief, BriefGenerationError } from "@/lib/anthropic";
import type { ProjectRow } from "@/lib/types";

// Vercel's Hobby plan caps serverless function duration at 60s even if a
// higher value is set here; keep this accurate to avoid requests that run
// past what the platform will actually allow.
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

  try {
    const brief = await generateBuildBrief({
      name: project.name,
      projectType: project.project_type,
      idea: project.idea,
      targetUser: project.target_user,
      preferredTech: project.preferred_tech,
      extraRequirements: project.extra_requirements,
    });

    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({ generated_brief: brief })
      .eq("id", id)
      .select()
      .single<ProjectRow>();

    if (updateError || !updated) {
      throw new BriefGenerationError("Failed to save the regenerated brief.");
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    const message =
      error instanceof BriefGenerationError
        ? error.message
        : "We couldn't regenerate your BuildBrief. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
