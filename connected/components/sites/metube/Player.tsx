"use client";

// MeTube's video player: real playback with play/pause, seeking, volume,
// fullscreen and a resume point remembered per account.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { formatDuration } from "@/data/metube";
import { iso } from "@/lib/time";
import { COL, pairId, type MtProgress, type MtView } from "./store";

export function Player({ videoId, src, poster, onEnded }: { videoId: string; src: string; poster?: string; onEnded?: () => void }) {
  const { store, user, now, settings } = useSystem();
  const video = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const counted = useRef(false);
  const lastSaved = useRef(0);

  // The system volume (taskbar) scales the player's own volume.
  useEffect(() => {
    if (!video.current) return;
    video.current.volume = Math.max(0, Math.min(1, volume * settings.volume));
    video.current.muted = muted || settings.muted;
  }, [volume, muted, settings.volume, settings.muted]);

  const saveProgress = useCallback(
    async (position: number, dur: number) => {
      if (!user || !dur) return;
      await store.put<MtProgress>(COL.progress, { id: pairId(user.id, videoId), owner: user.id, videoId, position, duration: dur, updatedAt: iso(now()) });
    },
    [store, user, videoId, now],
  );

  // Resume where this account left off.
  const onLoaded = async () => {
    const v = video.current!;
    setDuration(v.duration);
    if (!user) return;
    const p = await store.get<MtProgress>(COL.progress, pairId(user.id, videoId));
    if (p && p.position > 2 && p.position < v.duration - 2) {
      v.currentTime = p.position;
      setNotice(`Resuming from ${formatDuration(p.position)}`);
      setTimeout(() => setNotice(null), 2500);
    }
  };

  const toggle = () => {
    const v = video.current!;
    if (v.paused) v.play().catch(() => setError("This browser couldn't play the video."));
    else v.pause();
  };

  const onPlay = async () => {
    setPlaying(true);
    if (counted.current || !user) return;
    counted.current = true;
    const id = pairId(user.id, videoId);
    const prev = await store.get<MtView>(COL.views, id);
    await store.put<MtView>(COL.views, { id, owner: user.id, videoId, count: (prev?.count ?? 0) + 1, lastAt: iso(now()) });
  };

  const onTime = () => {
    const v = video.current!;
    setTime(v.currentTime);
    if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    if (Math.abs(v.currentTime - lastSaved.current) > 2) {
      lastSaved.current = v.currentTime;
      void saveProgress(v.currentTime, v.duration);
    }
  };

  const seekFromEvent = (clientX: number, bar: HTMLElement) => {
    const r = bar.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    const v = video.current!;
    if (Number.isFinite(v.duration)) {
      v.currentTime = k * v.duration;
      setTime(v.currentTime);
    }
  };

  const startSeek = (e: React.PointerEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    bar.setPointerCapture(e.pointerId);
    seekFromEvent(e.clientX, bar);
    const move = (ev: PointerEvent) => seekFromEvent(ev.clientX, bar);
    const up = () => {
      bar.removeEventListener("pointermove", move);
      bar.removeEventListener("pointerup", up);
      void saveProgress(video.current!.currentTime, video.current!.duration);
    };
    bar.addEventListener("pointermove", move);
    bar.addEventListener("pointerup", up);
  };

  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void box.current?.requestFullscreen?.();
  };

  // Try to start playing right away, as MeTube did (browsers may refuse).
  useEffect(() => {
    video.current?.play().catch(() => {});
  }, [src]);

  return (
    <div
      ref={box}
      className="mt-player"
      tabIndex={0}
      onKeyDown={(e) => {
        const v = video.current!;
        if (e.key === " " || e.key === "k") (e.preventDefault(), toggle());
        if (e.key === "ArrowRight") v.currentTime = Math.min(v.duration, v.currentTime + 5);
        if (e.key === "ArrowLeft") v.currentTime = Math.max(0, v.currentTime - 5);
        if (e.key === "f") fullscreen();
        if (e.key === "m") setMuted((m) => !m);
      }}
      data-video-id={videoId}
    >
      <video
        ref={video}
        src={src}
        poster={poster}
        onClick={toggle}
        onDoubleClick={fullscreen}
        onLoadedMetadata={onLoaded}
        onPlay={onPlay}
        onPause={() => (setPlaying(false), void saveProgress(video.current!.currentTime, video.current!.duration))}
        onTimeUpdate={onTime}
        onEnded={() => {
          setPlaying(false);
          void saveProgress(0, video.current!.duration);
          onEnded?.();
        }}
        onError={() => setError("This video couldn't be loaded.")}
        playsInline
        preload="metadata"
        aria-label="Video"
      />
      {!playing && !error && (
        <button className="mt-bigplay" onClick={toggle} aria-label="Play">
          ▶
        </button>
      )}
      {notice && <div className="mt-notice">{notice}</div>}
      {error && <div className="mt-notice error">{error}</div>}
      <div className="mt-controls">
        <div className="mt-progress" onPointerDown={startSeek} role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(time)} tabIndex={-1}>
          <div className="mt-buffered" style={{ width: `${duration ? (buffered / duration) * 100 : 0}%` }} />
          <div className="mt-played" style={{ width: `${duration ? (time / duration) * 100 : 0}%` }} />
          <div className="mt-scrubber" style={{ left: `${duration ? (time / duration) * 100 : 0}%` }} />
        </div>
        <div className="mt-buttons">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
            {playing ? "❚❚" : "▶"}
          </button>
          <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}>
            {muted || volume === 0 ? "🔇" : "🔊"}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => (setVolume(Number(e.target.value)), setMuted(false))} aria-label="Volume" className="mt-volume" />
          <span className="mt-time" data-current-time={time.toFixed(1)}>
            {formatDuration(time)} / {formatDuration(duration)}
          </span>
          <span style={{ flex: 1 }} />
          <button onClick={fullscreen} aria-label="Full screen">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
