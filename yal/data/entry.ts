// Helpers for writing catalogue entries.

import type { Anime, Episode } from "./types";

/** An anime record with empty defaults for everything not given. */
export function entry(e: Partial<Anime> & Pick<Anime, "id" | "slug" | "title">): Anime {
  return {
    synonyms: [],
    type: "Unknown",
    episodesPlanned: null,
    airedFrom: null,
    airedTo: null,
    year: null,
    broadcasts: [],
    studios: [],
    producers: [],
    licensors: [],
    source: null,
    genres: [],
    themes: [],
    duration: null,
    rating: null,
    synopsis: null,
    background: [],
    visibleFrom: null,
    staff: [],
    characters: [],
    voices: [],
    themesSongs: [],
    episodeList: [],
    relations: [],
    scores: [],
    provenance: "documented",
    sources: [],
    ...e,
  };
}

/** A weekly episode list: episode n airs (n - 1) weeks after the first. */
export function weekly(firstAiring: string, titles: string[]): Episode[] {
  const start = new Date(firstAiring).getTime();
  return titles.map((title, i) => ({
    number: i + 1,
    title,
    airedAt: new Date(start + i * 7 * 86400_000).toISOString(),
  }));
}

/** Air time of episode n in a weekly list. */
export function episodeAt(firstAiring: string, n: number): string {
  return new Date(new Date(firstAiring).getTime() + (n - 1) * 7 * 86400_000).toISOString();
}
