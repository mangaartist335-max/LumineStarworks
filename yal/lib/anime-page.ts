import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getAnime, getAnimeAnyTime } from "./catalog";
import { getViewer } from "./viewer";
import { formatAirDate, happened } from "./time";
import type { Anime } from "@/data/types";

export type AnimeLoad =
  | { state: "ok"; anime: Anime; asOf: string }
  | { state: "later"; title: string; listedAt: string; asOf: string };

/** Resolve an anime profile route for the viewed moment. */
export const loadAnime = cache(async (idParam: string): Promise<AnimeLoad> => {
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();
  const { asOf } = await getViewer();
  const anime = getAnime(id, asOf);
  if (anime) return { state: "ok", anime, asOf };
  const later = getAnimeAnyTime(id);
  if (later && later.visibleFrom) return { state: "later", title: later.title, listedAt: later.visibleFrom, asOf };
  notFound();
});

/** "Oct 5, 2013 to ?" / "Aug 15, 2011 to Jan 23, 2012" / "2005" / "Not documented". */
export function airedText(a: Anime, asOf: string): string {
  if (a.airedFrom) {
    const from = formatAirDate(a.airedFrom);
    if (a.airedTo && a.airedTo === a.airedFrom) return from;
    // A finale date is only shown once it has happened.
    if (a.airedTo && happened(a.airedTo, asOf)) return `${from} to ${formatAirDate(a.airedTo)}`;
    return `${from} to ?`;
  }
  if (a.releaseNote) return a.releaseNote;
  return "Not documented";
}

export function episodesText(a: Anime): string {
  return a.episodesPlanned !== null ? String(a.episodesPlanned) : "Unknown";
}
