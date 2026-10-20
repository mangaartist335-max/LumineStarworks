// The confirmed chronology supplied with the archive development brief.
//
// Only facts stated in the brief live here. Anything the brief does not
// state (Japanese titles, genres, synopses, networks, broadcast times …) is
// intentionally left empty so editors can fill it in from production
// documents later. Weekdays that the brief doesn't name are *derived* at
// display time from the dates instead of being stored as facts.

import { SeedBuilder } from "./builder";

export const ESTABLISHED_SOURCE_SLUG = "archive-development-brief-2026";

export function buildEstablished() {
  const bootstrap = new SeedBuilder("confirmed", null);
  const sourceId = bootstrap.sourceDocument({
    slug: ESTABLISHED_SOURCE_SLUG,
    title: "Anime Industry Archive Development Brief — Established Productions",
    kind: "brief",
    received_at: "2026-10-20",
    description:
      "Confirmed chronology supplied with the Lumine StarWorks archive brief. Additional release dates and staff credits will be imported from production documents as they become available.",
    reference: "Lumine StarWorks — Anime Industry Archive: 2006–2026, section 4",
  });

  const b = new SeedBuilder("confirmed", sourceId);
  b.tables.source_documents.push(...bootstrap.tables.source_documents);

  // Studios
  const flowPictures = b.studio({ name: "Flow Pictures" });
  const chaosHome = b.studio({ name: "CHAOS Home", slug: "chaos-home" });
  const studioBurst = b.studio({ name: "Studio Burst" });
  const flareWorks = b.studio({ name: "Studio FlareWorks", slug: "studio-flareworks" });

  // People
  const sawano = b.person("Hiroyuki Sawano", { occupations: ["composer"] });
  const yamamoto = b.person("Kohta Yamamoto", { occupations: ["composer"] });
  const lune = b.person("LUNE", { occupations: ["singer"] });
  const miura = b.person("Kaihatsu Miura");
  const kisaragi = b.person("Keito Kisaragi");
  const haraguchi = b.person("Lio Haraguchi");
  const sumikuro = b.person("Naochi Sumikuro");
  const kanzaki = b.person("Mirai Kanzaki");
  const tachikaze = b.person("Aoi Tachikaze");
  const kagura = b.person("Yusuke Kagura");

  // ── Sinful Apex ──────────────────────────────────────────────────────────
  const sinfulApex = b.production({
    title: "Sinful Apex",
    format: "tv",
    premiere_year: 2011,
    premiere_season: "summer",
    premiere_date: "2011-08-15",
    finale_date: "2012-01-23",
    episode_count: 24,
  });
  b.cite("production", sinfulApex.id, ["title", "premiere_season", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(sinfulApex, flowPictures);
  const sinfulRun = b.run(sinfulApex, "jp-tv", {
    kind: "tv",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2011-08-15",
    end_date: "2012-01-23",
    episode_count: 24,
    is_primary: true,
  });
  b.cite("broadcast_run", sinfulRun.id, ["start_date", "end_date", "episode_count"]);
  b.cast(sinfulApex, lune, "Aria Moonbirth", {
    language: null,
    type: "appearance",
    billing: null,
    notes: "LUNE appears as the fictional singer Aria Moonbirth.",
  });

  // ── Iron to Requiem ──────────────────────────────────────────────────────
  const ironFranchise = b.franchise({ name: "Iron to Requiem" });
  const ironS1 = b.production({
    title: "Iron to Requiem: Season 1",
    format: "tv",
    franchise_id: ironFranchise,
    franchise_order: 1,
    season_number: 1,
    premiere_year: 2013,
    premiere_season: "spring",
    premiere_date: "2013-04-04",
    finale_date: "2013-09-26",
    episode_count: 26,
  });
  b.cite("production", ironS1.id, ["title", "premiere_season", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(ironS1, chaosHome);
  b.credit(ironS1, sawano, "music");
  const ironJp = b.run(ironS1, "jp-tv", {
    kind: "tv",
    label: "Japanese broadcast",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2013-04-04",
    end_date: "2013-09-26",
    weekday: 4,
    episode_count: 26,
    is_primary: true,
  });
  b.cite("broadcast_run", ironJp.id, ["start_date", "end_date", "weekday", "episode_count"]);
  const ironDub = b.run(ironS1, "en-dub", {
    kind: "dub",
    label: "English dub",
    language: "en",
    start_date: "2014-07-05",
    end_date: "2014-12-27",
  });
  b.cite("broadcast_run", ironDub.id, ["start_date", "end_date"]);

  // ── Impact of Eden ───────────────────────────────────────────────────────
  const edenFranchise = b.franchise({ name: "Impact of Eden" });
  const edenZero = b.production({
    title: "Impact of Eden: Episode 0",
    slug: "impact-of-eden-episode-0",
    format: "tv_special",
    franchise_id: edenFranchise,
    franchise_order: 1,
    premiere_year: 2013,
    premiere_season: "summer",
    premiere_date: "2013-09-26",
    finale_date: "2013-09-26",
    episode_count: 1,
    notes: "Listed in the development brief as the “Episode 0 special”.",
  });
  b.cite("production", edenZero.id, ["premiere_date"]);
  b.studioLink(edenZero, studioBurst);
  const edenZeroRun = b.run(edenZero, "special", {
    kind: "special_broadcast",
    label: "Episode 0 special",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    cadence: "single",
    start_date: "2013-09-26",
    end_date: "2013-09-26",
    episode_count: 1,
    is_primary: true,
  });
  b.cite("broadcast_run", edenZeroRun.id, ["start_date"]);

  const edenS1 = b.production({
    title: "Impact of Eden",
    slug: "impact-of-eden-season-1",
    format: "tv",
    franchise_id: edenFranchise,
    franchise_order: 2,
    season_number: 1,
    alt_titles: ["Impact of Eden Season 1"],
    premiere_year: 2013,
    premiere_season: "fall",
    premiere_date: "2013-10-02",
    finale_date: "2014-03-26",
    notes:
      "Season 1 aired on two schedules: an Advance broadcast (from October 2, 2013) and the regular broadcast (from October 5, 2013). Each is kept as its own broadcast run. Premiere and finale dates above follow the earliest (Advance) broadcast.",
  });
  b.cite("production", edenS1.id, ["title", "premiere_date", "finale_date"]);
  b.studioLink(edenS1, studioBurst);
  const edenAdvance = b.run(edenS1, "advance", {
    kind: "advance",
    label: "Season 1 Advance broadcast",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2013-10-02",
    end_date: "2014-03-26",
  });
  b.cite("broadcast_run", edenAdvance.id, ["start_date", "end_date"]);
  const edenRegular = b.run(edenS1, "regular", {
    kind: "tv",
    label: "Season 1 regular broadcast",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2013-10-05",
    end_date: "2014-03-29",
    is_primary: true,
  });
  b.cite("broadcast_run", edenRegular.id, ["start_date", "end_date"]);
  b.relate(edenS1, edenZero, "special", "Episode 0 special aired ahead of the Season 1 premiere.");

  // ── EARTH: Metal Comet ───────────────────────────────────────────────────
  const earthFranchise = b.franchise({ name: "EARTH: Metal Comet", slug: "earth-metal-comet" });

  const earthS1 = b.production({
    title: "EARTH: Metal Comet Season 1",
    slug: "earth-metal-comet-season-1",
    format: "tv",
    franchise_id: earthFranchise,
    franchise_order: 1,
    season_number: 1,
    premiere_year: 2016,
    premiere_season: "spring",
    premiere_date: "2016-04-09",
    finale_date: "2016-06-25",
    episode_count: 12,
  });
  b.cite("production", earthS1.id, ["title", "premiere_season", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(earthS1, studioBurst);
  const earthS1Run = b.run(earthS1, "jp-tv", {
    kind: "tv",
    language: "ja",
    region: "JP",
    start_date: "2016-04-09",
    end_date: "2016-06-25",
    weekday: 6,
    local_time: "16:00",
    time_zone: "Asia/Tokyo",
    episode_count: 12,
    is_primary: true,
  });
  b.cite("broadcast_run", earthS1Run.id, ["start_date", "end_date", "weekday", "local_time", "time_zone", "episode_count"]);
  b.credit(earthS1, miura, "director");
  b.credit(earthS1, kisaragi, "series_composition");
  b.credit(earthS1, sawano, "music", { sort_order: 0 });
  b.credit(earthS1, yamamoto, "music", { sort_order: 1 });
  b.credit(earthS1, haraguchi, "character_design");
  b.credit(earthS1, sumikuro, "art_director");
  b.credit(earthS1, kanzaki, "color_design");
  b.credit(earthS1, tachikaze, "sound_director");
  b.credit(earthS1, kagura, "action_choreographer");

  const earthS2 = b.production({
    title: "EARTH: Metal Comet Season 2",
    slug: "earth-metal-comet-season-2",
    format: "tv",
    franchise_id: earthFranchise,
    franchise_order: 2,
    season_number: 2,
    premiere_year: 2019,
    premiere_season: "winter",
    premiere_date: "2019-01-09",
    finale_date: "2019-06-26",
    episode_count: 22,
  });
  b.cite("production", earthS2.id, ["title", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(earthS2, studioBurst);
  const earthS2Run = b.run(earthS2, "jp-tv", {
    kind: "tv",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2019-01-09",
    end_date: "2019-06-26",
    episode_count: 22,
    is_primary: true,
  });
  b.cite("broadcast_run", earthS2Run.id, ["start_date", "end_date", "episode_count"]);

  const earthS3 = b.production({
    title: "EARTH: Metal Comet Season 3",
    slug: "earth-metal-comet-season-3",
    format: "tv",
    franchise_id: earthFranchise,
    franchise_order: 3,
    season_number: 3,
    premiere_year: 2020,
    premiere_season: "summer",
    premiere_date: "2020-07-03",
    finale_date: "2020-09-18",
    episode_count: 12,
  });
  b.cite("production", earthS3.id, ["title", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(earthS3, flareWorks);
  const earthS3Run = b.run(earthS3, "jp-tv", {
    kind: "tv",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2020-07-03",
    end_date: "2020-09-18",
    episode_count: 12,
    is_primary: true,
  });
  b.cite("broadcast_run", earthS3Run.id, ["start_date", "end_date", "episode_count"]);

  const earthS4 = b.production({
    title: "EARTH: Metal Comet Season 4",
    slug: "earth-metal-comet-season-4",
    format: "tv",
    franchise_id: earthFranchise,
    franchise_order: 4,
    season_number: 4,
    premiere_year: 2023,
    premiere_season: "spring",
    premiere_date: "2023-04-14",
    finale_date: "2023-09-29",
    episode_count: 25,
  });
  b.cite("production", earthS4.id, ["title", "premiere_date", "finale_date", "episode_count"]);
  b.studioLink(earthS4, flareWorks);
  const earthS4Run = b.run(earthS4, "jp-tv", {
    kind: "tv",
    language: "ja",
    region: "JP",
    time_zone: "Asia/Tokyo",
    start_date: "2023-04-14",
    end_date: "2023-09-29",
    episode_count: 25,
    is_primary: true,
  });
  b.cite("broadcast_run", earthS4Run.id, ["start_date", "end_date", "episode_count"]);

  b.relate(earthS1, earthS2, "sequel");
  b.relate(earthS2, earthS3, "sequel");
  b.relate(earthS3, earthS4, "sequel");

  // ── Overture ─────────────────────────────────────────────────────────────
  const overture = b.production({
    title: "Overture",
    format: "film",
    premiere_year: 2019,
    notes: "Theatrical release in 2019; the exact release date has not been documented yet.",
  });
  b.cite("production", overture.id, ["title", "format", "premiere_year"]);
  b.studioLink(overture, studioBurst);
  b.credit(overture, sawano, "music");
  const goodbye = b.track("Goodbye, Past Identity", { kind: "song" });
  b.trackCredit(goodbye, lune, "performer");
  b.theme(overture, goodbye, "ending");

  return b.tables;
}
