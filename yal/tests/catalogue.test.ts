// The built-out back catalogue and the planned Impact of Eden page.

import { test } from "node:test";
import assert from "node:assert/strict";
import { anime } from "../data/anime";
import { characters } from "../data/characters";
import { animeUrl, airedEpisodes, characterFacts, getAnime, getCharacter, nextEpisodeSlot, seasonalAnime } from "../lib/catalog";
import { formatAirDate } from "../lib/time";
import { IOE_EP0_ID, IOE_ID, IRON_ID, NIGHTPOLIS_ID } from "../data/anime";

const BUILT_OUT = [10380, 7741, 5120, 8452, 9133, 4407, 9608, 9871, 6811, 3390, 6230];
const jst = (s: string) => new Date(`${s}+09:00`).toISOString();

test("Impact of Eden's page is planned: tab links point at the entry itself", () => {
  const ioe = anime.find((a) => a.id === IOE_ID)!;
  assert.equal(ioe.pagePlanned, true);
  assert.equal(anime.find((a) => a.id === IOE_EP0_ID)!.pagePlanned, true);
  assert.equal(animeUrl(ioe, "reviews"), "/anime/19815/Impact_of_Eden");
  // The entry still exists for threads, characters and credits.
  assert.ok(getAnime(IOE_ID, jst("2013-10-24T12:00:00")));
  // Other entries are untouched.
  assert.ok(!anime.find((a) => a.id === IRON_ID)!.pagePlanned);
  assert.ok(!anime.find((a) => a.id === NIGHTPOLIS_ID)!.pagePlanned);
});

test("every built-out entry has a full page's worth of data", () => {
  for (const id of BUILT_OUT) {
    const a = anime.find((x) => x.id === id)!;
    assert.equal(a.provenance, "reconstructed", a.title);
    assert.ok(a.synopsis && a.synopsis.length > 100, `${a.title}: synopsis`);
    assert.ok(a.studios.length > 0 && !a.studios.includes(1), `${a.title}: studio (never Studio Burst)`);
    assert.ok(a.staff.length >= 3, `${a.title}: staff`);
    assert.ok(a.characters.length >= 3, `${a.title}: characters`);
    assert.equal(a.voices.length, a.characters.length, `${a.title}: every character is cast`);
    assert.equal(a.episodeList.length, a.episodesPlanned, `${a.title}: episode list`);
    assert.ok(a.themesSongs.length > 0, `${a.title}: theme songs`);
    assert.ok(a.scores.length > 0, `${a.title}: score`);
  }
});

test("established facts survive the build-out", () => {
  const sinful = anime.find((a) => a.id === 10380)!;
  assert.deepEqual(sinful.studios, [2]);
  assert.equal(sinful.episodesPlanned, 24);
  assert.equal(formatAirDate(sinful.airedFrom!), "Aug 15, 2011");
  assert.equal(formatAirDate(sinful.airedTo!), "Jan 23, 2012");
  assert.ok(sinful.staff.some((s) => s.personId === 2 && s.role === "Director"));
  assert.ok(sinful.staff.some((s) => s.personId === 14));
  assert.ok(anime.find((a) => a.id === 7741)!.staff.some((s) => s.personId === 2 && s.role === "Director"));
  assert.ok(anime.find((a) => a.id === 7741)!.staff.some((s) => s.personId === 5));
  assert.ok(anime.find((a) => a.id === 5120)!.staff.some((s) => s.personId === 2 && s.role === "Co-Director"));
  const river = anime.find((a) => a.id === 8452)!;
  assert.ok(river.staff.some((s) => s.personId === 5) && river.staff.some((s) => s.personId === 9));
  assert.deepEqual(anime.find((a) => a.id === 9133)!.studios, [2]);
  assert.equal(anime.find((a) => a.id === 5120)!.year, 2009);
  assert.equal(anime.find((a) => a.id === 7741)!.year, 2010);
});

test("2012–2013 seasons fill in only as shows are listed and aired", () => {
  assert.deepEqual(seasonalAnime(2012, "winter", jst("2012-01-20T12:00:00")).premiering.map((a) => a.id), [4407]);
  assert.equal(seasonalAnime(2012, "spring", jst("2012-02-01T12:00:00")).premiering.length, 0);
  assert.deepEqual(seasonalAnime(2012, "spring", jst("2012-04-10T12:00:00")).premiering.map((a) => a.id), [9608]);
  assert.deepEqual(seasonalAnime(2012, "fall", jst("2012-10-10T12:00:00")).continuing.map((a) => a.id), [9871]);
  assert.deepEqual(seasonalAnime(2013, "winter", jst("2013-02-01T12:00:00")).premiering.map((a) => a.id), [6811]);
});

test("mid-season views show aired episodes and the next slot only", () => {
  const asOf = jst("2012-02-01T12:00:00");
  const glass = getAnime(4407, asOf)!;
  assert.deepEqual(airedEpisodes(glass, asOf).map((e) => e.number), [1, 2, 3]);
  const next = nextEpisodeSlot(glass, asOf)!;
  assert.equal(next.number, 4);
  assert.equal(next.aired, false);
  const elise = getCharacter(128, asOf)!;
  assert.ok(!characterFacts(elise, asOf).some((f) => f.includes("future morning")));
  assert.ok(characterFacts(elise, jst("2012-03-02T00:00:00")).some((f) => f.includes("future morning")));
});

test("characters of the new shows only appear once their show is listed", () => {
  assert.equal(getCharacter(141, jst("2012-11-01T00:00:00")), null);
  assert.ok(getCharacter(141, jst("2012-12-02T00:00:00")));
  assert.ok(characters.filter((c) => c.id >= 101).length >= 44);
});

// Year of each actor's first anime or voice credit, from public profiles
// (docs/VOICE_CASTING.md lists the details behind each one).
const VOICE_DEBUT: Record<number, number> = {
  20: 2002, 21: 2006, 22: 2003, 23: 2012, 24: 2007, 25: 2001, 26: 2001, 27: 1994,
  28: 2010, 29: 1995, 30: 2005, 31: 2004, 32: 2011,
  61: 1998, 62: 1972, 63: 1999, 64: 1990, 65: 2001, 66: 1998, 67: 2001, 68: 1987,
  69: 1987, 70: 1998, 71: 1992, 72: 1972, 73: 2007, 74: 1998, 75: 2001, 76: 1983,
  77: 2007, 78: 2006, 79: 1995, 80: 1997, 81: 1988, 82: 2003, 83: 2009, 84: 1988,
};
const LUNE = 14; // the singer, appearing as Aria Moonbirth

test("built-out titles are voiced by actors who were already working when they aired", () => {
  for (const id of BUILT_OUT) {
    const a = anime.find((x) => x.id === id)!;
    const premiered = new Date(Date.parse(a.airedFrom!) + 9 * 3600_000).getUTCFullYear(); // JST
    for (const v of a.voices) {
      if (v.personId === LUNE) continue;
      const debut = VOICE_DEBUT[v.personId];
      assert.ok(debut, `${a.title}: actor ${v.personId} has no researched debut year`);
      const main = a.characters.find((c) => c.characterId === v.characterId)?.role === "Main";
      // A lead goes to someone with at least a year of work behind them.
      assert.ok(main ? debut < premiered : debut <= premiered, `${a.title}: actor ${v.personId} (debut ${debut}) cast in ${premiered}`);
    }
  }
});
