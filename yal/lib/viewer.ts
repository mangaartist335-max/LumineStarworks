import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { AS_OF_COOKIE, clampAsOf } from "./time";
import { getStore } from "./store";
import type { Account } from "./store/types";

export interface Viewer {
  /** The archive moment being viewed. Never the real current date. */
  asOf: string;
  account: Account | null;
  mode: "local" | "supabase";
  /** Display zone for timestamps. */
  zone: string;
}

export const getViewer = cache(async (): Promise<Viewer> => {
  const jar = await cookies();
  const raw = jar.get(AS_OF_COOKIE)?.value;
  const asOf = clampAsOf(raw ? decodeURIComponent(raw) : null);
  const store = getStore();
  let account: Account | null = null;
  try {
    account = await store.currentAccount();
  } catch (err) {
    console.error("[yal] could not load the current account", err);
  }
  return { asOf, account, mode: store.mode, zone: account?.timeZone ?? "JST" };
});
