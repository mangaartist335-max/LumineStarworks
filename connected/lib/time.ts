// The Connected Era's historical clock.
//
// The computer keeps its own simulated time: real time plus an offset the
// user sets in Date and Time settings, so the clock ticks naturally. Every
// app reads "now" from here, never from the real date, and every dated
// record is compared against it.
//
// Times are stored as UTC milliseconds or ISO strings; zones are IANA names
// and only matter for display and for reading wall-clock input.

/** The span the architecture is designed for. */
export const ERA_START = "2006-01-01T00:00:00Z";
export const ERA_END = "2026-12-31T23:59:59Z";

/** The span implemented and populated in this phase. */
export const ACTIVE_START = "2012-07-11T00:00:00Z";
export const ACTIVE_END = "2013-12-31T23:59:59Z";

/** First boot: Saturday, September 7, 2013, 4:00 PM on the US East Coast. */
export const DEFAULT_BOOT_TIME = "2013-09-07T20:00:00Z";
export const DEFAULT_TIME_ZONE = "America/New_York";

export const ms = (iso: string) => Date.parse(iso);
export const iso = (t: number) => new Date(t).toISOString();

export function clampToActive(t: number): number {
  return Math.min(Math.max(t, ms(ACTIVE_START)), ms(ACTIVE_END));
}

/** Simulated "now" for a clock offset, kept inside the active period. */
export function simNow(offsetMs: number, realNow: number = Date.now()): number {
  return clampToActive(realNow + offsetMs);
}

/** The offset that makes the clock read `target` right now. */
export function offsetFor(target: number, realNow: number = Date.now()): number {
  return clampToActive(target) - realNow;
}

export const TIME_ZONES: { id: string; label: string }[] = [
  { id: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { id: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { id: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { id: "America/Chicago", label: "(UTC-06:00) Central Time (US & Canada)" },
  { id: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { id: "America/Sao_Paulo", label: "(UTC-03:00) Brasilia" },
  { id: "Europe/London", label: "(UTC) Dublin, Edinburgh, Lisbon, London" },
  { id: "Europe/Berlin", label: "(UTC+01:00) Amsterdam, Berlin, Rome, Stockholm" },
  { id: "Asia/Tokyo", label: "(UTC+09:00) Osaka, Sapporo, Tokyo" },
  { id: "Australia/Sydney", label: "(UTC+10:00) Canberra, Melbourne, Sydney" },
];

export interface ZonedParts {
  y: number;
  mo: number; // 0-11
  d: number;
  h: number; // 0-23
  mi: number;
  s: number;
  wd: number; // 0 = Sunday
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const formatters = new Map<string, Intl.DateTimeFormat>();

export function zonedParts(t: number, zone: string): ZonedParts {
  let f = formatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      weekday: "short",
    });
    formatters.set(zone, f);
  }
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(new Date(t))) p[part.type] = part.value;
  return {
    y: Number(p.year),
    mo: Number(p.month) - 1,
    d: Number(p.day),
    h: Number(p.hour) % 24,
    mi: Number(p.minute),
    s: Number(p.second),
    wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday),
  };
}

/** The UTC instant at which the clock in `zone` reads the given wall time. */
export function wallTimeToUtc(y: number, mo: number, d: number, h: number, mi: number, zone: string): number {
  const guess = Date.UTC(y, mo, d, h, mi);
  // Two passes settle the zone's offset, including across DST changes.
  let t = guess;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(t, zone);
    const shown = Date.UTC(p.y, p.mo, p.d, p.h, p.mi);
    t += guess - shown;
  }
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");
const h12 = (h: number) => (h % 12 === 0 ? 12 : h % 12);
const ampm = (h: number) => (h < 12 ? "AM" : "PM");

/** "4:05 PM" — the taskbar clock. */
export function formatTime(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${h12(p.h)}:${pad(p.mi)} ${ampm(p.h)}`;
}

/** "9/7/2013" — the taskbar date. */
export function formatShortDate(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${p.mo + 1}/${p.d}/${p.y}`;
}

/** "Saturday, September 7, 2013" */
export function formatLongDate(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${WEEKDAYS[p.wd]}, ${MONTHS[p.mo]} ${p.d}, ${p.y}`;
}

/** "Sep 7, 2013" */
export function formatDate(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${MONTHS[p.mo].slice(0, 3)} ${p.d}, ${p.y}`;
}

/** "Sep 7, 2013 4:05 PM" */
export function formatDateTime(t: number, zone: string): string {
  return `${formatDate(t, zone)} ${formatTime(t, zone)}`;
}

/** "2013-09-07" and "16:05" for date/time inputs, in the given zone. */
export function toDateInput(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${p.y}-${pad(p.mo + 1)}-${pad(p.d)}`;
}
export function toTimeInput(t: number, zone: string): string {
  const p = zonedParts(t, zone);
  return `${pad(p.h)}:${pad(p.mi)}`;
}

/** Reads date/time inputs as wall time in `zone`. Returns null if malformed. */
export function fromInputs(date: string, time: string, zone: string): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const tm = /^(\d{2}):(\d{2})$/.exec(time || "00:00");
  if (!dm || !tm) return null;
  return wallTimeToUtc(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2], zone);
}

/** "3 days ago" — early-2010s video-site style. */
export function timeAgo(t: number, now: number): string {
  const s = Math.max(0, Math.round((now - t) / 1000));
  const units: [number, string][] = [
    [365 * 86400, "year"],
    [30 * 86400, "month"],
    [7 * 86400, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [size, name] of units) {
    const n = Math.floor(s / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

/** Month grid for the taskbar calendar: weeks of [day | null]. */
export function monthGrid(y: number, mo: number): (number | null)[][] {
  const first = new Date(Date.UTC(y, mo, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const MONTH_NAMES = MONTHS;
export const WEEKDAY_NAMES = WEEKDAYS;
