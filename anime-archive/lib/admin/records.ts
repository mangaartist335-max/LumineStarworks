import type { ArchiveIndex } from "@/lib/archive/archive-index";
import { COMPANY_KIND_LABEL, OCCUPATION_LABEL, SOURCE_DOCUMENT_KIND_LABEL, TRACK_KIND_LABEL } from "@/lib/archive/labels";
import type { EntityType, Provenance } from "@/lib/archive/types";

/** Top-level records managed through the generic editor pages. */
export const RECORD_ENTITIES = ["franchise", "studio", "person", "company", "music_track", "source_document"] as const;
export type RecordEntity = (typeof RECORD_ENTITIES)[number];

export const RECORD_COPY: Record<RecordEntity, { plural: string; singular: string; description: string; publicPath?: string }> = {
  franchise: { plural: "Franchises", singular: "franchise", description: "Group seasons, films and specials into one timeline.", publicPath: "/franchises" },
  studio: { plural: "Studios", singular: "studio", description: "Register animation studios and their founding details.", publicPath: "/studios" },
  person: { plural: "People", singular: "person", description: "One profile per person — directors, writers, composers, animators, voice actors and more.", publicPath: "/staff" },
  company: { plural: "Companies & networks", singular: "company", description: "Production companies, broadcasters, licensors, distributors, streaming services and labels." },
  music_track: { plural: "Music tracks", singular: "track", description: "Songs, scores and soundtrack releases. Assign them to productions from the production editor." },
  source_document: { plural: "Source documents", singular: "source document", description: "The briefs, production documents and press releases that facts are cited to." },
};

export function isRecordEntity(value: string): value is RecordEntity {
  return (RECORD_ENTITIES as readonly string[]).includes(value);
}

export interface RecordListRow {
  id: string;
  title: string;
  subtitle: string;
  provenance: Provenance;
  uses: number;
  publicHref?: string;
}

export function listRecords(index: ArchiveIndex, entity: RecordEntity): RecordListRow[] {
  const t = index.tables;
  const rows: RecordListRow[] = (() => {
    switch (entity) {
      case "franchise":
        return t.franchises.map((f) => ({ id: f.id, title: f.name, subtitle: f.name_native ?? f.slug, provenance: f.provenance, uses: index.franchiseEntries(f.id).length, publicHref: `/franchises/${f.slug}` }));
      case "studio":
        return t.studios.map((s) => ({ id: s.id, title: s.name, subtitle: [s.founded_year, s.location].filter(Boolean).join(" · ") || s.slug, provenance: s.provenance, uses: index.productionLinksForStudio(s.id).length, publicHref: `/studios/${s.slug}` }));
      case "person":
        return t.people.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.occupations.map((o) => OCCUPATION_LABEL[o]).join(", ") || p.slug,
          provenance: p.provenance,
          uses: index.creditsForPerson(p.id).length + index.castForPerson(p.id).length + index.trackCreditsForPerson(p.id).length,
          publicHref: `/staff/${p.slug}`,
        }));
      case "company":
        return t.companies.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: COMPANY_KIND_LABEL[c.kind],
          provenance: c.provenance,
          uses: index.productionLinksForCompany(c.id).length + index.runsForNetwork(c.id).length,
        }));
      case "music_track":
        return t.music_tracks.map((m) => ({
          id: m.id,
          title: m.title,
          subtitle: `${TRACK_KIND_LABEL[m.kind]} · ${index.trackCredits(m.id).map((c) => c.person.name).join(", ") || "no credits"}`,
          provenance: m.provenance,
          uses: index.usagesForTrack(m.id).length,
        }));
      case "source_document":
        return t.source_documents.map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: `${SOURCE_DOCUMENT_KIND_LABEL[d.kind]} · ${d.received_at}`,
          provenance: d.provenance,
          uses: t.fact_sources.filter((f) => f.source_document_id === d.id).length,
        }));
    }
  })();
  return rows.sort((a, b) => a.title.localeCompare(b.title));
}

export function recordRow(index: ArchiveIndex, entity: EntityType, id: string): Record<string, unknown> | undefined {
  const map: Partial<Record<EntityType, Map<string, object>>> = {
    franchise: index.franchisesById,
    studio: index.studiosById,
    person: index.peopleById,
    company: index.companiesById,
    music_track: index.tracksById,
    source_document: index.sourcesById,
  };
  return map[entity]?.get(id) as Record<string, unknown> | undefined;
}
