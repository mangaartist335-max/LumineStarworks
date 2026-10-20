// Local development store.
//
// The `turbopackIgnore` hints keep the build from tracing the whole project
// because of the runtime-chosen store path.
//
// Without Supabase credentials the archive reads the seed data and keeps any
// editor changes in `.data/archive.local.json`. Delete that file (or run
// `npm run archive:reset-local`) to start over from the seed.

import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildSeedTables } from "../../../data/seed";
import { applyChangeSet } from "../changes";
import { emptyTables, type ArchiveTables, type ChangeSet } from "../types";

export function localStorePath(): string {
  return process.env.ARCHIVE_LOCAL_FILE ?? path.join(process.cwd(), ".data", "archive.local.json");
}

let seedCache: ArchiveTables | null = null;
let fileCache: { mtimeMs: number; tables: ArchiveTables } | null = null;

export function seedTables(): ArchiveTables {
  seedCache ??= buildSeedTables();
  return seedCache;
}

/** Fill in any tables missing from older store files. */
function normalize(tables: Partial<ArchiveTables>): ArchiveTables {
  return { ...emptyTables(), ...tables };
}

export async function loadLocalTables(): Promise<ArchiveTables> {
  const file = localStorePath();
  try {
    const info = await stat(/*turbopackIgnore: true*/ file);
    if (fileCache && fileCache.mtimeMs === info.mtimeMs) return fileCache.tables;
    const tables = normalize(JSON.parse(await readFile(/*turbopackIgnore: true*/ file, "utf8")));
    fileCache = { mtimeMs: info.mtimeMs, tables };
    return tables;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedTables();
    throw error;
  }
}

export async function commitLocalChanges(changes: ChangeSet): Promise<void> {
  const current = await loadLocalTables();
  const next = applyChangeSet(structuredClone(current), changes);
  await writeLocalTables(next);
}

export async function writeLocalTables(tables: ArchiveTables): Promise<void> {
  const file = localStorePath();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  await writeFile(/*turbopackIgnore: true*/ temp, JSON.stringify(tables), "utf8");
  await rename(/*turbopackIgnore: true*/ temp, file);
  const info = await stat(/*turbopackIgnore: true*/ file);
  fileCache = { mtimeMs: info.mtimeMs, tables };
}
