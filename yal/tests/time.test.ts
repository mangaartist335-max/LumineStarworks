import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clampAsOf,
  DEFAULT_AS_OF,
  formatAirDate,
  formatBroadcastSlot,
  formatDateTime,
  happened,
  parseAsOfInput,
  seasonOf,
  ARCHIVE_START,
  ARCHIVE_END,
} from "../lib/time";

test("Impact of Eden's 01:58 Sunday slot reads as Saturday 25:58", () => {
  const slot = formatBroadcastSlot("2013-10-05T16:58:00Z");
  assert.equal(slot.weekday, "Saturday");
  assert.equal(slot.time, "25:58");
  assert.equal(slot.date, "Oct 5, 2013");
  assert.equal(formatAirDate("2013-10-05T16:58:00Z"), "Oct 5, 2013");
});

test("date-only events (00:00 JST) are not rolled back a day", () => {
  assert.equal(formatAirDate("2011-08-14T15:00:00Z"), "Aug 15, 2011");
  assert.equal(formatAirDate("2013-04-03T15:00:00Z"), "Apr 4, 2013");
});

test("post timestamps format in the poster's zone", () => {
  assert.equal(formatDateTime("2013-10-05T17:31:00Z", "JST"), "Oct 6, 2013, 02:31 JST");
  assert.equal(formatDateTime("2013-10-05T21:19:00Z", "PDT"), "Oct 5, 2013, 14:19 PDT");
  assert.equal(formatDateTime("2013-10-05T22:10:00Z", "GMT"), "Oct 5, 2013, 22:10 GMT");
});

test("as-of input parsing interprets bare dates and times in JST", () => {
  assert.equal(parseAsOfInput("2013-10-06"), new Date("2013-10-06T23:59:00+09:00").toISOString());
  assert.equal(parseAsOfInput("2013-10-06T09:30"), new Date("2013-10-06T09:30:00+09:00").toISOString());
  assert.equal(parseAsOfInput("2013-10-06T00:30:00Z"), "2013-10-06T00:30:00.000Z");
  assert.equal(parseAsOfInput("nonsense"), null);
  assert.equal(parseAsOfInput(""), null);
});

test("the archive window is clamped to 2012–2013 and never uses the real date", () => {
  assert.equal(clampAsOf("2026-10-25T00:00:00Z"), new Date(ARCHIVE_END).toISOString());
  assert.equal(clampAsOf("2009-01-01T00:00:00Z"), new Date(ARCHIVE_START).toISOString());
  assert.equal(clampAsOf(null), new Date(DEFAULT_AS_OF).toISOString());
  assert.equal(clampAsOf("garbage"), new Date(DEFAULT_AS_OF).toISOString());
});

test("happened() treats undated records as back-catalogue", () => {
  assert.equal(happened(null, "2012-01-01T00:00:00Z"), true);
  assert.equal(happened("2013-10-06T00:00:00Z", "2013-10-05T23:59:59Z"), false);
  assert.equal(happened("2013-10-06T00:00:00Z", "2013-10-06T00:00:00Z"), true);
});

test("seasons follow the JST calendar", () => {
  assert.deepEqual(seasonOf("2013-10-24T03:00:00Z"), { year: 2013, season: "fall" });
  assert.deepEqual(seasonOf("2013-03-31T15:30:00Z"), { year: 2013, season: "spring" }); // Apr 1 00:30 JST
});
