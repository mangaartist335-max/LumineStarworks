// The back catalogue follows the Connected Era Master Bible (ch. 16, 18, 19).

import { test } from "node:test";
import assert from "node:assert/strict";
import { anime } from "../data/anime";
import { characters } from "../data/characters";
import { airedEpisodes, animeStatus, getAnime, nextEpisodeSlot, seasonalAnime } from "../lib/catalog";
import { formatAirDate } from "../lib/time";

const jst = (s: string) => new Date(`${s}+09:00`).toISOString();
const byTitle = (title: string) => {
  const a = anime.find((x) => x.title === title);
  assert.ok(a, `${title} is listed`);
  return a!;
};

// Ch. 18: title, year, format.
const CATALOGUE: [string, number, string][] = [
  ["Vacant Crown: Liminal War", 2000, "TV"],
  ["River of Sparks", 2004, "TV"],
  ["Glass Cathedral", 2005, "Movie"],
  ["Skyfall Chronicle", 2006, "TV"],
  ["Iron Halo Brigade", 2007, "TV"],
  ["Neon Afterimage", 2007, "Movie"],
  ["Tearfall Resonance", 2007, "Movie"],
  ["Circuit Hearts: Reload", 2008, "TV"],
  ["Steelbound Testament", 2008, "TV"],
  ["Pale Garden Reverie", 2009, "TV"],
  ["Nocturne of the Iron Sea", 2009, "Movie"],
  ["Blizzard Requiem", 2010, "TV"],
  ["Garden of Cinders", 2010, "OVA"],
  ["Shadowline Oratorio", 2011, "TV"],
  ["Zero Latitude", 2011, "Special"],
  ["Sinful Apex", 2011, "TV"],
  ["Rust Veil Junction", 2012, "TV"],
  ["Skyfall Chronicle: Black Aegis", 2012, "Movie"],
];

// Ch. 18 people registry: person id → titles.
const REGISTRY: Record<number, string[]> = {
  2: ["Sinful Apex", "Skyfall Chronicle", "Zero Latitude"], // Kaihatsu Miura (IoE and EMC are outside this catalogue)
  3: ["Steelbound Testament", "Pale Garden Reverie", "Blizzard Requiem"], // Keito Kisaragi
  5: ["Glass Cathedral", "Vacant Crown: Liminal War", "A Mystical Skyline/Finger"], // Tomoe Suzuhara
  4: ["Destiny/Infinite", "Steelbound Testament", "Sinful Apex"], // Lio Haraguchi
  9: ["River of Sparks", "Ghost Eater", "Sinful Apex"], // Yusuke Kagura
  7: ["Sinful Apex", "Neon Afterimage"], // Mirai Kanzaki
  8: ["River of Sparks", "Glass Cathedral"], // Aoi Tachikaze
  15: ["Vacant Crown: Liminal War", "Steelbound Testament"], // Rento Shibasaki
};
const LUNE = 14;

// Ch. 19: LUNE's documented or working songs.
const LUNE_SONGS: Record<string, string> = {
  "Vacant Crown: Liminal War": "Gesshoku / Requiem for Zero",
  "Glass Cathedral": "VITRAIL",
  "Neon Afterimage": "AFTER//IMAGE",
  "Circuit Hearts: Reload": "PULSE:RE",
  "Steelbound Testament": "ALETHEIA / Ashes Know My Name",
};

const TITLE_ONLY = ["Ghost Eater", "Destiny/Infinite", "A Mystical Skyline/Finger", "Azure Sorcerer"];
const ALL_TITLES = [...CATALOGUE.map(([t]) => t), ...TITLE_ONLY];

test("every catalogue title is listed with the Bible's year and format", () => {
  for (const [title, year, type] of CATALOGUE) {
    const a = byTitle(title);
    assert.equal(a.year, year, `${title}: year`);
    assert.equal(a.type, type, `${title}: format`);
    assert.equal(a.provenance, "documented", `${title}: provenance`);
    assert.ok(a.synopsis, `${title}: catalogue description`);
  }
  assert.deepEqual(byTitle("River of Sparks").premiered, { season: "winter", year: 2004 });
  assert.equal(byTitle("Garden of Cinders").episodesPlanned, 3, "OVA trilogy");
});

test("staff credits are exactly the people registry's connections", () => {
  for (const title of ALL_TITLES) {
    const a = byTitle(title);
    const expected = Object.entries(REGISTRY)
      .filter(([, titles]) => titles.includes(title))
      .map(([id]) => Number(id))
      .sort((x, y) => x - y);
    const credited = [...new Set(a.staff.filter((s) => s.personId !== LUNE).map((s) => s.personId))].sort((x, y) => x - y);
    assert.deepEqual(credited, expected, `${title}: staff`);
  }
});

test("LUNE's songs are credited as documented, without guessing whether they open or close", () => {
  for (const title of ALL_TITLES) {
    const a = byTitle(title);
    const song = LUNE_SONGS[title];
    const themes = a.themesSongs.filter((s) => s.artist === "LUNE");
    if (!song) {
      assert.equal(themes.length, 0, `${title}: no LUNE song in the Bible`);
      continue;
    }
    assert.equal(themes.length, 1, `${title}: one LUNE song`);
    assert.equal(themes[0].title, song);
    assert.equal(themes[0].kind, "Theme");
    assert.ok(a.staff.some((s) => s.personId === LUNE), `${title}: LUNE on the staff list`);
  }
});

test("Sinful Apex matches the franchise registry", () => {
  const sinful = byTitle("Sinful Apex");
  assert.deepEqual(sinful.studios, [2]);
  assert.equal(sinful.episodesPlanned, 24);
  assert.equal(sinful.episodeList.length, 24);
  assert.equal(formatAirDate(sinful.airedFrom!), "Aug 15, 2011");
  assert.equal(formatAirDate(sinful.airedTo!), "Jan 23, 2012");
  assert.ok(sinful.episodeList.every((e) => e.title === null), "episode titles are not recorded");
  const aria = characters.find((c) => c.name === "Aria Moonbirth")!;
  assert.ok(sinful.voices.some((v) => v.characterId === aria.id && v.personId === LUNE));
});

test("no studio, cast or invented detail where the Bible gives none", () => {
  for (const title of ALL_TITLES) {
    const a = byTitle(title);
    if (title !== "Sinful Apex") {
      assert.deepEqual(a.studios, [], `${title}: studio`);
      assert.equal(a.characters.length, 0, `${title}: characters`);
      assert.equal(a.episodeList.length, 0, `${title}: episode list`);
    }
    assert.equal(a.scores.length, 0, `${title}: scores`);
    assert.equal(a.rating, null, `${title}: rating`);
  }
  for (const title of TITLE_ONLY) {
    const a = byTitle(title);
    assert.equal(a.type, "Unknown", `${title}: format`);
    assert.equal(a.year, null, `${title}: year`);
    assert.equal(a.synopsis, null, `${title}: synopsis`);
  }
  assert.deepEqual(
    characters.map((c) => c.name),
    ["Aria Moonbirth"],
    "Aria Moonbirth is the only catalogue character the Bible names",
  );
});

test("sequels and side stories link both ways", () => {
  const linked = (from: string, to: string, kind: string) =>
    assert.ok(byTitle(from).relations.some((r) => r.target.id === byTitle(to).id && r.kind === kind), `${from} → ${to} (${kind})`);
  linked("Skyfall Chronicle", "Skyfall Chronicle: Black Aegis", "Sequel");
  linked("Skyfall Chronicle: Black Aegis", "Skyfall Chronicle", "Prequel");
  linked("Steelbound Testament", "Garden of Cinders", "Side story");
  linked("Garden of Cinders", "Steelbound Testament", "Parent story");
});

test("Sinful Apex fills in week by week", () => {
  const asOf = jst("2012-01-10T12:00:00");
  const sinful = getAnime(10380, asOf)!;
  assert.equal(animeStatus(sinful, asOf), "Currently Airing");
  assert.equal(airedEpisodes(sinful, asOf).length, 22);
  assert.deepEqual(nextEpisodeSlot(sinful, asOf), { number: 23, at: jst("2012-01-16T00:00:00"), aired: false });
  assert.equal(animeStatus(sinful, jst("2012-01-24T12:00:00")), "Finished Airing");
  assert.deepEqual(seasonalAnime(2011, "summer", asOf).premiering.map((a) => a.id), [10380]);
  assert.deepEqual(seasonalAnime(2004, "winter", asOf).premiering.map((a) => a.title), ["River of Sparks"]);
});

test("titles from 2012 are year-only until their dates are recorded", () => {
  for (const title of ["Rust Veil Junction", "Skyfall Chronicle: Black Aegis"]) {
    const a = byTitle(title);
    assert.equal(a.airedFrom, null);
    assert.equal(animeStatus(a, jst("2012-08-01T12:00:00")), "Not documented");
    assert.equal(animeStatus(a, jst("2013-02-01T12:00:00")), "Finished Airing");
  }
});
