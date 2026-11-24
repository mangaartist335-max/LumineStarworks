"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GenerateLoadingOverlay } from "@/components/projects/GenerateLoadingOverlay";
import { usePollForBrief } from "@/lib/usePollForBrief";
import type { ProjectRow } from "@/lib/types";

export function MissingBriefState({ project }: { project: ProjectRow }) {
  const router = useRouter();
  const { polling, start, stop } = usePollForBrief();
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(
    project.generation_status === "failed"
      ? project.generation_error || "Generation failed. Please try again."
      : null
  );

  const watch = useCallback(() => {
    start(project.id, {
      onDone: () => router.refresh(),
      onFailed: (message) => setError(message),
    });
  }, [project.id, router, start]);

  useEffect(() => {
    // A new project starts generating in the background the moment it's
    // created (or a regenerate is already running) — wait for it here.
    if (project.generation_status === "generating") watch();
    return () => stop();
  }, [project.generation_status, watch, stop]);

  async function handleGenerate() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      watch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setTriggering(false);
    }
  }

  if (polling) {
    return <GenerateLoadingOverlay active />;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-semibold">
        {error
          ? "Your BuildBrief didn't finish"
          : "This project doesn't have a BuildBrief yet"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {error
          ? `Generation for "${project.name}" stopped before it was done.`
          : `Generate a full development blueprint for "${project.name}" now.`}
      </p>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-left text-sm text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button
        className="mt-6"
        size="lg"
        onClick={handleGenerate}
        disabled={triggering}
      >
        {error ? "Try again" : "Generate BuildBrief"}
      </Button>
    </div>
  );
}
