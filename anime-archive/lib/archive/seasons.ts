// Japanese broadcast seasons (cours):
//   Winter: January–March   Spring: April–June
//   Summer: July–September  Fall:   October–December

import { monthOf, yearOf } from "./dates";
import { SEASON_LABEL } from "./labels";
import { SEASONS, type ISODate, type SeasonName } from "./types";

export const ARCHIVE_START_YEAR = 2006;
export const ARCHIVE_END_YEAR = 2026;
/** The calendar also shows announcements for the season after the archive window. */
export const CALENDAR_END_YEAR = ARCHIVE_END_YEAR + 1;

export interface SeasonKey {
  year: number;
  season: SeasonName;
}

const SEASON_START_MONTH: Record<SeasonName, number> = {
  winter: 1,
  spring: 4,
  summer: 7,
  fall: 10,
};

export function seasonOfMonth(month: number): SeasonName {
  if (month <= 3) return "winter";
  if (month <= 6) return "spring";
  if (month <= 9) return "summer";
  return "fall";
}

export function seasonOfDate(date: ISODate): SeasonKey {
  return { year: yearOf(date), season: seasonOfMonth(monthOf(date)) };
}

export function seasonIndex(key: SeasonKey): number {
  return key.year * 4 + SEASONS.indexOf(key.season);
}

export function seasonFromIndex(index: number): SeasonKey {
  return { year: Math.floor(index / 4), season: SEASONS[((index % 4) + 4) % 4] };
}

export function compareSeasons(a: SeasonKey, b: SeasonKey): number {
  return seasonIndex(a) - seasonIndex(b);
}

export function nextSeason(key: SeasonKey): SeasonKey {
  return seasonFromIndex(seasonIndex(key) + 1);
}

export function previousSeason(key: SeasonKey): SeasonKey {
  return seasonFromIndex(seasonIndex(key) - 1);
}

export function seasonRange(key: SeasonKey): { start: ISODate; end: ISODate } {
  const startMonth = SEASON_START_MONTH[key.season];
  const endMonth = startMonth + 2;
  const lastDay = new Date(Date.UTC(key.year, endMonth, 0)).getUTCDate();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return {
    start: `${key.year}-${pad(startMonth)}-01`,
    end: `${key.year}-${pad(endMonth)}-${pad(lastDay)}`,
  };
}

/** Every season touched by a date range, inclusive. */
export function seasonsSpanned(start: ISODate, end: ISODate | null): SeasonKey[] {
  const first = seasonIndex(seasonOfDate(start));
  const last = end ? seasonIndex(seasonOfDate(end)) : first;
  const result: SeasonKey[] = [];
  for (let i = first; i <= Math.max(first, last); i++) result.push(seasonFromIndex(i));
  return result;
}

/** Number of cours a run occupies — a two-cour show spans two calendar seasons. */
export function courCount(start: ISODate, end: ISODate | null): number {
  return seasonsSpanned(start, end).length;
}

export function isSeasonName(value: string): value is SeasonName {
  return (SEASONS as readonly string[]).includes(value);
}

export function formatSeason(key: SeasonKey | null): string {
  if (!key) return "Season not yet documented";
  return `${SEASON_LABEL[key.season]} ${key.year}`;
}

export function seasonHref(key: SeasonKey): string {
  return `/seasons/${key.year}/${key.season}`;
}

export function isWithinCalendar(key: SeasonKey): boolean {
  return key.year >= ARCHIVE_START_YEAR && key.year <= CALENDAR_END_YEAR;
}

export function calendarYears(): number[] {
  const years: number[] = [];
  for (let y = CALENDAR_END_YEAR; y >= ARCHIVE_START_YEAR; y--) years.push(y);
  return years;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}
