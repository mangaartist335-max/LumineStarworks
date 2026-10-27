// The expanded Connected Era web: AniFanWiki's rules and the facts shared by
// AniWire, Flow Pictures, AniFanWiki and YourAnimeList.

import { test } from "node:test";
import assert from "node:assert/strict";
import { diffLines, historyOf, linksIn, normalizeTitle, parseInline, parseWiki, plainText, searchPages, subjectOf, talkOf, titleToPath, type Revision } from "../lib/wiki";
import { catalogue, LUNE, olderCredits, people, personBySlug, titleBySlug } from "../data/catalogue";
import { articles } from "../data/aniwire";
import { flowNews } from "../data/flow";
import { infoboxRowsAt, wikiPageByTitle, wikiPages, wikiRevisions } from "../data/wiki";
import { ERA_END } from "../lib/time";
import yalIndex from "../data/generated/yal-index.json";

test("wiki titles: underscores, spaces and a capital first letter", () => {
  assert.equal(normalizeTitle("sinful_apex"), "Sinful apex");
  assert.equal(normalizeTitle("  Flow   Pictures "), "Flow Pictures");
  assert.equal(titleToPath("Skyfall Chronicle: Black Aegis"), "Skyfall_Chronicle:_Black_Aegis");
  assert.equal(talkOf("LUNE"), "Talk:LUNE");
  assert.equal(subjectOf("Talk:Sinful_Apex"), "Sinful Apex");
});

test("wiki markup: headings, emphasis, links, lists and spoilers", () => {
  const blocks = parseWiki("'''Glass Cathedral''' is a ''film''.\n\n== Staff ==\n* [[Tomoe Suzuhara]]: storyboards\n* [[Aoi Tachikaze|Tachikaze]]\n\nEnding: {{spoiler|it was the '''window'''}} [http://yal.connectedera.local/ YAL]");
  assert.deepEqual(blocks.map((b) => b.kind), ["para", "heading", "list", "para"]);
  const first = blocks[0] as Extract<(typeof blocks)[number], { kind: "para" }>;
  assert.deepEqual(first.inline[0], { kind: "bold", children: [{ kind: "text", text: "Glass Cathedral" }] });
  assert.equal(first.inline[2].kind, "italic");
  const list = blocks[2] as Extract<(typeof blocks)[number], { kind: "list" }>;
  assert.deepEqual(list.items[1][0], { kind: "link", target: "Aoi Tachikaze", label: "Tachikaze" });
  const last = blocks[3] as Extract<(typeof blocks)[number], { kind: "para" }>;
  assert.equal(last.inline[1].kind, "spoiler");
  assert.deepEqual(last.inline.at(-1), { kind: "external", href: "http://yal.connectedera.local/", label: "YAL" });
  assert.deepEqual(linksIn("[[A]] and {{spoiler|[[B]]}}"), ["A", "B"]);
  assert.equal(plainText("== Hi ==\n'''Bold''' [[Page|label]]"), "Hi\nBold label");
});

test("wiki markup: HTML and unclosed markers stay as plain text", () => {
  assert.deepEqual(parseInline("<script>alert(1)</script>"), [{ kind: "text", text: "<script>alert(1)</script>" }]);
  assert.deepEqual(parseInline("'''not closed [[nope"), [{ kind: "text", text: "'''not closed [[nope" }]);
  assert.deepEqual(parseInline("{{spoiler|open"), [{ kind: "text", text: "{{spoiler|open" }]);
});

test("wiki history and diffs", () => {
  const revs: Revision[] = [
    { id: "r1", title: "Page", at: "2012-01-01T00:00:00Z", editor: "a", summary: "new", text: "one\ntwo" },
    { id: "r2", title: "page", at: "2012-06-01T00:00:00Z", editor: "b", summary: "edit", text: "one\nthree" },
    { id: "r3", title: "Other", at: "2012-03-01T00:00:00Z", editor: "c", summary: "new", text: "x" },
  ];
  assert.deepEqual(historyOf("Page", revs, Date.parse("2012-03-01T00:00:00Z")).map((r) => r.id), ["r1"]);
  assert.deepEqual(historyOf("Page", revs, Date.parse("2013-01-01T00:00:00Z")).map((r) => r.id), ["r1", "r2"]);
  assert.deepEqual(diffLines("one\ntwo", "one\nthree"), [
    { kind: "same", text: "one" },
    { kind: "del", text: "two" },
    { kind: "add", text: "three" },
  ]);
  const hits = searchPages([{ title: "LUNE", text: "Singer" }, { title: "Sinful Apex", text: "Featuring [[LUNE]] as Aria" }], "lune");
  assert.deepEqual(hits.map((h) => h.title), ["LUNE", "Sinful Apex"]);
});

test("every shared title and person matches YourAnimeList's index", () => {
  const urls = new Set((yalIndex as { url: string }[]).map((d) => d.url));
  for (const t of [...catalogue, ...olderCredits]) assert.ok(urls.has(`http://yal.connectedera.local/anime/${t.yal.id}/${t.yal.slug}`), `${t.title} on YAL`);
  for (const p of [...people, LUNE]) assert.ok(urls.has(`http://yal.connectedera.local/people/${p.yal.id}/${p.yal.slug}`), `${p.name} on YAL`);
  for (const t of catalogue) for (const s of t.staff) assert.ok(personBySlug(s), `${t.title}: staff ${s}`);
  for (const p of people) for (const w of p.works) assert.ok(catalogue.some((t) => t.title === w) || olderCredits.some((o) => o.title === w), `${p.name}: ${w}`);
});

test("AniWire articles: dated in the era, corrections and comments after publication, real related titles", () => {
  const slugs = new Set<string>();
  for (const a of articles) {
    assert.ok(!slugs.has(a.slug), `duplicate ${a.slug}`);
    slugs.add(a.slug);
    assert.ok(Date.parse(a.publishedAt) <= Date.parse(ERA_END), a.slug);
    for (const c of a.corrections ?? []) assert.ok(c.at > a.publishedAt, `${a.slug}: correction before publication`);
    for (const c of a.comments ?? []) assert.ok(c.at > a.publishedAt, `${a.slug}: comment before publication`);
    for (const r of a.related) assert.ok(r === "iron-to-requiem" || titleBySlug(r), `${a.slug}: related ${r}`);
  }
  for (const n of flowNews) assert.ok(!n.work || titleBySlug(n.work), n.id);
});

test("AniFanWiki pages: ordered histories, real links, talk after creation", () => {
  const titles = new Set(wikiPages.map((p) => p.title));
  for (const p of wikiPages) {
    const at = p.revisions.map((r) => r.at);
    assert.deepEqual(at, [...at].sort(), `${p.title}: revisions in order`);
    assert.ok(at.every((x) => Date.parse(x) <= Date.parse(ERA_END)), `${p.title}: dated in the era`);
    for (const link of linksIn(p.revisions.at(-1)!.text)) assert.ok(titles.has(link), `${p.title} links to missing page ${link}`);
    for (const post of p.talk ?? []) assert.ok(post.at > at[0], `${p.title}: talk before the page existed`);
  }
  assert.equal(new Set(wikiRevisions.map((r) => r.id)).size, wikiRevisions.length, "revision ids are unique");
  assert.ok(wikiPageByTitle("Main Page")!.protected);
});

test("AniFanWiki infoboxes only show what was known on the date", () => {
  const itr = wikiPageByTitle("Iron to Requiem");
  const june = infoboxRowsAt(itr, Date.parse("2013-06-01T00:00:00Z")).map((r) => `${r.label}: ${r.value}`);
  assert.ok(june.includes("Episodes: 26 planned") && !june.some((r) => r.startsWith("Aired")));
  const october = infoboxRowsAt(itr, Date.parse("2013-10-01T00:00:00Z")).map((r) => `${r.label}: ${r.value}`);
  assert.ok(october.includes("Aired: Apr 4 – Sep 26, 2013") && october.includes("Episodes: 26"));
  const sinful = historyOf("Sinful Apex", wikiRevisions, Date.parse("2012-08-01T00:00:00Z"));
  assert.ok(sinful.at(-1)!.text.includes("January 23, 2012") && !sinful.at(-1)!.text.includes("Blu-ray"), "the Blu-ray news waits for October 2013");
});

test("News Reader: feeds, finding them by address, and fetching only what's out", async () => {
  const { feeds, findFeed } = await import("../data/feeds");
  const { fetchFeed, shownItems, unreadIn } = await import("../lib/news");
  assert.ok(feeds.length >= 10);
  assert.equal(new Set(feeds.map((f) => f.id)).size, feeds.length);
  assert.equal(findFeed("http://aniwire.connectedera.local/rss")?.id, "feed_aniwire");
  assert.equal(findFeed("aniwire.connectedera.local")?.id, "feed_aniwire", "a site's own address finds its feed");
  assert.equal(findFeed("www.example.com"), null);
  const aw = feeds.find((f) => f.id === "feed_aniwire")!;
  const first = fetchFeed(aw, Date.parse("2012-06-01T00:00:00Z"));
  assert.ok(first.items.every((i) => i.at <= "2012-06-01T00:00:00Z") && first.items.length === first.fresh.length);
  const later = fetchFeed(aw, Date.parse("2013-12-01T00:00:00Z"), first.items);
  assert.equal(later.fresh.length, later.items.length - first.items.length);
  assert.equal(shownItems(later.items, Date.parse("2012-06-01T00:00:00Z")).length, first.items.length, "moving the clock back hides later items again");
  assert.equal(unreadIn(first.items, new Set([first.items[0].id])), first.items.length - 1);
});
