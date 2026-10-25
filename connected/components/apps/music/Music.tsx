"use client";

// Music Player: every song on the computer, playlists, shuffle and repeat,
// with a little visualizer. Keeps playing while minimized.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { newId } from "@/lib/ids";
import { iso } from "@/lib/time";
import type { FileNode } from "@/lib/vfs";
import { isAudio, useArgs, useFileUrl, useFiles, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

interface Playlist {
  id: string;
  owner: string;
  name: string;
  fileIds: string[];
  createdAt: string;
  origin: "user";
}

/** "Akira - Summer Rain.mp3" → artist and title. */
export function songInfo(name: string): { artist: string; title: string } {
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  const i = base.indexOf(" - ");
  return i > 0 ? { artist: base.slice(0, i), title: base.slice(i + 3) } : { artist: "Unknown artist", title: base };
}

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

export default function Music({ win }: AppProps) {
  const { store, user, now, settings, updateSettings, folders, vfs } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const [playlists] = useCollection<Playlist>("music.playlists");
  const [prefs, setPrefs] = useUserValue<{ shuffle: boolean; repeat: "off" | "all" | "one" }>("music-prefs", { shuffle: false, repeat: "off" });
  const [view, setView] = useState<string>("library");
  const [queue, setQueue] = useState<string[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState({ at: 0, duration: 0 });
  const [selected, setSelected] = useState<string[]>([]);
  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const analyser = useRef<AnalyserNode | null>(null);

  const recycle = folders?.recycle;
  const songs = useMemo(() => files.filter((f) => f.kind === "file" && isAudio(f) && f.parentId !== recycle).sort((a, b) => a.name.localeCompare(b.name)), [files, recycle]);
  const playlist = playlists.find((p) => p.id === view);
  const shown: FileNode[] = playlist ? (playlist.fileIds.map((id) => songs.find((s) => s.id === id)).filter(Boolean) as FileNode[]) : songs;
  const song = songs.find((s) => s.id === current);
  const { url } = useFileUrl(current);
  useWindowTitle(win, song ? `${songInfo(song.name).title} - Music Player` : "Music Player");

  const start = (list: FileNode[], id: string) => {
    let order = list.map((f) => f.id);
    if (!order.includes(id)) order = [id, ...order];
    if (prefs.shuffle) order = [id, ...order.filter((x) => x !== id).sort(() => Math.random() - 0.5)];
    setQueue(order);
    setCurrent(id);
    setPlaying(true);
  };

  useArgs(win, (args) => {
    if (typeof args.fileId !== "string") return;
    const f = files.find((x) => x.id === args.fileId);
    const siblings = f ? files.filter((x) => x.parentId === f.parentId && x.kind === "file" && isAudio(x)).sort((a, b) => a.name.localeCompare(b.name)) : [];
    start(siblings.length ? siblings : songs, args.fileId);
  });

  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    a.volume = settings.volume;
    a.muted = settings.muted;
  }, [settings.volume, settings.muted]);

  useEffect(() => {
    const a = audio.current;
    if (!a || !url) return;
    if (playing) void a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [playing, url]);

  const step = (d: number, auto = false) => {
    if (!queue.length || !current) return;
    if (auto && prefs.repeat === "one") {
      audio.current!.currentTime = 0;
      void audio.current!.play();
      return;
    }
    const i = queue.indexOf(current);
    let next = i + d;
    if (next >= queue.length) {
      if (prefs.repeat === "off" && auto) return setPlaying(false);
      next = 0;
    }
    if (next < 0) next = queue.length - 1;
    setCurrent(queue[next]);
    setPlaying(true);
  };

  // Visualizer: set up on first play (browsers need a click first).
  const ensureAnalyser = () => {
    if (analyser.current || !audio.current) return;
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(audio.current);
      const an = ctx.createAnalyser();
      an.fftSize = 64;
      src.connect(an);
      an.connect(ctx.destination);
      analyser.current = an;
    } catch {
      // No visualizer, but the music still plays.
    }
  };

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = canvas.current;
      const an = analyser.current;
      if (!c) return;
      const g = c.getContext("2d")!;
      g.clearRect(0, 0, c.width, c.height);
      if (!an || !playing) return;
      const data = new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(data);
      const w = c.width / data.length;
      data.forEach((v, i) => {
        const h = (v / 255) * c.height;
        const grad = g.createLinearGradient(0, c.height - h, 0, c.height);
        grad.addColorStop(0, "#8fd3ff");
        grad.addColorStop(1, "#2a6fd6");
        g.fillStyle = grad;
        g.fillRect(i * w + 1, c.height - h, w - 2, h);
      });
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const addToPlaylist = async (pl: Playlist, ids: string[]) => {
    await store.put<Playlist>("music.playlists", { ...pl, fileIds: [...pl.fileIds, ...ids.filter((id) => !pl.fileIds.includes(id))] });
  };

  const info = song ? songInfo(song.name) : null;

  return (
    <div className="music">
      <div className="mu-main">
        <nav className="mu-nav">
          <button className={view === "library" ? "on" : ""} onClick={() => setView("library")}>
            ♫ All music ({songs.length})
          </button>
          <div className="mu-nav-head">Playlists</div>
          {playlists.map((p) => (
            <button key={p.id} className={view === p.id ? "on" : ""} onClick={() => setView(p.id)}>
              {p.name} ({p.fileIds.length})
            </button>
          ))}
          <button
            className="mu-new"
            onClick={async () => {
              if (!user) return;
              const name = await dialog.prompt("Name your playlist:", "My playlist", { title: "New playlist" });
              if (!name?.trim()) return;
              const id = newId("pls");
              await store.put<Playlist>("music.playlists", { id, owner: user.id, name: name.trim().slice(0, 40), fileIds: selected.filter((s) => songs.some((x) => x.id === s)), createdAt: iso(now()), origin: "user" });
              setView(id);
            }}
          >
            + New playlist{selected.length ? " from selection" : ""}
          </button>
        </nav>
        <div className="mu-list">
          <div className="toolbar">
            <strong>{playlist ? playlist.name : "All music"}</strong>
            <span style={{ flex: 1 }} />
            {selected.length > 0 && playlists.filter((p) => p.id !== view).length > 0 && (
              <select className="field" value="" onChange={(e) => e.target.value && void addToPlaylist(playlists.find((p) => p.id === e.target.value)!, selected)} aria-label="Add to playlist">
                <option value="">Add to playlist...</option>
                {playlists
                  .filter((p) => p.id !== view)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            )}
            {playlist && (
              <>
                <button className="tool" disabled={!selected.length} onClick={() => store.put<Playlist>("music.playlists", { ...playlist, fileIds: playlist.fileIds.filter((id) => !selected.includes(id)) })}>
                  Remove from playlist
                </button>
                <button
                  className="tool"
                  onClick={async () => {
                    const name = await dialog.prompt("Rename playlist:", playlist.name, { title: "Rename" });
                    if (name?.trim()) await store.put<Playlist>("music.playlists", { ...playlist, name: name.trim().slice(0, 40) });
                  }}
                >
                  Rename
                </button>
                <button
                  className="tool"
                  onClick={async () => {
                    if (await dialog.confirm(`Delete the playlist "${playlist.name}"? The songs stay on your computer.`, { title: "Delete playlist", okLabel: "Delete" })) {
                      await store.delete("music.playlists", playlist.id);
                      setView("library");
                    }
                  }}
                >
                  Delete playlist
                </button>
              </>
            )}
          </div>
          <table className="mu-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Artist</th>
                {playlist && <th />}
              </tr>
            </thead>
            <tbody>
              {shown.map((s, i) => {
                const si = songInfo(s.name);
                return (
                  <tr
                    key={`${s.id}-${i}`}
                    className={`${s.id === current ? "playing" : ""}${selected.includes(s.id) ? " selected" : ""}`}
                    onClick={(e) => setSelected((sel) => (e.ctrlKey || e.metaKey ? (sel.includes(s.id) ? sel.filter((x) => x !== s.id) : [...sel, s.id]) : [s.id]))}
                    onDoubleClick={() => (ensureAnalyser(), start(shown, s.id))}
                    data-song={si.title}
                  >
                    <td>{s.id === current && playing ? "▶" : i + 1}</td>
                    <td>{si.title}</td>
                    <td>{si.artist}</td>
                    {playlist && (
                      <td>
                        <button className="link-btn" disabled={i === 0} onClick={(e) => (e.stopPropagation(), void store.put<Playlist>("music.playlists", { ...playlist, fileIds: move(playlist.fileIds, i, i - 1) }))} aria-label="Move up">
                          ▲
                        </button>
                        <button className="link-btn" disabled={i === shown.length - 1} onClick={(e) => (e.stopPropagation(), void store.put<Playlist>("music.playlists", { ...playlist, fileIds: move(playlist.fileIds, i, i + 1) }))} aria-label="Move down">
                          ▼
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {shown.length === 0 && (
            <div className="empty">
              {playlist ? "This playlist is empty. Select songs in All music and add them here." : "No music yet. Songs you download or save go in My Music."}
              {!playlist && vfs && <div className="muted">MP3, OGG and WAV files anywhere in your folders show up here.</div>}
            </div>
          )}
        </div>
      </div>
      <div className="mu-player">
        <canvas ref={canvas} width={160} height={48} className="mu-vis" aria-hidden />
        <div className="mu-now">
          <strong>{info?.title ?? "Nothing playing"}</strong>
          <span className="muted">{info?.artist ?? "Double-click a song to play it"}</span>
          <div className="mu-seek">
            <span>{fmt(time.at)}</span>
            <input type="range" min={0} max={time.duration || 0} step={0.1} value={time.at} onChange={(e) => audio.current && (audio.current.currentTime = Number(e.target.value))} aria-label="Seek" disabled={!song} />
            <span>{fmt(time.duration)}</span>
          </div>
        </div>
        <div className="mu-buttons">
          <button className="tool" aria-pressed={prefs.shuffle} onClick={() => setPrefs({ ...prefs, shuffle: !prefs.shuffle })} title="Shuffle">
            🔀
          </button>
          <button className="tool" onClick={() => step(-1)} disabled={!song} aria-label="Previous">
            ⏮
          </button>
          <button
            className="mu-play"
            onClick={() => {
              ensureAnalyser();
              if (!current && shown[0]) return start(shown, shown[0].id);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? "Pause" : "Play"}
            disabled={!song && !shown.length}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button className="tool" onClick={() => step(1)} disabled={!song} aria-label="Next">
            ⏭
          </button>
          <button className="tool" aria-pressed={prefs.repeat !== "off"} onClick={() => setPrefs({ ...prefs, repeat: prefs.repeat === "off" ? "all" : prefs.repeat === "all" ? "one" : "off" })} title={`Repeat: ${prefs.repeat}`}>
            {prefs.repeat === "one" ? "🔂" : "🔁"}
          </button>
        </div>
        <div className="mu-volume">
          <button className="tool" onClick={() => updateSettings({ muted: !settings.muted })} aria-label={settings.muted ? "Unmute" : "Mute"}>
            {settings.muted ? "🔇" : "🔊"}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => updateSettings({ volume: Number(e.target.value), muted: false })} aria-label="Volume" />
        </div>
      </div>
      <audio
        ref={audio}
        src={url ?? undefined}
        onTimeUpdate={(e) => setTime({ at: e.currentTarget.currentTime, duration: e.currentTarget.duration || 0 })}
        onLoadedMetadata={(e) => setTime({ at: 0, duration: e.currentTarget.duration || 0 })}
        onEnded={() => step(1, true)}
        data-playing={playing}
      />
    </div>
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const out = [...list];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}
