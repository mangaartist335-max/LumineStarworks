import { TABLE_ORDER, type ArchiveTables, type ChangeSet, type TableName } from "./types";

export function emptyChangeSet(): ChangeSet {
  return { upserts: {}, deletes: {} };
}

export function isEmptyChangeSet(changes: ChangeSet): boolean {
  return (
    Object.values(changes.upserts).every((rows) => !rows || rows.length === 0) &&
    Object.values(changes.deletes).every((ids) => !ids || ids.length === 0)
  );
}

export function addUpsert<T extends TableName>(changes: ChangeSet, table: T, row: ArchiveTables[T][number]) {
  const list = (changes.upserts[table] ??= [] as ArchiveTables[T]) as ArchiveTables[T][number][];
  const index = list.findIndex((r) => r.id === row.id);
  if (index >= 0) list[index] = row;
  else list.push(row);
}

export function addDelete(changes: ChangeSet, table: TableName, id: string) {
  const list = (changes.deletes[table] ??= []);
  if (!list.includes(id)) list.push(id);
}

export function mergeChangeSets(...sets: ChangeSet[]): ChangeSet {
  const merged = emptyChangeSet();
  for (const set of sets) {
    for (const table of TABLE_ORDER) {
      for (const row of set.upserts[table] ?? []) addUpsert(merged, table, row as never);
      for (const id of set.deletes[table] ?? []) addDelete(merged, table, id);
    }
  }
  return merged;
}

/** Apply a change set to in-memory tables (used by the local store and by tests). */
export function applyChangeSet(tables: ArchiveTables, changes: ChangeSet): ArchiveTables {
  for (const table of [...TABLE_ORDER].reverse()) {
    const ids = changes.deletes[table];
    if (!ids?.length) continue;
    const drop = new Set(ids);
    (tables[table] as { id: string }[]) = (tables[table] as { id: string }[]).filter((r) => !drop.has(r.id));
  }
  for (const table of TABLE_ORDER) {
    const rows = changes.upserts[table] as { id: string }[] | undefined;
    if (!rows?.length) continue;
    const list = tables[table] as { id: string }[];
    const position = new Map(list.map((r, i) => [r.id, i]));
    for (const row of rows) {
      const at = position.get(row.id);
      if (at === undefined) {
        position.set(row.id, list.length);
        list.push(row);
      } else {
        list[at] = row;
      }
    }
  }
  return tables;
}

export function countChanges(changes: ChangeSet): { upserts: number; deletes: number } {
  let upserts = 0;
  let deletes = 0;
  for (const rows of Object.values(changes.upserts)) upserts += rows?.length ?? 0;
  for (const ids of Object.values(changes.deletes)) deletes += ids?.length ?? 0;
  return { upserts, deletes };
}
