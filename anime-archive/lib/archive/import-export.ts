// Structured JSON import and export.
//
// Import is a two-step process: `planImport` works out exactly what a
// document would create, update or dispute without changing anything, and
// `applyImportPlan` turns that plan into a ChangeSet. The rules that keep
// history safe live here:
//
//  • A confirmed fact is never overwritten by an import. A different value
//    becomes an open conflict for an editor to review instead.
//  • Other records only change when the incoming source is at least as
//    trustworthy (confirmed > provisional > proposed > conflicting > superseded).
//  • An empty value in a document never erases something already recorded.
//  • A production that matches an existing title + format + year is reported
//    as a duplicate instead of being created twice.

import { addUpsert, emptyChangeSet } from "./changes";
import { todayISO } from "./dates";
import { isUuid, newId, slugify } from "./ids";
import { ENTITY_LABEL, PROVENANCE_RANK } from "./labels";
import { checkIntegrity, describeRow, findRow } from "./mutations";
import { NATURAL_KEYS, REFERENCE_FIELDS, SLUGGED, fieldErrors, schemas } from "./schemas";
import {
  ENTITY_TABLE,
  PROVENANCE_STATUSES,
  SOURCE_DOCUMENT_KINDS,
  TABLE_ORDER,
  type ArchiveTables,
  type ChangeSet,
  type EntityType,
  type Production,
  type Provenance,
  type SourceDocumentKind,
  type TableName,
} from "./types";

export const ARCHIVE_FORMAT = "lumine-archive";
export const ARCHIVE_FORMAT_VERSION = 1;

export interface ImportSource {
  title: string;
  kind: SourceDocumentKind;
  reference: string | null;
  received_at: string;
  description: string | null;
  /** Provenance applied to rows that don't state their own. */
  provenance: Provenance;
}

export interface ArchiveDocument {
  format: typeof ARCHIVE_FORMAT;
  version: number;
  exported_at?: string;
  source?: Partial<ImportSource>;
  tables: Partial<Record<TableName, unknown[]>>;
}

export interface PlannedChange {
  entity: EntityType;
  id: string;
  label: string;
  action: "create" | "update";
  provenance: Provenance;
  fields: { field: string; from: unknown; to: unknown }[];
  row: Record<string, unknown>;
}

export interface PlannedConflict {
  entity: EntityType;
  id: string;
  label: string;
  field: string;
  current: unknown;
  proposed: unknown;
  current_provenance: Provenance;
  proposed_provenance: Provenance;
  reason: string;
}

export interface ImportPlan {
  source: ImportSource;
  creates: PlannedChange[];
  updates: PlannedChange[];
  conflicts: PlannedConflict[];
  duplicates: { entity: EntityType; label: string; reason: string }[];
  errors: { entity: EntityType | null; label: string; message: string }[];
  notes: string[];
  unchanged: number;
}

const TABLE_ENTITY = Object.fromEntries(Object.entries(ENTITY_TABLE).map(([entity, table]) => [table, entity])) as Partial<Record<TableName, EntityType>>;
const AUDIT_TABLES: TableName[] = ["revisions", "record_conflicts"];

/** Every column (with its empty default) for each entity, used to complete partial rows. */
const DEFAULTS: Record<EntityType, Record<string, unknown>> = {
  source_document: { description: null, reference: null, kind: "production_document" },
  franchise: { name_native: null, description: null },
  studio: { name_native: null, founded_year: null, location: null, founders: [], animation_style: null, description: null },
  person: { name_native: null, aliases: [], occupations: [], bio: null },
  company: { name_native: null, kind: "production", country: null, description: null },
  production: {
    franchise_id: null,
    franchise_order: null,
    season_number: null,
    title_native: null,
    title_romaji: null,
    alt_titles: [],
    synopsis: null,
    genres: [],
    themes: [],
    source_material: null,
    demographic: null,
    age_rating: null,
    premiere_year: null,
    premiere_season: null,
    premiere_date: null,
    finale_date: null,
    episode_count: null,
    runtime_minutes: null,
    production_history: null,
    reception: null,
    score: null,
    poster_url: null,
    notes: null,
  },
  production_studio: { role: "animation" },
  production_company: { region: null },
  broadcast_run: {
    label: null,
    language: "ja",
    region: null,
    network_id: null,
    start_date: null,
    end_date: null,
    weekday: null,
    local_time: null,
    time_zone: null,
    cadence: "weekly",
    episode_count: null,
    skipped_dates: [],
    is_primary: false,
    notes: null,
  },
  episode: { title: null, title_native: null, synopsis: null, runtime_minutes: null },
  episode_release: { air_time: null, notes: null },
  production_credit: { role_detail: null, sort_order: 0 },
  voice_credit: { character_name_native: null, language: "ja", credit_type: "voice", billing: null, notes: null },
  music_track: { title_native: null, kind: "song", release_date: null, release_year: null, label_id: null, catalog_number: null, notes: null },
  track_credit: { credited_as: null },
  theme_song: { sequence: null, episodes: null },
  related_media: { notes: null },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export class ImportFormatError extends Error {}

/** Accepts a full export, `{ tables: … }`, or a bare `{ productions: [...] }` object. */
export function parseArchiveDocument(input: unknown, fallbackTitle = "Structured JSON import"): { tables: Partial<Record<TableName, unknown[]>>; source: ImportSource } {
  if (!isRecord(input)) throw new ImportFormatError("The file must contain a JSON object.");
  if (input.format !== undefined && input.format !== ARCHIVE_FORMAT) {
    throw new ImportFormatError(`Expected format “${ARCHIVE_FORMAT}”, found “${String(input.format)}”.`);
  }
  if (typeof input.version === "number" && input.version > ARCHIVE_FORMAT_VERSION) {
    throw new ImportFormatError(`This file uses format version ${input.version}; this archive understands version ${ARCHIVE_FORMAT_VERSION}.`);
  }
  const rawTables = isRecord(input.tables) ? input.tables : input;
  const tables: Partial<Record<TableName, unknown[]>> = {};
  for (const [key, value] of Object.entries(rawTables)) {
    if (["format", "version", "exported_at", "source", "notes"].includes(key)) continue;
    if (!(TABLE_ORDER as string[]).includes(key)) throw new ImportFormatError(`Unknown table “${key}”.`);
    if (!Array.isArray(value)) throw new ImportFormatError(`“${key}” must be a list of records.`);
    tables[key as TableName] = value;
  }
  if (Object.keys(tables).length === 0) throw new ImportFormatError("The document doesn't contain any tables to import.");

  const src = isRecord(input.source) ? input.source : {};
  const kind = SOURCE_DOCUMENT_KINDS.includes(src.kind as SourceDocumentKind) ? (src.kind as SourceDocumentKind) : "import";
  const provenance = PROVENANCE_STATUSES.includes(src.provenance as Provenance) ? (src.provenance as Provenance) : "provisional";
  return {
    tables,
    source: {
      title: typeof src.title === "string" && src.title.trim() ? src.title.trim() : fallbackTitle,
      kind,
      reference: typeof src.reference === "string" ? src.reference : null,
      received_at: typeof src.received_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(src.received_at) ? src.received_at : todayISO(),
      description: typeof src.description === "string" ? src.description : null,
      provenance,
    },
  };
}

/** Resolve a reference given as a UUID, a slug, `production-slug#3` (episode) or `production-slug#kind[#language]` (run). */
function resolveReference(working: ArchiveTables, target: EntityType, value: unknown): string | null | undefined {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return undefined;
  if (isUuid(value) && findRow(working, target, value)) return value;
  if (SLUGGED.includes(target)) {
    const row = (working[ENTITY_TABLE[target]] as unknown as { id: string; slug: string }[]).find((r) => r.slug === value);
    return row?.id;
  }
  const [slug, ...rest] = value.split("#");
  const production = working.productions.find((p) => p.slug === slug);
  if (!production) return undefined;
  if (target === "episode") {
    const number = Number(rest[0]);
    return working.episodes.find((e) => e.production_id === production.id && e.number === number)?.id;
  }
  if (target === "broadcast_run") {
    const [kind, language] = rest;
    return working.broadcast_runs.find((r) => r.production_id === production.id && r.kind === kind && (!language || r.language === language))?.id;
  }
  return undefined;
}

function findMatch(working: ArchiveTables, entity: EntityType, row: Record<string, unknown>): Record<string, unknown> | undefined {
  const list = working[ENTITY_TABLE[entity]] as unknown as Record<string, unknown>[];
  if (typeof row.id === "string" && isUuid(row.id)) {
    const byId = list.find((r) => r.id === row.id);
    if (byId) return byId;
  }
  if (SLUGGED.includes(entity) && typeof row.slug === "string") {
    const bySlug = list.find((r) => r.slug === row.slug);
    if (bySlug) return bySlug;
  }
  const key = NATURAL_KEYS[entity];
  if (key) return list.find((r) => key.every((k) => same(r[k], row[k] ?? DEFAULTS[entity][k])));
  return undefined;
}

function upsertWorking(working: ArchiveTables, entity: EntityType, row: Record<string, unknown>) {
  const list = working[ENTITY_TABLE[entity]] as unknown as Record<string, unknown>[];
  const i = list.findIndex((r) => r.id === row.id);
  if (i >= 0) list[i] = row;
  else list.push(row);
}

export function planImport(tables: ArchiveTables, input: unknown, now = new Date().toISOString()): ImportPlan {
  const { tables: incoming, source } = parseArchiveDocument(input);
  const working = structuredClone(tables);
  const plan: ImportPlan = { source, creates: [], updates: [], conflicts: [], duplicates: [], errors: [], notes: [], unchanged: 0 };

  for (const table of AUDIT_TABLES) {
    const count = incoming[table]?.length ?? 0;
    if (count) plan.notes.push(`Skipped ${count} ${table.replace("_", " ")} row${count === 1 ? "" : "s"} — audit history stays with the archive it was recorded in.`);
  }
  if (incoming.fact_sources?.length) {
    plan.notes.push(`Skipped ${incoming.fact_sources.length} fact source row(s); this import is cited as the source of the facts it adds.`);
  }

  for (const table of TABLE_ORDER) {
    const entity = TABLE_ENTITY[table];
    const rows = incoming[table];
    if (!entity || !rows) continue;

    rows.forEach((raw, position) => {
      const label0 = `${ENTITY_LABEL[entity]} #${position + 1}`;
      if (!isRecord(raw)) {
        plan.errors.push({ entity, label: label0, message: "Each record must be a JSON object." });
        return;
      }
      const input: Record<string, unknown> = { ...raw };

      // Resolve slug-style references.
      for (const [field, target] of Object.entries(REFERENCE_FIELDS[entity] ?? {})) {
        if (!(field in input)) continue;
        const resolved = resolveReference(working, target, input[field]);
        if (resolved === undefined) {
          plan.errors.push({ entity, label: describeRow(working, entity, input) || label0, message: `${field}: no ${ENTITY_LABEL[target].toLowerCase()} matches “${String(input[field])}”.` });
          return;
        }
        input[field] = resolved;
      }
      if (SLUGGED.includes(entity) && typeof input.slug !== "string") {
        const basis = (input.title ?? input.name) as string | undefined;
        if (basis) input.slug = slugify(basis);
      }

      const incomingProvenance: Provenance = PROVENANCE_STATUSES.includes(input.provenance as Provenance) ? (input.provenance as Provenance) : source.provenance;
      const existing = findMatch(working, entity, input);
      const label = describeRow(working, entity, { ...existing, ...input });

      const presentFields = Object.keys(input).filter((k) => !["id", "created_at", "updated_at", "provenance"].includes(k));

      if (!existing) {
        const candidate = { ...DEFAULTS[entity], ...input, provenance: incomingProvenance };
        const { id: _id, created_at: _c, updated_at: _u, ...data } = candidate as Record<string, unknown>;
        void _id;
        void _c;
        void _u;
        const parsed = schemas[entity].safeParse(data);
        if (!parsed.success) {
          plan.errors.push({ entity, label, message: Object.entries(fieldErrors(parsed.error)).map(([f, m]) => `${f}: ${m}`).join("; ") });
          return;
        }
        const id = typeof input.id === "string" && isUuid(input.id) ? input.id : newId();
        const row = { id, ...(parsed.data as Record<string, unknown>), created_at: now, updated_at: now };
        const integrity = checkIntegrity(working, entity, row);
        if (integrity.title && entity === "production") {
          plan.duplicates.push({ entity, label, reason: integrity.title });
          return;
        }
        if (Object.keys(integrity).length) {
          plan.errors.push({ entity, label, message: Object.values(integrity).join(" ") });
          return;
        }
        upsertWorking(working, entity, row);
        plan.creates.push({
          entity,
          id,
          label,
          action: "create",
          provenance: incomingProvenance,
          fields: presentFields.map((f) => ({ field: f, from: null, to: row[f as keyof typeof row] })),
          row,
        });
        return;
      }

      // Existing record: compare field by field.
      const merged: Record<string, unknown> = { ...existing };
      for (const field of presentFields) {
        if (!isEmpty(input[field])) merged[field] = input[field];
      }
      const { id: _id, created_at: _c, updated_at: _u, ...data } = merged;
      void _id;
      void _c;
      void _u;
      const parsed = schemas[entity].safeParse(data);
      if (!parsed.success) {
        plan.errors.push({ entity, label, message: Object.entries(fieldErrors(parsed.error)).map(([f, m]) => `${f}: ${m}`).join("; ") });
        return;
      }
      const normalized = parsed.data as Record<string, unknown>;
      const currentProvenance = existing.provenance as Provenance;
      const applied: PlannedChange["fields"] = [];
      const next: Record<string, unknown> = { ...existing };

      for (const field of presentFields) {
        if (isEmpty(input[field])) continue;
        const to = normalized[field];
        const from = existing[field];
        if (same(from, to)) continue;
        const reviewed = tables.record_conflicts.find(
          (c) => c.entity_type === entity && c.entity_id === existing.id && c.field === field && same(c.proposed_value, to) && c.status !== "accepted",
        );
        if (reviewed) {
          plan.notes.push(
            `${label} · ${field}: this value was ${reviewed.status === "open" ? "already sent to conflict review" : "reviewed before and the record was kept"}, so it isn't raised again.`,
          );
          continue;
        }
        if (currentProvenance === "confirmed") {
          plan.conflicts.push({
            entity,
            id: existing.id as string,
            label,
            field,
            current: from,
            proposed: to,
            current_provenance: currentProvenance,
            proposed_provenance: incomingProvenance,
            reason: "The archive already holds a confirmed value for this field.",
          });
        } else if (PROVENANCE_RANK[incomingProvenance] < PROVENANCE_RANK[currentProvenance]) {
          plan.conflicts.push({
            entity,
            id: existing.id as string,
            label,
            field,
            current: from,
            proposed: to,
            current_provenance: currentProvenance,
            proposed_provenance: incomingProvenance,
            reason: `The incoming source is ${incomingProvenance}, which ranks below the ${currentProvenance} value on record.`,
          });
        } else {
          next[field] = to;
          applied.push({ field, from, to });
        }
      }

      // A more trustworthy source can promote a record (e.g. Proposed → Confirmed); it never demotes one.
      if (currentProvenance !== "confirmed" && PROVENANCE_RANK[incomingProvenance] > PROVENANCE_RANK[currentProvenance]) {
        next.provenance = incomingProvenance;
        applied.push({ field: "provenance", from: currentProvenance, to: incomingProvenance });
      }

      if (applied.length === 0) {
        if (!plan.conflicts.some((c) => c.id === existing.id && c.entity === entity)) plan.unchanged += 1;
        return;
      }
      next.updated_at = now;
      const integrity = checkIntegrity(working, entity, next);
      if (Object.keys(integrity).length) {
        plan.errors.push({ entity, label, message: Object.values(integrity).join(" ") });
        return;
      }
      upsertWorking(working, entity, next);
      plan.updates.push({ entity, id: existing.id as string, label, action: "update", provenance: next.provenance as Provenance, fields: applied, row: next });
    });
  }

  return plan;
}

export function importHasWork(plan: ImportPlan): boolean {
  return plan.creates.length + plan.updates.length + plan.conflicts.length > 0;
}

/** Turn a plan into a ChangeSet: the source document, the rows, their revisions, citations and conflicts. */
export function applyImportPlan(tables: ArchiveTables, plan: ImportPlan, author: string | null, now = new Date().toISOString()): { changes: ChangeSet; sourceDocumentId: string } {
  const changes = emptyChangeSet();
  const batchId = newId();

  let slug = slugify(`${plan.source.title}-${plan.source.received_at}`) || `import-${plan.source.received_at}`;
  const taken = new Set(tables.source_documents.map((d) => d.slug));
  for (let n = 2; taken.has(slug); n++) slug = `${slugify(`${plan.source.title}-${plan.source.received_at}`)}-${n}`;

  const sourceDocumentId = newId();
  addUpsert(changes, "source_documents", {
    id: sourceDocumentId,
    slug,
    title: plan.source.title,
    kind: plan.source.kind,
    description: plan.source.description,
    reference: plan.source.reference,
    received_at: plan.source.received_at,
    provenance: "confirmed",
    created_at: now,
    updated_at: now,
  });

  for (const item of [...plan.creates, ...plan.updates]) {
    const table = ENTITY_TABLE[item.entity];
    addUpsert(changes, table, item.row as never);
    const before = item.action === "update" ? (findRow(tables, item.entity, item.id) ?? null) : null;
    addUpsert(changes, "revisions", {
      id: newId(),
      batch_id: batchId,
      entity_type: item.entity,
      entity_id: item.id,
      action: "import",
      summary: `${item.action === "create" ? "Imported" : "Updated"} ${item.label} from “${plan.source.title}”`,
      before: before as Record<string, unknown> | null,
      after: item.row,
      changed_fields: item.fields.map((f) => f.field),
      author,
      source_document_id: sourceDocumentId,
      created_at: now,
    });
    const fields = SLUGGED.includes(item.entity) ? item.fields.map((f) => f.field) : [null];
    for (const field of fields) {
      addUpsert(changes, "fact_sources", {
        id: newId(),
        entity_type: item.entity,
        entity_id: item.id,
        field,
        source_document_id: sourceDocumentId,
        note: null,
        created_at: now,
      });
    }
  }

  for (const conflict of plan.conflicts) {
    addUpsert(changes, "record_conflicts", {
      id: newId(),
      entity_type: conflict.entity,
      entity_id: conflict.id,
      field: conflict.field,
      current_value: conflict.current ?? null,
      proposed_value: conflict.proposed ?? null,
      current_provenance: conflict.current_provenance,
      proposed_provenance: "conflicting",
      source_document_id: sourceDocumentId,
      status: "open",
      note: conflict.reason,
      created_at: now,
      resolved_at: null,
      resolved_by: null,
    });
  }

  return { changes, sourceDocumentId };
}

// ── Export ─────────────────────────────────────────────────────────────────

export function exportArchive(tables: ArchiveTables, options: { includeAudit?: boolean; title?: string } = {}): ArchiveDocument {
  const include = options.includeAudit ?? true;
  const out: Partial<Record<TableName, unknown[]>> = {};
  for (const table of TABLE_ORDER) {
    if (!include && (AUDIT_TABLES.includes(table) || table === "fact_sources")) continue;
    out[table] = tables[table];
  }
  return {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    source: { title: options.title ?? "Lumine StarWorks Anime Industry Archive export", kind: "import" },
    tables: out,
  };
}

/** One production with everything it references, ready to hand to another archive. */
export function exportProduction(tables: ArchiveTables, productionId: string): ArchiveDocument | null {
  const production = tables.productions.find((p) => p.id === productionId);
  if (!production) return null;
  const pick = <T extends { production_id: string }>(rows: T[]) => rows.filter((r) => r.production_id === productionId);

  const studios = pick(tables.production_studios);
  const companies = pick(tables.production_companies);
  const runs = pick(tables.broadcast_runs);
  const episodes = pick(tables.episodes);
  const credits = pick(tables.production_credits);
  const cast = pick(tables.voice_credits);
  const themes = pick(tables.theme_songs);
  const related = tables.related_media.filter((r) => r.production_id === productionId || r.related_production_id === productionId);
  const trackIds = new Set(themes.map((t) => t.track_id));
  const trackCredits = tables.track_credits.filter((c) => trackIds.has(c.track_id));
  const peopleIds = new Set([...credits.map((c) => c.person_id), ...cast.map((c) => c.person_id), ...trackCredits.map((c) => c.person_id)]);
  const companyIds = new Set([
    ...companies.map((c) => c.company_id),
    ...runs.map((r) => r.network_id).filter((id): id is string => !!id),
    ...tables.music_tracks.filter((t) => trackIds.has(t.id)).map((t) => t.label_id).filter((id): id is string => !!id),
  ]);
  const relatedIds = new Set(related.flatMap((r) => [r.production_id, r.related_production_id]));
  const runIds = new Set(runs.map((r) => r.id));
  const factIds = new Set<string>([productionId, ...runs.map((r) => r.id), ...credits.map((c) => c.id)]);

  return {
    format: ARCHIVE_FORMAT,
    version: ARCHIVE_FORMAT_VERSION,
    exported_at: new Date().toISOString(),
    source: { title: `${production.title} — archive export`, kind: "import" },
    tables: {
      source_documents: tables.source_documents.filter((d) => tables.fact_sources.some((f) => factIds.has(f.entity_id) && f.source_document_id === d.id)),
      franchises: tables.franchises.filter((f) => f.id === production.franchise_id),
      studios: tables.studios.filter((s) => studios.some((l) => l.studio_id === s.id)),
      people: tables.people.filter((p) => peopleIds.has(p.id)),
      companies: tables.companies.filter((c) => companyIds.has(c.id)),
      productions: tables.productions.filter((p) => relatedIds.has(p.id) || p.id === productionId) as Production[],
      production_studios: studios,
      production_companies: companies,
      broadcast_runs: runs,
      episodes,
      episode_releases: tables.episode_releases.filter((r) => runIds.has(r.broadcast_run_id)),
      production_credits: credits,
      voice_credits: cast,
      music_tracks: tables.music_tracks.filter((t) => trackIds.has(t.id)),
      track_credits: trackCredits,
      theme_songs: themes,
      related_media: related,
      fact_sources: tables.fact_sources.filter((f) => factIds.has(f.entity_id)),
      revisions: tables.revisions.filter((r) => r.entity_id === productionId),
    },
  };
}
