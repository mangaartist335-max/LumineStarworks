// Calendar helpers that work on civil dates (`YYYY-MM-DD`).
//
// Broadcast dates are stored as the local date in the broadcast's own time
// zone, so all arithmetic here happens in UTC to stay independent of the
// server's time zone.

import type { ISODate } from "./types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isValidISODate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function parseISODate(value: ISODate): Date {
  if (!isValidISODate(value)) throw new Error(`Invalid calendar date: ${value}`);
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10);
}

export function addDays(value: ISODate, days: number): ISODate {
  return toISODate(new Date(parseISODate(value).getTime() + days * DAY_MS));
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return Math.round((parseISODate(to).getTime() - parseISODate(from).getTime()) / DAY_MS);
}

/** 0 = Sunday … 6 = Saturday. */
export function weekdayOf(value: ISODate): number {
  return parseISODate(value).getUTCDay();
}

export function yearOf(value: ISODate): number {
  return Number(value.slice(0, 4));
}

export function monthOf(value: ISODate): number {
  return Number(value.slice(5, 7));
}

export function compareISODate(a: ISODate | null, b: ISODate | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a < b ? -1 : 1;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

const LONG_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const SHORT_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: ISODate | null, style: "long" | "short" = "long"): string {
  if (!value || !isValidISODate(value)) return "—";
  return (style === "long" ? LONG_FORMAT : SHORT_FORMAT).format(parseISODate(value));
}

export function formatDateRange(start: ISODate | null, end: ISODate | null): string {
  if (!start && !end) return "Dates not yet documented";
  if (start && !end) return `${formatDate(start, "short")} – ?`;
  if (!start && end) return `? – ${formatDate(end, "short")}`;
  if (start === end) return formatDate(start, "short");
  return `${formatDate(start, "short")} – ${formatDate(end, "short")}`;
}

export function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

const TIME = /^([01]\d|2[0-9]):([0-5]\d)$/;

/**
 * Broadcast times follow the Japanese convention where late-night slots can be
 * written past midnight (e.g. `25:30` is 1:30 AM on the following calendar day).
 */
export function isValidBroadcastTime(value: string): boolean {
  return TIME.test(value);
}

/** Short label for a time zone, e.g. `Asia/Tokyo` → `JST`. */
export function timeZoneAbbreviation(zone: string | null): string {
  if (!zone) return "";
  const known: Record<string, string> = {
    "Asia/Tokyo": "JST",
    "America/Los_Angeles": "PT",
    "America/New_York": "ET",
    UTC: "UTC",
  };
  return known[zone] ?? zone;
}

export function formatBroadcastTime(time: string | null, zone: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  const hour12 = ((h % 12) || 12).toString();
  const suffix = h % 24 < 12 ? "AM" : "PM";
  const overflow = h >= 24 ? ` (${time})` : "";
  const tz = timeZoneAbbreviation(zone);
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}${overflow}${tz ? ` ${tz}` : ""}`;
}
