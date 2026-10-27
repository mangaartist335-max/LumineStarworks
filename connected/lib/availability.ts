// Availability metadata for dated content.
//
// Authored archive content (videos, manga chapters, posts, pages, software)
// carries an Availability record; it exists in the Connected Era only from
// its publication moment onward, and only where it was released. User-made
// content is stamped with the simulated time it was created, so it follows
// the same rule.

export type ContentStatus = "published" | "unlisted" | "removed" | "draft";

/** Where a record came from. Archive records are authored with the project; user records are made by whoever uses the computer. */
export type Origin = "archive" | "user";

export interface Availability {
  /** When it went public (UTC ISO). */
  publishedAt: string;
  /** When the work itself was released, when it differs (a 2009 song uploaded in 2012). */
  releasedAt?: string;
  /** When the record was created, if it predates publication (drafts, scheduled posts). */
  createdAt?: string;
  /** ISO 3166 country codes where it is available, or "global". */
  region?: string[] | "global";
  /** For content reconstructed from an archived snapshot: when the snapshot was taken. */
  snapshotAt?: string;
  status?: ContentStatus;
  /** Taken down at this moment (still in the archive, not shown after). */
  removedAt?: string;
}

export function isAvailable(a: Availability, now: number, region = "US"): boolean {
  const status = a.status ?? "published";
  if (status === "draft") return false;
  if (Date.parse(a.publishedAt) > now) return false;
  if (a.removedAt && Date.parse(a.removedAt) <= now) return false;
  if (a.region && a.region !== "global" && !a.region.includes(region)) return false;
  return true;
}

/** Listed in feeds and search (unlisted items are reachable by link only). */
export function isListed(a: Availability, now: number, region = "US"): boolean {
  return isAvailable(a, now, region) && (a.status ?? "published") !== "unlisted";
}

export function availableNow<T extends { availability: Availability }>(items: T[], now: number, region = "US"): T[] {
  return items.filter((i) => isListed(i.availability, now, region));
}
