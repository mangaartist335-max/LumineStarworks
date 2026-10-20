import { describe, expect, it } from "vitest";
import { buildSeedTables, ESTABLISHED_SOURCE_SLUG } from "@/data/seed";
import { indexArchive } from "@/lib/archive/archive-index";
import { getSeasonListing } from "@/lib/archive/queries";
import { validateArchive } from "@/lib/archive/validation";

const tables = buildSeedTables();
const index = indexArchive(tables);
const bySlug = (slug: string) => {
  const p = index.productionsBySlug.get(slug);
  if (!p) throw new Error(`missing ${slug}`);
  return p;
};
const studioOf = (slug: string) => index.studiosFor(bySlug(slug).id).map((s) => s.studio.name);
const creditNames = (slug: string, role: string) =>
  index
    .creditsFor(bySlug(slug).id)
    .filter((c) => c.credit.role === role)
    .map((c) => c.person.name);

describe("established chronology", () => {
  it("records every production from the brief as Confirmed", () => {
    const confirmed = tables.productions.filter((p) => p.provenance === "confirmed").map((p) => p.slug).sort();
    expect(confirmed).toEqual(
      [
        "earth-metal-comet-season-1",
        "earth-metal-comet-season-2",
        "earth-metal-comet-season-3",
        "earth-metal-comet-season-4",
        "impact-of-eden-episode-0",
        "impact-of-eden-season-1",
        "iron-to-requiem-season-1",
        "overture",
        "sinful-apex",
      ].sort(),
    );
  });

  it("matches the brief for Sinful Apex", () => {
    const p = bySlug("sinful-apex");
    expect([p.premiere_date, p.finale_date, p.episode_count, p.premiere_season, p.premiere_year]).toEqual(["2011-08-15", "2012-01-23", 24, "summer", 2011]);
    expect(studioOf("sinful-apex")).toEqual(["Flow Pictures"]);
    const lune = index.castFor(p.id).find((c) => c.person.name === "LUNE");
    expect(lune?.credit.character_name).toBe("Aria Moonbirth");
  });

  it("matches the brief for Iron to Requiem, keeping the English dub separate", () => {
    const p = bySlug("iron-to-requiem-season-1");
    expect([p.premiere_date, p.finale_date, p.episode_count, p.premiere_season]).toEqual(["2013-04-04", "2013-09-26", 26, "spring"]);
    expect(studioOf("iron-to-requiem-season-1")).toEqual(["CHAOS Home"]);
    expect(creditNames("iron-to-requiem-season-1", "music")).toEqual(["Hiroyuki Sawano"]);
    const runs = index.runsFor(p.id);
    const jp = runs.find((r) => r.kind === "tv")!;
    const dub = runs.find((r) => r.kind === "dub")!;
    expect(jp.weekday).toBe(4);
    expect([dub.language, dub.start_date, dub.end_date]).toEqual(["en", "2014-07-05", "2014-12-27"]);
  });

  it("keeps Impact of Eden's Advance and regular schedules distinct", () => {
    const s1 = bySlug("impact-of-eden-season-1");
    const runs = index.runsFor(s1.id);
    const advance = runs.find((r) => r.kind === "advance")!;
    const regular = runs.find((r) => r.kind === "tv")!;
    expect([advance.start_date, advance.end_date]).toEqual(["2013-10-02", "2014-03-26"]);
    expect([regular.start_date, regular.end_date]).toEqual(["2013-10-05", "2014-03-29"]);
    expect(s1.episode_count).toBeNull(); // not stated in the brief
    const zero = bySlug("impact-of-eden-episode-0");
    expect(zero.premiere_date).toBe("2013-09-26");
    expect(index.relatedFor(s1.id).map((r) => r.production.slug)).toContain("impact-of-eden-episode-0");
    expect(studioOf("impact-of-eden-season-1")).toEqual(["Studio Burst"]);
  });

  it("matches the brief for every EARTH: Metal Comet season", () => {
    const expected = [
      ["earth-metal-comet-season-1", "2016-04-09", "2016-06-25", 12, "Studio Burst"],
      ["earth-metal-comet-season-2", "2019-01-09", "2019-06-26", 22, "Studio Burst"],
      ["earth-metal-comet-season-3", "2020-07-03", "2020-09-18", 12, "Studio FlareWorks"],
      ["earth-metal-comet-season-4", "2023-04-14", "2023-09-29", 25, "Studio FlareWorks"],
    ] as const;
    for (const [slug, start, end, eps, studio] of expected) {
      const p = bySlug(slug);
      expect([p.premiere_date, p.finale_date, p.episode_count]).toEqual([start, end, eps]);
      expect(studioOf(slug)).toEqual([studio]);
    }
    const s1Run = index.runsFor(bySlug("earth-metal-comet-season-1").id)[0];
    expect([s1Run.weekday, s1Run.local_time, s1Run.time_zone]).toEqual([6, "16:00", "Asia/Tokyo"]);
  });

  it("credits the EARTH: Metal Comet Season 1 staff exactly as listed", () => {
    const slug = "earth-metal-comet-season-1";
    expect(creditNames(slug, "director")).toEqual(["Kaihatsu Miura"]);
    expect(creditNames(slug, "series_composition")).toEqual(["Keito Kisaragi"]);
    expect(creditNames(slug, "music")).toEqual(["Hiroyuki Sawano", "Kohta Yamamoto"]);
    expect(creditNames(slug, "character_design")).toEqual(["Lio Haraguchi"]);
    expect(creditNames(slug, "art_director")).toEqual(["Naochi Sumikuro"]);
    expect(creditNames(slug, "color_design")).toEqual(["Mirai Kanzaki"]);
    expect(creditNames(slug, "sound_director")).toEqual(["Aoi Tachikaze"]);
    expect(creditNames(slug, "action_choreographer")).toEqual(["Yusuke Kagura"]);
  });

  it("records Overture as a 2019 Studio Burst film without inventing a date", () => {
    const p = bySlug("overture");
    expect([p.format, p.premiere_year, p.premiere_date, p.premiere_season]).toEqual(["film", 2019, null, null]);
    expect(studioOf("overture")).toEqual(["Studio Burst"]);
    expect(creditNames("overture", "music")).toEqual(["Hiroyuki Sawano"]);
    const ending = index.themesFor(p.id).find((t) => t.theme.usage === "ending")!;
    expect(ending.track.title).toBe("Goodbye, Past Identity");
    expect(ending.credits.map((c) => c.person.name)).toEqual(["LUNE"]);
  });

  it("doesn't invent details the brief leaves out", () => {
    for (const p of tables.productions.filter((x) => x.provenance === "confirmed")) {
      expect(p.title_native).toBeNull();
      expect(p.synopsis).toBeNull();
      expect(p.genres).toEqual([]);
      expect(p.score).toBeNull();
    }
  });

  it("cites the development brief for established facts", () => {
    const brief = tables.source_documents.find((d) => d.slug === ESTABLISHED_SOURCE_SLUG)!;
    const p = bySlug("earth-metal-comet-season-1");
    const fields = index.factSources("production", p.id).filter((f) => f.fact.source_document_id === brief.id).map((f) => f.fact.field);
    expect(fields).toEqual(expect.arrayContaining(["premiere_date", "finale_date", "episode_count"]));
  });

  it("files multi-cour shows under their premiere season and continuing seasons", () => {
    const summer = getSeasonListing(index, { year: 2011, season: "summer" }, "2026-10-20");
    const winter = getSeasonListing(index, { year: 2012, season: "winter" }, "2026-10-20");
    expect(summer.premieres.map((p) => p.slug)).toContain("sinful-apex");
    expect(winter.continuing.map((p) => p.slug)).toContain("sinful-apex");
    expect(winter.premieres.map((p) => p.slug)).not.toContain("sinful-apex");
  });
});

describe("proposed sample catalogue", () => {
  const confirmedPeople = new Set(tables.people.filter((p) => p.provenance === "confirmed").map((p) => p.id));
  const confirmedStudios = new Set(tables.studios.filter((s) => s.provenance === "confirmed").map((s) => s.id));
  const proposed = tables.productions.filter((p) => p.provenance !== "confirmed");

  it("marks every generated production as Proposed", () => {
    expect(proposed.length).toBeGreaterThan(50);
    expect(proposed.every((p) => p.provenance === "proposed")).toBe(true);
  });

  it("never attaches established people or studios to sample entries", () => {
    const ids = new Set(proposed.map((p) => p.id));
    expect(tables.production_credits.filter((c) => ids.has(c.production_id)).some((c) => confirmedPeople.has(c.person_id))).toBe(false);
    expect(tables.voice_credits.filter((c) => ids.has(c.production_id)).some((c) => confirmedPeople.has(c.person_id))).toBe(false);
    expect(tables.production_studios.filter((s) => ids.has(s.production_id)).some((s) => confirmedStudios.has(s.studio_id))).toBe(false);
  });

  it("keeps the seed free of timeline errors and duplicates", () => {
    expect(validateArchive(tables).filter((i) => i.level === "error")).toEqual([]);
  });

  it("produces stable ids on every build", () => {
    const again = buildSeedTables();
    expect(again.productions.map((p) => p.id)).toEqual(tables.productions.map((p) => p.id));
  });
});
