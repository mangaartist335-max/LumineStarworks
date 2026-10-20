// Form definitions for the archive editor. One list of fields per entity
// drives both the rendered form and the FormData → object conversion that
// feeds the zod schemas in ./schemas.

import {
  AGE_RATING_LABEL,
  BILLING_LABEL,
  BROADCAST_KIND_LABEL,
  CADENCE_LABEL,
  CAST_TYPE_LABEL,
  COMPANY_KIND_LABEL,
  COMPANY_ROLE_LABEL,
  CREDIT_ROLE_LABEL,
  DEMOGRAPHIC_LABEL,
  FORMAT_LABEL,
  OCCUPATION_LABEL,
  PROVENANCE_LABEL,
  RELATION_LABEL,
  SEASON_LABEL,
  SOURCE_DOCUMENT_KIND_LABEL,
  SOURCE_LABEL,
  STUDIO_ROLE_LABEL,
  THEME_USAGE_LABEL,
  TRACK_ROLE_LABEL,
  TRACK_KIND_LABEL,
  WEEKDAY_LABEL,
} from "./labels";
import type { EntityType } from "./types";

export interface Option {
  value: string;
  label: string;
}

interface BaseField {
  name: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Spans both columns in the two-column form grid. */
  wide?: boolean;
}

export type FieldDef =
  | (BaseField & { type: "text" | "textarea" | "date" | "time" | "url"; placeholder?: string })
  | (BaseField & { type: "number"; step?: number; placeholder?: string })
  | (BaseField & { type: "select"; options: Option[]; empty?: string })
  | (BaseField & { type: "multiselect"; options: Option[] })
  | (BaseField & { type: "list"; placeholder?: string })
  | (BaseField & { type: "dates"; placeholder?: string })
  | (BaseField & { type: "checkbox" })
  | (BaseField & { type: "reference"; entity: EntityType; empty?: string });

const opts = (labels: Record<string, string>): Option[] => Object.entries(labels).map(([value, label]) => ({ value, label }));

const provenance: FieldDef = {
  name: "provenance",
  label: "Record status",
  type: "select",
  options: opts(PROVENANCE_LABEL),
  required: true,
  help: "Confirmed facts are protected from automatic overwrites during imports.",
};

export const ENTITY_FORMS: Record<EntityType, FieldDef[]> = {
  source_document: [
    { name: "title", label: "Title", type: "text", required: true, wide: true },
    { name: "slug", label: "URL slug", type: "text", required: true, help: "Lowercase words separated by hyphens." },
    { name: "kind", label: "Kind", type: "select", options: opts(SOURCE_DOCUMENT_KIND_LABEL), required: true },
    { name: "received_at", label: "Received", type: "date", required: true },
    { name: "reference", label: "Reference", type: "text", placeholder: "Document number, URL or citation" },
    { name: "description", label: "Description", type: "textarea", wide: true },
    provenance,
  ],
  franchise: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", required: true },
    { name: "name_native", label: "Japanese name", type: "text" },
    { name: "description", label: "Description", type: "textarea", wide: true },
    provenance,
  ],
  studio: [
    { name: "name", label: "Studio name", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", required: true },
    { name: "name_native", label: "Japanese name", type: "text" },
    { name: "founded_year", label: "Founded", type: "number", placeholder: "e.g. 2004" },
    { name: "location", label: "Location", type: "text", placeholder: "City, prefecture" },
    { name: "founders", label: "Founders", type: "list", help: "One per line." },
    { name: "animation_style", label: "Animation style", type: "textarea", wide: true },
    { name: "description", label: "Description", type: "textarea", wide: true },
    provenance,
  ],
  person: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", required: true },
    { name: "name_native", label: "Japanese name", type: "text" },
    { name: "aliases", label: "Also known as", type: "list", help: "One per line (stage names, credited names)." },
    { name: "occupations", label: "Roles", type: "multiselect", options: opts(OCCUPATION_LABEL), wide: true },
    { name: "bio", label: "Biography", type: "textarea", wide: true },
    provenance,
  ],
  company: [
    { name: "name", label: "Company name", type: "text", required: true },
    { name: "slug", label: "URL slug", type: "text", required: true },
    { name: "name_native", label: "Japanese name", type: "text" },
    { name: "kind", label: "Kind", type: "select", options: opts(COMPANY_KIND_LABEL), required: true },
    { name: "country", label: "Country", type: "text" },
    { name: "description", label: "Description", type: "textarea", wide: true },
    provenance,
  ],
  production: [
    { name: "title", label: "English title", type: "text", required: true, wide: true },
    { name: "slug", label: "URL slug", type: "text", required: true, help: "Used in /anime/<slug>." },
    { name: "format", label: "Format", type: "select", options: opts(FORMAT_LABEL), required: true },
    { name: "title_native", label: "Japanese title", type: "text" },
    { name: "title_romaji", label: "Romanized title", type: "text" },
    { name: "alt_titles", label: "Alternative titles", type: "list", help: "One per line.", wide: true },
    { name: "franchise_id", label: "Franchise", type: "reference", entity: "franchise", empty: "Standalone production" },
    { name: "franchise_order", label: "Order in franchise", type: "number" },
    { name: "season_number", label: "Season number", type: "number" },
    { name: "premiere_year", label: "Premiere year", type: "number" },
    { name: "premiere_season", label: "Premiere season", type: "select", options: opts(SEASON_LABEL), empty: "Not documented" },
    { name: "premiere_date", label: "Premiere date", type: "date", help: "First broadcast or theatrical release." },
    { name: "finale_date", label: "Finale date", type: "date" },
    { name: "episode_count", label: "Episodes", type: "number" },
    { name: "runtime_minutes", label: "Runtime (minutes)", type: "number" },
    { name: "source_material", label: "Source material", type: "select", options: opts(SOURCE_LABEL), empty: "Not documented" },
    { name: "demographic", label: "Demographic", type: "select", options: opts(DEMOGRAPHIC_LABEL), empty: "Not documented" },
    { name: "age_rating", label: "Age rating", type: "select", options: opts(AGE_RATING_LABEL), empty: "Not documented" },
    { name: "genres", label: "Genres", type: "list", help: "One per line." },
    { name: "themes", label: "Themes", type: "list", help: "One per line." },
    { name: "synopsis", label: "Synopsis", type: "textarea", wide: true },
    { name: "production_history", label: "Production history", type: "textarea", wide: true },
    { name: "reception", label: "Reception", type: "textarea", wide: true },
    { name: "score", label: "Score (0–10)", type: "number", step: 0.01 },
    { name: "poster_url", label: "Approved poster URL", type: "url", placeholder: "https://…" },
    { name: "notes", label: "Archive notes", type: "textarea", wide: true },
    provenance,
  ],
  production_studio: [
    { name: "studio_id", label: "Studio", type: "reference", entity: "studio", required: true },
    { name: "role", label: "Role", type: "select", options: opts(STUDIO_ROLE_LABEL), required: true },
    provenance,
  ],
  production_company: [
    { name: "company_id", label: "Company", type: "reference", entity: "company", required: true },
    { name: "role", label: "Role", type: "select", options: opts(COMPANY_ROLE_LABEL), required: true },
    { name: "region", label: "Region", type: "text", placeholder: "e.g. North America" },
    provenance,
  ],
  broadcast_run: [
    { name: "kind", label: "Kind", type: "select", options: opts(BROADCAST_KIND_LABEL), required: true },
    { name: "label", label: "Label", type: "text", placeholder: "e.g. Season 1 Advance broadcast" },
    { name: "language", label: "Language", type: "select", options: [{ value: "ja", label: "Japanese" }, { value: "en", label: "English" }], required: true },
    { name: "region", label: "Region", type: "text", placeholder: "JP, US…" },
    { name: "network_id", label: "Network / platform", type: "reference", entity: "company", empty: "Not documented" },
    { name: "cadence", label: "Cadence", type: "select", options: opts(CADENCE_LABEL), required: true },
    { name: "start_date", label: "First broadcast", type: "date" },
    { name: "end_date", label: "Last broadcast", type: "date" },
    { name: "weekday", label: "Broadcast day", type: "select", options: WEEKDAY_LABEL.map((label, i) => ({ value: String(i), label })), empty: "Derive from dates" },
    { name: "local_time", label: "Local time", type: "time", placeholder: "HH:MM — late night may use 25:30" },
    { name: "time_zone", label: "Time zone", type: "text", placeholder: "Asia/Tokyo" },
    { name: "episode_count", label: "Episodes in this run", type: "number" },
    { name: "skipped_dates", label: "Skipped weeks", type: "dates", help: "Broadcast dates with no episode, one per line (YYYY-MM-DD).", wide: true },
    { name: "is_primary", label: "Primary run for this production", type: "checkbox" },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
    provenance,
  ],
  episode: [
    { name: "number", label: "Episode number", type: "number", step: 0.5, required: true, help: "Use 0 for a prologue, 12.5 for a recap." },
    { name: "title", label: "English title", type: "text" },
    { name: "title_native", label: "Japanese title", type: "text" },
    { name: "runtime_minutes", label: "Runtime (minutes)", type: "number" },
    { name: "synopsis", label: "Synopsis", type: "textarea", wide: true },
    provenance,
  ],
  episode_release: [
    { name: "episode_id", label: "Episode", type: "reference", entity: "episode", required: true },
    { name: "broadcast_run_id", label: "Broadcast run", type: "reference", entity: "broadcast_run", required: true },
    { name: "air_date", label: "Air date", type: "date", required: true },
    { name: "air_time", label: "Air time", type: "time" },
    { name: "notes", label: "Notes", type: "text", wide: true },
    provenance,
  ],
  production_credit: [
    { name: "person_id", label: "Person", type: "reference", entity: "person", required: true },
    { name: "role", label: "Role", type: "select", options: opts(CREDIT_ROLE_LABEL), required: true },
    { name: "role_detail", label: "Detail", type: "text", placeholder: "e.g. Episodes 1–12" },
    { name: "sort_order", label: "Order", type: "number", help: "Lower numbers are listed first." },
    provenance,
  ],
  voice_credit: [
    { name: "character_name", label: "Character", type: "text", required: true },
    { name: "character_name_native", label: "Character (Japanese)", type: "text" },
    { name: "person_id", label: "Performer", type: "reference", entity: "person", required: true },
    { name: "language", label: "Cast", type: "select", options: [{ value: "ja", label: "Japanese cast" }, { value: "en", label: "English cast" }], empty: "Featured performer (no language)" },
    { name: "credit_type", label: "Credit type", type: "select", options: opts(CAST_TYPE_LABEL), required: true },
    { name: "billing", label: "Billing", type: "select", options: opts(BILLING_LABEL), empty: "Not documented" },
    { name: "notes", label: "Notes", type: "text", wide: true },
    provenance,
  ],
  music_track: [
    { name: "title", label: "Title", type: "text", required: true, wide: true },
    { name: "slug", label: "URL slug", type: "text", required: true },
    { name: "title_native", label: "Japanese title", type: "text" },
    { name: "kind", label: "Kind", type: "select", options: opts(TRACK_KIND_LABEL), required: true },
    { name: "release_date", label: "Release date", type: "date" },
    { name: "release_year", label: "Release year", type: "number" },
    { name: "label_id", label: "Label", type: "reference", entity: "company", empty: "Not documented" },
    { name: "catalog_number", label: "Catalog number", type: "text" },
    { name: "notes", label: "Notes", type: "textarea", wide: true },
    provenance,
  ],
  track_credit: [
    { name: "person_id", label: "Person", type: "reference", entity: "person", required: true },
    { name: "role", label: "Role", type: "select", options: opts(TRACK_ROLE_LABEL), required: true },
    { name: "credited_as", label: "Credited as", type: "text", placeholder: "e.g. an in-story character name" },
    provenance,
  ],
  theme_song: [
    { name: "track_id", label: "Track", type: "reference", entity: "music_track", required: true },
    { name: "usage", label: "Used as", type: "select", options: opts(THEME_USAGE_LABEL), required: true },
    { name: "sequence", label: "Sequence", type: "number", help: "1 for OP1, 2 for OP2…" },
    { name: "episodes", label: "Episodes", type: "text", placeholder: "e.g. 1–12" },
    provenance,
  ],
  related_media: [
    { name: "relation", label: "Relationship", type: "select", options: opts(RELATION_LABEL), required: true, help: "How the other production relates to this one." },
    { name: "related_production_id", label: "Related production", type: "reference", entity: "production", required: true },
    { name: "notes", label: "Notes", type: "text", wide: true },
    provenance,
  ],
};

/** Convert submitted form data into the plain object the zod schema expects. */
export function formDataToInput(entity: EntityType, formData: FormData, fixed: Record<string, string> = {}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const text = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  for (const field of ENTITY_FORMS[entity]) {
    switch (field.type) {
      case "number": {
        const v = text(field.name);
        out[field.name] = v === null ? null : Number(v);
        break;
      }
      case "multiselect":
        out[field.name] = formData.getAll(field.name).filter((v): v is string => typeof v === "string" && v !== "");
        break;
      case "list":
      case "dates":
        out[field.name] = (text(field.name) ?? "")
          .split(/\n|,(?=\s*\d{4}-)/)
          .map((s) => s.trim())
          .filter(Boolean);
        break;
      case "checkbox":
        out[field.name] = formData.get(field.name) === "on";
        break;
      default:
        out[field.name] = text(field.name);
    }
  }
  // Select-style numbers.
  if (entity === "broadcast_run") out.weekday = out.weekday === null ? null : Number(out.weekday);
  // Defaults for optional numeric order fields.
  if (entity === "production_credit" && out.sort_order === null) out.sort_order = 0;
  for (const [key, value] of Object.entries(fixed)) out[key] = value;
  return out;
}

/** Turn a stored row into string form values. */
export function rowToValues(entity: EntityType, row: Record<string, unknown> | null): Record<string, string | string[] | boolean> {
  const values: Record<string, string | string[] | boolean> = {};
  if (!row) return values;
  for (const field of ENTITY_FORMS[entity]) {
    const v = row[field.name];
    if (field.type === "multiselect") values[field.name] = Array.isArray(v) ? (v as string[]) : [];
    else if (field.type === "list" || field.type === "dates") values[field.name] = Array.isArray(v) ? (v as string[]).join("\n") : "";
    else if (field.type === "checkbox") values[field.name] = Boolean(v);
    else values[field.name] = v === null || v === undefined ? "" : String(v);
  }
  return values;
}

/** Field names a parent form fixes (hidden) for each child entity. */
export const PARENT_FIELD: Partial<Record<EntityType, string>> = {
  production_studio: "production_id",
  production_company: "production_id",
  broadcast_run: "production_id",
  episode: "production_id",
  production_credit: "production_id",
  voice_credit: "production_id",
  theme_song: "production_id",
  related_media: "production_id",
  track_credit: "track_id",
};
