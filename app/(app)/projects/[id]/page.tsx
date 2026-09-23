import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BuildBriefView } from "@/components/projects/BuildBriefView";
import { MissingBriefState } from "@/components/projects/MissingBriefState";
import type { ProjectRow } from "@/lib/types";

export default async function ProjectPage(props: PageProps<"/projects/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle<ProjectRow>();

  if (!project) {
    notFound();
  }

  if (!project.generated_brief) {
    return <MissingBriefState project={project} />;
  }

  return <BuildBriefView project={project} initialBrief={project.generated_brief} />;
}
