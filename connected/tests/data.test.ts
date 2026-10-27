// Archive data: the search index, dates, and the release-state rule that
// Impact of Eden stays out of this phase entirely.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildSearchDocs } from "../data/search-docs";
import { SearchIndex } from "../lib/search";
import { parseUrl } from "../lib/web/url";
import { isArchiveHost } from "../lib/web/hosts";
import { siteForHost } from "../components/sites/registry";
import { ERA_END, ERA_START } from "../lib/time";
import { archiveHomepages } from "../data/homepages";
import { archiveReviews, archiveStories, fandomById } from "../data/fanfic";
import { archiveMail } from "../data/mail";
import { sampleContacts } from "../data/messenger";

const IOE_WORDS = /Impact of Eden|Studio Burst|\bBurst\b|Nightpolis|Sora Gauthier|Miyuki Kagemitsu|Human x Inhuman|Natsuki Takuya|AniBlex/;
const within = (iso: string) => Date.parse(iso) >= Date.parse(ERA_START) && Date.parse(iso) <= Date.parse(ERA_END);

test("search documents have unique ids, archive addresses and era dates", () => {
  const docs = buildSearchDocs();
  assert.ok(docs.length > 150, `only ${docs.length} documents`);
  const ids = new Set<string>();
  for (const d of docs) {
    assert.ok(!ids.has(d.id), `duplicate id ${d.id}`);
    ids.add(d.id);
    const u = parseUrl(d.url);
    assert.ok(u, `bad url ${d.url}`);
    assert.ok(siteForHost(u!.host), `no site serves ${d.url}`);
    assert.ok(isArchiveHost(u!.host), `not an archive host: ${d.url}`);
    assert.ok(!Number.isNaN(Date.parse(d.publishedAt)), `bad date on ${d.id}`);
  }
});

test("search only finds what existed on the computer's date", () => {
  const index = new SearchIndex(buildSearchDocs());
  const before = index.search("paper planet", { now: Date.parse("2012-08-01T00:00:00Z"), kind: "all", page: 1, perPage: 50 });
  assert.ok(!before.hits.some((h) => /Paper Planet/.test(h.doc.title)), "Paper Planet started in 2013");
  const after = index.search("paper planet", { now: Date.parse("2013-09-07T20:00:00Z"), kind: "all", page: 1, perPage: 50 });
  assert.ok(after.hits.some((h) => /Paper Planet/.test(h.doc.title)));
  const ink = index.search("rock crab", { now: Date.parse("2013-09-07T20:00:00Z"), kind: "all", page: 1, perPage: 10 });
  assert.ok(ink.hits.some((h) => h.doc.site === "InkPocket"));
});

test("Impact of Eden appears nowhere in the Connected Era's data", () => {
  for (const d of buildSearchDocs()) assert.doesNotMatch(`${d.title} ${d.description} ${d.body ?? ""} ${(d.tags ?? []).join(" ")}`, IOE_WORDS, d.id);
  for (const f of readdirSync(join(__dirname, "..", "data"))) {
    if (!/\.(ts|json)$/.test(f)) continue;
    assert.doesNotMatch(readFileSync(join(__dirname, "..", "data", f), "utf8"), IOE_WORDS, f);
  }
  assert.doesNotMatch(readFileSync(join(__dirname, "..", "data", "generated", "yal-index.json"), "utf8"), IOE_WORDS, "yal-index.json");
});

test("homepages: updates and guestbook entries fall inside the era", () => {
  for (const p of archiveHomepages) {
    assert.ok(within(p.createdAt), p.slug);
    for (const s of p.sections) if (s.at) assert.ok(Date.parse(s.at) >= Date.parse(p.createdAt) && within(s.at), `${p.slug}: ${s.heading}`);
    for (const g of p.guestbook) assert.ok(Date.parse(g.at) >= Date.parse(p.createdAt) && within(g.at), `${p.slug}: ${g.name}`);
  }
});

test("fan fiction: chapters in order, reviews after their chapter, known fandoms", () => {
  for (const s of archiveStories) {
    assert.ok(fandomById(s.fandom), s.id);
    for (let i = 1; i < s.chapters.length; i++) assert.ok(s.chapters[i].at > s.chapters[i - 1].at, `${s.id} chapter order`);
    for (const c of s.chapters) assert.ok(within(c.at) && c.text.length > 400, `${s.id}: ${c.title}`);
  }
  for (const r of archiveReviews) {
    const s = archiveStories.find((x) => x.id === r.storyId);
    assert.ok(s && s.chapters[r.chapter - 1], `review for missing chapter: ${r.storyId} ${r.chapter}`);
    assert.ok(Date.parse(r.at) > Date.parse(s!.chapters[r.chapter - 1].at), `review before chapter: ${r.storyId}`);
  }
});

test("mail and messenger sample data are well formed", () => {
  const ids = new Set(archiveMail.map((m) => m.id));
  assert.equal(ids.size, archiveMail.length);
  for (const m of archiveMail) if ("at" in m.deliver) assert.ok(within(m.deliver.at), m.id);
  for (const c of sampleContacts) {
    assert.ok(c.statusMessages.length > 0 && c.greetings.length && c.smallTalk.length, c.id);
    for (const s of c.schedule) assert.ok(s.from >= 0 && s.to <= 24 && s.from < s.to, `${c.id} schedule`);
  }
});
