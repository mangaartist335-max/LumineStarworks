// Read-side view models. Pages call these with an ArchiveIndex and get back
// plain objects that are ready to render (and safe to pass to client components).

import type { ArchiveIndex } from "./archive-index";
import { compareISODate, daysBetween, monthOf, weekdayOf, yearOf } from "./dates";
import { CREDIT_DEPARTMENTS, PROVENANCE_RANK } from "./labels";
import {
  ARCHIVE_START_YEAR,
  CALENDAR_END_YEAR,
  compareSeasons,
  decadeOf,
  seasonIndex,
  seasonOfDate,
  type SeasonKey,
} from "./seasons";
import {
  SEASONS,
  type BroadcastRun,
  type CreditRole,
  type ISODate,
  type Person,
  type Production,
  type ProductionFormat,
  type Provenance,
  type SeasonName,
  type Studio,
} from "./types";
import {
  analyzeBroadcastRun,
  isOriginalRun,
  productionTimeline,
  projectSchedule,
  validateProduction,
  type RunAnalysis,
  type ValidationIssue,
} from "./validation";

export type ProductionStatus = "upcoming" | "airing" | "finished" | "released" | "undated";

export interface ProductionSummary {
  id: string;
  slug: string;
  title: string;
  title_native: string | null;
  title_romaji: string | null;
  format: ProductionFormat;
  provenance: Provenance;
  studios: { slug: string; name: string }[];
  premiere: SeasonKey | null;
  premiere_year: number | null;
  premiere_date: ISODate | null;
  finale_date: ISODate | null;
  episode_count: number | null;
  runtime_minutes: number | null;
  genres: string[];
  score: number | null;
  status: ProductionStatus;
  network: string | null;
  weekday: number | null;
  weekday_derived: boolean;
  local_time: string | null;
  time_zone: string | null;
  franchise: { slug: string; name: string } | null;
  season_number: number | null;
  poster_url: string | null;
  cours: number;
  open_conflicts: number;
  director: string | null;
}

export function productionStatus(p: Production, today: ISODate): ProductionStatus {
  if (!p.premiere_date) return "undated";
  if (p.premiere_date > today) return "upcoming";
  if (p.format === "film") return "released";
  if (!p.finale_date || p.finale_date >= today) return p.finale_date === p.premiere_date ? "released" : "airing";
  return "finished";
}

export function premiereSeasonOf(p: Production): SeasonKey | null {
  if (p.premiere_year !== null && p.premiere_season) return { year: p.premiere_year, season: p.premiere_season };
  if (p.premiere_date) return seasonOfDate(p.premiere_date);
  return null;
}

function primaryRun(runs: BroadcastRun[]): BroadcastRun | undefined {
  const original = runs.filter(isOriginalRun);
  return original.find((r) => r.is_primary) ?? original[0];
}

export function summarizeProduction(index: ArchiveIndex, p: Production, today: ISODate): ProductionSummary {
  const runs = index.runsFor(p.id);
  const run = primaryRun(runs);
  const franchise = p.franchise_id ? index.franchisesById.get(p.franchise_id) : undefined;
  const network = run?.network_id ? index.companiesById.get(run.network_id)?.name ?? null : null;
  const derivedWeekday = run?.cadence === "weekly" && run.start_date ? weekdayOf(run.start_date) : null;
  const director = index.creditsFor(p.id).find((c) => c.credit.role === "director")?.person.name ?? null;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    title_native: p.title_native,
    title_romaji: p.title_romaji,
    format: p.format,
    provenance: p.provenance,
    studios: index.studiosFor(p.id).map(({ studio }) => ({ slug: studio.slug, name: studio.name })),
    premiere: premiereSeasonOf(p),
    premiere_year: p.premiere_year ?? (p.premiere_date ? yearOf(p.premiere_date) : null),
    premiere_date: p.premiere_date,
    finale_date: p.finale_date,
    episode_count: p.episode_count,
    runtime_minutes: p.runtime_minutes,
    genres: p.genres,
    score: p.score,
    status: productionStatus(p, today),
    network,
    weekday: run?.weekday ?? derivedWeekday,
    weekday_derived: run?.weekday == null && derivedWeekday !== null,
    local_time: run?.local_time ?? null,
    time_zone: run?.time_zone ?? null,
    franchise: franchise ? { slug: franchise.slug, name: franchise.name } : null,
    season_number: p.season_number,
    poster_url: p.poster_url,
    cours: productionTimeline(p, runs).cours,
    open_conflicts: index.openConflictCount("production", p.id),
    director,
  };
}

function byPremiere(a: Production, b: Production) {
  return compareISODate(a.premiere_date, b.premiere_date) || a.title.localeCompare(b.title);
}

// ── Seasons ────────────────────────────────────────────────────────────────

export interface SeasonListing {
  key: SeasonKey;
  premieres: ProductionSummary[];
  continuing: ProductionSummary[];
}

export function getSeasonListing(index: ArchiveIndex, key: SeasonKey, today: ISODate): SeasonListing {
  const premieres: Production[] = [];
  const continuing: Production[] = [];
  const target = seasonIndex(key);
  for (const p of index.tables.productions) {
    if (p.provenance === "superseded") continue;
    const premiere = premiereSeasonOf(p);
    if (!premiere) continue;
    if (seasonIndex(premiere) === target) {
      premieres.push(p);
      continue;
    }
    if (seasonIndex(premiere) < target) {
      const timeline = productionTimeline(p, index.runsFor(p.id));
      if (timeline.continuing.some((s) => seasonIndex(s) === target)) continuing.push(p);
    }
  }
  return {
    key,
    premieres: premieres.sort(byPremiere).map((p) => summarizeProduction(index, p, today)),
    continuing: continuing.sort(byPremiere).map((p) => summarizeProduction(index, p, today)),
  };
}

export interface CalendarCell {
  season: SeasonName;
  count: number;
  confirmed: number;
  continuing: number;
  highlights: string[];
}

export interface CalendarYear {
  year: number;
  seasons: CalendarCell[];
  total: number;
}

export function getSeasonCalendar(index: ArchiveIndex): CalendarYear[] {
  const cells = new Map<number, CalendarCell>();
  const cell = (key: SeasonKey) => {
    const i = seasonIndex(key);
    let c = cells.get(i);
    if (!c) {
      c = { season: key.season, count: 0, confirmed: 0, continuing: 0, highlights: [] };
      cells.set(i, c);
    }
    return c;
  };

  const sorted = [...index.tables.productions].filter((p) => p.provenance !== "superseded").sort(byPremiere);
  for (const p of sorted) {
    const premiere = premiereSeasonOf(p);
    if (!premiere) continue;
    const c = cell(premiere);
    c.count += 1;
    if (p.provenance === "confirmed") c.confirmed += 1;
    if (c.highlights.length < 3) c.highlights.push(p.title);
    for (const s of productionTimeline(p, index.runsFor(p.id)).continuing) cell(s).continuing += 1;
  }

  const years: CalendarYear[] = [];
  for (let year = CALENDAR_END_YEAR; year >= ARCHIVE_START_YEAR; year--) {
    const seasons = SEASONS.map((season) => cells.get(seasonIndex({ year, season })) ?? { season, count: 0, confirmed: 0, continuing: 0, highlights: [] });
    years.push({ year, seasons, total: seasons.reduce((n, s) => n + s.count, 0) });
  }
  return years;
}

// ── Browse & search ────────────────────────────────────────────────────────

export interface BrowseFilters {
  q?: string;
  year?: number;
  decade?: number;
  season?: SeasonName;
  format?: ProductionFormat;
  genre?: string;
  studio?: string;
  provenance?: Provenance;
  sort?: "premiere" | "premiere_desc" | "title" | "score" | "episodes";
}

export function matchesQuery(haystack: (string | null | undefined)[], q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return haystack.some((h) => h?.toLowerCase().includes(needle));
}

export function browseProductions(index: ArchiveIndex, filters: BrowseFilters, today: ISODate): ProductionSummary[] {
  const studio = filters.studio ? index.studiosBySlug.get(filters.studio) : undefined;
  const studioProductions = studio ? new Set(index.productionLinksForStudio(studio.id).map((l) => l.production.id)) : null;

  const rows = index.tables.productions.filter((p) => {
    const year = p.premiere_year ?? (p.premiere_date ? yearOf(p.premiere_date) : null);
    const premiere = premiereSeasonOf(p);
    if (filters.q && !matchesQuery([p.title, p.title_native, p.title_romaji, ...p.alt_titles], filters.q)) return false;
    if (filters.year && year !== filters.year) return false;
    if (filters.decade && (year === null || decadeOf(year) !== filters.decade)) return false;
    if (filters.season && premiere?.season !== filters.season) return false;
    if (filters.format && p.format !== filters.format) return false;
    if (filters.genre && !p.genres.includes(filters.genre)) return false;
    if (studioProductions && !studioProductions.has(p.id)) return false;
    if (filters.provenance && p.provenance !== filters.provenance) return false;
    return true;
  });

  const sorters: Record<NonNullable<BrowseFilters["sort"]>, (a: Production, b: Production) => number> = {
    premiere: byPremiere,
    premiere_desc: (a, b) => -byPremiere(a, b),
    title: (a, b) => a.title.localeCompare(b.title),
    score: (a, b) => (b.score ?? -1) - (a.score ?? -1) || byPremiere(a, b),
    episodes: (a, b) => (b.episode_count ?? -1) - (a.episode_count ?? -1) || byPremiere(a, b),
  };
  return rows.sort(sorters[filters.sort ?? "premiere_desc"]).map((p) => summarizeProduction(index, p, today));
}

export function allGenres(index: ArchiveIndex): string[] {
  return [...new Set(index.tables.productions.flatMap((p) => p.genres))].sort();
}

export interface SearchResults {
  productions: ProductionSummary[];
  people: Person[];
  studios: Studio[];
  franchises: { slug: string; name: string; name_native: string | null; entries: number }[];
  tracks: { slug: string; title: string; performers: string[] }[];
}

export function searchArchive(index: ArchiveIndex, q: string, today: ISODate, limit = 24): SearchResults {
  const t = index.tables;
  if (!q.trim()) return { productions: [], people: [], studios: [], franchises: [], tracks: [] };
  return {
    productions: t.productions
      .filter((p) => matchesQuery([p.title, p.title_native, p.title_romaji, ...p.alt_titles], q))
      .sort(byPremiere)
      .slice(0, limit)
      .map((p) => summarizeProduction(index, p, today)),
    people: t.people.filter((p) => matchesQuery([p.name, p.name_native, ...p.aliases], q)).slice(0, limit),
    studios: t.studios.filter((s) => matchesQuery([s.name, s.name_native], q)).slice(0, limit),
    franchises: t.franchises
      .filter((f) => matchesQuery([f.name, f.name_native], q))
      .slice(0, limit)
      .map((f) => ({ slug: f.slug, name: f.name, name_native: f.name_native, entries: index.franchiseEntries(f.id).length })),
    tracks: t.music_tracks
      .filter((m) => matchesQuery([m.title, m.title_native], q))
      .slice(0, limit)
      .map((m) => ({
        slug: m.slug,
        title: m.title,
        performers: index.trackCredits(m.id).filter((c) => c.credit.role === "performer").map((c) => c.person.name),
      })),
  };
}

// ── Homepage ───────────────────────────────────────────────────────────────

export interface Anniversary {
  production: ProductionSummary;
  years: number;
  date: ISODate;
  milestone: boolean;
}

export function getAnniversaries(index: ArchiveIndex, today: ISODate, windowDays = 21): Anniversary[] {
  const year = yearOf(today);
  const out: Anniversary[] = [];
  for (const p of index.tables.productions) {
    if (!p.premiere_date || p.provenance === "superseded") continue;
    const years = year - yearOf(p.premiere_date);
    if (years <= 0) continue;
    const thisYear = `${year}${p.premiere_date.slice(4)}`;
    if (p.premiere_date.slice(5) === "02-29") continue;
    const distance = Math.abs(daysBetween(today, thisYear));
    if (distance > windowDays) continue;
    out.push({ production: summarizeProduction(index, p, today), years, date: thisYear, milestone: years % 5 === 0 });
  }
  return out.sort((a, b) => Number(b.milestone) - Number(a.milestone) || (a.date < b.date ? -1 : 1));
}

export function getUpcoming(index: ArchiveIndex, today: ISODate, limit = 8): ProductionSummary[] {
  return index.tables.productions
    .filter((p) => p.premiere_date && p.premiere_date > today && p.provenance !== "superseded")
    .sort(byPremiere)
    .slice(0, limit)
    .map((p) => summarizeProduction(index, p, today));
}

export function getConfirmedHighlights(index: ArchiveIndex, today: ISODate): ProductionSummary[] {
  return index.tables.productions
    .filter((p) => p.provenance === "confirmed")
    .sort(byPremiere)
    .map((p) => summarizeProduction(index, p, today));
}

export function getRecentlyAdded(index: ArchiveIndex, today: ISODate, limit = 8): ProductionSummary[] {
  return [...index.tables.productions]
    .sort(
      (a, b) =>
        (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0) ||
        PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance] ||
        -byPremiere(a, b),
    )
    .slice(0, limit)
    .map((p) => summarizeProduction(index, p, today));
}

export interface FranchiseSummary {
  slug: string;
  name: string;
  name_native: string | null;
  description: string | null;
  provenance: Provenance;
  entries: number;
  first_year: number | null;
  last_year: number | null;
  studios: string[];
  average_score: number | null;
  formats: ProductionFormat[];
  lead: ProductionSummary | null;
}

export function summarizeFranchises(index: ArchiveIndex, today: ISODate): FranchiseSummary[] {
  return index.tables.franchises
    .map((f) => {
      const entries = index.franchiseEntries(f.id);
      const years = entries.map((e) => e.premiere_year ?? (e.premiere_date ? yearOf(e.premiere_date) : null)).filter((y): y is number => y !== null);
      const scores = entries.map((e) => e.score).filter((s): s is number => s !== null);
      const studios = [...new Set(entries.flatMap((e) => index.studiosFor(e.id).map((s) => s.studio.name)))];
      return {
        slug: f.slug,
        name: f.name,
        name_native: f.name_native,
        description: f.description,
        provenance: f.provenance,
        entries: entries.length,
        first_year: years.length ? Math.min(...years) : null,
        last_year: years.length ? Math.max(...years) : null,
        studios,
        average_score: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
        formats: [...new Set(entries.map((e) => e.format))],
        lead: entries[0] ? summarizeProduction(index, entries[0], today) : null,
      };
    })
    .sort(
      (a, b) =>
        PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance] ||
        b.entries - a.entries ||
        (b.average_score ?? 0) - (a.average_score ?? 0),
    );
}

export interface StudioSummary {
  slug: string;
  name: string;
  name_native: string | null;
  provenance: Provenance;
  founded_year: number | null;
  location: string | null;
  animation_style: string | null;
  productions: number;
  first_year: number | null;
  latest: ProductionSummary | null;
}

export function summarizeStudios(index: ArchiveIndex, today: ISODate): StudioSummary[] {
  return index.tables.studios
    .map((s) => {
      const productions = index.productionLinksForStudio(s.id).map((l) => l.production).sort(byPremiere);
      const years = productions.map((p) => p.premiere_year).filter((y): y is number => y !== null);
      return {
        slug: s.slug,
        name: s.name,
        name_native: s.name_native,
        provenance: s.provenance,
        founded_year: s.founded_year,
        location: s.location,
        animation_style: s.animation_style,
        productions: productions.length,
        first_year: years.length ? Math.min(...years) : null,
        latest: productions.length ? summarizeProduction(index, productions.at(-1)!, today) : null,
      };
    })
    .sort((a, b) => PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance] || b.productions - a.productions || a.name.localeCompare(b.name));
}

export interface YearCount {
  year: number;
  count: number;
}

export function getYearCounts(index: ArchiveIndex): { years: YearCount[]; decades: { decade: number; count: number }[] } {
  const counts = new Map<number, number>();
  for (const p of index.tables.productions) {
    const year = p.premiere_year ?? (p.premiere_date ? yearOf(p.premiere_date) : null);
    if (year === null) continue;
    counts.set(year, (counts.get(year) ?? 0) + 1);
  }
  const years: YearCount[] = [];
  for (let y = ARCHIVE_START_YEAR; y <= CALENDAR_END_YEAR; y++) years.push({ year: y, count: counts.get(y) ?? 0 });
  const decadeMap = new Map<number, number>();
  for (const { year, count } of years) decadeMap.set(decadeOf(year), (decadeMap.get(decadeOf(year)) ?? 0) + count);
  return { years, decades: [...decadeMap].map(([decade, count]) => ({ decade, count })) };
}

// ── Production detail ──────────────────────────────────────────────────────

export interface RunView {
  run: BroadcastRun;
  network: string | null;
  analysis: RunAnalysis;
  projected: { number: number; date: ISODate }[];
  releases: { number: number; date: ISODate; time: string | null }[];
}

export function getProductionDetail(index: ArchiveIndex, slug: string, today: ISODate) {
  const production = index.productionsBySlug.get(slug);
  if (!production) return null;

  const runs = index.runsFor(production.id);
  const episodes = index.episodesFor(production.id);

  const runViews: RunView[] = runs.map((run) => {
    const releases = index
      .releasesForRun(run.id)
      .map((release) => ({ release, episode: index.episodesById.get(release.episode_id)! }))
      .filter((r) => r.episode);
    const analysis = analyzeBroadcastRun(run, releases);
    const firstNumber = production.format === "tv_special" && production.title.includes("Episode 0") ? 0 : 1;
    return {
      run,
      network: run.network_id ? index.companiesById.get(run.network_id)?.name ?? null : null,
      analysis,
      projected: releases.length ? [] : projectSchedule(run, { firstNumber }),
      releases: releases
        .map(({ release, episode }) => ({ number: episode.number, date: release.air_date, time: release.air_time }))
        .sort((a, b) => a.number - b.number),
    };
  });

  const credits = index.creditsFor(production.id);
  const departments = CREDIT_DEPARTMENTS.map((dept) => ({
    label: dept.label,
    roles: dept.roles
      .map((role) => ({
        role,
        people: credits.filter((c) => c.credit.role === role).map((c) => ({ ...c.person, role_detail: c.credit.role_detail, credit_id: c.credit.id, provenance: c.credit.provenance })),
      }))
      .filter((r) => r.people.length > 0),
  })).filter((d) => d.roles.length > 0);

  const cast = index.castFor(production.id).map((c) => ({ ...c.credit, person: c.person }));
  const themes = index
    .themesFor(production.id)
    .map(({ theme, track, credits: trackCredits }) => ({
      theme,
      track,
      performers: trackCredits.filter((c) => c.credit.role === "performer").map((c) => ({ slug: c.person.slug, name: c.credit.credited_as ?? c.person.name })),
      composers: trackCredits.filter((c) => c.credit.role === "composer").map((c) => ({ slug: c.person.slug, name: c.person.name })),
      label: track.label_id ? index.companiesById.get(track.label_id)?.name ?? null : null,
    }))
    .sort((a, b) => ["opening", "ending", "insert", "image_song", "soundtrack"].indexOf(a.theme.usage) - ["opening", "ending", "insert", "image_song", "soundtrack"].indexOf(b.theme.usage) || (a.theme.sequence ?? 0) - (b.theme.sequence ?? 0));

  const franchise = production.franchise_id ? index.franchisesById.get(production.franchise_id) ?? null : null;
  const franchiseEntries = franchise ? index.franchiseEntries(franchise.id).map((p) => summarizeProduction(index, p, today)) : [];

  const issues: ValidationIssue[] = [...validateProduction(production, runs, episodes), ...runViews.flatMap((r) => r.analysis.issues)];

  const facts = index.factSources("production", production.id);
  const documents = new Map<string, { id: string; title: string; kind: string; received_at: string; fields: (string | null)[] }>();
  const collect = (entries: ReturnType<ArchiveIndex["factSources"]>) => {
    for (const { fact, document } of entries) {
      if (!document) continue;
      const doc = documents.get(document.id) ?? { id: document.id, title: document.title, kind: document.kind, received_at: document.received_at, fields: [] };
      if (!doc.fields.includes(fact.field)) doc.fields.push(fact.field);
      documents.set(document.id, doc);
    }
  };
  collect(facts);
  for (const run of runs) collect(index.factSources("broadcast_run", run.id));

  return {
    production,
    summary: summarizeProduction(index, production, today),
    timeline: productionTimeline(production, runs),
    franchise,
    franchiseEntries,
    studios: index.studiosFor(production.id),
    companies: index.companiesFor(production.id),
    runs: runViews,
    episodes: episodes.map((e) => ({
      ...e,
      releases: index.releasesForEpisode(e.id).map((r) => ({ ...r, run: index.runsById.get(r.broadcast_run_id) ?? null })),
    })),
    departments,
    keyStaff: (["director", "series_composition", "character_design", "music"] as CreditRole[])
      .map((role) => ({ role, people: credits.filter((c) => c.credit.role === role).map((c) => c.person) }))
      .filter((r) => r.people.length > 0),
    cast: {
      ja: cast.filter((c) => c.language === "ja"),
      en: cast.filter((c) => c.language === "en"),
      other: cast.filter((c) => c.language !== "ja" && c.language !== "en"),
    },
    themes,
    related: index.relatedFor(production.id).map((r) => ({ ...r, summary: summarizeProduction(index, r.production, today) })),
    issues,
    sources: [...documents.values()],
    fieldSources: facts.map(({ fact, document }) => ({ field: fact.field, document: document?.title ?? "Unknown document" })),
    revisions: index.revisions("production", production.id),
    conflicts: index.conflicts("production", production.id),
  };
}

export type ProductionDetail = NonNullable<ReturnType<typeof getProductionDetail>>;

// ── Studios ────────────────────────────────────────────────────────────────

export function getStudioDetail(index: ArchiveIndex, slug: string, today: ISODate) {
  const studio = index.studiosBySlug.get(slug);
  if (!studio) return null;

  const links = index.productionLinksForStudio(studio.id).sort((a, b) => byPremiere(a.production, b.production));
  const productionIds = new Set(links.map((l) => l.production.id));

  // Key staff: people with the most credits on this studio's productions.
  const staff = new Map<string, { person: Person; roles: Set<CreditRole>; productions: Set<string> }>();
  for (const { production } of links) {
    for (const { credit, person } of index.creditsFor(production.id)) {
      const entry = staff.get(person.id) ?? { person, roles: new Set(), productions: new Set() };
      entry.roles.add(credit.role);
      entry.productions.add(production.id);
      staff.set(person.id, entry);
    }
  }
  const keyStaff = [...staff.values()]
    .sort((a, b) => b.productions.size - a.productions.size || a.person.name.localeCompare(b.person.name))
    .slice(0, 12)
    .map((s) => ({ person: s.person, roles: [...s.roles], productions: s.productions.size }));

  // Collaborations: other studios on the same productions, plus franchise hand-offs.
  const collaborations = new Map<string, { studio: Studio; shared: Set<string>; handoffs: string[] }>();
  for (const { production } of links) {
    for (const { studio: other } of index.studiosFor(production.id)) {
      if (other.id === studio.id) continue;
      const entry = collaborations.get(other.id) ?? { studio: other, shared: new Set(), handoffs: [] };
      entry.shared.add(production.title);
      collaborations.set(other.id, entry);
    }
    if (production.franchise_id) {
      for (const sibling of index.franchiseEntries(production.franchise_id)) {
        if (productionIds.has(sibling.id)) continue;
        for (const { studio: other } of index.studiosFor(sibling.id)) {
          if (other.id === studio.id) continue;
          const entry = collaborations.get(other.id) ?? { studio: other, shared: new Set(), handoffs: [] };
          const franchise = index.franchisesById.get(production.franchise_id)!;
          const note = `${franchise.name}`;
          if (!entry.handoffs.includes(note)) entry.handoffs.push(note);
          collaborations.set(other.id, entry);
        }
      }
    }
  }

  // Staff transitions: people whose credits move between this studio and another one.
  const transitions: { person: Person; direction: "joined" | "moved"; other: Studio; year: number | null; via: string }[] = [];
  for (const { person } of staff.values()) {
    const history = index
      .creditsForPerson(person.id)
      .map(({ production }) => ({ production, studios: index.studiosFor(production.id).map((s) => s.studio) }))
      .filter((h) => h.production.premiere_date || h.production.premiere_year)
      .sort((a, b) => byPremiere(a.production, b.production));
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const next = history[i];
      const prevHere = prev.studios.some((s) => s.id === studio.id);
      const nextHere = next.studios.some((s) => s.id === studio.id);
      if (prevHere && !nextHere && next.studios[0]) {
        transitions.push({ person, direction: "moved", other: next.studios[0], year: next.production.premiere_year, via: next.production.title });
      } else if (!prevHere && nextHere && prev.studios[0]) {
        transitions.push({ person, direction: "joined", other: prev.studios[0], year: next.production.premiere_year, via: next.production.title });
      }
    }
  }

  return {
    studio,
    filmography: links.map((l) => ({ role: l.link.role, summary: summarizeProduction(index, l.production, today) })),
    keyStaff,
    collaborations: [...collaborations.values()].map((c) => ({ studio: c.studio, shared: [...c.shared], handoffs: c.handoffs })),
    transitions: transitions.sort((a, b) => (a.year ?? 0) - (b.year ?? 0)),
    sources: index.factSources("studio", studio.id),
    revisions: index.revisions("studio", studio.id),
  };
}

// ── People ─────────────────────────────────────────────────────────────────

export function getPersonDetail(index: ArchiveIndex, slug: string, today: ISODate) {
  const person = index.peopleBySlug.get(slug);
  if (!person) return null;

  const credits = new Map<string, { summary: ProductionSummary; roles: { role: CreditRole; detail: string | null }[] }>();
  for (const { credit, production } of index.creditsForPerson(person.id)) {
    const entry = credits.get(production.id) ?? { summary: summarizeProduction(index, production, today), roles: [] };
    entry.roles.push({ role: credit.role, detail: credit.role_detail });
    credits.set(production.id, entry);
  }
  const staffCredits = [...credits.values()].sort((a, b) => compareISODate(a.summary.premiere_date, b.summary.premiere_date));

  const castCredits = index
    .castForPerson(person.id)
    .map(({ credit, production }) => ({ credit, summary: summarizeProduction(index, production, today) }))
    .sort((a, b) => compareISODate(a.summary.premiere_date, b.summary.premiere_date));

  const music = index.trackCreditsForPerson(person.id).map(({ credit, track }) => ({
    credit,
    track,
    usages: index.usagesForTrack(track.id).map((u) => ({ usage: u.theme.usage, production: { slug: u.production.slug, title: u.production.title } })),
  }));

  const studios = new Map<string, { studio: Studio; count: number }>();
  for (const { summary } of [...staffCredits, ...castCredits]) {
    for (const s of summary.studios) {
      const studio = index.studiosBySlug.get(s.slug);
      if (!studio) continue;
      const entry = studios.get(studio.id) ?? { studio, count: 0 };
      entry.count += 1;
      studios.set(studio.id, entry);
    }
  }

  const years = [...staffCredits, ...castCredits].map((c) => c.summary.premiere_year).filter((y): y is number => y !== null);

  return {
    person,
    staffCredits,
    castCredits,
    music,
    studios: [...studios.values()].sort((a, b) => b.count - a.count),
    active: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
    sources: index.factSources("person", person.id),
  };
}

// ── Franchises ─────────────────────────────────────────────────────────────

export function getFranchiseTimeline(index: ArchiveIndex, slug: string, today: ISODate) {
  const franchise = index.franchisesBySlug.get(slug);
  if (!franchise) return null;
  const entries = index.franchiseEntries(franchise.id);
  let previousStudios: string[] = [];
  const timeline = entries.map((p) => {
    const summary = summarizeProduction(index, p, today);
    const studios = summary.studios.map((s) => s.name);
    const studioChange = previousStudios.length > 0 && studios.length > 0 && studios[0] !== previousStudios[0] ? { from: previousStudios[0], to: studios[0] } : null;
    if (studios.length) previousStudios = studios;
    const credits = index.creditsFor(p.id);
    return {
      summary,
      studioChange,
      director: credits.filter((c) => c.credit.role === "director").map((c) => c.person),
      music: credits.filter((c) => c.credit.role === "music").map((c) => c.person),
      dub: index.runsFor(p.id).find((r) => r.kind === "dub") ?? null,
    };
  });
  const inside = new Set(entries.map((e) => e.id));
  const linked = entries
    .flatMap((e) => index.relatedFor(e.id))
    .filter((r) => !inside.has(r.production.id))
    .map((r) => ({ relation: r.relation, summary: summarizeProduction(index, r.production, today) }));

  const years = timeline.map((t) => t.summary.premiere_year).filter((y): y is number => y !== null);
  return {
    franchise,
    timeline,
    linked,
    span: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
    revisions: index.revisions("franchise", franchise.id),
  };
}

// ── Music ──────────────────────────────────────────────────────────────────

export interface MusicRow {
  slug: string;
  title: string;
  title_native: string | null;
  kind: string;
  provenance: Provenance;
  release_date: ISODate | null;
  release_year: number | null;
  label: string | null;
  performers: { slug: string; name: string }[];
  composers: { slug: string; name: string }[];
  usages: { usage: string; sequence: number | null; production: { slug: string; title: string; year: number | null } }[];
}

export function getMusicArchive(index: ArchiveIndex): MusicRow[] {
  return index.tables.music_tracks
    .map((track) => {
      const credits = index.trackCredits(track.id);
      const usages = index.usagesForTrack(track.id).map((u) => ({
        usage: u.theme.usage,
        sequence: u.theme.sequence,
        production: { slug: u.production.slug, title: u.production.title, year: u.production.premiere_year },
      }));
      return {
        slug: track.slug,
        title: track.title,
        title_native: track.title_native,
        kind: track.kind,
        provenance: track.provenance,
        release_date: track.release_date,
        release_year: track.release_year ?? usages[0]?.production.year ?? null,
        label: track.label_id ? index.companiesById.get(track.label_id)?.name ?? null : null,
        performers: credits.filter((c) => c.credit.role === "performer").map((c) => ({ slug: c.person.slug, name: c.credit.credited_as ?? c.person.name })),
        composers: credits.filter((c) => c.credit.role === "composer").map((c) => ({ slug: c.person.slug, name: c.person.name })),
        usages,
      };
    })
    .sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0) || a.title.localeCompare(b.title));
}

export interface ComposerRow {
  slug: string;
  name: string;
  name_native: string | null;
  provenance: Provenance;
  scores: { slug: string; title: string; year: number | null }[];
}

export function getComposers(index: ArchiveIndex): ComposerRow[] {
  const map = new Map<string, ComposerRow>();
  for (const credit of index.tables.production_credits) {
    if (credit.role !== "music") continue;
    const person = index.peopleById.get(credit.person_id);
    const production = index.productionsById.get(credit.production_id);
    if (!person || !production) continue;
    const row = map.get(person.id) ?? { slug: person.slug, name: person.name, name_native: person.name_native, provenance: person.provenance, scores: [] };
    row.scores.push({ slug: production.slug, title: production.title, year: production.premiere_year });
    map.set(person.id, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, scores: r.scores.sort((a, b) => (a.year ?? 0) - (b.year ?? 0)) }))
    .sort((a, b) => PROVENANCE_RANK[b.provenance] - PROVENANCE_RANK[a.provenance] || b.scores.length - a.scores.length || a.name.localeCompare(b.name));
}

// ── Misc ───────────────────────────────────────────────────────────────────

export function archiveStats(index: ArchiveIndex) {
  const t = index.tables;
  const byProvenance = new Map<Provenance, number>();
  for (const p of t.productions) byProvenance.set(p.provenance, (byProvenance.get(p.provenance) ?? 0) + 1);
  return {
    productions: t.productions.length,
    studios: t.studios.length,
    people: t.people.length,
    franchises: t.franchises.length,
    tracks: t.music_tracks.length,
    openConflicts: t.record_conflicts.filter((c) => c.status === "open").length,
    byProvenance,
  };
}

export function seasonsWithContent(index: ArchiveIndex): SeasonKey[] {
  const keys = new Map<number, SeasonKey>();
  for (const p of index.tables.productions) {
    const s = premiereSeasonOf(p);
    if (s) keys.set(seasonIndex(s), s);
  }
  return [...keys.values()].sort(compareSeasons);
}

export function monthDay(date: ISODate): string {
  return `${monthOf(date)}-${date.slice(8)}`;
}
