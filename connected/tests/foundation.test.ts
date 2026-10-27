// Shared foundation: clock, ids, availability, file system, window manager,
// browser history, addresses and search.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_END,
  ACTIVE_START,
  DEFAULT_BOOT_TIME,
  formatLongDate,
  formatTime,
  fromInputs,
  ms,
  offsetFor,
  simNow,
  timeAgo,
  toDateInput,
  toTimeInput,
  wallTimeToUtc,
  zonedParts,
} from "../lib/time";
import { idPrefix, isId, newId } from "../lib/ids";
import { isAvailable, isListed } from "../lib/availability";
import { MemoryStore } from "../lib/storage/memory";
import { Vfs, validateName } from "../lib/vfs";
import { cascadeRect, emptyWm, taskbarAction, wmReducer, type WmState } from "../lib/wm";
import { activeTab, browserReducer, canGoBack, canGoForward, currentEntry, newBrowser } from "../lib/browser-model";
import { interpretInput, parseUrl, searchUrl } from "../lib/web/url";
import { isArchiveHost, upgradeLegacyUrl } from "../lib/web/hosts";
import { containsLink, linkHref, LINK_PATTERN, trimLink } from "../lib/web/links";
import { SearchIndex, tokenize, type SearchDoc } from "../lib/search";

test("clock: time zones, DST and wall-time input", () => {
  const boot = ms(DEFAULT_BOOT_TIME);
  assert.equal(formatTime(boot, "America/New_York"), "4:00 PM"); // EDT in September
  assert.equal(formatTime(boot, "Asia/Tokyo"), "5:00 AM");
  assert.equal(formatLongDate(boot, "Asia/Tokyo"), "Sunday, September 8, 2013");
  // Winter: New York is UTC-5.
  assert.equal(new Date(wallTimeToUtc(2013, 0, 15, 9, 30, "America/New_York")).toISOString(), "2013-01-15T14:30:00.000Z");
  // Summer: UTC-4.
  assert.equal(new Date(wallTimeToUtc(2013, 6, 15, 9, 30, "America/New_York")).toISOString(), "2013-07-15T13:30:00.000Z");
  const t = fromInputs("2012-12-24", "18:45", "Europe/London")!;
  assert.equal(toDateInput(t, "Europe/London"), "2012-12-24");
  assert.equal(toTimeInput(t, "Europe/London"), "18:45");
  assert.equal(fromInputs("bad", "18:45", "Europe/London"), null);
  assert.equal(zonedParts(ms("2013-10-05T16:58:00Z"), "Asia/Tokyo").d, 6);
});

test("clock: the simulated time ticks from the offset and stays in the active period", () => {
  const real = ms("2026-10-25T12:00:00Z");
  const offset = offsetFor(ms("2013-03-01T00:00:00Z"), real);
  assert.equal(simNow(offset, real), ms("2013-03-01T00:00:00Z"));
  assert.equal(simNow(offset, real + 60_000), ms("2013-03-01T00:01:00Z"));
  assert.equal(simNow(offsetFor(ms("2020-01-01T00:00:00Z"), real), real), ms(ACTIVE_END));
  assert.equal(simNow(offsetFor(ms("2008-01-01T00:00:00Z"), real), real), ms(ACTIVE_START));
  assert.equal(timeAgo(ms("2013-03-01T00:00:00Z"), ms("2013-03-04T01:00:00Z")), "3 days ago");
});

test("ids carry their kind", () => {
  const id = newId("vid");
  assert.ok(isId(id, "vid"));
  assert.equal(idPrefix(id), "vid");
  assert.notEqual(newId("vid"), id);
});

test("availability follows publication, removal, status and region", () => {
  const a = { publishedAt: "2013-01-01T00:00:00Z", removedAt: "2013-06-01T00:00:00Z", region: ["US", "CA"] };
  assert.equal(isAvailable(a, ms("2012-12-31T23:59:00Z")), false);
  assert.equal(isAvailable(a, ms("2013-02-01T00:00:00Z")), true);
  assert.equal(isAvailable(a, ms("2013-02-01T00:00:00Z"), "JP"), false);
  assert.equal(isAvailable(a, ms("2013-07-01T00:00:00Z")), false);
  assert.equal(isListed({ publishedAt: "2013-01-01T00:00:00Z", status: "unlisted" }, ms("2013-02-01T00:00:00Z")), false);
});

async function freshVfs() {
  const store = new MemoryStore();
  let clock = ms("2013-09-07T20:00:00Z");
  const vfs = new Vfs(store, "usr_test", () => clock, "Sam");
  const folders = await vfs.ensureHome([{ folder: "pictures", subfolder: "Sample Pictures", name: "Lake.jpg", url: "/media/lake.jpg", mime: "image/jpeg", size: 1000 }]);
  return { store, vfs, folders, tick: () => (clock += 60_000) };
}

test("file system: libraries, sample files, write, rename, copy, move", async () => {
  const { vfs, folders } = await freshVfs();
  const pics = await vfs.list(folders.pictures);
  assert.equal(pics[0].name, "Sample Pictures");
  assert.equal((await vfs.list(pics[0].id))[0].content?.kind, "url");
  assert.equal(await vfs.path(folders.downloads), "C:\\Users\\Sam\\Downloads");

  const note = await vfs.writeFile(folders.documents, "notes.txt", "hello 2013");
  assert.equal(await vfs.readText(note.id), "hello 2013");
  const dup = await vfs.writeFile(folders.documents, "notes.txt", "again");
  assert.equal(dup.name, "notes (2).txt");

  await assert.rejects(vfs.rename(note.id, "bad:name.txt"), /can't contain/);
  await assert.rejects(vfs.rename(dup.id, "NOTES.TXT"), /already a file/);
  const renamed = await vfs.rename(note.id, "plans.txt");
  assert.equal(renamed.name, "plans.txt");

  const folder = await vfs.createFolder(folders.documents, "Projects");
  await vfs.move(renamed.id, folder.id);
  assert.deepEqual((await vfs.list(folder.id)).map((n) => n.name), ["plans.txt"]);
  await assert.rejects(vfs.move(folder.id, folder.id), /subfolder/);

  const copy = await vfs.copy(folder.id, folders.desktop);
  const copied = await vfs.list(copy.id);
  assert.equal(copied[0].name, "plans.txt");
  await vfs.updateFile(copied[0].id, "changed");
  assert.equal(await vfs.readText(renamed.id), "hello 2013", "copies don't share contents");
  assert.equal(validateName("ok name.png"), null);
});

test("file system: recycle bin, restore, empty, search, system folders protected", async () => {
  const { vfs, folders } = await freshVfs();
  const f = await vfs.writeFile(folders.downloads, "wallpaper.png", new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }));
  assert.equal((await vfs.search("wall")).length, 1);
  await vfs.trash(f.id);
  assert.equal((await vfs.list(folders.downloads)).length, 0);
  assert.equal((await vfs.list(folders.recycle)).length, 1);
  assert.equal((await vfs.search("wall")).length, 0, "search skips the Recycle Bin");
  await vfs.restore(f.id);
  assert.equal((await vfs.list(folders.downloads))[0].name, "wallpaper.png");
  await vfs.trash(f.id);
  assert.equal(await vfs.emptyRecycleBin(), 1);
  assert.equal(await vfs.get(f.id), undefined);
  await assert.rejects(vfs.trash(folders.downloads), /system folder/);
  await assert.rejects(vfs.rename(folders.pictures, "Pics"), /system folder/);
});

test("window manager: open, focus, minimize, maximize, close", () => {
  let s: WmState = emptyWm;
  const area = { w: 1280, h: 760 };
  s = wmReducer(s, { type: "open", id: "a", appId: "browser", title: "Browser", rect: cascadeRect(s, { w: 900, h: 600 }, area) });
  s = wmReducer(s, { type: "open", id: "b", appId: "notepad", title: "Notepad", rect: cascadeRect(s, { w: 500, h: 400 }, area) });
  assert.equal(s.focused, "b");
  assert.notDeepEqual(s.windows[0].rect, s.windows[1].rect, "new windows cascade");
  s = wmReducer(s, { type: "focus", id: "a" });
  assert.equal(s.focused, "a");
  assert.ok(s.windows.find((w) => w.id === "a")!.z > s.windows.find((w) => w.id === "b")!.z);
  s = wmReducer(s, taskbarAction(s, "a")); // focused → minimize
  assert.equal(s.windows.find((w) => w.id === "a")!.minimized, true);
  assert.equal(s.focused, "b");
  s = wmReducer(s, taskbarAction(s, "a")); // minimized → restore
  assert.equal(s.focused, "a");
  assert.equal(s.windows.find((w) => w.id === "a")!.minimized, false);
  s = wmReducer(s, { type: "toggleMaximize", id: "a" });
  assert.equal(s.windows.find((w) => w.id === "a")!.maximized, true);
  s = wmReducer(s, { type: "move", id: "a", x: 5, y: 5 });
  assert.notEqual(s.windows.find((w) => w.id === "a")!.rect.x, 5, "maximized windows don't move");
  s = wmReducer(s, { type: "toggleMaximize", id: "a" });
  s = wmReducer(s, { type: "resize", id: "a", rect: { x: 10, y: 10, w: 100, h: 50 } });
  assert.deepEqual(s.windows.find((w) => w.id === "a")!.rect, { x: 10, y: 10, w: 320, h: 200 }, "minimum size");
  s = wmReducer(s, { type: "close", id: "a" });
  assert.equal(s.focused, "b");
  assert.equal(s.windows.length, 1);
});

test("browser: tabs, history, back/forward, replace, close", () => {
  let s = newBrowser("t1", "about:newtab");
  s = browserReducer(s, { type: "navigate", url: "http://search.connectedera.local/" });
  s = browserReducer(s, { type: "navigate", url: "http://metube.connectedera.local/" });
  assert.equal(currentEntry(activeTab(s)).url, "http://metube.connectedera.local/");
  s = browserReducer(s, { type: "back" });
  assert.equal(currentEntry(activeTab(s)).url, "http://search.connectedera.local/");
  assert.ok(canGoForward(activeTab(s)));
  s = browserReducer(s, { type: "navigate", url: "http://manga.connectedera.local/" });
  assert.ok(!canGoForward(activeTab(s)), "navigating drops the forward history");
  s = browserReducer(s, { type: "replace", url: "http://manga.connectedera.local/browse", title: "Browse" });
  assert.equal(activeTab(s).entries.length, 3);
  s = browserReducer(s, { type: "newTab", id: "t2", url: "about:newtab" });
  assert.equal(s.active, "t2");
  assert.ok(!canGoBack(activeTab(s)));
  s = browserReducer(s, { type: "activateOffset", delta: 1 });
  assert.equal(s.active, "t1");
  s = browserReducer(s, { type: "closeTab", id: "t1" });
  assert.equal(s.active, "t2");
  s = browserReducer(s, { type: "closeTab", id: "t2" });
  assert.equal(s.tabs.length, 0);
});

test("addresses: old bookmarks move to their connectedera.local home", () => {
  assert.equal(upgradeLegacyUrl("http://www.goggle.com/search?q=mochi"), "http://search.connectedera.local/search?q=mochi");
  assert.equal(upgradeLegacyUrl("http://www.YourAnimeList.net/anime/10380#top"), "http://yal.connectedera.local/anime/10380#top");
  assert.equal(upgradeLegacyUrl("http://nadiadraws.tum.com/"), "http://nadiadraws.tum.connectedera.local/");
  assert.equal(upgradeLegacyUrl("http://metube.connectedera.local/"), null, "current addresses stay as they are");
  assert.equal(upgradeLegacyUrl("http://example.com/"), null);
  assert.ok(isArchiveHost("tum.connectedera.local") && isArchiveHost("nadiadraws.tum.connectedera.local"));
  assert.ok(!isArchiveHost("connectedera.local.example.com"));
});

test("links: chat and post text links to archive and outside addresses", () => {
  const found = (t: string) => [...t.matchAll(LINK_PATTERN)].map((m) => trimLink(m[1]));
  assert.deepEqual(found("look at metube.connectedera.local/watch?v=abc!"), ["metube.connectedera.local/watch?v=abc"]);
  assert.deepEqual(found("my page is nadiadraws.tum.connectedera.local, say hi"), ["nadiadraws.tum.connectedera.local"]);
  assert.equal(linkHref("manga.connectedera.local/series/x"), "http://manga.connectedera.local/series/x");
  assert.equal(linkHref("example.com"), "http://www.example.com");
  assert.ok(containsLink("try www.example.org") && !containsLink("see you at 5"));
});

test("addresses: typed text becomes an address or a search", () => {
  assert.deepEqual(interpretInput("metube.connectedera.local/watch?v=x"), { kind: "address", url: "http://metube.connectedera.local/watch?v=x" });
  assert.equal(interpretInput("http://YAL.ConnectedEra.local/anime/10380")!.url, "http://yal.connectedera.local/anime/10380");
  assert.deepEqual(interpretInput("star courier walkthrough"), { kind: "search", url: searchUrl("star courier walkthrough") });
  assert.equal(interpretInput("about:history")!.url, "about:history");
  assert.equal(interpretInput("   "), null);
  assert.equal(interpretInput("javascript:alert(1)")!.kind, "search", "scripts are never addresses");
  const u = parseUrl("http://metube.connectedera.local/watch?v=abc#t=30")!;
  assert.equal(u.host, "metube.connectedera.local");
  assert.equal(u.params.get("v"), "abc");
  assert.equal(parseUrl("file:///etc/passwd"), null);
});

test("search: ranking, prefix matching, date filtering, suggestions, snippets", () => {
  const doc = (id: string, title: string, publishedAt: string, description = "", kind: SearchDoc["kind"] = "web"): SearchDoc => ({
    id,
    url: `http://www.example.com/${id}`,
    title,
    description,
    kind,
    publishedAt,
    site: "Example",
  });
  const index = new SearchIndex([
    doc("a", "MeTube - Broadcast Yourself", "2012-01-01T00:00:00Z", "Watch and share videos."),
    doc("b", "Star Courier walkthrough part 1", "2013-02-01T00:00:00Z", "Levels 1-3 of the arcade game.", "video"),
    doc("c", "Star Courier walkthrough part 2", "2013-08-01T00:00:00Z", "Levels 4-6.", "video"),
    doc("d", "Courier bags review", "2012-05-01T00:00:00Z", "Which bag survives a rainy commute?"),
  ]);
  const now = Date.parse("2013-03-01T00:00:00Z");
  const r = index.search("star courier", { now });
  assert.deepEqual(r.hits.map((h) => h.doc.id), ["b", "d"], "part 2 isn't published yet; full matches rank first");
  assert.equal(index.search("metu", { now }).hits[0].doc.id, "a", "prefix of the last word");
  assert.equal(index.search("star courier", { now, kind: "video" }).total, 1);
  assert.equal(index.search("courier", { now, since: Date.parse("2013-01-01T00:00:00Z") }).total, 1);
  assert.deepEqual(index.suggest("star", now), ["Star Courier walkthrough part 1"]);
  assert.deepEqual(index.suggest("star", Date.parse("2014-01-01T00:00:00Z")).length, 2);
  const snip = index.search("arcade", { now }).hits[0].snippet;
  assert.ok(snip.some((s) => s.hit && s.text.toLowerCase() === "arcade"));
  assert.deepEqual(tokenize("The Walkthroughs of Stories"), ["walkthrough", "story"]);
  const paged = index.search("courier", { now: Date.parse("2014-01-01T00:00:00Z"), perPage: 2, page: 2 });
  assert.equal(paged.pages, 2);
  assert.equal(paged.hits.length, 1);
});
