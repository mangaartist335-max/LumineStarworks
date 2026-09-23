import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBuildBrief, BriefGenerationError } from "@/lib/anthropic";
import { newProjectSchema } from "@/lib/validation";
import type { ProjectRow } from "@/lib/types";

export const maxDuration = 120;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to create a project." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = newProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const { data: inserted, error: insertError } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      project_type: input.projectType,
      idea: input.idea,
      target_user: input.targetUser,
      preferred_tech: input.preferredTech || null,
      extra_requirements: input.extraRequirements || null,
      status: "planning",
    })
    .select()
    .single<ProjectRow>();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "Could not create the project. Please try again." },
      { status: 500 }
    );
  }

  try {
    const brief = await generateBuildBrief({
      name: input.name,
      projectType: input.projectType,
      idea: input.idea,
      targetUser: input.targetUser,
      preferredTech: input.preferredTech,
      extraRequirements: input.extraRequirements,
    });

    const { data: updated, error: updateError } = await supabase
      .from("projects")
      .update({ generated_brief: brief, status: "ready_to_build" })
      .eq("id", inserted.id)
      .select()
      .single<ProjectRow>();

    if (updateError || !updated) {
      throw new BriefGenerationError("Failed to save the generated brief.");
    }

    return NextResponse.json({ project: updated });
  } catch (error) {
    await supabase.from("projects").delete().eq("id", inserted.id);
    const message =
      error instanceof BriefGenerationError
        ? error.message
        : "We couldn't generate your BuildBrief. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
