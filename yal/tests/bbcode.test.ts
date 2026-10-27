import { test } from "node:test";
import assert from "node:assert/strict";
import { excerpt, parseBBCode, parseQuoteHead, quoteFor, safeHref, textOf, type BBNode } from "../lib/bbcode";

const find = (nodes: BBNode[], type: BBNode["type"]): BBNode | undefined => {
  for (const n of nodes) {
    if (n.type === type) return n;
    const kids = "children" in n ? n.children : n.type === "list" ? n.items.flat() : [];
    const hit = find(kids, type);
    if (hit) return hit;
  }
  return undefined;
};

test("archive quote heads keep author and post number", () => {
  assert.deepEqual(parseQuoteHead("PlanetationBro;5"), { kind: "post", author: "PlanetationBro", number: 5 });
  assert.deepEqual(parseQuoteHead('"Originally posted earlier in thread"'), { kind: "text", text: "Originally posted earlier in thread" });
  assert.deepEqual(parseQuoteHead("StormWallTheory — #74 (page 4)"), { kind: "post", author: "StormWallTheory — #74 (page 4)", number: null });
  assert.deepEqual(parseQuoteHead(undefined), { kind: "plain" });
});

test("spoilers carry their title and hide their content in excerpts", () => {
  const nodes = parseBBCode("before [spoiler=manga readers only]the storm[/spoiler] after");
  const sp = find(nodes, "spoiler");
  assert.ok(sp && sp.type === "spoiler");
  assert.equal(sp.title, "manga readers only");
  assert.equal(excerpt("before [spoiler]the storm[/spoiler] after"), "before [spoiler] after");
});

test("lists split on [*]", () => {
  const list = find(parseBBCode("[list]\n[*]MetaCode\n[*]Flame Guns\n[/list]"), "list");
  assert.ok(list && list.type === "list");
  assert.equal(list.items.length, 2);
  assert.equal(textOf(list.items[0]).trim(), "MetaCode");
});

test("unclosed tags close at the end and stray closers are ignored", () => {
  const nodes = parseBBCode("[b]bold [i]both[/b] tail [/u]");
  assert.equal(textOf(nodes), "bold both tail ");
});

test("unknown tags and HTML stay as literal text", () => {
  const nodes = parseBBCode('[img]x.png[/img] <script>alert(1)</script> <3');
  assert.equal(textOf(nodes), '[img]x.png[/img] <script>alert(1)</script> <3');
  assert.ok(nodes.every((n) => n.type === "text"));
});

test("only http(s) and site-relative links are allowed", () => {
  assert.equal(safeHref("javascript:alert(1)"), null);
  assert.equal(safeHref("data:text/html,hi"), null);
  assert.equal(safeHref("//evil.example"), null);
  assert.equal(safeHref("/anime/19815"), "/anime/19815");
  assert.equal(safeHref("https://example.com/a"), "https://example.com/a");
  const url = find(parseBBCode("[url=javascript:alert(1)]click[/url]"), "url");
  assert.ok(url && url.type === "url" && url.href === null);
});

test("[code] content is literal", () => {
  const code = find(parseBBCode("[code][spoiler=x]y[/spoiler][/code]"), "code");
  assert.ok(code && code.type === "code");
  assert.equal(code.text, "[spoiler=x]y[/spoiler]");
});

test("quoting drops nested quotes", () => {
  const q = quoteFor("NekoToast92", 3, "[quote=A;1]old[/quote]\nnew text");
  assert.equal(q, "[quote=NekoToast92;3]new text[/quote]\n\n");
});
