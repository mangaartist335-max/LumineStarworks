"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BuildBrief } from "@/lib/types";

interface PollOptions {
  projectId: string;
  /** Only treat the row as "done" once its updated_at is newer than this
   * (ISO string). Needed for regenerate, where a brief already exists and
   * mere presence doesn't tell you the new one has landed yet. Omit for a
   * brand-new project, where any non-null brief means it's done. */
  since?: string;
  intervalMs?: number;
  timeoutMs?: number;
}

// Generation runs server-side in the background (see the after() calls in
// the projects API routes). This polls the row directly via Supabase — no
// extra API route needed, RLS already scopes it to the signed-in owner.
export function usePollForBrief() {
  const [polling, setPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const stopRef = useRef(false);

  const start = useCallback(
    (
      { projectId, since, intervalMs = 2500, timeoutMs = 55000 }: PollOptions,
      onFound: (brief: BuildBrief) => void,
      onTimeout?: () => void
    ) => {
      stopRef.current = false;
      setTimedOut(false);
      setPolling(true);
      const supabase = createClient();
      const startedAt = Date.now();
      const sinceTime = since ? new Date(since).getTime() : null;

      const tick = async () => {
        if (stopRef.current) return;
        if (Date.now() - startedAt > timeoutMs) {
          setPolling(false);
          setTimedOut(true);
          onTimeout?.();
          return;
        }

        const { data } = await supabase
          .from("projects")
          .select("generated_brief, updated_at")
          .eq("id", projectId)
          .maybeSingle();

        if (stopRef.current) return;

        const isFresh =
          sinceTime === null ||
          (data?.updated_at ? new Date(data.updated_at).getTime() > sinceTime : false);

        if (data?.generated_brief && isFresh) {
          setPolling(false);
          onFound(data.generated_brief as BuildBrief);
          return;
        }

        setTimeout(tick, intervalMs);
      };

      tick();
    },
    []
  );

  const stop = useCallback(() => {
    stopRef.current = true;
    setPolling(false);
  }, []);

  return { polling, timedOut, start, stop };
}
