// Timeline validation for broadcast schedules and production records.
//
// These checks never change data. They describe what looks right, what needs
// an editor's attention, and what can be inferred from the recorded dates, so
// the archive can stay honest about the difference between a documented fact
// and a calculation.

import { addDays, daysBetween, isValidBroadcastTime, isValidISODate, isValidTimeZone, weekdayOf, formatDate } from "./dates";
import { FORMAT_LABEL, WEEKDAY_LABEL } from "./labels";
import { formatSeason, seasonOfDate, seasonsSpanned, type SeasonKey } from "./seasons";
import type {
  ArchiveTables,
  BroadcastRun,
  EntityType,
  Episode,
  EpisodeRelease,
  ISODate,
  Production,
} from "./types";

export type IssueLevel = "error" | "warning" | "info";

export interface ValidationIssue {
  level: IssueLevel;
  code: string;
  message: string;
  entity_type: EntityType;
  entity_id: string;
  field?: string;
}

export interface RunAnalysis {
  run_id: string;
  /** The weekday the run airs on — recorded, or derived from the premiere date. */
  weekday: number | null;
  weekday_source: "recorded" | "derived" | null;
  /** Broadcast-weekday slots between premiere and finale, inclusive. */
  weekly_slots: number | null;
  /** Recorded skipped weeks that fall inside the run. */
  skipped_weeks: number;
  /** Slots that should carry an episode once recorded skips are removed. */
  available_slots: number | null;
  /** Slots with no episode and no recorded reason (hiatus not yet documented). */
  unaccounted_weeks: number;
  /** Episode count implied by the dates when none is recorded. */
  inferred_episode_count: number | null;
  seasons: SeasonKey[];
  issues: ValidationIssue[];
}

const issue = (
  level: IssueLevel,
  code: string,
  message: string,
  entity_type: EntityType,
  entity_id: string,
  field?: string,
): ValidationIssue => ({ level, code, message, entity_type, entity_id, field });

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Analyze one broadcast run on its own. */
export function analyzeBroadcastRun(
  run: BroadcastRun,
  releases: { release: EpisodeRelease; episode: Episode }[] = [],
): RunAnalysis {
  const issues: ValidationIssue[] = [];
  const push = (level: IssueLevel, code: string, message: string, field?: string) =>
    issues.push(issue(level, code, message, "broadcast_run", run.id, field));

  const analysis: RunAnalysis = {
    run_id: run.id,
    weekday: run.weekday,
    weekday_source: run.weekday === null ? null : "recorded",
    weekly_slots: null,
    skipped_weeks: 0,
    available_slots: null,
    unaccounted_weeks: 0,
    inferred_episode_count: null,
    seasons: [],
    issues,
  };

  const start = run.start_date && isValidISODate(run.start_date) ? run.start_date : null;
  const end = run.end_date && isValidISODate(run.end_date) ? run.end_date : null;

  if (run.start_date && !start) push("error", "run.invalid_start", `“${run.start_date}” is not a valid calendar date.`, "start_date");
  if (run.end_date && !end) push("error", "run.invalid_end", `“${run.end_date}” is not a valid calendar date.`, "end_date");
  if (run.time_zone && !isValidTimeZone(run.time_zone))
    push("error", "run.invalid_time_zone", `“${run.time_zone}” is not a recognised IANA time zone.`, "time_zone");
  if (run.local_time && !isValidBroadcastTime(run.local_time))
    push("error", "run.invalid_time", `“${run.local_time}” is not a valid broadcast time (use HH:MM, up to 29:59).`, "local_time");
  if (run.weekday !== null && (run.weekday < 0 || run.weekday > 6))
    push("error", "run.invalid_weekday", "Broadcast weekday must be between Sunday (0) and Saturday (6).", "weekday");

  if (!start) return analysis;
  analysis.seasons = seasonsSpanned(start, end);

  if (end && end < start) {
    push("error", "run.end_before_start", `The finale (${formatDate(end)}) is before the premiere (${formatDate(start)}).`, "end_date");
    return analysis;
  }

  if (run.cadence === "single") {
    if (end && end !== start)
      push("warning", "run.single_spans_days", "A single airing should start and end on the same date.", "end_date");
    return analysis;
  }

  if (run.cadence !== "weekly" && run.cadence !== "daily") return analysis;

  const startWeekday = weekdayOf(start);

  if (run.cadence === "weekly") {
    if (run.weekday !== null && run.weekday !== startWeekday) {
      push(
        "error",
        "run.start_weekday_mismatch",
        `The premiere (${formatDate(start)}) is a ${WEEKDAY_LABEL[startWeekday]}, but the run is recorded as airing on ${WEEKDAY_LABEL[run.weekday]}s.`,
        "start_date",
      );
    }
    if (run.weekday === null) {
      analysis.weekday = startWeekday;
      analysis.weekday_source = "derived";
    }
    const weekday = analysis.weekday ?? startWeekday;

    if (end) {
      const endWeekday = weekdayOf(end);
      if (endWeekday !== weekday) {
        push(
          run.weekday === null ? "warning" : "error",
          "run.end_weekday_mismatch",
          `The finale (${formatDate(end)}) is a ${WEEKDAY_LABEL[endWeekday]}, but the run airs on ${WEEKDAY_LABEL[weekday]}s.`,
          "end_date",
        );
      }
    }
  }

  // Recorded skipped weeks.
  const validSkips = new Set<ISODate>();
  for (const skip of run.skipped_dates) {
    if (!isValidISODate(skip)) {
      push("error", "run.invalid_skip", `Skipped week “${skip}” is not a valid date.`, "skipped_dates");
      continue;
    }
    if (skip < start || (end && skip > end)) {
      push("warning", "run.skip_outside_run", `Skipped week ${formatDate(skip)} falls outside the broadcast run.`, "skipped_dates");
      continue;
    }
    if (run.cadence === "weekly" && analysis.weekday !== null && weekdayOf(skip) !== analysis.weekday) {
      push(
        "warning",
        "run.skip_wrong_weekday",
        `Skipped week ${formatDate(skip)} is a ${WEEKDAY_LABEL[weekdayOf(skip)]}, not a broadcast day.`,
        "skipped_dates",
      );
      continue;
    }
    validSkips.add(skip);
  }
  analysis.skipped_weeks = validSkips.size;

  if (end) {
    const span = daysBetween(start, end);
    const slots = run.cadence === "weekly" ? Math.floor(span / 7) + 1 : span + 1;
    analysis.weekly_slots = slots;
    analysis.available_slots = slots - validSkips.size;

    const unit = run.cadence === "weekly" ? "weekly slot" : "daily slot";
    if (run.episode_count !== null) {
      const diff = analysis.available_slots - run.episode_count;
      if (diff > 0) {
        analysis.unaccounted_weeks = diff;
        push(
          "warning",
          "run.unaccounted_weeks",
          `${plural(run.episode_count, "episode")} across ${plural(analysis.available_slots, unit)} leaves ${plural(diff, "week")} without an episode. Record the skipped weeks (holiday breaks or a hiatus) to complete the schedule.`,
          "skipped_dates",
        );
      } else if (diff < 0) {
        push(
          "error",
          "run.too_few_slots",
          `${plural(run.episode_count, "episode")} cannot fit into ${plural(analysis.available_slots, unit)} between the premiere and finale. Check the dates, the skipped weeks, or note double-episode broadcasts.`,
          "episode_count",
        );
      }
    } else {
      analysis.inferred_episode_count = analysis.available_slots;
      push(
        "info",
        "run.episode_count_inferred",
        `The dates are consistent with ${plural(analysis.available_slots, "episode")} airing ${run.cadence === "weekly" ? "weekly" : "daily"} with no breaks. The episode count itself is not yet documented.`,
        "episode_count",
      );
    }
  }

  // Episode-level release dates.
  const sorted = [...releases].sort((a, b) => a.episode.number - b.episode.number);
  const seenDates = new Map<ISODate, number>();
  let previous: { number: number; date: ISODate } | null = null;
  for (const { release, episode } of sorted) {
    const where = `Episode ${episode.number}`;
    if (!isValidISODate(release.air_date)) {
      issues.push(issue("error", "release.invalid_date", `${where} has an invalid air date.`, "episode_release", release.id, "air_date"));
      continue;
    }
    if (release.air_date < start || (end && release.air_date > end)) {
      issues.push(
        issue("error", "release.outside_run", `${where} airs on ${formatDate(release.air_date)}, outside this broadcast run.`, "episode_release", release.id, "air_date"),
      );
    }
    if (run.cadence === "weekly" && analysis.weekday !== null && weekdayOf(release.air_date) !== analysis.weekday) {
      issues.push(
        issue(
          "warning",
          "release.wrong_weekday",
          `${where} airs on a ${WEEKDAY_LABEL[weekdayOf(release.air_date)]} instead of the usual ${WEEKDAY_LABEL[analysis.weekday]}.`,
          "episode_release",
          release.id,
          "air_date",
        ),
      );
    }
    if (validSkips.has(release.air_date)) {
      issues.push(
        issue("error", "release.on_skipped_week", `${where} is dated on a week recorded as skipped.`, "episode_release", release.id, "air_date"),
      );
    }
    if (previous && release.air_date < previous.date) {
      issues.push(
        issue(
          "error",
          "release.out_of_order",
          `${where} (${formatDate(release.air_date)}) airs before Episode ${previous.number} (${formatDate(previous.date)}).`,
          "episode_release",
          release.id,
          "air_date",
        ),
      );
    }
    const sameDay = seenDates.get(release.air_date);
    if (sameDay !== undefined) {
      issues.push(
        issue(
          "info",
          "release.double_episode",
          `Episodes ${sameDay} and ${episode.number} share ${formatDate(release.air_date)} (double-episode broadcast).`,
          "episode_release",
          release.id,
          "air_date",
        ),
      );
    } else {
      seenDates.set(release.air_date, episode.number);
    }
    previous = { number: episode.number, date: release.air_date };
  }

  return analysis;
}

export interface ProjectedEpisode {
  number: number;
  date: ISODate;
}

/**
 * Lay out a weekly (or daily) schedule from a run's premiere, honouring
 * recorded skipped weeks. The result is a projection — it is shown with a
 * clear label and never stored as fact.
 */
export function projectSchedule(run: BroadcastRun, options: { firstNumber?: number; count?: number } = {}): ProjectedEpisode[] {
  if (!run.start_date || !isValidISODate(run.start_date)) return [];
  if (run.cadence !== "weekly" && run.cadence !== "daily") return [];
  const step = run.cadence === "weekly" ? 7 : 1;
  const count = options.count ?? run.episode_count ?? analyzeBroadcastRun(run).inferred_episode_count;
  if (!count || count <= 0) return [];

  const skips = new Set(run.skipped_dates);
  const result: ProjectedEpisode[] = [];
  let date = run.start_date;
  let number = options.firstNumber ?? 1;
  // Guard against runaway loops on malformed data.
  for (let guard = 0; result.length < count && guard < count + skips.size + 520; guard++) {
    if (run.end_date && date > run.end_date) break;
    if (!skips.has(date)) {
      result.push({ number, date });
      number += 1;
    }
    date = addDays(date, step);
  }
  return result;
}

/** Runs that carry the original-language premiere (everything except dubs and home video). */
export function isOriginalRun(run: BroadcastRun): boolean {
  return run.kind !== "dub" && run.kind !== "home_video";
}

export interface ProductionTimeline {
  premiere: SeasonKey | null;
  /** Seasons the original broadcast occupies, starting with the premiere season. */
  seasons: SeasonKey[];
  /** Calendar seasons after the premiere season that the broadcast continues into. */
  continuing: SeasonKey[];
  cours: number;
}

export function productionTimeline(production: Production, runs: BroadcastRun[]): ProductionTimeline {
  const premiere =
    production.premiere_year !== null && production.premiere_season !== null
      ? { year: production.premiere_year, season: production.premiere_season }
      : production.premiere_date
        ? seasonOfDate(production.premiere_date)
        : null;

  const original = runs.filter((r) => isOriginalRun(r) && r.start_date);
  const start = production.premiere_date ?? original.map((r) => r.start_date!).sort()[0] ?? null;
  const ends = [production.finale_date, ...original.map((r) => r.end_date)].filter((d): d is ISODate => !!d);
  const end = ends.sort().at(-1) ?? null;

  if (!start) return { premiere, seasons: premiere ? [premiere] : [], continuing: [], cours: premiere ? 1 : 0 };
  const seasons = seasonsSpanned(start, end);
  return { premiere: premiere ?? seasons[0], seasons, continuing: seasons.slice(1), cours: seasons.length };
}

/** Validate a production against its own broadcast runs and episodes. */
export function validateProduction(
  production: Production,
  runs: BroadcastRun[],
  episodes: Episode[] = [],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const push = (level: IssueLevel, code: string, message: string, field?: string) =>
    issues.push(issue(level, code, message, "production", production.id, field));

  const { premiere_date, finale_date } = production;

  if (premiere_date && !isValidISODate(premiere_date)) push("error", "production.invalid_premiere", "Premiere date is not a valid calendar date.", "premiere_date");
  if (finale_date && !isValidISODate(finale_date)) push("error", "production.invalid_finale", "Finale date is not a valid calendar date.", "finale_date");
  if (premiere_date && finale_date && finale_date < premiere_date)
    push("error", "production.finale_before_premiere", `The finale (${formatDate(finale_date)}) is before the premiere (${formatDate(premiere_date)}).`, "finale_date");

  // Premiere season must follow from the premiere date.
  if (premiere_date && isValidISODate(premiere_date)) {
    const expected = seasonOfDate(premiere_date);
    if (production.premiere_season && production.premiere_year !== null) {
      if (production.premiere_season !== expected.season || production.premiere_year !== expected.year) {
        push(
          "error",
          "production.season_mismatch",
          `A premiere on ${formatDate(premiere_date)} belongs to ${formatSeason(expected)}, but the record says ${formatSeason({ year: production.premiere_year, season: production.premiere_season })}.`,
          "premiere_season",
        );
      }
    } else if (production.premiere_year !== null && production.premiere_year !== expected.year) {
      push("error", "production.year_mismatch", `The premiere date is in ${expected.year}, but the premiere year is ${production.premiere_year}.`, "premiere_year");
    }
  }

  const original = runs.filter((r) => isOriginalRun(r));
  const dated = original.filter((r) => r.start_date && isValidISODate(r.start_date));

  if (premiere_date && dated.length > 0) {
    const earliest = [...dated].sort((a, b) => (a.start_date! < b.start_date! ? -1 : 1))[0];
    if (earliest.start_date !== premiere_date) {
      push(
        "warning",
        "production.premiere_mismatch",
        `The recorded premiere (${formatDate(premiere_date)}) doesn't match the earliest broadcast, which began ${formatDate(earliest.start_date)}.`,
        "premiere_date",
      );
    }
  }

  if (finale_date) {
    const ends = original.map((r) => r.end_date).filter(Boolean);
    if (ends.length > 0 && !ends.includes(finale_date)) {
      push("warning", "production.finale_mismatch", `The recorded finale (${formatDate(finale_date)}) doesn't match the end of any original broadcast run.`, "finale_date");
    }
  }

  // Film releases and television premieres are different things.
  const weekly = original.filter((r) => r.cadence === "weekly");
  if (production.format === "film" && weekly.length > 0)
    push("warning", "production.film_has_weekly_run", "Theatrical films should use a theatrical release, not a weekly broadcast run.", "format");
  if (production.format === "tv" && original.length > 0 && original.every((r) => r.kind === "theatrical"))
    push("warning", "production.tv_theatrical_only", `${FORMAT_LABEL.tv} entries need a television broadcast run; only theatrical releases are recorded.`, "format");

  // Episode count agreement.
  const primary = original.find((r) => r.is_primary) ?? original[0];
  if (production.episode_count !== null && primary?.episode_count != null && primary.episode_count !== production.episode_count) {
    push(
      "warning",
      "production.episode_count_mismatch",
      `The production lists ${plural(production.episode_count, "episode")}, but its primary broadcast run lists ${primary.episode_count}.`,
      "episode_count",
    );
  }

  const numbers = new Map<number, number>();
  for (const ep of episodes) numbers.set(ep.number, (numbers.get(ep.number) ?? 0) + 1);
  for (const [number, count] of numbers) {
    if (count > 1) push("error", "episode.duplicate_number", `Episode ${number} is recorded ${count} times.`, "episodes");
  }
  const regular = episodes.filter((e) => e.number >= 1 && Number.isInteger(e.number)).length;
  if (production.episode_count !== null && regular > production.episode_count) {
    push("warning", "episode.too_many", `${plural(regular, "regular episode")} are recorded, more than the expected ${production.episode_count}.`, "episodes");
  }

  // Dub releases and simultaneous regional broadcasts.
  const firstOriginal = dated.map((r) => r.start_date!).sort()[0];
  for (const run of runs) {
    if (run.kind === "dub" && run.start_date && firstOriginal && run.start_date < firstOriginal) {
      issues.push(issue("warning", "run.dub_before_original", "This English dub begins before the original Japanese broadcast.", "broadcast_run", run.id, "start_date"));
    }
  }
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i];
      const b = runs[j];
      if (a.start_date && a.start_date === b.start_date && (a.region !== b.region || a.language !== b.language)) {
        issues.push(
          issue("info", "run.simulcast", `Two broadcast runs premiere together on ${formatDate(a.start_date)} (simultaneous regional broadcast).`, "broadcast_run", b.id, "start_date"),
        );
      }
    }
  }

  const timeline = productionTimeline(production, runs);
  if (timeline.continuing.length > 0 && timeline.premiere) {
    push(
      "info",
      "production.multi_cour",
      `Premiered in ${formatSeason(timeline.premiere)} and continues through ${timeline.continuing.map(formatSeason).join(", ")}.`,
    );
  }

  return issues;
}

export function normalizeTitle(title: string): string {
  return title
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Two productions are duplicates when they share a slug, or a title + format + premiere year. */
export function duplicateKey(p: Pick<Production, "title" | "format" | "premiere_year">): string {
  return `${normalizeTitle(p.title)}|${p.format}|${p.premiere_year ?? "?"}`;
}

export function findDuplicateProductions(productions: Production[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byKey = new Map<string, Production>();
  const bySlug = new Map<string, Production>();
  for (const p of productions) {
    if (p.provenance === "superseded") continue;
    const slugTwin = bySlug.get(p.slug);
    if (slugTwin) {
      issues.push(issue("error", "production.duplicate_slug", `“${p.title}” shares the address /anime/${p.slug} with “${slugTwin.title}”.`, "production", p.id, "slug"));
    } else {
      bySlug.set(p.slug, p);
    }
    const key = duplicateKey(p);
    const twin = byKey.get(key);
    if (twin) {
      issues.push(
        issue(
          "error",
          "production.duplicate",
          `“${p.title}” looks like a duplicate of an existing ${FORMAT_LABEL[p.format]} record from ${p.premiere_year ?? "an unknown year"}.`,
          "production",
          p.id,
          "title",
        ),
      );
    } else {
      byKey.set(key, p);
    }
  }
  return issues;
}

/** Run every check across the whole archive. */
export function validateArchive(tables: Pick<ArchiveTables, "productions" | "broadcast_runs" | "episodes" | "episode_releases">): ValidationIssue[] {
  const runsByProduction = new Map<string, BroadcastRun[]>();
  for (const run of tables.broadcast_runs) {
    const list = runsByProduction.get(run.production_id) ?? [];
    list.push(run);
    runsByProduction.set(run.production_id, list);
  }
  const episodesByProduction = new Map<string, Episode[]>();
  const episodeById = new Map<string, Episode>();
  for (const ep of tables.episodes) {
    episodeById.set(ep.id, ep);
    const list = episodesByProduction.get(ep.production_id) ?? [];
    list.push(ep);
    episodesByProduction.set(ep.production_id, list);
  }
  const releasesByRun = new Map<string, { release: EpisodeRelease; episode: Episode }[]>();
  for (const release of tables.episode_releases) {
    const episode = episodeById.get(release.episode_id);
    if (!episode) continue;
    const list = releasesByRun.get(release.broadcast_run_id) ?? [];
    list.push({ release, episode });
    releasesByRun.set(release.broadcast_run_id, list);
  }

  const issues: ValidationIssue[] = [];
  for (const production of tables.productions) {
    if (production.provenance === "superseded") continue;
    const runs = runsByProduction.get(production.id) ?? [];
    issues.push(...validateProduction(production, runs, episodesByProduction.get(production.id) ?? []));
    for (const run of runs) issues.push(...analyzeBroadcastRun(run, releasesByRun.get(run.id) ?? []).issues);
  }
  issues.push(...findDuplicateProductions(tables.productions));
  return issues;
}
