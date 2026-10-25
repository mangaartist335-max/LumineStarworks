// Date-aware queries over the archive catalogue.
//
// Every function takes `asOf`. Nothing returned may postdate that moment:
// entries, credits, facts, relations and snapshots all carry their own
// visibility timestamps.

import { anime } from "@/data/anime";
import { characters } from "@/data/characters";
import { companies, people } from "@/data/industry";
import { manga } from "@/data/manga";
import { news, seedRecommendations, seedReviews } from "@/data/community";
import type {
  Anime,
  Character,
  Company,
  Episode,
  Manga,
  NewsItem,
  Person,
  ScoreSnapshot,
} from "@/data/types";
import { happened, ms, addDays, zoneParts, type Season, seasonOf } from "./time";

const animeById = new Map(anime.map((a) => [a.id, a]));
const characterById = new Map(characters.map((c) => [c.id, c]));
const personById = new Map(people.map((p) => [p.id, p]));
const companyById = new Map(companies.map((c) => [c.id, c]));
const mangaById = new Map(manga.map((m) => [m.id, m]));

export const allAnime = anime;
export const allCharacters = characters;
export const allPeople = people;
export const allCompanies = companies;
export const allManga = manga;

// ── URLs ─────────────────────────────────────────────────────────────────

/** Profile URL. Entries whose page is being planned have no tabs yet, so tab links go to the entry itself. */
export const animeUrl = (a: Pick<Anime, "id" | "slug" | "pagePlanned">, tab?: string) =>
  `/anime/${a.id}/${a.slug}${tab && !a.pagePlanned ? `/${tab}` : ""}`;
export const mangaUrl = (m: Pick<Manga, "id" | "slug">) => `/manga/${m.id}/${m.slug}`;
export const characterUrl = (c: Pick<Character, "id" | "slug">) => `/character/${c.id}/${c.slug}`;
export const personUrl = (p: Pick<Person, "id" | "slug">) => `/people/${p.id}/${p.slug}`;
export const companyUrl = (c: Pick<Company, "id" | "slug">) => `/company/${c.id}/${c.slug}`;
export const newsUrl = (n: Pick<NewsItem, "id" | "slug">) => `/news/${n.id}/${n.slug}`;

// ── Anime ────────────────────────────────────────────────────────────────

export function visibleAnime(asOf: string): Anime[] {
  return anime.filter((a) => happened(a.visibleFrom, asOf));
}

export function getAnime(id: number, asOf: string): Anime | null {
  const a = animeById.get(id);
  return a && happened(a.visibleFrom, asOf) ? a : null;
}

/** Look up an entry regardless of date (for "not yet in the database" messages). */
export function getAnimeAnyTime(id: number): Anime | null {
  return animeById.get(id) ?? null;
}

export type AiringStatus = "Not yet aired" | "Currently Airing" | "Finished Airing" | "Not documented";

export function animeStatus(a: Anime, asOf: string): AiringStatus {
  if (a.airedFrom) {
    if (!happened(a.airedFrom, asOf)) return "Not yet aired";
    if (a.airedTo && happened(addDays(a.airedTo, 1), asOf)) return "Finished Airing";
    if (a.airedTo && a.type !== "TV") return "Finished Airing";
    return "Currently Airing";
  }
  const year = zoneParts(asOf).y;
  if (a.year !== null && a.year < year) return "Finished Airing";
  return "Not documented";
}

export function animeYear(a: Anime): number | null {
  if (a.year !== null) return a.year;
  return a.airedFrom ? zoneParts(a.airedFrom).y : null;
}

/** Archived episodes that had aired by asOf. */
export function airedEpisodes(a: Anime, asOf: string): Episode[] {
  return a.episodeList.filter((e) => e.airedAt && happened(e.airedAt, asOf));
}

/**
 * The next weekly slot after the last archived episode, derived from the
 * documented weekly schedule. Returns null when it cannot be derived.
 */
export function nextEpisodeSlot(a: Anime, asOf: string): { number: number; at: string; aired: boolean } | null {
  // A scheduled episode in the list comes first (its title stays hidden).
  const upcoming = a.episodeList.find((e) => e.airedAt && !happened(e.airedAt, asOf));
  if (upcoming && a.type === "TV") return { number: upcoming.number, at: upcoming.airedAt!, aired: false };
  if (!a.weeklyFrom || a.episodeList.length === 0) return null;
  const last = a.episodeList[a.episodeList.length - 1];
  if (!last.airedAt || !happened(last.airedAt, asOf)) return null;
  if (a.episodesPlanned !== null && last.number >= a.episodesPlanned) return null;
  const at = addDays(last.airedAt, 7);
  return { number: last.number + 1, at, aired: happened(at, asOf) };
}

export function latestScore(a: Anime, asOf: string): ScoreSnapshot | null {
  const visible = a.scores.filter((s) => happened(s.capturedAt, asOf));
  return visible.length ? visible[visible.length - 1] : null;
}

export function animeLicensors(a: Anime, asOf: string): Company[] {
  return a.licensors
    .filter((l) => happened(l.visibleFrom, asOf))
    .map((l) => companyById.get(l.companyId))
    .filter((c): c is Company => Boolean(c));
}

export function animeCompanies(ids: number[], asOf: string): Company[] {
  return ids
    .map((id) => companyById.get(id))
    .filter((c): c is Company => Boolean(c) && happened(c!.visibleFrom, asOf));
}

export function animeStaff(a: Anime, asOf: string) {
  return a.staff
    .filter((s) => happened(s.visibleFrom ?? a.visibleFrom, asOf))
    .map((s) => ({ ...s, person: personById.get(s.personId)! }))
    .filter((s) => s.person && happened(s.person.visibleFrom, asOf));
}

export function animeCharacters(a: Anime, asOf: string) {
  return a.characters
    .map((c) => ({ ...c, character: characterById.get(c.characterId)! }))
    .filter((c) => c.character && happened(c.visibleFrom ?? c.character.visibleFrom, asOf))
    .map((c) => ({
      ...c,
      voices: a.voices
        .filter((v) => v.characterId === c.characterId && happened(v.visibleFrom ?? c.character.visibleFrom, asOf))
        .map((v) => ({ ...v, person: personById.get(v.personId)! })),
    }));
}

export function animeRelations(a: Anime, asOf: string) {
  return a.relations
    .filter((r) => happened(r.visibleFrom ?? null, asOf))
    .map((r) => {
      if (r.target.type === "anime") {
        const t = getAnime(r.target.id, asOf);
        return t ? { kind: r.kind, note: r.note, title: t.title, url: animeUrl(t), type: t.type as string } : null;
      }
      const m = getManga(r.target.id, asOf);
      return m ? { kind: r.kind, note: r.note, title: m.title, url: mangaUrl(m), type: m.type as string } : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
}

export function visibleBackground(a: Anime, asOf: string): string[] {
  return a.background.filter((b) => happened(b.visibleFrom, asOf)).map((b) => b.text);
}

export function visibleThemeSongs(a: Anime, asOf: string) {
  return a.themesSongs.filter((t) => happened(t.visibleFrom, asOf));
}

export function visibleBroadcasts(a: Anime, asOf: string) {
  return a.broadcasts
    .filter((b) => happened(b.visibleFrom ?? a.visibleFrom, asOf))
    .map((b) => ({ ...b, scheduled: Boolean(b.at && !happened(b.at, asOf)) }));
}

/** Entries premiering in a given season (TV and films with a premiere season). */
export function seasonalAnime(year: number, season: Season, asOf: string): { premiering: Anime[]; continuing: Anime[] } {
  const visible = visibleAnime(asOf);
  const premiering = visible.filter((a) => a.premiered && a.premiered.year === year && a.premiered.season === season);
  const startIdx = year * 4 + ["winter", "spring", "summer", "fall"].indexOf(season);
  const continuing = visible.filter((a) => {
    if (!a.airedFrom || premiering.includes(a)) return false;
    const s = seasonOf(a.airedFrom);
    const from = s.year * 4 + ["winter", "spring", "summer", "fall"].indexOf(s.season);
    if (from >= startIdx) return false;
    if (!a.airedTo) return a.type === "TV";
    const e = seasonOf(a.airedTo);
    const to = e.year * 4 + ["winter", "spring", "summer", "fall"].indexOf(e.season);
    return to >= startIdx;
  });
  return { premiering, continuing };
}

/** Specials, OVAs and one-off releases dated within the season. */
export function seasonalOthers(year: number, season: Season, asOf: string): Anime[] {
  return visibleAnime(asOf).filter((a) => {
    if (a.premiered || !a.airedFrom) return false;
    const s = seasonOf(a.airedFrom);
    return s.year === year && s.season === season;
  });
}

// ── Characters ───────────────────────────────────────────────────────────

export function getCharacter(id: number, asOf: string): Character | null {
  const c = characterById.get(id);
  return c && happened(c.visibleFrom, asOf) ? c : null;
}

export function visibleCharacters(asOf: string): Character[] {
  return characters.filter((c) => happened(c.visibleFrom, asOf));
}

export function characterFacts(c: Character, asOf: string): string[] {
  return c.bio.filter((f) => happened(f.revealedAt, asOf)).map((f) => f.text);
}

export function characterRelationships(c: Character, asOf: string) {
  return c.relationships
    .filter((r) => happened(r.revealedAt, asOf))
    .map((r) => ({ ...r, character: getCharacter(r.characterId, asOf) }))
    .filter((r): r is typeof r & { character: Character } => Boolean(r.character));
}

export function characterAppearances(c: Character, asOf: string) {
  return visibleAnime(asOf)
    .map((a) => {
      const link = a.characters.find((x) => x.characterId === c.id);
      if (!link) return null;
      const voices = a.voices
        .filter((v) => v.characterId === c.id && happened(v.visibleFrom ?? c.visibleFrom, asOf))
        .map((v) => ({ ...v, person: personById.get(v.personId)! }));
      return { anime: a, role: link.role, voices };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

// ── People & companies ───────────────────────────────────────────────────

export function getPerson(id: number, asOf: string): Person | null {
  const p = personById.get(id);
  return p && happened(p.visibleFrom, asOf) ? p : null;
}

export function visiblePeople(asOf: string): Person[] {
  return people.filter((p) => happened(p.visibleFrom, asOf));
}

export function personStaffCredits(p: Person, asOf: string) {
  return visibleAnime(asOf).flatMap((a) =>
    a.staff
      .filter((s) => s.personId === p.id && happened(s.visibleFrom ?? a.visibleFrom, asOf))
      .map((s) => ({ anime: a, role: s.role, note: s.note })),
  );
}

export function personVoiceCredits(p: Person, asOf: string) {
  return visibleAnime(asOf).flatMap((a) =>
    a.voices
      .filter((v) => v.personId === p.id)
      .map((v) => ({ anime: a, character: getCharacter(v.characterId, asOf), language: v.language }))
      .filter((v) => v.character),
  ) as { anime: Anime; character: Character; language: string }[];
}

export function personMangaCredits(p: Person, asOf: string) {
  return visibleManga(asOf).flatMap((m) =>
    m.authors.filter((au) => au.personId === p.id).map((au) => ({ manga: m, role: au.role })),
  );
}

export function getCompany(id: number, asOf: string): Company | null {
  const c = companyById.get(id);
  return c && happened(c.visibleFrom, asOf) ? c : null;
}

export function visibleCompanies(asOf: string): Company[] {
  return companies.filter((c) => happened(c.visibleFrom, asOf));
}

export function companyWorks(c: Company, asOf: string) {
  return visibleAnime(asOf)
    .map((a) => {
      const roles: string[] = [];
      if (a.studios.includes(c.id)) roles.push("Studio");
      if (a.producers.includes(c.id)) roles.push("Producer");
      if (a.licensors.some((l) => l.companyId === c.id && happened(l.visibleFrom, asOf))) roles.push("Licensor");
      return roles.length ? { anime: a, roles } : null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

// ── Manga ────────────────────────────────────────────────────────────────

export function visibleManga(asOf: string): Manga[] {
  return manga.filter((m) => happened(m.visibleFrom, asOf));
}

export function getManga(id: number, asOf: string): Manga | null {
  const m = mangaById.get(id);
  return m && happened(m.visibleFrom, asOf) ? m : null;
}

export function mangaRelations(m: Manga, asOf: string) {
  return m.relations
    .filter((r) => happened(r.visibleFrom ?? null, asOf))
    .map((r) => {
      const t = r.target.type === "anime" ? getAnime(r.target.id, asOf) : null;
      return t ? { kind: r.kind, title: t.title, url: animeUrl(t), type: t.type as string } : null;
    })
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
}

// ── News, reviews, recommendations (seeded) ──────────────────────────────

export function visibleNews(asOf: string): NewsItem[] {
  return news.filter((n) => happened(n.publishedAt, asOf)).sort((a, b) => ms(b.publishedAt) - ms(a.publishedAt));
}

export function getNews(id: number, asOf: string): NewsItem | null {
  const n = news.find((x) => x.id === id);
  return n && happened(n.publishedAt, asOf) ? n : null;
}

export function seedReviewsFor(asOf: string, animeId?: number) {
  return seedReviews
    .filter((r) => happened(r.postedAt, asOf) && (animeId === undefined || r.animeId === animeId))
    .sort((a, b) => ms(b.postedAt) - ms(a.postedAt));
}

export function seedRecommendationsFor(asOf: string, animeId?: number) {
  return seedRecommendations
    .filter((r) => {
      if (!happened(r.postedAt, asOf)) return false;
      if (!getAnime(r.from, asOf) || !getAnime(r.to, asOf)) return false;
      return animeId === undefined || r.from === animeId || r.to === animeId;
    })
    .sort((a, b) => ms(b.postedAt) - ms(a.postedAt));
}

export function relatedLink(r: { type: "anime" | "manga" | "company" | "person"; id: number }, asOf: string) {
  if (r.type === "anime") {
    const a = getAnime(r.id, asOf);
    return a ? { label: a.title, url: animeUrl(a) } : null;
  }
  if (r.type === "manga") {
    const m = getManga(r.id, asOf);
    return m ? { label: m.title, url: mangaUrl(m) } : null;
  }
  if (r.type === "company") {
    const c = getCompany(r.id, asOf);
    return c ? { label: c.name, url: companyUrl(c) } : null;
  }
  const p = getPerson(r.id, asOf);
  return p ? { label: p.name, url: personUrl(p) } : null;
}
