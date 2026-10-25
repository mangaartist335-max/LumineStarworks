// Release-state controls: with no future phase enabled (the default), Impact
// of Eden and everything that exists only through it stay out of the site.

import { test } from "node:test";
import assert from "node:assert/strict";
import { allAnime, anime, IOE_EP0_ID, IOE_ID, NIGHTPOLIS_ID } from "../data/anime";
import { allCharacters, characters } from "../data/characters";
import { companies, people } from "../data/industry";
import { manga } from "../data/manga";
import { allNews, news, seedRecommendations, seedReviews } from "../data/community";
import { allSeedThreads, seedThreads } from "../data/forums";
import { phaseEnabled } from "../data/release";
import { allArchivePosts, getArchiveThread } from "../lib/archive";
import { getAnime } from "../lib/catalog";

const IOE_WORDS = /Impact of Eden|Studio Burst|\bBurst\b|Nightpolis|Sora Gauthier|Miyuki Kagemitsu|Human x Inhuman|Natsuki Takuya|AniBlex/;
const LATE = "2013-12-31T14:00:00Z";

test("the phase is off by default", () => {
  assert.equal(phaseEnabled("impact-of-eden"), false);
});

test("Impact of Eden records are kept but not active", () => {
  for (const id of [IOE_ID, IOE_EP0_ID, NIGHTPOLIS_ID]) {
    assert.ok(allAnime.some((a) => a.id === id), `record ${id} is preserved`);
    assert.ok(!anime.some((a) => a.id === id), `record ${id} is hidden`);
    assert.equal(getAnime(id, LATE), null);
  }
  assert.ok(allCharacters.length > characters.length);
  assert.ok(allNews.length > news.length);
  assert.ok(allSeedThreads.length > seedThreads.length);
  assert.equal(getArchiveThread("ioe-ep1"), null);
  assert.equal(allArchivePosts().filter((p) => p.threadId.startsWith("ioe-")).length, 0);
});

test("nothing active mentions Impact of Eden", () => {
  const texts: [string, string][] = [];
  for (const a of anime) {
    texts.push([a.title, [a.title, a.synopsis, ...a.background.map((b) => b.text), ...(a.archiveNotes ?? [])].join(" ")]);
    for (const r of a.relations) assert.ok(anime.some((x) => x.id === r.target.id) || r.target.type !== "anime", `${a.title} relates to a hidden entry`);
  }
  for (const c of characters) texts.push([c.name, [c.name, ...c.bio.map((b) => b.text)].join(" ")]);
  for (const c of companies) texts.push([c.name, `${c.name} ${c.about ?? ""}`]);
  for (const p of people) texts.push([p.name, `${p.name} ${p.about ?? ""}`]);
  for (const m of manga) texts.push([m.title, m.title]);
  for (const n of news) texts.push([n.title, `${n.title} ${n.body}`]);
  for (const r of seedReviews) texts.push([r.id, r.body]);
  for (const r of seedRecommendations) texts.push([r.id, r.reason]);
  for (const t of seedThreads) texts.push([t.title, [t.title, ...t.posts.map((p) => p.body)].join(" ")]);
  const cites = (list: { sources?: { cite: string }[]; source?: unknown }[]) =>
    list.flatMap((r) => [...(r.sources ?? []), ...(r.source && typeof r.source === "object" ? [r.source as { cite: string }] : [])]).map((s) => s.cite);
  for (const c of [...cites(anime), ...cites(characters), ...cites(companies), ...cites(people), ...cites(manga), ...cites(news)]) texts.push(["source", c]);
  for (const [what, text] of texts) assert.doesNotMatch(text ?? "", IOE_WORDS, what);
});
