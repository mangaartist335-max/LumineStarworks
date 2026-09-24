import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import type { ProjectRow } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      "id, user_id, name, project_type, idea, target_user, preferred_tech, extra_requirements, status, generated_brief, created_at, updated_at"
    )
    .order("updated_at", { ascending: false })
    .returns<ProjectRow[]>();

  const firstName = user?.user_metadata?.display_name?.split?.(" ")?.[0];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `Welcome back, ${firstName}` : "Your projects"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {projects?.length
              ? "Pick up a project or start a new blueprint."
              : "Turn your next idea into a build-ready plan."}
          </p>
        </div>
        <ButtonLink href="/projects/new">New Project</ButtonLink>
      </div>

      <div className="mt-8">
        {projects && projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
