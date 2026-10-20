// Fast lookups over a loaded archive. Built once per snapshot and shared by
// every query that renders a page.

import { INVERSE_RELATION } from "./labels";
import type {
  ArchiveTables,
  BroadcastRun,
  Company,
  EntityType,
  Episode,
  EpisodeRelease,
  FactSource,
  Franchise,
  MusicTrack,
  Person,
  Production,
  ProductionCompany,
  ProductionCredit,
  ProductionStudio,
  RecordConflict,
  Relation,
  RelatedMedia,
  Revision,
  SourceDocument,
  Studio,
  ThemeSong,
  TrackCredit,
  VoiceCredit,
} from "./types";

function groupBy<T>(rows: T[], key: (row: T) => string | null): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    if (k === null) continue;
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

function byId<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.id, r]));
}

function bySlug<T extends { slug: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((r) => [r.slug, r]));
}

export interface RelatedEntry {
  relation: Relation;
  production: Production;
  link: RelatedMedia;
  /** True when the link was recorded from the other production's side. */
  inverse: boolean;
}

export class ArchiveIndex {
  readonly productionsById: Map<string, Production>;
  readonly productionsBySlug: Map<string, Production>;
  readonly studiosById: Map<string, Studio>;
  readonly studiosBySlug: Map<string, Studio>;
  readonly peopleById: Map<string, Person>;
  readonly peopleBySlug: Map<string, Person>;
  readonly franchisesById: Map<string, Franchise>;
  readonly franchisesBySlug: Map<string, Franchise>;
  readonly companiesById: Map<string, Company>;
  readonly companiesBySlug: Map<string, Company>;
  readonly tracksById: Map<string, MusicTrack>;
  readonly tracksBySlug: Map<string, MusicTrack>;
  readonly sourcesById: Map<string, SourceDocument>;
  readonly runsById: Map<string, BroadcastRun>;
  readonly episodesById: Map<string, Episode>;

  private readonly studioLinksByProduction: Map<string, ProductionStudio[]>;
  private readonly studioLinksByStudio: Map<string, ProductionStudio[]>;
  private readonly companyLinksByProduction: Map<string, ProductionCompany[]>;
  private readonly companyLinksByCompany: Map<string, ProductionCompany[]>;
  private readonly runsByProduction: Map<string, BroadcastRun[]>;
  private readonly runsByNetwork: Map<string, BroadcastRun[]>;
  private readonly episodesByProduction: Map<string, Episode[]>;
  private readonly releasesByRun: Map<string, EpisodeRelease[]>;
  private readonly releasesByEpisode: Map<string, EpisodeRelease[]>;
  private readonly creditsByProduction: Map<string, ProductionCredit[]>;
  private readonly creditsByPerson: Map<string, ProductionCredit[]>;
  private readonly castByProduction: Map<string, VoiceCredit[]>;
  private readonly castByPerson: Map<string, VoiceCredit[]>;
  private readonly trackCreditsByTrack: Map<string, TrackCredit[]>;
  private readonly trackCreditsByPerson: Map<string, TrackCredit[]>;
  private readonly themesByProduction: Map<string, ThemeSong[]>;
  private readonly themesByTrack: Map<string, ThemeSong[]>;
  private readonly relatedFrom: Map<string, RelatedMedia[]>;
  private readonly relatedTo: Map<string, RelatedMedia[]>;
  private readonly productionsByFranchise: Map<string, Production[]>;
  private readonly factsByEntity: Map<string, FactSource[]>;
  private readonly revisionsByEntity: Map<string, Revision[]>;
  private readonly conflictsByEntity: Map<string, RecordConflict[]>;

  constructor(readonly tables: ArchiveTables) {
    this.productionsById = byId(tables.productions);
    this.productionsBySlug = bySlug(tables.productions);
    this.studiosById = byId(tables.studios);
    this.studiosBySlug = bySlug(tables.studios);
    this.peopleById = byId(tables.people);
    this.peopleBySlug = bySlug(tables.people);
    this.franchisesById = byId(tables.franchises);
    this.franchisesBySlug = bySlug(tables.franchises);
    this.companiesById = byId(tables.companies);
    this.companiesBySlug = bySlug(tables.companies);
    this.tracksById = byId(tables.music_tracks);
    this.tracksBySlug = bySlug(tables.music_tracks);
    this.sourcesById = byId(tables.source_documents);
    this.runsById = byId(tables.broadcast_runs);
    this.episodesById = byId(tables.episodes);

    this.studioLinksByProduction = groupBy(tables.production_studios, (r) => r.production_id);
    this.studioLinksByStudio = groupBy(tables.production_studios, (r) => r.studio_id);
    this.companyLinksByProduction = groupBy(tables.production_companies, (r) => r.production_id);
    this.companyLinksByCompany = groupBy(tables.production_companies, (r) => r.company_id);
    this.runsByProduction = groupBy(tables.broadcast_runs, (r) => r.production_id);
    this.runsByNetwork = groupBy(tables.broadcast_runs, (r) => r.network_id);
    this.episodesByProduction = groupBy(tables.episodes, (r) => r.production_id);
    this.releasesByRun = groupBy(tables.episode_releases, (r) => r.broadcast_run_id);
    this.releasesByEpisode = groupBy(tables.episode_releases, (r) => r.episode_id);
    this.creditsByProduction = groupBy(tables.production_credits, (r) => r.production_id);
    this.creditsByPerson = groupBy(tables.production_credits, (r) => r.person_id);
    this.castByProduction = groupBy(tables.voice_credits, (r) => r.production_id);
    this.castByPerson = groupBy(tables.voice_credits, (r) => r.person_id);
    this.trackCreditsByTrack = groupBy(tables.track_credits, (r) => r.track_id);
    this.trackCreditsByPerson = groupBy(tables.track_credits, (r) => r.person_id);
    this.themesByProduction = groupBy(tables.theme_songs, (r) => r.production_id);
    this.themesByTrack = groupBy(tables.theme_songs, (r) => r.track_id);
    this.relatedFrom = groupBy(tables.related_media, (r) => r.production_id);
    this.relatedTo = groupBy(tables.related_media, (r) => r.related_production_id);
    this.productionsByFranchise = groupBy(tables.productions, (r) => r.franchise_id);
    this.factsByEntity = groupBy(tables.fact_sources, (r) => `${r.entity_type}:${r.entity_id}`);
    this.revisionsByEntity = groupBy(tables.revisions, (r) => `${r.entity_type}:${r.entity_id}`);
    this.conflictsByEntity = groupBy(tables.record_conflicts, (r) => `${r.entity_type}:${r.entity_id}`);
  }

  studiosFor(productionId: string) {
    return (this.studioLinksByProduction.get(productionId) ?? [])
      .map((link) => ({ link, studio: this.studiosById.get(link.studio_id)! }))
      .filter((s) => s.studio)
      .sort((a, b) => (a.link.role === "animation" ? -1 : 0) - (b.link.role === "animation" ? -1 : 0));
  }

  productionLinksForStudio(studioId: string) {
    return (this.studioLinksByStudio.get(studioId) ?? [])
      .map((link) => ({ link, production: this.productionsById.get(link.production_id)! }))
      .filter((p) => p.production);
  }

  companiesFor(productionId: string) {
    return (this.companyLinksByProduction.get(productionId) ?? [])
      .map((link) => ({ link, company: this.companiesById.get(link.company_id)! }))
      .filter((c) => c.company);
  }

  productionLinksForCompany(companyId: string) {
    return (this.companyLinksByCompany.get(companyId) ?? [])
      .map((link) => ({ link, production: this.productionsById.get(link.production_id)! }))
      .filter((p) => p.production);
  }

  runsForNetwork(companyId: string) {
    return this.runsByNetwork.get(companyId) ?? [];
  }

  runsFor(productionId: string): BroadcastRun[] {
    return [...(this.runsByProduction.get(productionId) ?? [])].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return (a.start_date ?? "9999") < (b.start_date ?? "9999") ? -1 : 1;
    });
  }

  episodesFor(productionId: string): Episode[] {
    return [...(this.episodesByProduction.get(productionId) ?? [])].sort((a, b) => a.number - b.number);
  }

  releasesForRun(runId: string): EpisodeRelease[] {
    return this.releasesByRun.get(runId) ?? [];
  }

  releasesForEpisode(episodeId: string): EpisodeRelease[] {
    return this.releasesByEpisode.get(episodeId) ?? [];
  }

  creditsFor(productionId: string) {
    return (this.creditsByProduction.get(productionId) ?? [])
      .map((credit) => ({ credit, person: this.peopleById.get(credit.person_id)! }))
      .filter((c) => c.person)
      .sort((a, b) => a.credit.sort_order - b.credit.sort_order);
  }

  creditsForPerson(personId: string) {
    return (this.creditsByPerson.get(personId) ?? [])
      .map((credit) => ({ credit, production: this.productionsById.get(credit.production_id)! }))
      .filter((c) => c.production);
  }

  castFor(productionId: string) {
    return (this.castByProduction.get(productionId) ?? [])
      .map((credit) => ({ credit, person: this.peopleById.get(credit.person_id)! }))
      .filter((c) => c.person);
  }

  castForPerson(personId: string) {
    return (this.castByPerson.get(personId) ?? [])
      .map((credit) => ({ credit, production: this.productionsById.get(credit.production_id)! }))
      .filter((c) => c.production);
  }

  trackCredits(trackId: string) {
    return (this.trackCreditsByTrack.get(trackId) ?? [])
      .map((credit) => ({ credit, person: this.peopleById.get(credit.person_id)! }))
      .filter((c) => c.person);
  }

  trackCreditsForPerson(personId: string) {
    return (this.trackCreditsByPerson.get(personId) ?? [])
      .map((credit) => ({ credit, track: this.tracksById.get(credit.track_id)! }))
      .filter((c) => c.track);
  }

  themesFor(productionId: string) {
    return (this.themesByProduction.get(productionId) ?? [])
      .map((theme) => {
        const track = this.tracksById.get(theme.track_id);
        return track ? { theme, track, credits: this.trackCredits(track.id) } : null;
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  }

  usagesForTrack(trackId: string) {
    return (this.themesByTrack.get(trackId) ?? [])
      .map((theme) => ({ theme, production: this.productionsById.get(theme.production_id)! }))
      .filter((t) => t.production);
  }

  relatedFor(productionId: string): RelatedEntry[] {
    const out: RelatedEntry[] = [];
    for (const link of this.relatedFrom.get(productionId) ?? []) {
      const production = this.productionsById.get(link.related_production_id);
      if (production) out.push({ relation: link.relation, production, link, inverse: false });
    }
    for (const link of this.relatedTo.get(productionId) ?? []) {
      const production = this.productionsById.get(link.production_id);
      if (production) out.push({ relation: INVERSE_RELATION[link.relation], production, link, inverse: true });
    }
    return out;
  }

  franchiseEntries(franchiseId: string): Production[] {
    return [...(this.productionsByFranchise.get(franchiseId) ?? [])].sort(
      (a, b) =>
        (a.franchise_order ?? 999) - (b.franchise_order ?? 999) ||
        (a.premiere_date ?? `${a.premiere_year ?? 9999}`).localeCompare(b.premiere_date ?? `${b.premiere_year ?? 9999}`),
    );
  }

  factSources(entity: EntityType, id: string) {
    return (this.factsByEntity.get(`${entity}:${id}`) ?? []).map((fact) => ({
      fact,
      document: this.sourcesById.get(fact.source_document_id) ?? null,
    }));
  }

  revisions(entity: EntityType, id: string): Revision[] {
    return [...(this.revisionsByEntity.get(`${entity}:${id}`) ?? [])].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }

  conflicts(entity: EntityType, id: string): RecordConflict[] {
    return this.conflictsByEntity.get(`${entity}:${id}`) ?? [];
  }

  openConflictCount(entity: EntityType, id: string): number {
    return this.conflicts(entity, id).filter((c) => c.status === "open").length;
  }
}

const cache = new WeakMap<ArchiveTables, ArchiveIndex>();

export function indexArchive(tables: ArchiveTables): ArchiveIndex {
  let index = cache.get(tables);
  if (!index) {
    index = new ArchiveIndex(tables);
    cache.set(tables, index);
  }
  return index;
}
