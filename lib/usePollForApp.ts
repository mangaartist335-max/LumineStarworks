"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GENERATION_MAX_SECONDS, type AppBuildStatus } from "@/lib/types";

// Same pattern as usePollForBrief: the build runs in the background and
// records progress on the project row, which RLS lets the owner read directly.
const STALE_AFTER_MS = (GENERATION_MAX_SECONDS + 20) * 1000;
const POLL_INTERVAL_MS = 3000;

const TIMED_OUT_MESSAGE =
  "The build took too long and was stopped. Please try again: builds usually finish in a couple of minutes.";

interface PollCallbacks {
  onDone: (html: string) => void;
  onFailed: (message: string) => void;
}

interface AppStatusRow {
  app_status: AppBuildStatus | null;
  app_error: string | null;
  app_started_at: string | null;
}

export function usePollForApp() {
  const [polling, setPolling] = useState(false);
  const stopRef = useRef(false);

  const start = useCallback((projectId: string, { onDone, onFailed }: PollCallbacks) => {
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

      // Poll the small status fields; only fetch the (large) HTML once done.
      const { data } = await supabase
        .from("projects")
        .select("app_status, app_error, app_started_at")
        .eq("id", projectId)
        .maybeSingle<AppStatusRow>();

      if (stopRef.current) return;

      if (data?.app_status === "done") {
        const { data: full } = await supabase
          .from("projects")
          .select("app_html")
          .eq("id", projectId)
          .maybeSingle<{ app_html: string | null }>();
        if (stopRef.current) return;
        if (full?.app_html) {
          const html = full.app_html;
          return finish(() => onDone(html));
        }
      }
      if (data?.app_status === "failed") {
        const message = data.app_error || "The build failed. Please try again.";
        return finish(() => onFailed(message));
      }

      const startedAt = data?.app_started_at
        ? new Date(data.app_started_at).getTime()
        : pollStartedAt;
      if (Date.now() - startedAt > STALE_AFTER_MS) {
        return finish(() => onFailed(TIMED_OUT_MESSAGE));
      }

      setTimeout(tick, POLL_INTERVAL_MS);
    };

    tick();
  }, []);

  const stop = useCallback(() => {
    stopRef.current = true;
    setPolling(false);
  }, []);

  return { polling, start, stop };
}
