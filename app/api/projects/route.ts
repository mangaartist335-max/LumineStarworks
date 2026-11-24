import { NextResponse, after } from "next/server";
import { getRequestAuth } from "@/lib/supabase/request";
import { runGeneration } from "@/lib/run-generation";
import { checkAndRecordGeneration } from "@/lib/generation-limit";
import { newProjectSchema } from "@/lib/validation";
import { isMissingColumnError, MISSING_MIGRATION_MESSAGE } from "@/lib/db-errors";
import type { ProjectRow } from "@/lib/types";

// Generation runs in `after()`, which keeps going after the response is
// sent, so the browser never waits on Claude. Must match
// GENERATION_MAX_SECONDS in lib/types.ts (this value has to be a literal).
export const maxDuration = 300;

export async function POST(request: Request) {
  const { supabase, user } = await getRequestAuth(request);

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

  const limit = await checkAndRecordGeneration(supabase, user.id, "create", null);
  if (!limit.allowed) {
    return NextResponse.json({ error: limit.message }, { status: 429 });
  }

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
      generation_status: "generating",
      generation_started_at: new Date().toISOString(),
    })
    .select()
    .single<ProjectRow>();

  if (insertError || !inserted) {
    console.error("[projects.insert]", insertError);
    return NextResponse.json(
      {
        error: isMissingColumnError(insertError)
          ? MISSING_MIGRATION_MESSAGE
          : "Could not create the project. Please try again.",
      },
      { status: 500 }
    );
  }

  after(() =>
    runGeneration(
      supabase,
      inserted.id,
      {
        name: input.name,
        projectType: input.projectType,
        idea: input.idea,
        targetUser: input.targetUser,
        preferredTech: input.preferredTech,
        extraRequirements: input.extraRequirements,
      },
      { markReadyToBuild: true }
    )
  );

  return NextResponse.json({ project: inserted });
}
