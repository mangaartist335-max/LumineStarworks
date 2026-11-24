import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCachedProjects, listProjects, type ProjectSummary } from "./projects";

/** Projects list: shows the cached copy instantly, then refreshes from the server. */
export function useProjects() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const result = await listProjects();
      setProjects(result.projects);
      setOffline(result.offline);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load projects.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getCachedProjects().then((cached) => {
      if (cached && !loaded.current) setProjects(cached);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loaded.current = true;
      void refresh();
    }, [refresh])
  );

  return { projects, offline, refreshing, error, refresh: () => refresh(true) };
}
