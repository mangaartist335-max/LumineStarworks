"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GenerateLoadingOverlay } from "@/components/projects/GenerateLoadingOverlay";
import type { ProjectRow } from "@/lib/types";

export function MissingBriefState({ project }: { project: ProjectRow }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <GenerateLoadingOverlay active={loading} />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-accent">
        <Sparkles className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-semibold">This project doesn&apos;t have a BuildBrief yet</h1>
      <p className="mt-2 text-sm text-muted">
        Generate a full development blueprint for &ldquo;{project.name}&rdquo; now.
      </p>
      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      <Button className="mt-6" size="lg" onClick={handleGenerate} disabled={loading}>
        Generate BuildBrief
      </Button>
    </div>
  );
}
