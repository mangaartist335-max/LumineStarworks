import "server-only";
import { storageMode } from "../env";
import { LocalStore } from "./local";
import { SupabaseStore } from "./supabase";
import type { YalStore } from "./types";

let store: YalStore | null = null;

export function getStore(): YalStore {
  if (!store) store = storageMode() === "supabase" ? new SupabaseStore() : new LocalStore();
  return store;
}
