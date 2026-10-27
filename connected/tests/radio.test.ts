// The radio stations: schedules, airings and date gating.

import { test } from "node:test";
import assert from "node:assert/strict";
import { airingAt, daySchedule, positionAt, runsAt, slotAt, spotRunning } from "../lib/radio";
import { radioScript, recordingLength, stations } from "../data/radio";
import { media } from "../data/media";

const ZONE = "America/New_York";
const at = (s: string) => Date.parse(s);

test("the six stations from the Bible, each on air around the clock", () => {
  assert.deepEqual(stations.map((s) => s.name), ["CV Pop FM", "Garage Noise 101.7", "Ambient Echo", "TalkWave AM", "Pixel Beats", "Golden Oldies"]);
  for (const s of stations) {
    for (let h = 0; h < 24; h++) assert.equal(s.programmes.filter((p) => runsAt(p, h)).length, 1, `${s.name} at ${h}:00`);
    assert.equal(daySchedule(s).reduce((n, x) => n + (x.to - x.from), 0), 24, `${s.name} schedule adds up`);
  }
});

test("every line, song and advert has a recording", () => {
  const keys = [
    ...radioScript.tracks.map((t) => t.media ?? `radio:${t.id}`),
    ...radioScript.tracks.map((t) => `radio:ba_${t.id}`),
    ...stations.flatMap((s) => s.ids.map((_, i) => `radio:id_${s.id}_${i}`)),
    ...stations.flatMap((s) => s.programmes.filter((p) => p.intro).map((p) => `radio:intro_${p.id}`)),
    ...radioScript.spots.map((s) => `radio:${s.id}`),
    ...radioScript.talk.map((s) => `radio:${s.id}`),
  ];
  for (const k of keys) assert.ok((media(k).duration ?? 0) > 1, `${k} has a length`);
});

test("an airing is the same every time and fills its whole slot", () => {
  const cv = stations[0];
  const t = at("2013-03-20T13:30:00Z"); // 9:30 AM in New York, The Morning Mix
  const a = airingAt(radioScript, cv, t, ZONE, recordingLength);
  const b = airingAt(radioScript, cv, t + 20 * 60_000, ZONE, recordingLength);
  assert.equal(a.programme.id, "cvpop-morning");
  assert.equal(a.id, "cvpop-morning@2013-03-20");
  assert.equal(a.start, at("2013-03-20T10:00:00Z"));
  assert.equal(a.end, at("2013-03-20T14:00:00Z"));
  assert.equal(a.cues[0].kind, "intro");
  assert.deepEqual(a.cues.map((c) => c.ref), b.cues.map((c) => c.ref));
  assert.ok(a.cues.reduce((n, c) => n + c.duration, 0) >= (a.end - a.start) / 1000);
  const pos = positionAt(a, t);
  assert.ok(pos.index > 0 && pos.offset >= 0 && pos.offset < a.cues[pos.index].duration);
});

test("programmes that run past midnight belong to the evening they started", () => {
  const ambient = stations.find((s) => s.id === "ambient")!;
  const late = slotAt(ambient, at("2012-08-02T06:30:00Z"), ZONE); // 2:30 AM on Aug 2
  assert.equal(late.programme.id, "ambient-night");
  assert.equal(late.day, "2012-08-01");
  assert.equal(late.start, at("2012-08-02T00:00:00Z")); // 8 PM on Aug 1
  assert.equal(late.end, at("2012-08-02T09:00:00Z")); // 5 AM on Aug 2
});

test("no song or advert from the future, and talk fits the season", () => {
  for (const s of stations) {
    for (const when of ["2012-07-15T16:00:00Z", "2012-12-10T22:00:00Z", "2013-04-02T14:00:00Z", "2013-10-20T19:00:00Z"]) {
      const a = airingAt(radioScript, s, at(when), ZONE, recordingLength);
      const month = new Date(a.start).getUTCMonth() + 1;
      for (const c of a.cues) {
        if (c.kind === "track") assert.ok(Date.parse(radioScript.tracks.find((t) => t.id === c.ref)!.released) <= a.start, `${a.id}: ${c.ref} not out yet`);
        if (c.kind === "ad" || c.kind === "promo") assert.ok(spotRunning(radioScript.spots.find((x) => x.id === c.ref)!, s.id, a.start, month), `${a.id}: ${c.ref} not running`);
        if (c.kind === "talk") {
          const seg = radioScript.talk.find((x) => x.id === c.ref)!;
          assert.ok(!seg.months || seg.months.includes(month), `${a.id}: ${c.ref} out of season`);
        }
      }
    }
  }
  const pixel = stations.find((s) => s.id === "pixel")!;
  const summer2012 = airingAt(radioScript, pixel, at("2012-07-20T20:00:00Z"), ZONE, recordingLength);
  assert.ok(!summer2012.cues.some((c) => c.ref === "trk_high_score_sunset" || c.ref === "promo_iron_to_requiem"));
  const october2013 = airingAt(radioScript, pixel, at("2013-10-20T20:00:00Z"), ZONE, recordingLength);
  assert.ok(october2013.cues.some((c) => c.ref === "promo_sinful_apex_bluray"), "the Blu-ray promo runs in October 2013");
});

test("TalkWave talks, the music stations play music", () => {
  const talk = airingAt(radioScript, stations.find((s) => s.id === "talkwave")!, at("2013-01-15T15:00:00Z"), ZONE, recordingLength);
  assert.ok(talk.cues.some((c) => c.kind === "talk") && !talk.cues.some((c) => c.kind === "track"));
  const oldies = airingAt(radioScript, stations.find((s) => s.id === "oldies")!, at("2013-01-15T15:00:00Z"), ZONE, recordingLength);
  assert.ok(oldies.cues.some((c) => c.kind === "track") && !oldies.cues.some((c) => c.kind === "talk"));
});
