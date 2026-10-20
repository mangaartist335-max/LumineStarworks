// Write-side operations. Each function is pure: it reads the current tables
// and returns a ChangeSet (including revision rows) for the store to apply.
// Nothing here touches the database directly, which keeps every rule easy to
// test and identical in local and Supabase modes.

import { addDelete, addUpsert, emptyChangeSet, mergeChangeSets } from "./changes";
import { newId } from "./ids";
import { ENTITY_LABEL, PROVENANCE_LABEL } from "./labels";
import { NATURAL_KEYS, REFERENCE_FIELDS, SLUGGED, type EntityInput } from "./schemas";
import { duplicateKey } from "./validation";
import {
  ENTITY_TABLE,
  type ArchiveTables,
  type ChangeSet,
  type EntityRow,
  type EntityType,
  type Production,
  type Provenance,
  type RecordConflict,
  type Revision,
  type TableName,
} from "./types";

export class ArchiveError extends Error {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export interface MutationContext {
  tables: ArchiveTables;
  author: string | null;
  now: string;
  batchId: string;
  /** When set, the changed fields are cited to this source document. */
  sourceDocumentId?: string | null;
}

export function createContext(tables: ArchiveTables, author: string | null, sourceDocumentId: string | null = null): MutationContext {
  return { tables, author, now: new Date().toISOString(), batchId: newId(), sourceDocumentId };
}

type AnyRow = EntityRow & Record<string, unknown>;

export function findRow(tables: ArchiveTables, entity: EntityType, id: string): AnyRow | undefined {
  return (tables[ENTITY_TABLE[entity]] as unknown as AnyRow[]).find((r) => r.id === id);
}

export function describeRow(tables: ArchiveTables, entity: EntityType, row: Record<string, unknown>): string {
  const name = (row.title ?? row.name ?? row.character_name) as string | undefined;
  if (name) return name;
  if (entity === "production_credit" || entity === "voice_credit") {
    const person = tables.people.find((p) => p.id === row.person_id);
    const production = tables.productions.find((p) => p.id === row.production_id);
    return `${person?.name ?? "Someone"} on ${production?.title ?? "a production"}`;
  }
  if (entity === "broadcast_run") return (row.label as string) ?? `${row.kind} run`;
  if (entity === "episode") return `Episode ${row.number}`;
  const production = tables.productions.find((p) => p.id === row.production_id)?.title;
  const named = (id: unknown, list: { id: string; name?: string; title?: string }[]) => {
    const found = list.find((r) => r.id === id);
    return found?.name ?? found?.title;
  };
  const other =
    named(row.studio_id, tables.studios) ??
    named(row.company_id, tables.companies) ??
    named(row.track_id, tables.music_tracks) ??
    named(row.related_production_id, tables.productions) ??
    named(row.person_id, tables.people);
  if (other && production) return `${other} on ${production}`;
  if (other) return other;
  return ENTITY_LABEL[entity];
}

function revision(
  ctx: MutationContext,
  entity: EntityType,
  id: string,
  action: Revision["action"],
  summary: string,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  changed: string[] = [],
): Revision {
  return {
    id: newId(),
    batch_id: ctx.batchId,
    entity_type: entity,
    entity_id: id,
    action,
    summary,
    before,
    after,
    changed_fields: changed,
    author: ctx.author,
    source_document_id: ctx.sourceDocumentId ?? null,
    created_at: ctx.now,
  };
}

const META = new Set(["id", "created_at", "updated_at"]);

export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => !META.has(k) && JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));
}

function citeFields(ctx: MutationContext, changes: ChangeSet, entity: EntityType, id: string, fields: (string | null)[]) {
  if (!ctx.sourceDocumentId) return;
  for (const field of fields) {
    addUpsert(changes, "fact_sources", {
      id: newId(),
      entity_type: entity,
      entity_id: id,
      field,
      source_document_id: ctx.sourceDocumentId,
      note: null,
      created_at: ctx.now,
    });
  }
}

/** Check that referenced rows exist and that slugs / natural keys / productions are unique. */
export function checkIntegrity(tables: ArchiveTables, entity: EntityType, row: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [field, target] of Object.entries(REFERENCE_FIELDS[entity] ?? {})) {
    const value = row[field];
    if (value === null || value === undefined) continue;
    if (!findRow(tables, target, value as string)) errors[field] = `That ${ENTITY_LABEL[target].toLowerCase()} doesn't exist in the archive.`;
  }

  const others = (tables[ENTITY_TABLE[entity]] as unknown as AnyRow[]).filter((r) => r.id !== row.id);
  if (SLUGGED.includes(entity) && others.some((r) => r.slug === row.slug)) {
    errors.slug = `Another ${ENTITY_LABEL[entity].toLowerCase()} already uses “${row.slug}”.`;
  }

  const key = NATURAL_KEYS[entity];
  if (key && others.some((r) => key.every((k) => JSON.stringify(r[k] ?? null) === JSON.stringify(row[k] ?? null)))) {
    errors._form = `This ${ENTITY_LABEL[entity].toLowerCase()} is already recorded.`;
  }

  if (entity === "production") {
    const dupKey = duplicateKey(row as unknown as Production);
    const twin = (others as unknown as Production[]).find((p) => p.provenance !== "superseded" && duplicateKey(p) === dupKey);
    if (twin) errors.title = `“${twin.title}” (${twin.format}, ${twin.premiere_year ?? "year unknown"}) is already in the archive.`;
  }
  return errors;
}

export interface SaveResult {
  changes: ChangeSet;
  row: AnyRow;
  created: boolean;
  changed: string[];
}

export function saveEntity<E extends EntityType>(ctx: MutationContext, entity: E, data: EntityInput<E>, id?: string | null): SaveResult {
  const existing = id ? findRow(ctx.tables, entity, id) : undefined;
  if (id && !existing) throw new ArchiveError(`That ${ENTITY_LABEL[entity].toLowerCase()} no longer exists.`);

  const row = (existing
    ? { ...existing, ...data, updated_at: ctx.now }
    : { id: newId(), ...data, created_at: ctx.now, updated_at: ctx.now }) as unknown as AnyRow;

  const errors = checkIntegrity(ctx.tables, entity, row);
  if (Object.keys(errors).length) throw new ArchiveError("Please fix the highlighted fields.", errors);

  const changes = emptyChangeSet();
  const changed = existing ? changedFields(existing, row) : Object.keys(data);
  if (existing && changed.length === 0) return { changes, row: existing, created: false, changed: [] };

  addUpsert(changes, ENTITY_TABLE[entity], row as never);
  const label = describeRow(ctx.tables, entity, row);
  addUpsert(
    changes,
    "revisions",
    existing
      ? revision(ctx, entity, row.id, "update", `Updated ${label}: ${changed.join(", ")}`, existing, row, changed)
      : revision(ctx, entity, row.id, "create", `Created ${ENTITY_LABEL[entity].toLowerCase()} “${label}”`, null, row),
  );
  citeFields(ctx, changes, entity, row.id, SLUGGED.includes(entity) ? changed : [null]);
  return { changes, row, created: !existing, changed };
}

/** Rows owned by an entity that are removed along with it. */
function ownedChildren(tables: ArchiveTables, entity: EntityType, id: string): { entity: EntityType; row: AnyRow }[] {
  const out: { entity: EntityType; row: AnyRow }[] = [];
  const add = (child: EntityType, list: AnyRow[]) => list.forEach((row) => out.push({ entity: child, row }));
  const all = (child: EntityType) => tables[ENTITY_TABLE[child]] as unknown as AnyRow[];

  if (entity === "production") {
    const runs = tables.broadcast_runs.filter((r) => r.production_id === id).map((r) => r.id);
    const episodes = tables.episodes.filter((e) => e.production_id === id).map((e) => e.id);
    add("episode_release", all("episode_release").filter((r) => runs.includes(r.broadcast_run_id as string) || episodes.includes(r.episode_id as string)));
    for (const child of ["production_studio", "production_company", "broadcast_run", "episode", "production_credit", "voice_credit", "theme_song"] as EntityType[]) {
      add(child, all(child).filter((r) => r.production_id === id));
    }
    add("related_media", all("related_media").filter((r) => r.production_id === id || r.related_production_id === id));
  }
  if (entity === "broadcast_run") add("episode_release", all("episode_release").filter((r) => r.broadcast_run_id === id));
  if (entity === "episode") add("episode_release", all("episode_release").filter((r) => r.episode_id === id));
  if (entity === "music_track") add("track_credit", all("track_credit").filter((r) => r.track_id === id));
  return out;
}

/** Rows elsewhere in the archive that still point at an entity (deletion is blocked until they're gone). */
export function blockingReferences(tables: ArchiveTables, entity: EntityType, id: string): string[] {
  const uses: [string, number][] = [];
  const count = (label: string, n: number) => n > 0 && uses.push([label, n]);
  switch (entity) {
    case "studio":
      count("production", tables.production_studios.filter((r) => r.studio_id === id).length);
      break;
    case "person":
      count("staff credit", tables.production_credits.filter((r) => r.person_id === id).length);
      count("cast credit", tables.voice_credits.filter((r) => r.person_id === id).length);
      count("music credit", tables.track_credits.filter((r) => r.person_id === id).length);
      break;
    case "company":
      count("production", tables.production_companies.filter((r) => r.company_id === id).length);
      count("broadcast run", tables.broadcast_runs.filter((r) => r.network_id === id).length);
      count("music track", tables.music_tracks.filter((r) => r.label_id === id).length);
      break;
    case "franchise":
      count("production", tables.productions.filter((r) => r.franchise_id === id).length);
      break;
    case "music_track":
      count("theme song assignment", tables.theme_songs.filter((r) => r.track_id === id).length);
      break;
    case "source_document":
      count("cited fact", tables.fact_sources.filter((r) => r.source_document_id === id).length);
      break;
  }
  return uses.map(([label, n]) => `${n} ${label}${n === 1 ? "" : "s"}`);
}

export function deleteEntity(ctx: MutationContext, entity: EntityType, id: string): ChangeSet {
  const row = findRow(ctx.tables, entity, id);
  if (!row) throw new ArchiveError(`That ${ENTITY_LABEL[entity].toLowerCase()} has already been removed.`);
  const blockers = blockingReferences(ctx.tables, entity, id);
  if (blockers.length) {
    throw new ArchiveError(`“${describeRow(ctx.tables, entity, row)}” is still used by ${blockers.join(", ")}. Remove or reassign those first.`);
  }
  const changes = emptyChangeSet();
  for (const child of ownedChildren(ctx.tables, entity, id)) {
    addDelete(changes, ENTITY_TABLE[child.entity], child.row.id);
    addUpsert(changes, "revisions", revision(ctx, child.entity, child.row.id, "delete", `Removed with ${describeRow(ctx.tables, entity, row)}`, child.row, null));
  }
  addDelete(changes, ENTITY_TABLE[entity], id);
  addUpsert(changes, "revisions", revision(ctx, entity, id, "delete", `Deleted ${ENTITY_LABEL[entity].toLowerCase()} “${describeRow(ctx.tables, entity, row)}”`, row, null));
  return changes;
}

/** Restore an entity to the state recorded in a revision (or bring back a deleted row). */
export function restoreRevision(ctx: MutationContext, revisionId: string): ChangeSet {
  const rev = ctx.tables.revisions.find((r) => r.id === revisionId);
  if (!rev) throw new ArchiveError("That revision could not be found.");
  const snapshot = rev.action === "delete" ? rev.before : rev.after;
  if (!snapshot) throw new ArchiveError("This revision doesn't hold a version that can be restored.");

  const current = findRow(ctx.tables, rev.entity_type, rev.entity_id);
  const restored = { ...snapshot, id: rev.entity_id, updated_at: ctx.now } as AnyRow;
  const errors = checkIntegrity(ctx.tables, rev.entity_type, restored);
  if (Object.keys(errors).length) throw new ArchiveError(`This version can't be restored: ${Object.values(errors).join(" ")}`);

  const changes = emptyChangeSet();
  addUpsert(changes, ENTITY_TABLE[rev.entity_type], restored as never);
  addUpsert(
    changes,
    "revisions",
    revision(
      ctx,
      rev.entity_type,
      rev.entity_id,
      "restore",
      `Restored ${describeRow(ctx.tables, rev.entity_type, restored)} to the version from ${rev.created_at.slice(0, 10)}`,
      current ?? null,
      restored,
      current ? changedFields(current, restored) : [],
    ),
  );
  return changes;
}

/** Restore every row removed in one batch (for example a production and its credits). */
export function restoreBatch(ctx: MutationContext, batchId: string): ChangeSet {
  const deletes = ctx.tables.revisions.filter((r) => r.batch_id === batchId && r.action === "delete");
  if (!deletes.length) throw new ArchiveError("Nothing in that change can be restored.");
  // Parents first so references resolve.
  const order: EntityType[] = ["source_document", "franchise", "studio", "person", "company", "production", "music_track", "broadcast_run", "episode"];
  deletes.sort((a, b) => {
    const ia = order.indexOf(a.entity_type);
    const ib = order.indexOf(b.entity_type);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const working = structuredClone(ctx.tables);
  const sets: ChangeSet[] = [];
  for (const rev of deletes) {
    const set = restoreRevision({ ...ctx, tables: working }, rev.id);
    for (const table of Object.keys(set.upserts) as TableName[]) {
      (working[table] as { id: string }[]).push(...((set.upserts[table] ?? []) as { id: string }[]));
    }
    sets.push(set);
  }
  return mergeChangeSets(...sets);
}

export function resolveConflict(ctx: MutationContext, conflictId: string, decision: "accept" | "reject", note: string | null): ChangeSet {
  const conflict = ctx.tables.record_conflicts.find((c) => c.id === conflictId);
  if (!conflict) throw new ArchiveError("That conflict could not be found.");
  if (conflict.status !== "open") throw new ArchiveError("That conflict has already been resolved.");

  const changes = emptyChangeSet();
  const resolved: RecordConflict = {
    ...conflict,
    status: decision === "accept" ? "accepted" : "rejected",
    note,
    resolved_at: ctx.now,
    resolved_by: ctx.author,
  };
  addUpsert(changes, "record_conflicts", resolved);

  if (decision === "accept") {
    const row = findRow(ctx.tables, conflict.entity_type, conflict.entity_id);
    if (!row) throw new ArchiveError("The record this conflict belongs to no longer exists.");
    const updated = { ...row, [conflict.field]: conflict.proposed_value, updated_at: ctx.now } as AnyRow;
    addUpsert(changes, ENTITY_TABLE[conflict.entity_type], updated as never);
    addUpsert(
      changes,
      "revisions",
      revision(
        { ...ctx, sourceDocumentId: conflict.source_document_id },
        conflict.entity_type,
        conflict.entity_id,
        "resolve",
        `Accepted a correction to ${conflict.field} on ${describeRow(ctx.tables, conflict.entity_type, row)}${note ? ` — ${note}` : ""}`,
        row,
        updated,
        [conflict.field],
      ),
    );
    citeFields({ ...ctx, sourceDocumentId: conflict.source_document_id }, changes, conflict.entity_type, conflict.entity_id, [conflict.field]);
  }
  return changes;
}

/**
 * Change the provenance status of many records at once (e.g. approving Proposed entries).
 * With `cascade`, a production's own rows (studios, runs, credits, cast, music, links) follow it.
 */
export function setProvenance(ctx: MutationContext, entity: EntityType, ids: string[], provenance: Provenance, options: { cascade?: boolean } = {}): ChangeSet {
  const changes = emptyChangeSet();
  const mark = (type: EntityType, row: AnyRow, summary: string) => {
    if (row.provenance === provenance) return;
    const updated = { ...row, provenance, updated_at: ctx.now } as AnyRow;
    addUpsert(changes, ENTITY_TABLE[type], updated as never);
    addUpsert(changes, "revisions", revision(ctx, type, row.id, "update", summary, row, updated, ["provenance"]));
  };
  for (const id of ids) {
    const row = findRow(ctx.tables, entity, id);
    if (!row) continue;
    const label = describeRow(ctx.tables, entity, row);
    mark(entity, row, `Marked ${label} as ${PROVENANCE_LABEL[provenance]}`);
    if (options.cascade && entity === "production") {
      for (const child of ownedChildren(ctx.tables, entity, id)) {
        if (child.entity === "related_media" && child.row.production_id !== id) continue;
        mark(child.entity, child.row, `Marked as ${PROVENANCE_LABEL[provenance]} along with ${label}`);
      }
    }
  }
  return changes;
}

function nextSeasonTitle(title: string, next: number): string {
  if (/season\s+\d+$/i.test(title)) return title.replace(/(season\s+)\d+$/i, `$1${next}`);
  return `${title.replace(/:\s*$/, "")} Season ${next}`;
}

/** Create the next season of a production: same franchise, studios and classification, empty dates. */
export function createNextSeason(ctx: MutationContext, productionId: string): { changes: ChangeSet; production: Production } {
  const source = ctx.tables.productions.find((p) => p.id === productionId);
  if (!source) throw new ArchiveError("That production no longer exists.");
  const sets: ChangeSet[] = [];
  let tables = ctx.tables;
  const step = (set: ChangeSet) => {
    sets.push(set);
    tables = structuredClone(tables);
    for (const table of Object.keys(set.upserts) as TableName[]) {
      const list = tables[table] as { id: string }[];
      for (const row of (set.upserts[table] ?? []) as { id: string }[]) {
        const i = list.findIndex((r) => r.id === row.id);
        if (i >= 0) list[i] = row;
        else list.push(row);
      }
    }
  };

  let franchiseId = source.franchise_id;
  if (!franchiseId) {
    const baseName = source.title.replace(/[:\s]*season\s+\d+$/i, "").trim();
    let slug = source.slug.replace(/-season-\d+$/, "");
    while (tables.franchises.some((f) => f.slug === slug)) slug = `${slug}-franchise`;
    const created = saveEntity({ ...ctx, tables }, "franchise", { slug, name: baseName, name_native: null, description: null, provenance: "provisional" });
    step(created.changes);
    franchiseId = created.row.id;
    const updated = saveEntity({ ...ctx, tables }, "production", { ...stripMeta(source), franchise_id: franchiseId, franchise_order: source.franchise_order ?? 1, season_number: source.season_number ?? 1 } as EntityInput<"production">, source.id);
    step(updated.changes);
  }

  const siblings = tables.productions.filter((p) => p.franchise_id === franchiseId);
  const seasonNumber = Math.max(source.season_number ?? 1, ...siblings.map((p) => p.season_number ?? 0)) + 1;
  const order = Math.max(0, ...siblings.map((p) => p.franchise_order ?? 0)) + 1;
  const title = nextSeasonTitle(source.title, seasonNumber);
  let slug = source.slug.replace(/-season-\d+$/, "") + `-season-${seasonNumber}`;
  while (tables.productions.some((p) => p.slug === slug)) slug = `${slug}-new`;

  const created = saveEntity({ ...ctx, tables }, "production", {
    slug,
    franchise_id: franchiseId,
    franchise_order: order,
    season_number: seasonNumber,
    title,
    title_native: null,
    title_romaji: null,
    alt_titles: [],
    format: source.format,
    synopsis: null,
    genres: source.genres,
    themes: source.themes,
    source_material: source.source_material,
    demographic: source.demographic,
    age_rating: source.age_rating,
    premiere_year: null,
    premiere_season: null,
    premiere_date: null,
    finale_date: null,
    episode_count: null,
    runtime_minutes: source.runtime_minutes,
    production_history: null,
    reception: null,
    score: null,
    poster_url: null,
    notes: `Created as the season after “${source.title}”. Dates and staff are awaiting documentation.`,
    provenance: "provisional",
  });
  step(created.changes);
  const production = created.row as unknown as Production;

  for (const link of tables.production_studios.filter((l) => l.production_id === source.id)) {
    step(saveEntity({ ...ctx, tables }, "production_studio", { production_id: production.id, studio_id: link.studio_id, role: link.role, provenance: "provisional" }).changes);
  }
  step(saveEntity({ ...ctx, tables }, "related_media", { production_id: source.id, related_production_id: production.id, relation: "sequel", notes: null, provenance: "provisional" }).changes);

  return { changes: mergeChangeSets(...sets), production };
}

export function stripMeta<T extends { id: string; created_at: string; updated_at: string }>(row: T): Omit<T, "id" | "created_at" | "updated_at"> {
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
  void _id;
  void _c;
  void _u;
  return rest;
}
