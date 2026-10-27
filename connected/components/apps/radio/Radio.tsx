"use client";

// Radio: the Connected Era's six stations, live. What's on air comes from
// the computer's clock, so tuning in mid-song starts mid-song, and every
// station keeps its own schedule of programmes. Keeps playing while the
// window is minimized; closing it switches the radio off.

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useClock, useSystem } from "@/components/system/system";
import { useUserValue } from "@/components/system/hooks";
import { mediaUrl } from "@/data/media";
import { radioScript, recordingLength, stationById, stations } from "@/data/radio";
import { airingAt, daySchedule, positionAt, slotAt, type Airing, type Cue, type Station } from "@/lib/radio";
import { formatTime } from "@/lib/time";
import { useWindowTitle } from "../common";
import type { AppProps } from "../registry";

// One cue list per airing: they're fixed, so build each once.
const airings = new Map<string, Airing>();
function airingFor(station: Station, t: number, zone: string): Airing {
  const slot = slotAt(station, t, zone);
  const key = `${station.id}:${slot.start}`;
  let a = airings.get(key);
  if (!a) {
    a = airingAt(radioScript, station, t, zone, recordingLength);
    airings.set(key, a);
  }
  return a;
}

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}:00 ${h % 24 < 12 ? "AM" : "PM"}`;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const KIND_LABEL: Record<Cue["kind"], string> = {
  track: "Now playing",
  intro: "On air",
  backannounce: "On air",
  id: "Station ID",
  ad: "Advert break",
  promo: "Promo",
  talk: "On air",
};

function CueDetails({ cue }: { cue: Cue }) {
  if (cue.kind === "track") {
    const t = radioScript.tracks.find((x) => x.id === cue.ref)!;
    return (
      <>
        <div className="rd-title">{t.title}</div>
        <div className="rd-artist">{t.artist}</div>
        <div className="rd-meta">
          {t.composer !== t.artist ? `Written by ${t.composer} · ` : ""}
          {t.label} · {new Date(t.released).getUTCFullYear()} · Instrumental
        </div>
      </>
    );
  }
  return (
    <>
      <div className="rd-title">{cue.label}</div>
      {cue.caption && <p className="rd-caption">&ldquo;{cue.caption}&rdquo;</p>}
    </>
  );
}

export default function Radio({ win }: AppProps) {
  const { computer, settings, updateSettings } = useSystem();
  const t = useClock(500);
  const [stationId, setStationId] = useUserValue("radio-station", "cvpop");
  const [on, setOn] = useState(false);
  const [tab, setTab] = useState<"recent" | "schedule">("recent");
  const [failed, setFailed] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement>(null);

  const station = stationById(stationId) ?? stations[0];
  const airing = airingFor(station, t, computer.timeZone);
  const { index, offset } = positionAt(airing, t);
  const cue = airing.cues[index];
  const cueKey = `${airing.id}#${index}`;
  useWindowTitle(win, on ? `${station.name} - Radio` : "Radio");

  // Starting a cue reads the clock at that moment, so it begins at the live position.
  const startCue = useEffectEvent(() => {
    const a = audio.current;
    if (!a) return;
    a.src = `${mediaUrl(cue.media)}#t=${offset.toFixed(1)}`;
    void a.play().catch(() => setFailed(cueKey));
  });
  useEffect(() => {
    if (on) startCue();
    else audio.current?.pause();
  }, [on, cueKey]);

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.volume = settings.volume;
    a.muted = settings.muted;
  }, [settings.volume, settings.muted]);

  const tune = (id: string) => {
    setFailed(null);
    void setStationId(id);
  };
  const recent = airing.cues.slice(Math.max(0, index - 8), index).reverse();
  const startedAt = (i: number) => {
    let s = airing.start;
    for (let k = 0; k < i; k++) s += Math.max(airing.cues[k].duration, 1) * 1000;
    return s;
  };

  return (
    <div
      className="radio-app"
      tabIndex={0}
      onKeyDown={(e) => {
        const n = Number(e.key);
        if (n >= 1 && n <= stations.length) tune(stations[n - 1].id);
        else if (e.key === " ") {
          e.preventDefault();
          setOn((v) => !v);
        }
      }}
    >
      <aside className="rd-presets" aria-label="Stations">
        {stations.map((s, i) => (
          <button key={s.id} className={`rd-preset${s.id === station.id ? " on" : ""}`} onClick={() => tune(s.id)} style={{ "--rd": s.color } as React.CSSProperties}>
            <span className="rd-num">{i + 1}</span>
            <span>
              <strong>{s.name}</strong>
              <small>{s.format}</small>
            </span>
          </button>
        ))}
      </aside>
      <main className="rd-main" style={{ "--rd": station.color } as React.CSSProperties}>
        <header className="rd-head">
          <div>
            <h1>{station.name}</h1>
            <div className="rd-programme">
              {airing.programme.name}
              {airing.programme.host ? ` with ${airing.programme.host}` : ""} · {formatTime(airing.start, computer.timeZone)} to {formatTime(airing.end, computer.timeZone)}
            </div>
          </div>
          {on && <span className="rd-onair">ON AIR</span>}
        </header>
        <section className="rd-now" aria-live="polite">
          <div className="rd-kind">{KIND_LABEL[cue.kind]}</div>
          <CueDetails cue={cue} />
          <div className="rd-progress" aria-hidden>
            <div style={{ width: `${Math.min(100, (offset / Math.max(cue.duration, 1)) * 100)}%` }} />
          </div>
          <div className="rd-times">
            <span>{mmss(offset)}</span>
            <span>{mmss(cue.duration)}</span>
          </div>
        </section>
        <div className="rd-controls">
          <button className="btn primary" onClick={() => (setFailed(null), setOn((v) => !v))}>
            {on ? "■ Stop" : "▶ Listen live"}
          </button>
          <button className="tool" onClick={() => updateSettings({ muted: !settings.muted })} aria-label={settings.muted ? "Unmute" : "Mute"}>
            {settings.muted ? "🔇" : "🔊"}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value), muted: false })} aria-label="Volume" />
          <span className="muted">Keys 1 to 6 change station, Space starts and stops.</span>
        </div>
        {failed === cueKey && on && <p className="rd-error">The station isn&apos;t coming through right now. Press Stop, then Listen live to try again.</p>}
        <nav className="rd-tabs">
          <button className={tab === "recent" ? "on" : ""} onClick={() => setTab("recent")}>
            Recently played
          </button>
          <button className={tab === "schedule" ? "on" : ""} onClick={() => setTab("schedule")}>
            Today&apos;s schedule
          </button>
        </nav>
        {tab === "recent" ? (
          <ul className="rd-list">
            {recent.map((c, i) => (
              <li key={`${index - 1 - i}`}>
                <span className="rd-at">{formatTime(startedAt(index - 1 - i), computer.timeZone)}</span>
                <span>{c.kind === "track" ? c.label : `${KIND_LABEL[c.kind] === "On air" ? c.label : KIND_LABEL[c.kind]}${c.kind === "ad" || c.kind === "promo" ? `: ${c.label.replace(/^(Advert|Promo): /, "")}` : ""}`}</span>
              </li>
            ))}
            {recent.length === 0 && <li className="muted">This programme has just started.</li>}
          </ul>
        ) : (
          <ul className="rd-list">
            {daySchedule(station).map((x) => (
              <li key={`${x.programme.id}-${x.from}`} className={x.programme.id === airing.programme.id ? "now" : ""}>
                <span className="rd-at">
                  {hourLabel(x.from)} to {hourLabel(x.to)}
                </span>
                <span>
                  {x.programme.name}
                  {x.programme.host ? ` with ${x.programme.host}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <audio ref={audio} onError={() => on && setFailed(cueKey)} />
      </main>
    </div>
  );
}
