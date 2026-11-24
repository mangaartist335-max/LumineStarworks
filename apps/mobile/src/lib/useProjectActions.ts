import { router } from "expo-router";
import { useState } from "react";
import { feedback } from "./feedback";
import { archiveProject, deleteProject, duplicateProject, getProject, type ProjectSummary } from "./projects";

/** Duplicate / archive / delete, shared by the Projects list and the workspace. */
export function useProjectActions(onChanged: () => void) {
  const [target, setTarget] = useState<Pick<ProjectSummary, "id" | "name" | "archived_at"> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  const flash = (tone: "success" | "danger", text: string) => {
    setMessage({ tone, text });
    setTimeout(() => setMessage(null), 3500);
  };

  async function duplicate(id: string) {
    try {
      const { project } = await getProject(id);
      if (!project) throw new Error("Project not found.");
      const newId = await duplicateProject(project);
      feedback.success();
      onChanged();
      router.push(`/project/${newId}`);
    } catch (e) {
      feedback.error();
      flash("danger", e instanceof Error ? e.message : "Couldn't duplicate.");
    }
  }

  async function toggleArchive(p: Pick<ProjectSummary, "id" | "archived_at">) {
    try {
      await archiveProject(p.id, !p.archived_at);
      feedback.success();
      flash("success", p.archived_at ? "Moved back to your projects." : "Archived. Find it under the Archived filter.");
      onChanged();
    } catch (e) {
      feedback.error();
      flash("danger", e instanceof Error ? e.message : "Couldn't archive.");
    }
  }

  async function remove(id: string, afterDelete?: () => void) {
    try {
      await deleteProject(id);
      feedback.success();
      setConfirmDelete(false);
      onChanged();
      afterDelete?.();
    } catch (e) {
      feedback.error();
      flash("danger", e instanceof Error ? e.message : "Couldn't delete.");
    }
  }

  return { target, setTarget, confirmDelete, setConfirmDelete, message, duplicate, toggleArchive, remove };
}
