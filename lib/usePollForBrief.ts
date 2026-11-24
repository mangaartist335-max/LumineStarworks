"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  GENERATION_MAX_SECONDS,
  type BuildBrief,
  type GenerationStatus,
} from "@/lib/types";

// The server marks a run failed itself, but if the platform kills the
// function outright (time limit reached) nothing gets to record that — so
// a run still "generating" past the server's limit is treated as cut off.
const STALE_AFTER_MS = (GENERATION_MAX_SECONDS + 20) * 1000;
const POLL_INTERVAL_MS = 3000;

const TIMED_OUT_MESSAGE =
  "Generation took too long and was stopped. Please try again. A shorter idea description finishes faster.";

interface PollCallbacks {
  onDone: (brief: BuildBrief) => void;
  onFailed: (message: string) => void;
}

interface GenerationRow {
  generated_brief: BuildBrief | null;
  generation_status: GenerationStatus | null;
  generation_error: string | null;
  generation_started_at: string | null;
}

// Background generation (see lib/run-generation.ts) records its progress on
// the project row; this polls that row directly through Supabase — RLS
// already limits it to the signed-in owner, so no extra API route is needed.
export function usePollForBrief() {
  const [polling, setPolling] = useState(false);
  const stopRef = useRef(false);

  const start = useCallback(
    (projectId: string, { onDone, onFailed }: PollCallbacks) => {
      stopRef.current = false;
      setPolling(true);
      const supabase = createClient();
      const pollStartedAt = Date.now();

      const finish = (fn: () => void) => {
        stopRef.current = true;
        setPolling(false);
        fn();
      };

      const tick = async () => {
        if (stopRef.current) return;

        const { data } = await supabase
          .from("projects")
          .select(
            "generated_brief, generation_status, generation_error, generation_started_at"
          )
          .eq("id", projectId)
          .maybeSingle<GenerationRow>();

        if (stopRef.current) return;

        if (data?.generation_status === "done" && data.generated_brief) {
          const brief = data.generated_brief;
          return finish(() => onDone(brief));
        }
        if (data?.generation_status === "failed") {
          const message =
            data.generation_error ||
            "Generation failed. Please try again.";
          return finish(() => onFailed(message));
        }

        const startedAt = data?.generation_started_at
          ? new Date(data.generation_started_at).getTime()
          : pollStartedAt;
        if (Date.now() - startedAt > STALE_AFTER_MS) {
          return finish(() => onFailed(TIMED_OUT_MESSAGE));
        }

        setTimeout(tick, POLL_INTERVAL_MS);
      };

      tick();
    },
    []
  );

  const stop = useCallback(() => {
    stopRef.current = true;
    setPolling(false);
  }, []);

  return { polling, start, stop };
}
