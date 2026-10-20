// Supabase-backed store.
//
// Reads use the public (anon) key — every archive table is world-readable
// under RLS. Writes go through the signed-in editor's session and a single
// `archive_apply_changes` RPC, so Row Level Security decides who may write and
// every change set lands atomically.

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../../env";
import { TABLE_ORDER, emptyTables, type ArchiveTables, type ChangeSet, type TableName } from "../types";

const PAGE = 1000;

let readClient: SupabaseClient | null = null;

function publicClient(): SupabaseClient {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  readClient ??= createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
  return readClient;
}

async function loadTable(client: SupabaseClient, table: TableName): Promise<unknown[]> {
  const rows: unknown[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Could not load ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

/** Postgres returns numerics as strings in some configurations; normalise the few we use. */
function normalizeRows(table: TableName, rows: unknown[]): unknown[] {
  if (table !== "productions") return rows;
  return (rows as Record<string, unknown>[]).map((r) => ({ ...r, score: r.score === null || r.score === undefined ? null : Number(r.score) }));
}

let cache: { at: number; tables: ArchiveTables } | null = null;
const TTL_MS = 10_000;

export async function loadSupabaseTables(options: { fresh?: boolean } = {}): Promise<ArchiveTables> {
  if (!options.fresh && cache && Date.now() - cache.at < TTL_MS) return cache.tables;
  const client = publicClient();
  const tables = emptyTables();
  const results = await Promise.all(TABLE_ORDER.map((t) => loadTable(client, t)));
  TABLE_ORDER.forEach((t, i) => {
    (tables[t] as unknown[]) = normalizeRows(t, results[i]);
  });
  cache = { at: Date.now(), tables };
  return tables;
}

export function invalidateSupabaseCache() {
  cache = null;
}

export async function commitSupabaseChanges(client: SupabaseClient, changes: ChangeSet): Promise<void> {
  const { error } = await client.rpc("archive_apply_changes", { changes });
  if (error) {
    if (error.code === "42501" || /row-level security|permission denied/i.test(error.message)) {
      throw new Error("Your account doesn't have editor access to the archive yet. Ask an admin to grant the editor role.");
    }
    throw new Error(`Supabase rejected the change: ${error.message}`);
  }
  invalidateSupabaseCache();
}
