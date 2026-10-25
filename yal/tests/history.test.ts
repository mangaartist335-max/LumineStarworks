// Covers Impact of Eden material, which belongs to a later development
// phase; the phase is switched on for this file only.
import "./helpers/future-phase";
// The essential rule: a historical date never shows content that did not
// exist at that point. These cases follow the brief's timeline.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  airedEpisodes,
  animeStatus,
  characterFacts,
  getAnime,
  getCharacter,
  latestScore,
  nextEpisodeSlot,
  seasonalAnime,
  visibleAnime,
  visibleBackground,
  visibleNews,
  visibleThemeSongs,
  seedReviewsFor,
} from "../lib/catalog";
import { archivePostsAsOf, getArchiveThread, threadVisible } from "../lib/archive";
import { IOE_ID, IRON_ID, NIGHTPOLIS_ID } from "../data/anime";

const jst = (s: string) => new Date(`${s}+09:00`).toISOString();

test("Oct 5, 2013 (evening): premiere day, no Episode 1 thread or reactions yet", () => {
  const asOf = jst("2013-10-05T21:00:00");
  const ioe = getAnime(IOE_ID, asOf)!;
  assert.equal(animeStatus(ioe, asOf), "Not yet aired");
  assert.equal(threadVisible(getArchiveThread("ioe-ep1")!, asOf), false);
  assert.equal(archivePostsAsOf("ioe-ep1", asOf).length, 0);
  assert.equal(latestScore(ioe, asOf), null);
  assert.equal(visibleThemeSongs(ioe, asOf).length, 0);
  assert.equal(seedReviewsFor(asOf, IOE_ID).length, 0);
  // Character facts revealed by Episode 1 are not yet fan knowledge.
  const sora = getCharacter(1, asOf)!;
  assert.ok(!characterFacts(sora, asOf).some((f) => f.includes("MetaCode")));
  assert.equal(getCharacter(10, asOf), null); // Nova is introduced in Episode 1
});

test("Oct 6, 2013: Episode 1 discussion and early reactions appear", () => {
  const asOf = jst("2013-10-06T03:00:00");
  assert.equal(threadVisible(getArchiveThread("ioe-ep1")!, asOf), true);
  const posts = archivePostsAsOf("ioe-ep1", asOf);
  assert.deepEqual(posts.map((p) => p.number), [1, 2, 3, 4, 5]); // the first half hour of reactions
  assert.equal(posts[0].author, "YALBot");
  assert.equal(threadVisible(getArchiveThread("ioe-ep2")!, asOf), false);
  assert.equal(animeStatus(getAnime(IOE_ID, asOf)!, asOf), "Currently Airing");
});

test("Oct 13, 2013: Episode 2 discussion is open, Episode 3 is not", () => {
  const asOf = jst("2013-10-13T12:00:00");
  assert.equal(threadVisible(getArchiveThread("ioe-ep2")!, asOf), true);
  assert.equal(threadVisible(getArchiveThread("ioe-ep3")!, asOf), false);
  const sora = getCharacter(1, jst("2013-10-12T12:00:00"))!;
  assert.ok(!characterFacts(sora, jst("2013-10-12T12:00:00")).some((f) => f.includes("bloody nose")));
  assert.ok(characterFacts(sora, asOf).some((f) => f.includes("bloody nose")));
});

test("Oct 20, 2013: Episode 3 discussion is open", () => {
  assert.equal(threadVisible(getArchiveThread("ioe-ep3")!, jst("2013-10-20T03:00:00")), true);
});

test("Oct 24, 2013: three aired episodes, Episode 4 not aired yet", () => {
  const asOf = jst("2013-10-24T12:00:00");
  const ioe = getAnime(IOE_ID, asOf)!;
  assert.deepEqual(airedEpisodes(ioe, asOf).map((e) => e.number), [1, 2, 3]);
  const next = nextEpisodeSlot(ioe, asOf)!;
  assert.equal(next.number, 4);
  assert.equal(next.aired, false);
  assert.equal(new Date(next.at).toISOString(), "2013-10-26T16:58:00.000Z"); // Saturday Oct 26, 25:58 JST
});

test("entries appear only once listed", () => {
  assert.equal(getAnime(IOE_ID, jst("2013-09-14T12:00:00")), null);
  assert.ok(getAnime(IOE_ID, jst("2013-09-15T12:00:00")));
  assert.equal(getAnime(IRON_ID, jst("2013-03-01T12:00:00")), null);
  assert.ok(getAnime(NIGHTPOLIS_ID, jst("2012-01-01T12:00:00")), "2005 OVA is back-catalogue");
});

test("finales and announcements are hidden until they happen", () => {
  const asOf = jst("2013-06-01T12:00:00");
  assert.equal(animeStatus(getAnime(IRON_ID, asOf)!, asOf), "Currently Airing");
  const ioe = getAnime(IOE_ID, jst("2013-10-03T12:00:00"))!;
  assert.ok(!visibleBackground(ioe, jst("2013-10-03T12:00:00")).some((b) => b.includes("AdultDrift")));
  assert.ok(visibleBackground(ioe, jst("2013-10-05T12:00:00")).some((b) => b.includes("AdultDrift")));
});

test("Spring 2013 lists Iron to Requiem; Fall 2013 lists Impact of Eden only after it is added", () => {
  assert.deepEqual(seasonalAnime(2013, "spring", jst("2013-05-01T12:00:00")).premiering.map((a) => a.id), [IRON_ID]);
  assert.equal(seasonalAnime(2013, "fall", jst("2013-09-01T12:00:00")).premiering.length, 0);
  assert.deepEqual(seasonalAnime(2013, "fall", jst("2013-10-24T12:00:00")).premiering.map((a) => a.id), [IOE_ID]);
});

test("the Nightpolis Winter OVA stays a separate record from the TV series", () => {
  const asOf = jst("2013-10-24T12:00:00");
  const ova = getAnime(NIGHTPOLIS_ID, asOf)!;
  const tv = getAnime(IOE_ID, asOf)!;
  assert.notEqual(ova.id, tv.id);
  assert.equal(ova.type, "OVA");
  assert.equal(ova.year, 2005);
  assert.equal(ova.staff.length, 0, "undocumented staff stays empty");
  assert.equal(ova.episodesPlanned, null);
});

test("news never runs ahead of the viewed moment", () => {
  for (const asOf of [jst("2012-06-01T00:00:00"), jst("2013-10-05T00:00:00"), jst("2013-12-31T23:00:00")]) {
    for (const n of visibleNews(asOf)) assert.ok(new Date(n.publishedAt) <= new Date(asOf));
  }
  assert.equal(visibleAnime(jst("2013-12-31T23:00:00")).filter((a) => (a.year ?? 0) > 2013).length, 0);
});
