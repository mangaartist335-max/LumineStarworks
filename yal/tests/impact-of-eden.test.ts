// Impact of Eden belongs to a later development phase. Its records stay in
// the repository; this file switches the phase on and checks they are intact.
import "./helpers/future-phase";
import { test } from "node:test";
import assert from "node:assert/strict";
import { anime, IOE_EP0_ID, IOE_ID, IRON_ID, NIGHTPOLIS_ID } from "../data/anime";
import { characters } from "../data/characters";
import { companies, people } from "../data/industry";
import { manga } from "../data/manga";
import { news, seedRecommendations, seedReviews } from "../data/community";
import { seedThreads } from "../data/forums";
import { getArchiveThread } from "../lib/archive";
import { animeUrl, getAnime } from "../lib/catalog";
import { formatAirDate, formatBroadcastSlot } from "../lib/time";

const jst = (s: string) => new Date(`${s}+09:00`).toISOString();

test("with the phase on, every Impact of Eden record is back", () => {
  for (const id of [IOE_ID, IOE_EP0_ID, NIGHTPOLIS_ID]) assert.ok(anime.some((a) => a.id === id), `anime ${id}`);
  assert.ok(characters.some((c) => c.name === "Sora Gauthier"));
  assert.ok(companies.some((c) => c.name === "Studio Burst"));
  assert.ok(people.some((p) => p.name === "Natsuki Takuya"));
  assert.ok(manga.some((m) => m.title === "Impact of Eden"));
  assert.ok(news.some((n) => n.title.includes("Impact of Eden")));
  assert.ok(seedReviews.some((r) => r.animeId === IOE_ID));
  assert.ok(seedRecommendations.some((r) => r.to === IOE_ID));
  assert.ok(seedThreads.some((t) => t.title.includes("Impact of Eden")));
  assert.ok(getArchiveThread("ioe-ep1"));
});

test("established Impact of Eden credits are recorded as given", () => {
  const ioe = anime.find((a) => a.id === IOE_ID)!;
  const credit = (role: string) => people.find((p) => p.id === ioe.staff.find((s) => s.role === role)?.personId)?.name;
  assert.equal(credit("Director"), "Kaihatsu Miura");
  assert.equal(credit("Series Composition"), "Keito Kisaragi");
  assert.equal(credit("Music"), "Hiroyuki Sawano");
  assert.equal(credit("Original Creator"), "Natsuki Takuya");
  assert.deepEqual(ioe.studios, [1]);
  assert.equal(ioe.episodesPlanned, 25);
  assert.ok(anime.find((a) => a.id === IRON_ID));
});

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

test("Impact of Eden dates: advance late on Sep 30, Season 1 on Saturday Oct 5 (25:58)", () => {
  const ioe = anime.find((a) => a.id === IOE_ID)!;
  const slot = formatBroadcastSlot(ioe.airedFrom!);
  assert.deepEqual([slot.date, slot.weekday, slot.time], ["Oct 5, 2013", "Saturday", "25:58"]);
  assert.equal(formatAirDate(ioe.airedFrom!), "Oct 5, 2013");
  const advance = ioe.broadcasts.find((b) => b.label === "Advance premiere")!;
  assert.equal(Date.parse(advance.at!), Date.parse(jst("2013-10-01T00:00:00")));
  assert.match(advance.note!, /Sep 30/);
  // The advance comes before the Season 1 premiere, after the Episode 0 special.
  const ep0 = ioe.broadcasts.find((b) => b.label === "Episode 0 special")!;
  assert.ok(Date.parse(ep0.at!) < Date.parse(advance.at!) && Date.parse(advance.at!) < Date.parse(ioe.airedFrom!));
});
