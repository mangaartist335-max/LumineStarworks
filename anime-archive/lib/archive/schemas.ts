// Zod schemas for every editable entity. The same schemas validate editor
// forms, JSON imports and the export format, so there is exactly one
// definition of "a valid row".

import { z } from "zod";
import { isValidBroadcastTime, isValidISODate, isValidTimeZone } from "./dates";
import {
  AGE_RATINGS,
  BROADCAST_CADENCES,
  BROADCAST_KINDS,
  CAST_BILLINGS,
  CAST_CREDIT_TYPES,
  CAST_LANGUAGES,
  COMPANY_KINDS,
  COMPANY_ROLES,
  CREDIT_ROLES,
  DEMOGRAPHICS,
  OCCUPATIONS,
  PRODUCTION_FORMATS,
  PROVENANCE_STATUSES,
  RELATIONS,
  SEASONS,
  SOURCE_DOCUMENT_KINDS,
  SOURCE_MATERIALS,
  STUDIO_ROLES,
  THEME_USAGES,
  TRACK_CREDIT_ROLES,
  TRACK_KINDS,
  type EntityType,
} from "./types";

const text = (max = 200) => z.string().trim().min(1, "Required").max(max);
const optionalText = (max = 4000) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));
const date = z.string().refine(isValidISODate, "Use a real calendar date (YYYY-MM-DD)");
const optionalDate = date.nullable();
const slug = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
const ref = z.string().trim().min(1, "Choose a record");
const optionalRef = z.string().trim().min(1).nullable();
const year = z.number().int().min(1900).max(2100);
const stringList = z.array(z.string().trim().min(1).max(120)).max(60);

export const provenanceSchema = z.enum(PROVENANCE_STATUSES);

export const schemas = {
  source_document: z.object({
    slug,
    title: text(300),
    kind: z.enum(SOURCE_DOCUMENT_KINDS),
    description: optionalText(),
    reference: optionalText(500),
    received_at: date,
    provenance: provenanceSchema,
  }),
  franchise: z.object({
    slug,
    name: text(),
    name_native: optionalText(200),
    description: optionalText(),
    provenance: provenanceSchema,
  }),
  studio: z.object({
    slug,
    name: text(),
    name_native: optionalText(200),
    founded_year: year.nullable(),
    location: optionalText(200),
    founders: stringList,
    animation_style: optionalText(1000),
    description: optionalText(),
    provenance: provenanceSchema,
  }),
  person: z.object({
    slug,
    name: text(),
    name_native: optionalText(200),
    aliases: stringList,
    occupations: z.array(z.enum(OCCUPATIONS)).max(OCCUPATIONS.length),
    bio: optionalText(),
    provenance: provenanceSchema,
  }),
  company: z.object({
    slug,
    name: text(),
    name_native: optionalText(200),
    kind: z.enum(COMPANY_KINDS),
    country: optionalText(120),
    description: optionalText(),
    provenance: provenanceSchema,
  }),
  production: z
    .object({
      slug,
      franchise_id: optionalRef,
      franchise_order: z.number().int().min(0).max(999).nullable(),
      season_number: z.number().int().min(0).max(99).nullable(),
      title: text(300),
      title_native: optionalText(300),
      title_romaji: optionalText(300),
      alt_titles: stringList,
      format: z.enum(PRODUCTION_FORMATS),
      synopsis: optionalText(),
      genres: stringList,
      themes: stringList,
      source_material: z.enum(SOURCE_MATERIALS).nullable(),
      demographic: z.enum(DEMOGRAPHICS).nullable(),
      age_rating: z.enum(AGE_RATINGS).nullable(),
      premiere_year: year.nullable(),
      premiere_season: z.enum(SEASONS).nullable(),
      premiere_date: optionalDate,
      finale_date: optionalDate,
      episode_count: z.number().int().min(0).max(5000).nullable(),
      runtime_minutes: z.number().int().min(1).max(600).nullable(),
      production_history: optionalText(8000),
      reception: optionalText(8000),
      score: z.number().min(0).max(10).nullable(),
      poster_url: z.string().trim().url("Use a full https:// address").nullable().or(z.literal("").transform(() => null)),
      notes: optionalText(),
      provenance: provenanceSchema,
    })
    .superRefine((p, ctx) => {
      if (p.premiere_date && p.finale_date && p.finale_date < p.premiere_date) {
        ctx.addIssue({ code: "custom", path: ["finale_date"], message: "The finale can't be before the premiere" });
      }
      if (p.premiere_season && p.premiere_year === null) {
        ctx.addIssue({ code: "custom", path: ["premiere_year"], message: "Add the premiere year for this season" });
      }
    }),
  production_studio: z.object({
    production_id: ref,
    studio_id: ref,
    role: z.enum(STUDIO_ROLES),
    provenance: provenanceSchema,
  }),
  production_company: z.object({
    production_id: ref,
    company_id: ref,
    role: z.enum(COMPANY_ROLES),
    region: optionalText(120),
    provenance: provenanceSchema,
  }),
  broadcast_run: z
    .object({
      production_id: ref,
      kind: z.enum(BROADCAST_KINDS),
      label: optionalText(200),
      language: z.string().trim().min(2).max(12),
      region: optionalText(12),
      network_id: optionalRef,
      start_date: optionalDate,
      end_date: optionalDate,
      weekday: z.number().int().min(0).max(6).nullable(),
      local_time: z.string().refine(isValidBroadcastTime, "Use HH:MM (late-night slots may go up to 29:59)").nullable(),
      time_zone: z.string().refine(isValidTimeZone, "Use an IANA time zone such as Asia/Tokyo").nullable(),
      cadence: z.enum(BROADCAST_CADENCES),
      episode_count: z.number().int().min(0).max(5000).nullable(),
      skipped_dates: z.array(date).max(200),
      is_primary: z.boolean(),
      notes: optionalText(),
      provenance: provenanceSchema,
    })
    .superRefine((r, ctx) => {
      if (r.start_date && r.end_date && r.end_date < r.start_date) {
        ctx.addIssue({ code: "custom", path: ["end_date"], message: "The last broadcast can't be before the first" });
      }
    }),
  episode: z.object({
    production_id: ref,
    number: z.number().min(0).max(5000),
    title: optionalText(300),
    title_native: optionalText(300),
    synopsis: optionalText(),
    runtime_minutes: z.number().int().min(1).max(600).nullable(),
    provenance: provenanceSchema,
  }),
  episode_release: z.object({
    episode_id: ref,
    broadcast_run_id: ref,
    air_date: date,
    air_time: z.string().refine(isValidBroadcastTime, "Use HH:MM").nullable(),
    notes: optionalText(),
    provenance: provenanceSchema,
  }),
  production_credit: z.object({
    production_id: ref,
    person_id: ref,
    role: z.enum(CREDIT_ROLES),
    role_detail: optionalText(200),
    sort_order: z.number().int().min(0).max(999),
    provenance: provenanceSchema,
  }),
  voice_credit: z.object({
    production_id: ref,
    person_id: ref,
    character_name: text(200),
    character_name_native: optionalText(200),
    language: z.enum(CAST_LANGUAGES).nullable(),
    credit_type: z.enum(CAST_CREDIT_TYPES),
    billing: z.enum(CAST_BILLINGS).nullable(),
    notes: optionalText(),
    provenance: provenanceSchema,
  }),
  music_track: z.object({
    slug,
    title: text(300),
    title_native: optionalText(300),
    kind: z.enum(TRACK_KINDS),
    release_date: optionalDate,
    release_year: year.nullable(),
    label_id: optionalRef,
    catalog_number: optionalText(120),
    notes: optionalText(),
    provenance: provenanceSchema,
  }),
  track_credit: z.object({
    track_id: ref,
    person_id: ref,
    role: z.enum(TRACK_CREDIT_ROLES),
    credited_as: optionalText(200),
    provenance: provenanceSchema,
  }),
  theme_song: z.object({
    production_id: ref,
    track_id: ref,
    usage: z.enum(THEME_USAGES),
    sequence: z.number().int().min(0).max(99).nullable(),
    episodes: optionalText(120),
    provenance: provenanceSchema,
  }),
  related_media: z
    .object({
      production_id: ref,
      related_production_id: ref,
      relation: z.enum(RELATIONS),
      notes: optionalText(),
      provenance: provenanceSchema,
    })
    .refine((r) => r.production_id !== r.related_production_id, { message: "A production can't be related to itself", path: ["related_production_id"] }),
} satisfies Record<EntityType, z.ZodType>;

export type EntityInput<E extends EntityType> = z.infer<(typeof schemas)[E]>;

/** Flatten a ZodError into `{ field: message }` for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Columns that reference other entities, used to resolve slugs during import. */
export const REFERENCE_FIELDS: Partial<Record<EntityType, Record<string, EntityType>>> = {
  production: { franchise_id: "franchise" },
  production_studio: { production_id: "production", studio_id: "studio" },
  production_company: { production_id: "production", company_id: "company" },
  broadcast_run: { production_id: "production", network_id: "company" },
  episode: { production_id: "production" },
  episode_release: { episode_id: "episode", broadcast_run_id: "broadcast_run" },
  production_credit: { production_id: "production", person_id: "person" },
  voice_credit: { production_id: "production", person_id: "person" },
  music_track: { label_id: "company" },
  track_credit: { track_id: "music_track", person_id: "person" },
  theme_song: { production_id: "production", track_id: "music_track" },
  related_media: { production_id: "production", related_production_id: "production" },
};

/** Entities that are addressed by a slug. */
export const SLUGGED: EntityType[] = ["source_document", "franchise", "studio", "person", "company", "production", "music_track"];

/** Fields that identify a link row when no id is supplied (natural keys). */
export const NATURAL_KEYS: Partial<Record<EntityType, string[]>> = {
  production_studio: ["production_id", "studio_id", "role"],
  production_company: ["production_id", "company_id", "role"],
  broadcast_run: ["production_id", "kind", "language", "region"],
  episode: ["production_id", "number"],
  episode_release: ["episode_id", "broadcast_run_id"],
  production_credit: ["production_id", "person_id", "role"],
  voice_credit: ["production_id", "person_id", "character_name", "language"],
  track_credit: ["track_id", "person_id", "role"],
  theme_song: ["production_id", "track_id", "usage"],
  related_media: ["production_id", "related_production_id", "relation"],
};
