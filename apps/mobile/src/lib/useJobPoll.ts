import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { getJobStatus } from "./projects";
import { GENERATION_MAX_SECONDS } from "@/shared/types";

export type JobKind = "blueprint" | "app";
export type JobPhase = "idle" | "running" | "done" | "failed";

const INTERVAL_MS = 3000;
const STALE_MS = (GENERATION_MAX_SECONDS + 20) * 1000;

/**
 * Follows a background job (blueprint generation or app build) by reading
 * its real status from the project row. Pauses while the app is in the
 * background (battery) and resumes when it comes back.
 */
export function useJobPoll(projectId: string, kind: JobKind) {
  const [phase, setPhase] = useState<JobPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef(false);
  const callbacks = useRef<{ onDone?: () => void; onFailed?: (m: string) => void }>({});
  const tickRef = useRef<() => Promise<void>>(async () => {});

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const tick = useCallback(async () => {
    if (!active.current) return;
    try {
      const row = await getJobStatus(projectId);
      if (!active.current) return;
      const status = kind === "blueprint" ? row?.generation_status : row?.app_status;
      const err = kind === "blueprint" ? row?.generation_error : row?.app_error;
      const started = kind === "blueprint" ? row?.generation_started_at : row?.app_started_at;
      if (started) setStartedAt(new Date(started).getTime());

      if (status === "done") {
        active.current = false;
        setPhase("done");
        callbacks.current.onDone?.();
        return;
      }
      if (status === "failed") {
        active.current = false;
        const message = err || "Something went wrong. Please try again.";
        setError(message);
        setPhase("failed");
        callbacks.current.onFailed?.(message);
        return;
      }
      if (started && Date.now() - new Date(started).getTime() > STALE_MS) {
        active.current = false;
        const message = "This took too long and was stopped. Please try again.";
        setError(message);
        setPhase("failed");
        callbacks.current.onFailed?.(message);
        return;
      }
    } catch {
      // Network blip: keep polling.
    }
    if (active.current && AppState.currentState === "active") {
      timer.current = setTimeout(() => void tickRef.current(), INTERVAL_MS);
    }
  }, [projectId, kind]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  const start = useCallback(
    (cbs: { onDone?: () => void; onFailed?: (m: string) => void } = {}) => {
      callbacks.current = cbs;
      clear();
      active.current = true;
      setError(null);
      setPhase("running");
      setStartedAt((s) => s ?? Date.now());
      void tick();
    },
    [tick]
  );

  const stop = useCallback(() => {
    active.current = false;
    clear();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && active.current) {
        clear();
        void tick();
      }
    });
    return () => {
      sub.remove();
      active.current = false;
      clear();
    };
  }, [tick]);

  return { phase, error, startedAt, start, stop };
}
