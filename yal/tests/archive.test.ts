// Covers Impact of Eden material, which belongs to a later development
// phase; the phase is switched on for this file only.
import "./helpers/future-phase";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ARCHIVE_STATS,
  archivePostsAsOf,
  getArchiveThread,
  threadVisible,
  visibleSnapshot,
  archivedPostCount,
  effectiveTime,
} from "../lib/archive";

const ALL = "9999-12-31T00:00:00Z";

test("all three episode threads are imported in full", () => {
  assert.equal(archivePostsAsOf("ioe-ep1", ALL).length, 1113);
  assert.equal(archivePostsAsOf("ioe-ep2", ALL).length, 945);
  assert.equal(archivePostsAsOf("ioe-ep3", ALL).length, 1068);
  assert.equal(ARCHIVE_STATS.posts, 3126);
});

test("established thread metadata is preserved", () => {
  const ep1 = getArchiveThread("ioe-ep1")!;
  assert.equal(ep1.title, "Impact of Eden Episode 1 Discussion");
  assert.equal(ep1.author, "YALBot");
  assert.equal(ep1.createdAt, "2013-10-05T17:31:00Z"); // Oct 6, 2013, 02:31 JST
  assert.equal(ep1.snapshot!.replies, 1113);
  assert.equal(ep1.snapshot!.views, 42806);
  assert.equal(ep1.sidebar!.episodeTitle, "Where the Wind Ran First");

  const ep2 = getArchiveThread("ioe-ep2")!;
  assert.match(ep2.title, /FRONTIER RISK MANAGEMENT: Introduction/);
  assert.equal(ep2.createdAt, "2013-10-12T17:31:00Z"); // Oct 13 JST

  const ep3 = getArchiveThread("ioe-ep3")!;
  assert.match(ep3.title, /Battle Circle/);
  assert.equal(ep3.createdAt, "2013-10-19T17:30:00Z"); // Oct 20 JST
  assert.equal(ep3.snapshot!.replies, 1067);
  assert.equal(ep3.snapshot!.views, 44820);
});

test("post numbers are unique and no post exists before its thread", () => {
  for (const id of ["ioe-ep1", "ioe-ep2", "ioe-ep3"]) {
    const t = getArchiveThread(id)!;
    const posts = archivePostsAsOf(id, ALL);
    assert.equal(new Set(posts.map((p) => p.number)).size, posts.length, `${id} numbers`);
    for (const p of posts) assert.ok(new Date(p.at) >= new Date(t.createdAt), `${id} #${p.number} predates thread`);
  }
});

test("the one mistyped archive date keeps its recorded label but sits where its neighbours put it", () => {
  const posts = archivePostsAsOf("ioe-ep1", ALL);
  const p82 = posts.find((p) => p.number === 82)!;
  assert.equal(p82.displayAt, "2013-10-05T08:02:00Z"); // as recorded: Oct 5, 04:02 EDT
  assert.equal(new Date(p82.at).toISOString(), "2013-10-06T08:02:00.000Z"); // between #81 and #83
  assert.equal(archivePostsAsOf("ioe-ep1", "2013-10-06T00:00:00Z").some((p) => p.number === 82), false);
});

test("effectiveTime clamps when no day shift fits", () => {
  assert.equal(effectiveTime("2013-10-01T00:00:00Z", "2013-10-05T00:00:00Z", "2013-10-05T01:00:00Z", "2013-10-05T02:00:00Z"), "2013-10-05T00:00:00Z");
  assert.equal(effectiveTime("2013-10-06T00:00:00Z", "2013-10-05T00:00:00Z"), "2013-10-06T00:00:00Z");
});

test("snapshot counts only appear once captured", () => {
  const ep1 = getArchiveThread("ioe-ep1")!;
  assert.equal(visibleSnapshot(ep1, "2013-10-06T00:00:00Z"), null);
  assert.ok(visibleSnapshot(ep1, "2013-10-24T03:00:00Z"));
});

test("member post counts come from the nearest earlier archived post", () => {
  assert.equal(archivedPostCount("YALBot", "2013-10-05T17:00:00Z"), null);
  assert.equal(archivedPostCount("YALBot", "2013-10-05T17:31:00Z"), 12482);
});

test("thread visibility follows creation time", () => {
  const ep1 = getArchiveThread("ioe-ep1")!;
  assert.equal(threadVisible(ep1, "2013-10-05T17:30:59Z"), false);
  assert.equal(threadVisible(ep1, "2013-10-05T17:31:00Z"), true);
});
