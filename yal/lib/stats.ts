import "server-only";
import type { Anime } from "@/data/types";
import { LIST_STATUSES, type ListStatus } from "./store/types";
import { entriesForAnime, favoritesCount } from "./members";
import { latestScore, visibleAnime } from "./catalog";

export interface AnimeStats {
  members: number;
  favorites: number;
  statusCounts: Record<ListStatus, number>;
  memberScores: { average: number | null; count: number; distribution: number[] };
  derivedWatchers: number;
}

export async function animeStats(animeId: number, asOf: string): Promise<AnimeStats> {
  const { live, derived } = await entriesForAnime(animeId, asOf);
  const statusCounts = Object.fromEntries(LIST_STATUSES.map((s) => [s, 0])) as Record<ListStatus, number>;
  for (const e of [...live, ...derived]) statusCounts[e.status]++;
  const scored = live.filter((e) => e.score !== null).map((e) => e.score!);
  const distribution = Array.from({ length: 10 }, (_, i) => scored.filter((s) => s === i + 1).length);
  return {
    members: live.length + derived.length,
    favorites: await favoritesCount("anime", animeId, asOf),
    statusCounts,
    memberScores: {
      average: scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 100) / 100 : null,
      count: scored.length,
      distribution,
    },
    derivedWatchers: derived.length,
  };
}

/** Popularity rank by member count among entries visible at asOf (only ranked when it has members). */
export async function popularityRank(anime: Anime, asOf: string): Promise<number | null> {
  const all = visibleAnime(asOf);
  const counts = await Promise.all(all.map(async (a) => ({ id: a.id, n: (await animeStats(a.id, asOf)).members })));
  const mine = counts.find((c) => c.id === anime.id);
  if (!mine || mine.n === 0) return null;
  return counts.filter((c) => c.n > mine.n).length + 1;
}

/**
 * Score rank needs a documented score from enough users. With archived
 * scores available for only a few titles, entries stay "N/A" like a fresh
 * 2013 listing until at least three titles qualify.
 */
export function scoreRank(anime: Anime, asOf: string): number | null {
  const scored = visibleAnime(asOf)
    .map((a) => ({ a, s: latestScore(a, asOf) }))
    .filter((x) => x.s && x.s.scoredBy >= 1000);
  if (scored.length < 3) return null;
  const mine = scored.find((x) => x.a.id === anime.id);
  if (!mine) return null;
  return scored.filter((x) => x.s!.score > mine.s!.score).length + 1;
}
