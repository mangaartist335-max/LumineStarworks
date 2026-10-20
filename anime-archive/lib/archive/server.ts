import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import { archiveMode } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { indexArchive, type ArchiveIndex } from "./archive-index";
import { isEmptyChangeSet } from "./changes";
import { todayISO } from "./dates";
import { commitLocalChanges, loadLocalTables } from "./store/local";
import { commitSupabaseChanges, loadSupabaseTables } from "./store/supabase";
import type { ArchiveTables, ChangeSet, ISODate } from "./types";

/** Load the archive for this request (deduplicated across every component that asks). */
export const loadArchive = cache(async (): Promise<ArchiveIndex> => {
  await connection();
  const tables = archiveMode() === "supabase" ? await loadSupabaseTables() : await loadLocalTables();
  return indexArchive(tables);
});

/**
 * Fresh tables for Server Actions. Mutations always compute against the
 * latest stored state instead of the per-render cache.
 */
export async function loadTablesForWrite(): Promise<ArchiveTables> {
  return archiveMode() === "supabase" ? await loadSupabaseTables({ fresh: true }) : await loadLocalTables();
}

/**
 * "Today" for status badges, upcoming premieres and anniversaries.
 * `ARCHIVE_TODAY=2016-04-09` pins the date, which is handy for demos and screenshots.
 */
export function archiveToday(): ISODate {
  const pinned = process.env.ARCHIVE_TODAY;
  if (pinned && /^\d{4}-\d{2}-\d{2}$/.test(pinned)) return pinned;
  return todayISO();
}

export async function commitChanges(changes: ChangeSet): Promise<void> {
  if (isEmptyChangeSet(changes)) return;
  if (archiveMode() === "supabase") {
    await commitSupabaseChanges(await createSessionClient(), changes);
  } else {
    try {
      await commitLocalChanges(changes);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "EROFS" || code === "EACCES") {
        throw new Error("This deployment can't save local edits (read-only file system). Connect Supabase to edit the archive here.");
      }
      throw error;
    }
  }
}
