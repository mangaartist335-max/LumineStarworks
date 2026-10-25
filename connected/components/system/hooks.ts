"use client";

import { useCallback, useEffect, useState } from "react";
import type { StoredDoc } from "@/lib/storage/types";
import { useSystem } from "./system";

/**
 * Live view of a stored collection, filtered to the current user's records
 * unless `allUsers` is set. Re-reads whenever the collection changes (in
 * this tab or another one running the same computer).
 */
export function useCollection<T extends StoredDoc>(collection: string, opts: { allUsers?: boolean } = {}): [T[], () => Promise<void>, boolean] {
  const { store, user } = useSystem();
  const [items, setItems] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  const allUsers = Boolean(opts.allUsers);
  const reload = useCallback(async () => {
    const all = await store.list<T>(collection);
    setItems(allUsers ? all : all.filter((d) => (d as unknown as { owner?: string }).owner === user?.id));
    setLoaded(true);
  }, [store, collection, user, allUsers]);
  useEffect(() => {
    // Load once now and again whenever this collection changes.
    void reload();
    return store.subscribe((e) => {
      if (e.kind === "doc" && e.collection === collection) void reload();
    });
  }, [store, collection, reload]);
  return [items, reload, loaded];
}

/** A per-user value in the key-value area, with a setter that persists it. */
export function useUserValue<T>(key: string, initial: T): [T, (v: T) => Promise<void>, boolean] {
  const { store, user } = useSystem();
  const fullKey = `${key}:${user?.id ?? "nobody"}`;
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    store.kvGet<T>(fullKey).then((v) => {
      if (!alive) return;
      if (v !== undefined) setValue(v);
      setLoaded(true);
    });
    const off = store.subscribe((e) => {
      if (e.kind === "kv" && e.key === fullKey) void store.kvGet<T>(fullKey).then((v) => v !== undefined && setValue(v));
    });
    return () => {
      alive = false;
      off();
    };
  }, [store, fullKey]);
  const set = useCallback(
    async (v: T) => {
      setValue(v);
      await store.kvSet(fullKey, v);
    },
    [store, fullKey],
  );
  return [value, set, loaded];
}
