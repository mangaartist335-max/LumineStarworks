import { describe, expect, it } from "vitest";
import { addDays, daysBetween, formatBroadcastTime, isValidISODate, weekdayOf } from "@/lib/archive/dates";
import { courCount, nextSeason, previousSeason, seasonOfDate, seasonRange, seasonsSpanned } from "@/lib/archive/seasons";

describe("calendar dates", () => {
  it("rejects impossible dates", () => {
    expect(isValidISODate("2013-02-29")).toBe(false);
    expect(isValidISODate("2012-02-29")).toBe(true);
    expect(isValidISODate("2013-13-01")).toBe(false);
    expect(isValidISODate("13-04-04")).toBe(false);
  });

  it("knows the weekday of established premieres", () => {
    expect(weekdayOf("2011-08-15")).toBe(1); // Sinful Apex — Monday
    expect(weekdayOf("2013-04-04")).toBe(4); // Iron to Requiem — Thursday
    expect(weekdayOf("2013-10-02")).toBe(3); // Impact of Eden Advance — Wednesday
    expect(weekdayOf("2013-10-05")).toBe(6); // Impact of Eden regular — Saturday
    expect(weekdayOf("2016-04-09")).toBe(6); // EARTH: Metal Comet S1 — Saturday
  });

  it("does date arithmetic across months and leap years", () => {
    expect(addDays("2012-02-28", 1)).toBe("2012-02-29");
    expect(addDays("2011-12-26", 7)).toBe("2012-01-02");
    expect(daysBetween("2011-08-15", "2012-01-23")).toBe(161);
  });

  it("formats late-night broadcast times past midnight", () => {
    expect(formatBroadcastTime("16:00", "Asia/Tokyo")).toBe("4:00 PM JST");
    expect(formatBroadcastTime("25:30", "Asia/Tokyo")).toBe("1:30 AM (25:30) JST");
  });
});

describe("broadcast seasons", () => {
  it("maps months to the four Japanese seasons", () => {
    expect(seasonOfDate("2013-03-31")).toEqual({ year: 2013, season: "winter" });
    expect(seasonOfDate("2013-04-01")).toEqual({ year: 2013, season: "spring" });
    expect(seasonOfDate("2013-09-26")).toEqual({ year: 2013, season: "summer" });
    expect(seasonOfDate("2013-10-02")).toEqual({ year: 2013, season: "fall" });
  });

  it("wraps across years", () => {
    expect(nextSeason({ year: 2011, season: "fall" })).toEqual({ year: 2012, season: "winter" });
    expect(previousSeason({ year: 2019, season: "winter" })).toEqual({ year: 2018, season: "fall" });
  });

  it("gives exact season ranges", () => {
    expect(seasonRange({ year: 2012, season: "winter" })).toEqual({ start: "2012-01-01", end: "2012-03-31" });
    expect(seasonRange({ year: 2013, season: "fall" })).toEqual({ start: "2013-10-01", end: "2013-12-31" });
  });

  it("follows a multi-cour run into later seasons", () => {
    expect(seasonsSpanned("2011-08-15", "2012-01-23")).toEqual([
      { year: 2011, season: "summer" },
      { year: 2011, season: "fall" },
      { year: 2012, season: "winter" },
    ]);
    expect(courCount("2016-04-09", "2016-06-25")).toBe(1);
  });
});
