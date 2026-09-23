"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BuildBrief, ProjectStatus } from "@/lib/types";
import { PROJECT_STATUSES } from "@/lib/types";

export async function renameProject(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Project name cannot be empty.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ name: trimmed })
    .eq("id", id);
  if (error) throw new Error("Could not rename this project.");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error("Could not delete this project.");
  revalidatePath("/dashboard");
}

export async function updateProjectStatus(
  id: string,
  status: ProjectStatus
): Promise<void> {
  if (!PROJECT_STATUSES.includes(status)) {
    throw new Error("Invalid status.");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error("Could not update status.");
  revalidatePath("/dashboard");
  revalidatePath(`/projects/${id}`);
}

export async function updateProjectBrief(
  id: string,
  brief: BuildBrief
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ generated_brief: brief })
    .eq("id", id);
  if (error) throw new Error("Could not save your changes.");
  revalidatePath(`/projects/${id}`);
}
