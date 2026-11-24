import { apiPost } from "./api";
import { readCache, removeCache, writeCache } from "./cache";
import { supabase } from "./supabase";
import type { BuildBrief, BuildPlan, ProjectRow, ProjectStatus, ProjectType } from "@/shared/types";

/** A lightweight row for lists (no full blueprint or built app). */
export interface ProjectSummary {
  id: string;
  name: string;
  project_type: ProjectType;
  status: ProjectStatus;
  generation_status: ProjectRow["generation_status"];
  app_status: ProjectRow["app_status"];
  archived_at: string | null;
  task_progress: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
  overview: string | null;
  plan: BuildPlan | null;
  done: string[] | null;
}

// Everything except the (potentially large) built app HTML.
const PROJECT_COLUMNS =
  "id, user_id, name, project_type, idea, target_user, preferred_tech, extra_requirements, status, generated_brief, generation_status, generation_error, generation_started_at, app_status, app_error, app_started_at, archived_at, task_progress, created_at, updated_at";

const SUMMARY_COLUMNS =
  "id, name, project_type, status, generation_status, app_status, archived_at, task_progress, created_at, updated_at, overview:generated_brief->>projectOverview, plan:generated_brief->buildPlan, done:generated_brief->definitionOfDone";

export type ProjectDetail = Omit<ProjectRow, "app_html">;

/** Gives up on a request after `ms` so offline mode kicks in quickly (the client otherwise retries with growing waits). */
function timeout(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/** True once an app has been built (the HTML itself is only fetched when opened). */
export const hasBuiltApp = (p: Pick<ProjectRow, "app_status">) => p.app_status === "done";

export async function listProjects(): Promise<{ projects: ProjectSummary[]; offline: boolean }> {
  const { data, error } = await supabase
    .from("projects")
    .select(SUMMARY_COLUMNS)
    .order("updated_at", { ascending: false })
    .abortSignal(timeout(12000));
  if (error) {
    const cached = await readCache<ProjectSummary[]>("projects");
    if (cached) return { projects: cached, offline: true };
    throw new Error("Couldn't load your projects. Check your connection.");
  }
  const projects = (data ?? []) as unknown as ProjectSummary[];
  await writeCache("projects", projects);
  return { projects, offline: false };
}

export async function getCachedProjects(): Promise<ProjectSummary[] | null> {
  return readCache<ProjectSummary[]>("projects");
}

export async function getProject(id: string): Promise<{ project: ProjectDetail | null; offline: boolean }> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("id", id)
    .abortSignal(timeout(12000))
    .maybeSingle();
  if (error) {
    const cached = await readCache<ProjectDetail>(`project:${id}`);
    if (cached) return { project: cached, offline: true };
    throw new Error("Couldn't load this project. Check your connection.");
  }
  if (!data) return { project: null, offline: false };
  const project = data as unknown as ProjectDetail;
  await writeCache(`project:${id}`, project);
  return { project, offline: false };
}

export async function getCachedProject(id: string): Promise<ProjectDetail | null> {
  return readCache<ProjectDetail>(`project:${id}`);
}

/** Light status read used while polling a background job. */
export async function getJobStatus(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("generation_status, generation_error, generation_started_at, app_status, app_error, app_started_at")
    .eq("id", id)
    .abortSignal(timeout(8000))
    .maybeSingle();
  if (error) throw error;
  return data as Pick<
    ProjectRow,
    "generation_status" | "generation_error" | "generation_started_at" | "app_status" | "app_error" | "app_started_at"
  > | null;
}

export async function getAppHtml(id: string): Promise<string | null> {
  const cached = await readCache<string>(`app:${id}`);
  const { data, error } = await supabase
    .from("projects")
    .select("app_html")
    .eq("id", id)
    .abortSignal(timeout(20000))
    .maybeSingle();
  if (error) return cached;
  const html = (data as { app_html: string | null } | null)?.app_html ?? null;
  if (html) await writeCache(`app:${id}`, html);
  return html;
}

export interface NewProjectInput {
  name: string;
  projectType: ProjectType;
  idea: string;
  targetUser: string;
  preferredTech?: string | null;
  extraRequirements?: string | null;
}

/** Creates the project and starts blueprint generation on the server. */
export async function createProject(input: NewProjectInput): Promise<ProjectRow> {
  const { project } = await apiPost<{ project: ProjectRow }>("/api/projects", input);
  return project;
}

export async function regenerateBlueprint(id: string): Promise<void> {
  await apiPost(`/api/projects/${id}/regenerate`);
}

export async function startAppBuild(id: string): Promise<void> {
  await apiPost(`/api/projects/${id}/build-app`);
}

async function update(id: string, values: Record<string, unknown>) {
  const { error } = await supabase.from("projects").update(values).eq("id", id);
  if (error) throw new Error("Couldn't save that change. Please try again.");
}

export const renameProject = (id: string, name: string) => update(id, { name: name.trim().slice(0, 80) });
export const setProjectStatus = (id: string, status: ProjectStatus) => update(id, { status });
export const setTaskProgress = (id: string, progress: Record<string, boolean>) =>
  update(id, { task_progress: progress });
export const archiveProject = (id: string, archived: boolean) =>
  update(id, { archived_at: archived ? new Date().toISOString() : null });
export const saveBrief = (id: string, brief: BuildBrief) => update(id, { generated_brief: brief });

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error("Couldn't delete this project. Please try again.");
  await Promise.all([removeCache(`project:${id}`), removeCache(`app:${id}`)]);
}

export async function duplicateProject(project: ProjectDetail): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Please sign in again.");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: `${project.name} (copy)`.slice(0, 80),
      project_type: project.project_type,
      idea: project.idea,
      target_user: project.target_user,
      preferred_tech: project.preferred_tech,
      extra_requirements: project.extra_requirements,
      status: project.generated_brief ? "ready_to_build" : "planning",
      generated_brief: project.generated_brief,
      generation_status: project.generated_brief ? "done" : null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Couldn't duplicate this project. Please try again.");
  return (data as { id: string }).id;
}

// ---- Tasks: an interactive checklist built from the blueprint ----

export interface TaskGroup {
  id: string;
  title: string;
  tasks: { key: string; label: string }[];
}

const PLAN_GROUPS: { key: keyof BuildPlan; title: string }[] = [
  { key: "dayOneMorning", title: "Day 1 · Morning" },
  { key: "dayOneAfternoon", title: "Day 1 · Afternoon" },
  { key: "dayOneEvening", title: "Day 1 · Evening" },
  { key: "dayTwoMorning", title: "Day 2 · Morning" },
  { key: "dayTwoAfternoon", title: "Day 2 · Afternoon" },
  { key: "dayTwoFinalPolish", title: "Day 2 · Final polish" },
];

export function buildTaskGroups(plan: BuildPlan | null | undefined, done: string[] | null | undefined): TaskGroup[] {
  const groups: TaskGroup[] = [];
  if (plan) {
    for (const g of PLAN_GROUPS) {
      const items = plan[g.key] ?? [];
      if (items.length) {
        groups.push({
          id: g.key,
          title: g.title,
          tasks: items.map((label, i) => ({ key: `plan.${g.key}.${i}`, label })),
        });
      }
    }
  }
  if (done?.length) {
    groups.push({
      id: "done",
      title: "Ready to launch when…",
      tasks: done.map((label, i) => ({ key: `done.${i}`, label })),
    });
  }
  return groups;
}

export function taskProgress(
  plan: BuildPlan | null | undefined,
  done: string[] | null | undefined,
  progress: Record<string, boolean> | null | undefined
): { completed: number; total: number; ratio: number } {
  const keys = buildTaskGroups(plan, done).flatMap((g) => g.tasks.map((t) => t.key));
  const completed = keys.filter((k) => progress?.[k]).length;
  return { completed, total: keys.length, ratio: keys.length ? completed / keys.length : 0 };
}

// ---- Profile and account ----

export async function getProfile(): Promise<{ display_name: string | null } | null> {
  const { data } = await supabase.from("profiles").select("display_name").maybeSingle();
  return (data as { display_name: string | null } | null) ?? null;
}

export async function updateDisplayName(name: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const id = userData.user?.id;
  if (!id) throw new Error("Please sign in again.");
  const { error } = await supabase.from("profiles").update({ display_name: name.trim() }).eq("id", id);
  if (error) throw new Error("Couldn't save your name.");
}

export async function savePushToken(token: string | null): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const id = userData.user?.id;
  if (!id) return;
  await supabase.from("profiles").update({ expo_push_token: token }).eq("id", id);
}

export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    throw new Error(
      error.code === "PGRST202"
        ? "Account deletion isn't set up on the server yet. Please try again later."
        : "Couldn't delete your account. Please try again."
    );
  }
}
