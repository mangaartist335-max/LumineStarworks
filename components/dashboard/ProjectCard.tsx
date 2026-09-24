"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Check, X } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DropdownMenu, MenuItem } from "@/components/ui/DropdownMenu";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatRelativeTime, cn } from "@/lib/utils";
import { STATUS_LABELS, PROJECT_STATUSES, type ProjectRow, type ProjectStatus } from "@/lib/types";
import {
  renameProject,
  deleteProject,
  updateProjectStatus,
} from "@/app/(app)/projects/actions";

export function ProjectCard({ project }: { project: ProjectRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submitRename() {
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === project.name) {
      setRenaming(false);
      setNameDraft(project.name);
      return;
    }
    startTransition(async () => {
      try {
        await renameProject(project.id, trimmed);
        setRenaming(false);
      } catch {
        setError("Couldn't rename the project.");
      }
    });
  }

  function handleStatusChange(status: ProjectStatus) {
    startTransition(async () => {
      try {
        await updateProjectStatus(project.id, status);
      } catch {
        setError("Couldn't update status.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteProject(project.id);
        router.refresh();
      } catch {
        setError("Couldn't delete the project.");
      }
      setConfirmDelete(false);
    });
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-surface p-5 transition-colors hover:border-border-strong",
        isPending && "opacity-70"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {renaming ? (
          <div className="flex flex-1 items-center gap-1.5">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") {
                  setRenaming(false);
                  setNameDraft(project.name);
                }
              }}
              className="w-full rounded-md border border-accent bg-background-elevated px-2 py-1 text-sm font-semibold outline-none"
            />
            <button
              onClick={submitRename}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-success hover:bg-success/10"
              aria-label="Save name"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setRenaming(false);
                setNameDraft(project.name);
              }}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-hover"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link href={`/projects/${project.id}`} className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold text-foreground group-hover:text-accent">
              {project.name}
            </h3>
          </Link>
        )}

        <DropdownMenu
          trigger={
            <button
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Project actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
        >
          {(close) => (
            <>
              <MenuItem
                icon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => {
                  setRenaming(true);
                  close();
                }}
              >
                Rename
              </MenuItem>
              <div className="my-1 h-px bg-border" />
              <p className="px-2.5 pb-1 pt-1 text-xs font-medium text-muted-foreground">
                Set status
              </p>
              {PROJECT_STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  onClick={() => {
                    handleStatusChange(status);
                    close();
                  }}
                >
                  <span className="flex w-full items-center justify-between">
                    {STATUS_LABELS[status]}
                    {status === project.status && (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    )}
                  </span>
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border" />
              <MenuItem
                danger
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  setConfirmDelete(true);
                  close();
                }}
              >
                Delete
              </MenuItem>
            </>
          )}
        </DropdownMenu>
      </div>

      <Link href={`/projects/${project.id}`} className="mt-3 block">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{project.project_type}</span>
          <span>&middot;</span>
          <span>Updated {formatRelativeTime(project.updated_at)}</span>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted">{project.idea}</p>
        <div className="mt-4">
          <StatusBadge status={project.status} />
        </div>
      </Link>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete project"
        maxWidthClassName="max-w-sm"
      >
        <p className="text-sm text-muted">
          This permanently deletes <strong className="text-foreground">{project.name}</strong> and its generated brief. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isPending}>
            Delete project
          </Button>
        </div>
      </Modal>
    </div>
  );
}
