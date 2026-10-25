// Time handling for the YAL archive.
//
// Every in-world event is stored as a UTC ISO timestamp. The "as of" moment
// decides what exists: a record is visible only once its event time has
// passed. Display formatting happens in an explicit time zone (JST by
// default) and never consults the real current date.

export const ARCHIVE_START = "2012-01-01T00:00:00+09:00";
export const ARCHIVE_END = "2013-12-31T23:59:59+09:00";
// The default visit: Thursday, October 24, 2013 at noon in Tokyo. Episode 3's
// discussion has wound down and Episode 4 has not aired yet.
export const DEFAULT_AS_OF = "2013-10-24T12:00:00+09:00";

export const AS_OF_COOKIE = "yal_asof";
export const AS_OF_PARAM = "asof";

// Offsets (hours from UTC) for the zone labels used in the archive.
export const ZONE_OFFSETS: Record<string, number> = {
  JST: 9,
  GMT: 0,
  UTC: 0,
  BST: 1,
  CET: 1,
  CEST: 2,
  EST: -5,
  EDT: -4,
  CST: -6,
  CDT: -5,
  PST: -8,
  PDT: -7,
  BRT: -3,
  AEST: 10,
};

export const DISPLAY_ZONES = ["JST", "GMT", "CET", "EST", "EDT", "PST", "PDT"] as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ms(iso: string): number {
  return new Date(iso).getTime();
}

export function isValidDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

/** True when an event at `eventAt` has happened by `asOf`. Undated events are back-catalogue and always visible. */
export function happened(eventAt: string | null | undefined, asOf: string): boolean {
  if (!eventAt) return true;
  return ms(eventAt) <= ms(asOf);
}

/** Normalise an as-of value to a UTC ISO string inside the archive window. */
export function clampAsOf(value: string | null | undefined): string {
  const t = value && isValidDate(value) ? ms(value) : ms(DEFAULT_AS_OF);
  return new Date(Math.min(Math.max(t, ms(ARCHIVE_START)), ms(ARCHIVE_END))).toISOString();
}

/**
 * Parse a user-entered "as of" value. Accepts `2013-10-06`, `2013-10-06T09:30`
 * (interpreted in JST) or a full ISO timestamp with offset.
 */
export function parseAsOfInput(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) return clampAsOf(`${m[1]}-${m[2]}-${m[3]}T23:59:00+09:00`);
  m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/.exec(v);
  if (m) return clampAsOf(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`);
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(v) && isValidDate(v)) return clampAsOf(v);
  return null;
}

type Parts = { y: number; mo: number; d: number; h: number; mi: number; wd: number };

/** Calendar parts of an instant in a fixed-offset zone. */
export function zoneParts(iso: string, zone = "JST"): Parts {
  const offset = ZONE_OFFSETS[zone] ?? 9;
  const t = new Date(ms(iso) + offset * 3600_000);
  return {
    y: t.getUTCFullYear(),
    mo: t.getUTCMonth(),
    d: t.getUTCDate(),
    h: t.getUTCHours(),
    mi: t.getUTCMinutes(),
    wd: t.getUTCDay(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "Oct 6, 2013, 02:31 JST" — the archive's post timestamp format. */
export function formatDateTime(iso: string, zone = "JST"): string {
  const p = zoneParts(iso, zone);
  return `${MONTHS[p.mo]} ${p.d}, ${p.y}, ${pad(p.h)}:${pad(p.mi)} ${zone}`;
}

/** "Oct 6, 2013" */
export function formatDate(iso: string, zone = "JST"): string {
  const p = zoneParts(iso, zone);
  return `${MONTHS[p.mo]} ${p.d}, ${p.y}`;
}

/** "October 6, 2013" */
export function formatLongDate(iso: string, zone = "JST"): string {
  const p = zoneParts(iso, zone);
  return `${MONTHS_LONG[p.mo]} ${p.d}, ${p.y}`;
}

/** "Thu, Oct 24, 2013 12:00 JST" */
export function formatToolbar(iso: string, zone = "JST"): string {
  const p = zoneParts(iso, zone);
  return `${WEEKDAYS[p.wd]}, ${MONTHS[p.mo]} ${p.d}, ${p.y} ${pad(p.h)}:${pad(p.mi)} ${zone}`;
}

/** "Jul 2011" — member join dates. */
export function formatMonthYear(iso: string, zone = "JST"): string {
  const p = zoneParts(iso, zone);
  return `${MONTHS[p.mo]} ${p.y}`;
}

export function weekdayName(iso: string, zone = "JST", long = false): string {
  const p = zoneParts(iso, zone);
  return (long ? WEEKDAYS_LONG : WEEKDAYS)[p.wd];
}

/**
 * Japanese late-night broadcast notation: an airing at 01:58 on Sunday is
 * listed as "Saturday 25:58". Times between 00:00 and 04:59 roll back to the
 * previous broadcast day.
 */
export function formatBroadcastSlot(iso: string): { weekday: string; time: string; date: string } {
  const p = zoneParts(iso, "JST");
  if (p.h < 5) {
    const prev = new Date(ms(iso) - 24 * 3600_000).toISOString();
    const q = zoneParts(prev, "JST");
    return {
      weekday: WEEKDAYS_LONG[q.wd],
      time: `${pad(p.h + 24)}:${pad(p.mi)}`,
      date: `${MONTHS[q.mo]} ${q.d}, ${q.y}`,
    };
  }
  return { weekday: WEEKDAYS_LONG[p.wd], time: `${pad(p.h)}:${pad(p.mi)}`, date: `${MONTHS[p.mo]} ${p.d}, ${p.y}` };
}

/** "2013-10-24" in JST, for <input type="date">. */
export function toDateInput(iso: string): string {
  const p = zoneParts(iso, "JST");
  return `${p.y}-${pad(p.mo + 1)}-${pad(p.d)}`;
}

/** "12:00" in JST, for <input type="time">. */
export function toTimeInput(iso: string): string {
  const p = zoneParts(iso, "JST");
  return `${pad(p.h)}:${pad(p.mi)}`;
}

/** Midnight JST at the start of the given JST calendar day. */
export function startOfJstDay(iso: string): string {
  const p = zoneParts(iso, "JST");
  return new Date(Date.UTC(p.y, p.mo, p.d, 0, 0) - 9 * 3600_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return new Date(ms(iso) + days * 24 * 3600_000).toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(ms(iso) + minutes * 60_000).toISOString();
}

/** "Mon 2011" style labels like "Jul 2011" → first instant of that month in JST. */
export function monthYearToIso(label: string): string | null {
  const m = /^([A-Z][a-z]{2}) (\d{4})$/.exec(label.trim());
  if (!m) return null;
  const mo = MONTHS.indexOf(m[1]);
  if (mo < 0) return null;
  return new Date(Date.UTC(Number(m[2]), mo, 1, 0, 0) - 9 * 3600_000).toISOString();
}

export type Season = "winter" | "spring" | "summer" | "fall";
export const SEASONS: Season[] = ["winter", "spring", "summer", "fall"];

export function seasonOf(iso: string): { year: number; season: Season } {
  const p = zoneParts(iso, "JST");
  const season: Season = p.mo <= 2 ? "winter" : p.mo <= 5 ? "spring" : p.mo <= 8 ? "summer" : "fall";
  return { year: p.y, season };
}

export function seasonLabel(season: Season, year: number): string {
  return `${season[0].toUpperCase()}${season.slice(1)} ${year}`;
}

/** First instant of a season in JST. */
export function seasonStart(year: number, season: Season): string {
  const mo = SEASONS.indexOf(season) * 3;
  return new Date(Date.UTC(year, mo, 1, 0, 0) - 9 * 3600_000).toISOString();
}

/** Relative wording used by 2013-era forums: "3 minutes ago", "Yesterday, 23:48". */
export function relativeTo(iso: string, asOf: string, zone = "JST"): string {
  const diff = ms(asOf) - ms(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const today = startOfJstDay(asOf);
  const yesterday = addDays(today, -1);
  const p = zoneParts(iso, zone);
  if (ms(iso) >= ms(yesterday)) return `Yesterday, ${pad(p.h)}:${pad(p.mi)}`;
  return formatDateTime(iso, zone);
}

/**
 * Air date in Japanese broadcast-day terms. Late-night airings (00:01–04:59
 * JST) belong to the previous broadcast day, so Impact of Eden's 01:58 Sunday
 * slot reads "Oct 5, 2013". Dates recorded without a time are stored at
 * exactly 00:00 JST and are shown as-is.
 */
export function formatAirDate(iso: string): string {
  const p = zoneParts(iso, "JST");
  if (p.h === 0 && p.mi === 0) return formatDate(iso, "JST");
  return formatBroadcastSlot(iso).date;
}
