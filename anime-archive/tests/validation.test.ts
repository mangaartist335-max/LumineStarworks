import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/archive/dates";
import type { Episode, EpisodeRelease } from "@/lib/archive/types";
import { analyzeBroadcastRun, findDuplicateProductions, productionTimeline, projectSchedule, validateProduction } from "@/lib/archive/validation";
import { codes, production, run } from "./helpers";

describe("broadcast weekday checks", () => {
  it("accepts a run whose dates fall on its broadcast weekday", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2013-04-04", end_date: "2013-09-26", weekday: 4, episode_count: 26 }));
    expect(analysis.issues).toEqual([]);
    expect(analysis.weekly_slots).toBe(26);
  });

  it("flags a premiere that doesn't match the recorded weekday", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2016-04-09", end_date: "2016-06-25", weekday: 5, episode_count: 12 }));
    expect(codes(analysis.issues)).toContain("run.start_weekday_mismatch");
    expect(codes(analysis.issues)).toContain("run.end_weekday_mismatch");
  });

  it("derives the weekday when none is recorded", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2011-08-15", end_date: "2012-01-23", episode_count: 24 }));
    expect(analysis.weekday).toBe(1);
    expect(analysis.weekday_source).toBe("derived");
    expect(analysis.issues).toEqual([]);
  });
});

describe("episode counts, skipped weeks and hiatuses", () => {
  const earthS2 = { start_date: "2019-01-09", end_date: "2019-06-26", episode_count: 22 };

  it("reports weeks that have no episode and no recorded reason", () => {
    const analysis = analyzeBroadcastRun(run(earthS2));
    expect(analysis.available_slots).toBe(25);
    expect(analysis.unaccounted_weeks).toBe(3);
    expect(codes(analysis.issues)).toEqual(["run.unaccounted_weeks"]);
  });

  it("is satisfied once the skipped weeks are recorded", () => {
    const skipped = [addDays("2019-01-09", 7 * 10), addDays("2019-01-09", 7 * 11), addDays("2019-01-09", 7 * 12)];
    const analysis = analyzeBroadcastRun(run({ ...earthS2, skipped_dates: skipped }));
    expect(analysis.issues).toEqual([]);
    expect(analysis.skipped_weeks).toBe(3);
  });

  it("ignores skipped dates that aren't broadcast days", () => {
    const analysis = analyzeBroadcastRun(run({ ...earthS2, skipped_dates: ["2019-03-02"] }));
    expect(codes(analysis.issues)).toContain("run.skip_wrong_weekday");
  });

  it("errors when the episode count can't fit between premiere and finale", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2016-04-09", end_date: "2016-06-25", episode_count: 14 }));
    expect(codes(analysis.issues)).toContain("run.too_few_slots");
  });

  it("infers — but doesn't store — an episode count from the dates", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2013-10-02", end_date: "2014-03-26" }));
    expect(analysis.inferred_episode_count).toBe(26);
    expect(codes(analysis.issues)).toEqual(["run.episode_count_inferred"]);
  });

  it("projects a schedule that skips recorded hiatus weeks", () => {
    const schedule = projectSchedule(run({ start_date: "2020-01-01", end_date: "2020-01-29", episode_count: 4, skipped_dates: ["2020-01-15"] }));
    expect(schedule).toEqual([
      { number: 1, date: "2020-01-01" },
      { number: 2, date: "2020-01-08" },
      { number: 3, date: "2020-01-22" },
      { number: 4, date: "2020-01-29" },
    ]);
  });
});

describe("episode release dates", () => {
  const ep = (n: number): Episode => ({
    id: `ep-${n}`,
    production_id: "prod-1",
    number: n,
    title: null,
    title_native: null,
    synopsis: null,
    runtime_minutes: null,
    provenance: "confirmed",
    created_at: "",
    updated_at: "",
  });
  const release = (n: number, date: string): { release: EpisodeRelease; episode: Episode } => ({
    episode: ep(n),
    release: { id: `rel-${n}`, episode_id: `ep-${n}`, broadcast_run_id: "run-1", air_date: date, air_time: null, notes: null, provenance: "confirmed", created_at: "", updated_at: "" },
  });

  it("catches out-of-order, off-weekday and double-episode releases", () => {
    const analysis = analyzeBroadcastRun(run({ start_date: "2016-04-09", end_date: "2016-06-25", weekday: 6, episode_count: 12 }), [
      release(1, "2016-04-09"),
      release(2, "2016-04-10"),
      release(3, "2016-04-23"),
      release(4, "2016-04-23"),
      release(5, "2016-04-16"),
    ]);
    const found = codes(analysis.issues);
    expect(found).toContain("release.wrong_weekday");
    expect(found).toContain("release.double_episode");
    expect(found).toContain("release.out_of_order");
  });
});

describe("production timeline checks", () => {
  it("keeps the premiere season while following a multi-cour broadcast", () => {
    const p = production({ premiere_year: 2011, premiere_season: "summer", premiere_date: "2011-08-15", finale_date: "2012-01-23", episode_count: 24 });
    const timeline = productionTimeline(p, [run({ start_date: "2011-08-15", end_date: "2012-01-23" })]);
    expect(timeline.premiere).toEqual({ year: 2011, season: "summer" });
    expect(timeline.continuing).toEqual([
      { year: 2011, season: "fall" },
      { year: 2012, season: "winter" },
    ]);
    expect(codes(validateProduction(p, [run({ start_date: "2011-08-15", end_date: "2012-01-23", episode_count: 24 })]))).toEqual(["production.multi_cour"]);
  });

  it("flags a premiere season that contradicts the premiere date", () => {
    const p = production({ premiere_year: 2013, premiere_season: "spring", premiere_date: "2013-10-02" });
    expect(codes(validateProduction(p, []))).toContain("production.season_mismatch");
  });

  it("matches the premiere to the earliest original broadcast (advance broadcasts included)", () => {
    const p = production({ premiere_date: "2013-10-05", finale_date: "2014-03-29", premiere_year: 2013, premiere_season: "fall" });
    const runs = [run({ id: "adv", kind: "advance", start_date: "2013-10-02", end_date: "2014-03-26", is_primary: false }), run({ id: "reg", start_date: "2013-10-05", end_date: "2014-03-29" })];
    expect(codes(validateProduction(p, runs))).toContain("production.premiere_mismatch");
  });

  it("distinguishes theatrical films from weekly television", () => {
    const film = production({ format: "film", premiere_year: 2019 });
    expect(codes(validateProduction(film, [run({ start_date: "2019-01-05", end_date: "2019-03-30" })]))).toContain("production.film_has_weekly_run");
    const tv = production({ format: "tv" });
    expect(codes(validateProduction(tv, [run({ kind: "theatrical", cadence: "single", start_date: "2019-01-05", end_date: "2019-01-05" })]))).toContain("production.tv_theatrical_only");
  });

  it("notes simultaneous regional broadcasts and catches dubs that start too early", () => {
    const p = production({ premiere_date: "2023-10-04" });
    const jp = run({ id: "jp", start_date: "2023-10-04", end_date: "2023-12-20" });
    const simulcast = run({ id: "en", kind: "dub", language: "en", region: "US", start_date: "2023-10-04", end_date: "2023-12-20", is_primary: false });
    expect(codes(validateProduction(p, [jp, simulcast]))).toContain("run.simulcast");
    const early = run({ id: "en2", kind: "dub", language: "en", region: "US", start_date: "2023-09-01", is_primary: false });
    expect(codes(validateProduction(p, [jp, early]))).toContain("run.dub_before_original");
  });

  it("flags finales before premieres", () => {
    expect(codes(validateProduction(production({ premiere_date: "2020-07-03", finale_date: "2020-06-01" }), []))).toContain("production.finale_before_premiere");
  });
});

describe("duplicate productions", () => {
  it("treats the same title, format and year as a duplicate", () => {
    const issues = findDuplicateProductions([
      production({ id: "a", slug: "overture", title: "Overture", format: "film", premiere_year: 2019 }),
      production({ id: "b", slug: "overture-2", title: "OVERTURE", format: "film", premiere_year: 2019 }),
      production({ id: "c", slug: "overture-tv", title: "Overture", format: "tv", premiere_year: 2019 }),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0].entity_id).toBe("b");
  });

  it("ignores superseded records", () => {
    const issues = findDuplicateProductions([
      production({ id: "a", slug: "a", title: "Overture", format: "film", premiere_year: 2019, provenance: "superseded" }),
      production({ id: "b", slug: "b", title: "Overture", format: "film", premiere_year: 2019 }),
    ]);
    expect(issues).toEqual([]);
  });
});
