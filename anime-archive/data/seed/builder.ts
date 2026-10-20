// A small helper for writing seed data by hand.
//
// It hands out stable ids, de-duplicates shared records (people, studios,
// companies, tracks) by slug, keeps people's occupations in sync with their
// credits, and records which source document established each fact.

import { stableId, slugify } from "../../lib/archive/ids";
import { ROLE_OCCUPATION } from "../../lib/archive/labels";
import {
  emptyTables,
  type ArchiveTables,
  type BroadcastRun,
  type CastBilling,
  type CastCreditType,
  type CastLanguage,
  type Company,
  type CompanyKind,
  type CompanyRole,
  type CreditRole,
  type EntityType,
  type Franchise,
  type Occupation,
  type Production,
  type Provenance,
  type Relation,
  type SourceDocument,
  type Studio,
  type StudioRole,
  type ThemeUsage,
  type TrackCreditRole,
  type TrackKind,
} from "../../lib/archive/types";

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Drop `undefined` values so they never overwrite a default. */
function definedOnly<T extends object>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export class SeedBuilder {
  readonly tables: ArchiveTables = emptyTables();
  private readonly stamp: string;

  constructor(
    private readonly provenance: Provenance,
    private readonly sourceId: string | null,
    timestamp = "2026-10-20T00:00:00.000Z",
  ) {
    this.stamp = timestamp;
  }

  private meta(table: string, key: string) {
    return {
      id: stableId(table, key),
      provenance: this.provenance,
      created_at: this.stamp,
      updated_at: this.stamp,
    };
  }

  /** Record that `fields` of an entity came from this builder's source document. */
  cite(entity_type: EntityType, entity_id: string, fields: (string | null)[] = [null]) {
    if (!this.sourceId) return;
    for (const field of fields) {
      this.tables.fact_sources.push({
        id: stableId("fact_sources", `${entity_type}:${entity_id}:${field ?? "*"}:${this.sourceId}`),
        entity_type,
        entity_id,
        field,
        source_document_id: this.sourceId,
        note: null,
        created_at: this.stamp,
      });
    }
  }

  sourceDocument(doc: Optional<Omit<SourceDocument, "id" | "provenance" | "created_at" | "updated_at">, "description" | "reference">) {
    const row: SourceDocument = {
      ...this.meta("source_documents", doc.slug),
      description: null,
      reference: null,
      ...doc,
      provenance: "confirmed",
    };
    this.tables.source_documents.push(row);
    return row.id;
  }

  franchise(input: Optional<Pick<Franchise, "name" | "slug" | "name_native" | "description">, "slug" | "name_native" | "description">) {
    const slug = input.slug ?? slugify(input.name);
    const row: Franchise = {
      ...this.meta("franchises", slug),
      slug,
      name: input.name,
      name_native: input.name_native ?? null,
      description: input.description ?? null,
    };
    this.tables.franchises.push(row);
    this.cite("franchise", row.id, ["name"]);
    return row.id;
  }

  studio(input: Partial<Omit<Studio, "id" | "provenance" | "created_at" | "updated_at">> & { name: string }) {
    const slug = input.slug ?? slugify(input.name);
    const existing = this.tables.studios.find((s) => s.slug === slug);
    if (existing) return existing.id;
    const row: Studio = {
      ...this.meta("studios", slug),
      slug,
      name: input.name,
      name_native: input.name_native ?? null,
      founded_year: input.founded_year ?? null,
      location: input.location ?? null,
      founders: input.founders ?? [],
      animation_style: input.animation_style ?? null,
      description: input.description ?? null,
    };
    this.tables.studios.push(row);
    this.cite("studio", row.id, ["name"]);
    return row.id;
  }

  person(name: string, extra: { name_native?: string; aliases?: string[]; bio?: string; occupations?: Occupation[] } = {}) {
    const slug = slugify(name);
    const existing = this.tables.people.find((p) => p.slug === slug);
    if (existing) {
      for (const o of extra.occupations ?? []) if (!existing.occupations.includes(o)) existing.occupations.push(o);
      if (extra.name_native && !existing.name_native) existing.name_native = extra.name_native;
      return existing.id;
    }
    const row = {
      ...this.meta("people", slug),
      slug,
      name,
      name_native: extra.name_native ?? null,
      aliases: extra.aliases ?? [],
      occupations: [...(extra.occupations ?? [])],
      bio: extra.bio ?? null,
    };
    this.tables.people.push(row);
    this.cite("person", row.id, ["name"]);
    return row.id;
  }

  private addOccupation(personId: string, occupation: Occupation | undefined) {
    if (!occupation) return;
    const person = this.tables.people.find((p) => p.id === personId);
    if (person && !person.occupations.includes(occupation)) person.occupations.push(occupation);
  }

  company(name: string, kind: CompanyKind, extra: Partial<Pick<Company, "name_native" | "country" | "description">> = {}) {
    const slug = slugify(name);
    const existing = this.tables.companies.find((c) => c.slug === slug);
    if (existing) return existing.id;
    const row: Company = {
      ...this.meta("companies", slug),
      slug,
      name,
      kind,
      name_native: extra.name_native ?? null,
      country: extra.country ?? null,
      description: extra.description ?? null,
    };
    this.tables.companies.push(row);
    this.cite("company", row.id, ["name"]);
    return row.id;
  }

  production(input: Partial<Omit<Production, "id" | "provenance" | "created_at" | "updated_at">> & Pick<Production, "title" | "format">) {
    const slug = input.slug ?? slugify(input.title);
    const row: Production = {
      ...this.meta("productions", slug),
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
      ...definedOnly(input),
      slug,
      title: input.title,
      format: input.format,
    };
    this.tables.productions.push(row);
    return row;
  }

  studioLink(production: Production, studioId: string, role: StudioRole = "animation") {
    const row = { ...this.meta("production_studios", `${production.slug}:${studioId}:${role}`), production_id: production.id, studio_id: studioId, role };
    this.tables.production_studios.push(row);
    this.cite("production_studio", row.id);
    return row.id;
  }

  companyLink(production: Production, companyId: string, role: CompanyRole, region: string | null = null) {
    const row = {
      ...this.meta("production_companies", `${production.slug}:${companyId}:${role}`),
      production_id: production.id,
      company_id: companyId,
      role,
      region,
    };
    this.tables.production_companies.push(row);
    this.cite("production_company", row.id);
    return row.id;
  }

  run(production: Production, key: string, input: Partial<Omit<BroadcastRun, "id" | "production_id" | "provenance" | "created_at" | "updated_at">> & Pick<BroadcastRun, "kind">) {
    const row: BroadcastRun = {
      ...this.meta("broadcast_runs", `${production.slug}:${key}`),
      production_id: production.id,
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
      ...definedOnly(input),
      kind: input.kind,
    };
    this.tables.broadcast_runs.push(row);
    return row;
  }

  credit(production: Production, personId: string, role: CreditRole, extra: { role_detail?: string; sort_order?: number } = {}) {
    const row = {
      ...this.meta("production_credits", `${production.slug}:${personId}:${role}`),
      production_id: production.id,
      person_id: personId,
      role,
      role_detail: extra.role_detail ?? null,
      sort_order: extra.sort_order ?? this.tables.production_credits.filter((c) => c.production_id === production.id && c.role === role).length,
    };
    this.tables.production_credits.push(row);
    this.addOccupation(personId, ROLE_OCCUPATION[role]);
    this.cite("production_credit", row.id);
    return row.id;
  }

  cast(
    production: Production,
    personId: string,
    character: string,
    extra: { native?: string; language?: CastLanguage | null; type?: CastCreditType; billing?: CastBilling | null; notes?: string } = {},
  ) {
    const language = extra.language === undefined ? "ja" : extra.language;
    const row = {
      ...this.meta("voice_credits", `${production.slug}:${personId}:${character}:${language ?? "none"}`),
      production_id: production.id,
      person_id: personId,
      character_name: character,
      character_name_native: extra.native ?? null,
      language,
      credit_type: extra.type ?? "voice",
      billing: extra.billing === undefined ? "main" : extra.billing,
      notes: extra.notes ?? null,
    };
    this.tables.voice_credits.push(row);
    this.addOccupation(personId, extra.type === "appearance" ? undefined : "voice_actor");
    this.cite("voice_credit", row.id);
    return row.id;
  }

  track(title: string, input: { slug?: string; title_native?: string; kind?: TrackKind; release_date?: string; release_year?: number; label_id?: string; notes?: string } = {}) {
    const slug = input.slug ?? slugify(title);
    const existing = this.tables.music_tracks.find((t) => t.slug === slug);
    if (existing) return existing.id;
    const row = {
      ...this.meta("music_tracks", slug),
      slug,
      title,
      title_native: input.title_native ?? null,
      kind: input.kind ?? "song",
      release_date: input.release_date ?? null,
      release_year: input.release_year ?? (input.release_date ? Number(input.release_date.slice(0, 4)) : null),
      label_id: input.label_id ?? null,
      catalog_number: null,
      notes: input.notes ?? null,
    };
    this.tables.music_tracks.push(row);
    this.cite("music_track", row.id, ["title"]);
    return row.id;
  }

  trackCredit(trackId: string, personId: string, role: TrackCreditRole, credited_as: string | null = null) {
    const row = { ...this.meta("track_credits", `${trackId}:${personId}:${role}`), track_id: trackId, person_id: personId, role, credited_as };
    this.tables.track_credits.push(row);
    this.addOccupation(personId, role === "performer" ? "singer" : role === "composer" ? "composer" : undefined);
    this.cite("track_credit", row.id);
    return row.id;
  }

  theme(production: Production, trackId: string, usage: ThemeUsage, extra: { sequence?: number; episodes?: string } = {}) {
    const row = {
      ...this.meta("theme_songs", `${production.slug}:${trackId}:${usage}`),
      production_id: production.id,
      track_id: trackId,
      usage,
      sequence: extra.sequence ?? null,
      episodes: extra.episodes ?? null,
    };
    this.tables.theme_songs.push(row);
    this.cite("theme_song", row.id);
    return row.id;
  }

  relate(production: Production, related: Production, relation: Relation, notes: string | null = null) {
    const row = {
      ...this.meta("related_media", `${production.slug}:${related.slug}:${relation}`),
      production_id: production.id,
      related_production_id: related.id,
      relation,
      notes,
    };
    this.tables.related_media.push(row);
    this.cite("related_media", row.id);
    return row.id;
  }
}

/** Merge several builders' tables. Later builders never replace earlier rows with the same id. */
export function mergeTables(...parts: ArchiveTables[]): ArchiveTables {
  const merged = emptyTables();
  for (const part of parts) {
    for (const table of Object.keys(merged) as (keyof ArchiveTables)[]) {
      const target = merged[table] as { id: string }[];
      const seen = new Set(target.map((r) => r.id));
      for (const row of part[table] as { id: string }[]) {
        if (!seen.has(row.id)) {
          target.push(row);
          seen.add(row.id);
        }
      }
    }
  }
  return merged;
}
