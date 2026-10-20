// Domain types for the Lumine StarWorks Anime Industry Archive.
//
// Every interface here mirrors a table in supabase/migrations. Field names use
// snake_case so rows can move between Postgres, the local JSON store and the
// import/export format without any mapping layer.

export const PROVENANCE_STATUSES = [
  "confirmed",
  "provisional",
  "proposed",
  "conflicting",
  "superseded",
] as const;
export type Provenance = (typeof PROVENANCE_STATUSES)[number];

export const SEASONS = ["winter", "spring", "summer", "fall"] as const;
export type SeasonName = (typeof SEASONS)[number];

export const PRODUCTION_FORMATS = [
  "tv",
  "tv_special",
  "film",
  "ova",
  "ona",
  "special",
  "music_video",
] as const;
export type ProductionFormat = (typeof PRODUCTION_FORMATS)[number];

export const SOURCE_MATERIALS = [
  "original",
  "manga",
  "web_manga",
  "light_novel",
  "novel",
  "visual_novel",
  "game",
  "music",
  "other",
] as const;
export type SourceMaterial = (typeof SOURCE_MATERIALS)[number];

export const DEMOGRAPHICS = ["shounen", "shoujo", "seinen", "josei", "kids", "general"] as const;
export type Demographic = (typeof DEMOGRAPHICS)[number];

export const AGE_RATINGS = ["G", "PG", "PG-13", "R-15+", "R-17+"] as const;
export type AgeRating = (typeof AGE_RATINGS)[number];

export const BROADCAST_KINDS = [
  "tv",
  "advance",
  "streaming",
  "special_broadcast",
  "dub",
  "theatrical",
  "home_video",
] as const;
export type BroadcastKind = (typeof BROADCAST_KINDS)[number];

export const BROADCAST_CADENCES = ["weekly", "daily", "single", "irregular"] as const;
export type BroadcastCadence = (typeof BROADCAST_CADENCES)[number];

export const STUDIO_ROLES = ["animation", "co_animation", "assistance"] as const;
export type StudioRole = (typeof STUDIO_ROLES)[number];

export const COMPANY_KINDS = [
  "production",
  "broadcaster",
  "licensor",
  "distributor",
  "streaming",
  "music_label",
  "other",
] as const;
export type CompanyKind = (typeof COMPANY_KINDS)[number];

export const COMPANY_ROLES = [
  "production_committee",
  "producer",
  "licensor",
  "distributor",
  "streaming",
  "music",
] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const CREDIT_ROLES = [
  "original_creator",
  "director",
  "assistant_director",
  "series_composition",
  "screenplay",
  "storyboard",
  "character_design",
  "chief_animation_director",
  "animation_director",
  "action_choreographer",
  "mecha_design",
  "art_director",
  "color_design",
  "director_of_photography",
  "cg_director",
  "editing",
  "sound_director",
  "music",
  "producer",
  "animation_producer",
  "other",
] as const;
export type CreditRole = (typeof CREDIT_ROLES)[number];

export const OCCUPATIONS = [
  "director",
  "writer",
  "composer",
  "animator",
  "character_designer",
  "art_director",
  "voice_actor",
  "singer",
  "producer",
  "sound_director",
  "other",
] as const;
export type Occupation = (typeof OCCUPATIONS)[number];

export const CAST_LANGUAGES = ["ja", "en"] as const;
export type CastLanguage = (typeof CAST_LANGUAGES)[number];

export const CAST_CREDIT_TYPES = ["voice", "singing_voice", "appearance"] as const;
export type CastCreditType = (typeof CAST_CREDIT_TYPES)[number];

export const CAST_BILLINGS = ["main", "supporting", "guest"] as const;
export type CastBilling = (typeof CAST_BILLINGS)[number];

export const TRACK_KINDS = ["song", "score", "single", "album", "soundtrack"] as const;
export type TrackKind = (typeof TRACK_KINDS)[number];

export const TRACK_CREDIT_ROLES = ["performer", "composer", "lyricist", "arranger"] as const;
export type TrackCreditRole = (typeof TRACK_CREDIT_ROLES)[number];

export const THEME_USAGES = ["opening", "ending", "insert", "soundtrack", "image_song"] as const;
export type ThemeUsage = (typeof THEME_USAGES)[number];

export const RELATIONS = [
  "sequel",
  "prequel",
  "side_story",
  "special",
  "film",
  "ova",
  "spin_off",
  "compilation",
  "alternative",
  "parent_story",
] as const;
export type Relation = (typeof RELATIONS)[number];

export const SOURCE_DOCUMENT_KINDS = [
  "brief",
  "production_document",
  "press_release",
  "import",
  "editorial",
] as const;
export type SourceDocumentKind = (typeof SOURCE_DOCUMENT_KINDS)[number];

export const REVISION_ACTIONS = ["create", "update", "delete", "restore", "import", "resolve"] as const;
export type RevisionAction = (typeof REVISION_ACTIONS)[number];

export const CONFLICT_STATUSES = ["open", "accepted", "rejected"] as const;
export type ConflictStatus = (typeof CONFLICT_STATUSES)[number];

/** ISO calendar date, `YYYY-MM-DD`. Dates are civil dates in the broadcast's own time zone. */
export type ISODate = string;
/** ISO timestamp, e.g. `2026-10-20T12:00:00.000Z`. */
export type ISOTimestamp = string;

interface RecordBase {
  id: string;
  provenance: Provenance;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
}

export interface Franchise extends RecordBase {
  slug: string;
  name: string;
  name_native: string | null;
  description: string | null;
}

export interface Studio extends RecordBase {
  slug: string;
  name: string;
  name_native: string | null;
  founded_year: number | null;
  location: string | null;
  founders: string[];
  animation_style: string | null;
  description: string | null;
}

export interface Person extends RecordBase {
  slug: string;
  name: string;
  name_native: string | null;
  aliases: string[];
  occupations: Occupation[];
  bio: string | null;
}

export interface Company extends RecordBase {
  slug: string;
  name: string;
  name_native: string | null;
  kind: CompanyKind;
  country: string | null;
  description: string | null;
}

export interface Production extends RecordBase {
  slug: string;
  franchise_id: string | null;
  franchise_order: number | null;
  season_number: number | null;
  title: string;
  title_native: string | null;
  title_romaji: string | null;
  alt_titles: string[];
  format: ProductionFormat;
  synopsis: string | null;
  genres: string[];
  themes: string[];
  source_material: SourceMaterial | null;
  demographic: Demographic | null;
  age_rating: AgeRating | null;
  premiere_year: number | null;
  premiere_season: SeasonName | null;
  premiere_date: ISODate | null;
  finale_date: ISODate | null;
  episode_count: number | null;
  runtime_minutes: number | null;
  production_history: string | null;
  reception: string | null;
  score: number | null;
  poster_url: string | null;
  notes: string | null;
}

export interface ProductionStudio extends RecordBase {
  production_id: string;
  studio_id: string;
  role: StudioRole;
}

export interface ProductionCompany extends RecordBase {
  production_id: string;
  company_id: string;
  role: CompanyRole;
  region: string | null;
}

export interface BroadcastRun extends RecordBase {
  production_id: string;
  kind: BroadcastKind;
  label: string | null;
  language: string;
  region: string | null;
  network_id: string | null;
  start_date: ISODate | null;
  end_date: ISODate | null;
  /** 0 = Sunday … 6 = Saturday, in the run's own time zone. */
  weekday: number | null;
  local_time: string | null;
  time_zone: string | null;
  cadence: BroadcastCadence;
  episode_count: number | null;
  /** Dates (on the broadcast weekday) when no episode aired: holidays, hiatuses, specials. */
  skipped_dates: ISODate[];
  is_primary: boolean;
  notes: string | null;
}

export interface Episode extends RecordBase {
  production_id: string;
  number: number;
  title: string | null;
  title_native: string | null;
  synopsis: string | null;
  runtime_minutes: number | null;
}

export interface EpisodeRelease extends RecordBase {
  episode_id: string;
  broadcast_run_id: string;
  air_date: ISODate;
  air_time: string | null;
  notes: string | null;
}

export interface ProductionCredit extends RecordBase {
  production_id: string;
  person_id: string;
  role: CreditRole;
  role_detail: string | null;
  sort_order: number;
}

export interface VoiceCredit extends RecordBase {
  production_id: string;
  person_id: string;
  character_name: string;
  character_name_native: string | null;
  language: CastLanguage | null;
  credit_type: CastCreditType;
  billing: CastBilling | null;
  notes: string | null;
}

export interface MusicTrack extends RecordBase {
  slug: string;
  title: string;
  title_native: string | null;
  kind: TrackKind;
  release_date: ISODate | null;
  release_year: number | null;
  label_id: string | null;
  catalog_number: string | null;
  notes: string | null;
}

export interface TrackCredit extends RecordBase {
  track_id: string;
  person_id: string;
  role: TrackCreditRole;
  credited_as: string | null;
}

export interface ThemeSong extends RecordBase {
  production_id: string;
  track_id: string;
  usage: ThemeUsage;
  sequence: number | null;
  episodes: string | null;
}

export interface RelatedMedia extends RecordBase {
  production_id: string;
  related_production_id: string;
  relation: Relation;
  notes: string | null;
}

export interface SourceDocument extends RecordBase {
  slug: string;
  title: string;
  kind: SourceDocumentKind;
  description: string | null;
  reference: string | null;
  received_at: ISODate;
}

/** Field-level provenance: which source document established which value. */
export interface FactSource {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  field: string | null;
  source_document_id: string;
  note: string | null;
  created_at: ISOTimestamp;
}

export interface Revision {
  id: string;
  batch_id: string;
  entity_type: EntityType;
  entity_id: string;
  action: RevisionAction;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  changed_fields: string[];
  author: string | null;
  source_document_id: string | null;
  created_at: ISOTimestamp;
}

export interface RecordConflict {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  field: string;
  current_value: unknown;
  proposed_value: unknown;
  current_provenance: Provenance;
  proposed_provenance: Provenance;
  source_document_id: string | null;
  status: ConflictStatus;
  note: string | null;
  created_at: ISOTimestamp;
  resolved_at: ISOTimestamp | null;
  resolved_by: string | null;
}

/** Every table in the archive, keyed by table name. */
export interface ArchiveTables {
  source_documents: SourceDocument[];
  franchises: Franchise[];
  studios: Studio[];
  people: Person[];
  companies: Company[];
  productions: Production[];
  production_studios: ProductionStudio[];
  production_companies: ProductionCompany[];
  broadcast_runs: BroadcastRun[];
  episodes: Episode[];
  episode_releases: EpisodeRelease[];
  production_credits: ProductionCredit[];
  voice_credits: VoiceCredit[];
  music_tracks: MusicTrack[];
  track_credits: TrackCredit[];
  theme_songs: ThemeSong[];
  related_media: RelatedMedia[];
  fact_sources: FactSource[];
  revisions: Revision[];
  record_conflicts: RecordConflict[];
}

export type TableName = keyof ArchiveTables;
export type TableRow<T extends TableName> = ArchiveTables[T][number];

/**
 * Tables in foreign-key dependency order. Inserts walk this list forwards,
 * deletes walk it backwards.
 */
export const TABLE_ORDER: TableName[] = [
  "source_documents",
  "franchises",
  "studios",
  "people",
  "companies",
  "productions",
  "production_studios",
  "production_companies",
  "broadcast_runs",
  "episodes",
  "episode_releases",
  "production_credits",
  "voice_credits",
  "music_tracks",
  "track_credits",
  "theme_songs",
  "related_media",
  "fact_sources",
  "revisions",
  "record_conflicts",
];

/** Entities that editors work with directly (everything except the audit tables). */
export const ENTITY_TYPES = [
  "source_document",
  "franchise",
  "studio",
  "person",
  "company",
  "production",
  "production_studio",
  "production_company",
  "broadcast_run",
  "episode",
  "episode_release",
  "production_credit",
  "voice_credit",
  "music_track",
  "track_credit",
  "theme_song",
  "related_media",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TABLE: Record<EntityType, TableName> = {
  source_document: "source_documents",
  franchise: "franchises",
  studio: "studios",
  person: "people",
  company: "companies",
  production: "productions",
  production_studio: "production_studios",
  production_company: "production_companies",
  broadcast_run: "broadcast_runs",
  episode: "episodes",
  episode_release: "episode_releases",
  production_credit: "production_credits",
  voice_credit: "voice_credits",
  music_track: "music_tracks",
  track_credit: "track_credits",
  theme_song: "theme_songs",
  related_media: "related_media",
};

export type EntityRow = TableRow<(typeof ENTITY_TABLE)[EntityType]>;

/** A bundle of writes that the store applies atomically. */
export interface ChangeSet {
  upserts: Partial<{ [T in TableName]: ArchiveTables[T] }>;
  deletes: Partial<Record<TableName, string[]>>;
}

export function emptyTables(): ArchiveTables {
  return {
    source_documents: [],
    franchises: [],
    studios: [],
    people: [],
    companies: [],
    productions: [],
    production_studios: [],
    production_companies: [],
    broadcast_runs: [],
    episodes: [],
    episode_releases: [],
    production_credits: [],
    voice_credits: [],
    music_tracks: [],
    track_credits: [],
    theme_songs: [],
    related_media: [],
    fact_sources: [],
    revisions: [],
    record_conflicts: [],
  };
}
