// The radio stations' rules, free of React: which programme is on, what an
// airing plays and where in it the computer's clock falls.
//
// Each airing (one programme on one day) has an id and a cue list built
// from a seed, so tuning in at the same moment always plays the same thing.
// A cue list only uses songs released, and adverts running, by the time the
// airing starts, so the radio never plays something from the future.

import { wallTimeToUtc, zonedParts } from "./time";

export interface Programme {
  id: string;
  name: string;
  host?: string;
  voice?: string;
  from: number;
  to: number;
  intro?: string;
  /** TalkWave's segment kinds for this programme. */
  talk?: string[];
}
export interface Station {
  id: string;
  name: string;
  format: string;
  voice: string;
  color: string;
  ids: string[];
  programmes: Programme[];
}
export interface Track {
  id: string;
  station: string;
  title: string;
  artist: string;
  composer: string;
  label: string;
  released: string;
  /** A song from the Music Player's library, reused rather than copied. */
  media?: string;
}
export interface Spot {
  id: string;
  kind: "ad" | "promo";
  name: string;
  stations: string[];
  voice: string;
  text: string;
  months?: number[];
  from?: string;
  until?: string;
}
export interface TalkSegment {
  id: string;
  kind: string;
  voice: string;
  text: string;
  months?: number[];
}
export interface RadioScript {
  backAnnounce: string;
  stations: Station[];
  tracks: Track[];
  spots: Spot[];
  talk: TalkSegment[];
}

export type CueKind = "intro" | "track" | "backannounce" | "id" | "ad" | "promo" | "talk";
export interface Cue {
  kind: CueKind;
  /** Track, spot, talk segment or programme id. */
  ref: string;
  /** Media manifest key of the recording. */
  media: string;
  duration: number;
  label: string;
  caption?: string;
}

export interface Airing {
  id: string;
  station: Station;
  programme: Programme;
  start: number;
  end: number;
  cues: Cue[];
}

export const runsAt = (p: Programme, hour: number) => (p.from < p.to ? hour >= p.from && hour < p.to : hour >= p.from || hour < p.to);

/** The programme on air at `t` and the instants its airing starts and ends. */
export function slotAt(station: Station, t: number, zone: string): { programme: Programme; start: number; end: number; day: string } {
  const p = zonedParts(t, zone);
  const programme = station.programmes.find((x) => runsAt(x, p.h));
  if (!programme) throw new Error(`${station.id} has nothing on at ${p.h}:00`);
  const wraps = programme.from > programme.to;
  const back = wraps && p.h < programme.to ? 1 : 0;
  const start = wallTimeToUtc(p.y, p.mo, p.d - back, programme.from, 0, zone);
  const end = wallTimeToUtc(p.y, p.mo, p.d - back + (wraps || programme.to === 24 ? 1 : 0), programme.to % 24, 0, zone);
  const s = zonedParts(start, zone);
  const day = `${s.y}-${String(s.mo + 1).padStart(2, "0")}-${String(s.d).padStart(2, "0")}`;
  return { programme, start, end, day };
}

function seeded(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export const trackMedia = (t: Track) => t.media ?? `radio:${t.id}`;
const inMonth = (months: number[] | undefined, month: number) => !months || months.includes(month);

export function spotRunning(s: Spot, stationId: string, at: number, month: number): boolean {
  return s.stations.includes(stationId) && inMonth(s.months, month) && (!s.from || Date.parse(s.from) <= at) && (!s.until || Date.parse(s.until) > at);
}

/** Everything an airing can use on its date. */
export function eligible(script: RadioScript, station: Station, programme: Programme, at: number, zone: string) {
  const month = zonedParts(at, zone).mo + 1;
  return {
    tracks: script.tracks.filter((t) => t.station === station.id && Date.parse(t.released) <= at),
    spots: script.spots.filter((s) => spotRunning(s, station.id, at, month)),
    talk: script.talk.filter((s) => programme.talk?.includes(s.kind) && inMonth(s.months, month)),
  };
}

/** The cue list of the airing on at `t`. `duration` gives a recording's length in seconds. */
export function airingAt(script: RadioScript, station: Station, t: number, zone: string, duration: (key: string) => number): Airing {
  const { programme, start, end, day } = slotAt(station, t, zone);
  const id = `${programme.id}@${day}`;
  const rnd = seeded(id);
  // Avoids whatever played most recently, as far as the list allows.
  const pick = <T,>(list: T[], recent: T[] = []) => {
    const fresh = list.filter((x) => !recent.includes(x));
    const pool = fresh.length ? fresh : list;
    return pool[Math.floor(rnd() * pool.length)];
  };
  const { tracks, spots, talk } = eligible(script, station, programme, start, zone);
  const cues: Cue[] = [];
  let total = 0;
  const push = (c: Omit<Cue, "duration">) => {
    const d = duration(c.media);
    cues.push({ ...c, duration: d });
    total += Math.max(d, 1);
  };
  const stationId = (i: number) => push({ kind: "id", ref: `${station.id}_${i}`, media: `radio:id_${station.id}_${i}`, label: station.name, caption: station.ids[i] });
  if (programme.intro) push({ kind: "intro", ref: programme.id, media: `radio:intro_${programme.id}`, label: `${programme.name} with ${programme.host}`, caption: programme.intro });
  else stationId(0);
  const length = (end - start) / 1000;
  const recentTracks: Track[] = [];
  const recentTalk: TalkSegment[] = [];
  const remember = <T,>(list: T[], x: T, keep: number) => {
    list.unshift(x);
    list.length = Math.min(list.length, keep);
    return x;
  };
  for (let n = 1; total < length; n++) {
    if (programme.talk && talk.length) {
      const seg = remember(recentTalk, pick(talk, recentTalk), Math.min(3, talk.length - 1));
      push({ kind: "talk", ref: seg.id, media: `radio:${seg.id}`, label: seg.kind === "sport" ? "Sports" : seg.kind === "news" ? "News" : seg.kind === "gossip" ? "Around town" : "Talk", caption: seg.text });
    } else if (tracks.length) {
      const track = remember(recentTracks, pick(tracks, recentTracks), Math.min(2, tracks.length - 1));
      push({ kind: "track", ref: track.id, media: trackMedia(track), label: `${track.title} - ${track.artist}` });
      if (programme.host && rnd() < 0.7) push({ kind: "backannounce", ref: track.id, media: `radio:ba_${track.id}`, label: `${programme.host} on the mic`, caption: script.backAnnounce.replace("{title}", track.title).replace("{artist}", track.artist) });
    } else {
      stationId(n % station.ids.length);
    }
    if (n % 2 === 0) {
      const spot = spots.length && rnd() < 0.7 ? pick(spots) : null;
      if (spot) push({ kind: spot.kind, ref: spot.id, media: `radio:${spot.id}`, label: spot.kind === "ad" ? `Advert: ${spot.name}` : `Promo: ${spot.name}`, caption: spot.text });
      else stationId(n % station.ids.length);
    }
  }
  return { id, station, programme, start, end, cues };
}

/** Which cue is playing at `t`, and how many seconds into it. */
export function positionAt(airing: Airing, t: number): { index: number; offset: number } {
  let left = Math.max(0, (t - airing.start) / 1000);
  for (let i = 0; i < airing.cues.length; i++) {
    const d = Math.max(airing.cues[i].duration, 1);
    if (left < d) return { index: i, offset: left };
    left -= d;
  }
  return { index: airing.cues.length - 1, offset: 0 };
}

/** A station's day, in programme order from midnight. */
export function daySchedule(station: Station): { programme: Programme; from: number; to: number }[] {
  const parts = station.programmes.flatMap((p) => (p.from < p.to ? [{ programme: p, from: p.from, to: p.to }] : [{ programme: p, from: 0, to: p.to }, { programme: p, from: p.from, to: 24 }]));
  return parts.filter((x) => x.from !== x.to).sort((a, b) => a.from - b.from);
}
