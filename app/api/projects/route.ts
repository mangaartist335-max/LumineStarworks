import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateBuildBrief } from "@/lib/anthropic";
import { newProjectSchema } from "@/lib/validation";
import type { ProjectRow } from "@/lib/types";

// The actual generation work happens in `after()`, which keeps running
// for up to this long after the response is already sent — the browser
// never has to hold a request open while Claude works, so it can't time
// out or fail with a bare network error no matter how long generation takes.
export const maxDuration = 60;

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
    console.error("[projects.insert]", insertError);
    return NextResponse.json(
      { error: "Could not create the project. Please try again." },
      { status: 500 }
    );
  }

  after(async () => {
    try {
      const brief = await generateBuildBrief({
        name: input.name,
        projectType: input.projectType,
        idea: input.idea,
        targetUser: input.targetUser,
        preferredTech: input.preferredTech,
        extraRequirements: input.extraRequirements,
      });

      const { error: updateError } = await supabase
        .from("projects")
        .update({ generated_brief: brief, status: "ready_to_build" })
        .eq("id", inserted.id);

      if (updateError) {
        console.error("[projects.update]", updateError);
      }
    } catch (error) {
      console.error("[projects.generate]", error);
      // Leave the project row in place with no brief. The project page
      // polls for a brief and falls back to a manual retry once it's
      // waited long enough, so a background failure here isn't a dead end.
    }
  });

  return NextResponse.json({ project: inserted });
}
