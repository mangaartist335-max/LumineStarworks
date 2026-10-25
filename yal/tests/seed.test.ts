// Consistency checks across the catalogue and reconstructed seed content.

import { test } from "node:test";
import assert from "node:assert/strict";
import { anime } from "../data/anime";
import { characters } from "../data/characters";
import { companies, people } from "../data/industry";
import { manga } from "../data/manga";
import { news, seedRecommendations, seedReviews } from "../data/community";
import { boards, seedThreads } from "../data/forums";
import { getArchiveMember } from "../lib/archive";
import { getAnime } from "../lib/catalog";

const ids = <T extends { id: number | string }>(list: T[]) => list.map((x) => x.id);
const unique = (list: (number | string)[]) => new Set(list).size === list.length;

test("ids are unique", () => {
  assert.ok(unique(ids(anime)));
  assert.ok(unique(ids(characters)));
  assert.ok(unique(ids(people)));
  assert.ok(unique(ids(companies)));
  assert.ok(unique(ids(manga)));
  assert.ok(unique(ids(news)));
  assert.ok(unique(ids(seedThreads)));
});

test("every reference resolves", () => {
  const personIds = new Set(ids(people));
  const companyIds = new Set(ids(companies));
  const charIds = new Set(ids(characters));
  for (const a of anime) {
    for (const s of a.staff) assert.ok(personIds.has(s.personId), `${a.title}: person ${s.personId}`);
    for (const v of a.voices) {
      assert.ok(personIds.has(v.personId), `${a.title}: VA ${v.personId}`);
      assert.ok(charIds.has(v.characterId), `${a.title}: character ${v.characterId}`);
    }
    for (const c of [...a.studios, ...a.producers, ...a.licensors.map((l) => l.companyId)]) assert.ok(companyIds.has(c), `${a.title}: company ${c}`);
    for (const r of a.relations) {
      const pool = r.target.type === "anime" ? anime : manga;
      assert.ok(pool.some((x) => x.id === r.target.id), `${a.title}: relation ${r.target.id}`);
    }
  }
  const boardSlugs = new Set(boards.map((b) => b.slug));
  for (const t of seedThreads) assert.ok(boardSlugs.has(t.board), t.id);
});

test("established credits are recorded as given", () => {
  const ioe = anime.find((a) => a.id === 19815)!;
  const credit = (role: string) => people.find((p) => p.id === ioe.staff.find((s) => s.role === role)?.personId)?.name;
  assert.equal(credit("Director"), "Kaihatsu Miura");
  assert.equal(credit("Series Composition"), "Keito Kisaragi");
  assert.equal(credit("Music"), "Hiroyuki Sawano");
  assert.equal(credit("Original Creator"), "Natsuki Takuya");
  assert.deepEqual(ioe.studios, [1]);
  assert.equal(ioe.episodesPlanned, 25);
  const iron = anime.find((a) => a.id === 16592)!;
  assert.deepEqual(iron.studios, [3]);
  assert.equal(iron.episodesPlanned, 26);
  const sinful = anime.find((a) => a.id === 10380)!;
  assert.deepEqual(sinful.studios, [2]);
  assert.equal(sinful.episodesPlanned, 24);
});

test("back-catalogue titles are not assigned to Studio Burst", () => {
  for (const a of anime) {
    if (a.franchise === "Impact of Eden" && a.id !== 1043) continue;
    assert.ok(!a.studios.includes(1), `${a.title} wrongly credited to Studio Burst`);
  }
});

test("reconstructed posts, reviews and recommendations come from members who had already joined", () => {
  const check = (author: string, at: string, what: string) => {
    const m = getArchiveMember(author);
    assert.ok(m, `${what}: unknown member ${author}`);
    if (m!.joinedAt) assert.ok(new Date(m!.joinedAt) <= new Date(at), `${what}: ${author} joined after ${at}`);
  };
  for (const t of seedThreads) {
    assert.equal(t.provenance, "reconstructed");
    assert.equal(t.posts[0].at, t.createdAt, `${t.id} first post time`);
    for (const p of t.posts) {
      check(p.author, p.at, t.id);
      assert.ok(new Date(p.at) >= new Date(t.createdAt), `${t.id}: post before thread`);
    }
  }
  for (const r of seedReviews) {
    assert.equal(r.provenance, "reconstructed");
    check(r.author, r.postedAt, r.id);
    assert.ok(getAnime(r.animeId, r.postedAt), `${r.id}: anime not listed yet`);
    assert.ok(r.body.length >= 200, `${r.id}: too short`);
  }
  for (const r of seedRecommendations) {
    check(r.author, r.postedAt, r.id);
    assert.ok(getAnime(r.from, r.postedAt) && getAnime(r.to, r.postedAt), `${r.id}: anime not listed yet`);
  }
});

test("seed threads tied to an anime only post once it is listed", () => {
  for (const t of seedThreads) if (t.animeId) assert.ok(getAnime(t.animeId, t.createdAt), `${t.id} predates its anime`);
});

test("nothing is populated beyond 2013", () => {
  const limit = new Date("2014-01-01T00:00:00+09:00");
  const dates = [
    ...anime.flatMap((a) => [a.visibleFrom, a.airedFrom, ...a.episodeList.map((e) => e.airedAt), ...a.scores.map((s) => s.capturedAt)]),
    ...characters.flatMap((c) => [c.visibleFrom, ...c.bio.map((b) => b.revealedAt)]),
    ...news.map((n) => n.publishedAt),
    ...seedThreads.flatMap((t) => t.posts.map((p) => p.at)),
  ].filter(Boolean) as string[];
  for (const d of dates) assert.ok(new Date(d) < limit, `date beyond 2013: ${d}`);
});
