import type { Plant, PlantStatus } from "../types/plant";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Formats a Date as a local calendar date: YYYY-MM-DD. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayString(): string {
  return toDateString(new Date());
}

/** Parses YYYY-MM-DD as local midnight (not UTC, which would shift the day). */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `from` to `to` (DST-safe). */
export function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / MS_PER_DAY);
}

export function daysSinceWatered(plant: Plant, on: Date = new Date()): number {
  return daysBetween(parseDateString(plant.last_watered_date), on);
}

/**
 * Overdue: it's been at least `interval` days since the last watering.
 * Due Today: it will be overdue tomorrow.
 * Watered: anything else.
 */
export function getPlantStatus(plant: Plant, on: Date = new Date()): PlantStatus {
  const since = daysSinceWatered(plant, on);
  if (since >= plant.watering_interval_days) return "overdue";
  if (since + 1 >= plant.watering_interval_days) return "dueToday";
  return "watered";
}

/** Days until the plant becomes overdue (0 or less means it already is). */
export function daysUntilNextWater(plant: Plant, on: Date = new Date()): number {
  return plant.watering_interval_days - daysSinceWatered(plant, on);
}

export function describeNextWater(plant: Plant, on: Date = new Date()): string {
  const days = daysUntilNextWater(plant, on);
  if (days < 0) {
    const late = -days;
    return `${late} day${late === 1 ? "" : "s"} late`;
  }
  if (days === 0) return "Water now";
  if (days === 1) return "Water tomorrow";
  return `Water in ${days} days`;
}

export function formatFriendlyDate(value: string, on: Date = new Date()): string {
  const date = parseDateString(value);
  const diff = daysBetween(date, on);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === on.getFullYear() ? undefined : "numeric",
  });
}

export function formatInterval(days: number): string {
  return days === 1 ? "Every day" : `Every ${days} days`;
}

const STATUS_ORDER: Record<PlantStatus, number> = {
  overdue: 0,
  dueToday: 1,
  watered: 2,
};

/** Thirstiest plants first, then by name. */
export function sortByUrgency(plants: Plant[], on: Date = new Date()): Plant[] {
  return [...plants].sort((a, b) => {
    const byStatus = STATUS_ORDER[getPlantStatus(a, on)] - STATUS_ORDER[getPlantStatus(b, on)];
    if (byStatus !== 0) return byStatus;
    const byDays = daysUntilNextWater(a, on) - daysUntilNextWater(b, on);
    if (byDays !== 0) return byDays;
    return a.name.localeCompare(b.name);
  });
}
