"use client";

// Video Player: plays the videos on your computer, with the other videos
// in the same folder lined up next.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { FileDialog, isVideo, useArgs, useFileUrl, useFiles, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

export default function VideoPlayer({ win }: AppProps) {
  const { settings } = useSystem();
  const files = useFiles();
  const [fileId, setFileId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const file = files.find((f) => f.id === fileId);
  const siblings = useMemo(() => (file ? files.filter((f) => f.parentId === file.parentId && f.kind === "file" && isVideo(f)).sort((a, b) => a.name.localeCompare(b.name)) : []), [files, file]);
  const index = siblings.findIndex((f) => f.id === fileId);
  const { url, error } = useFileUrl(fileId);
  useWindowTitle(win, file ? `${file.name} - Video Player` : "Video Player");

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") {
      setFileId(args.fileId);
      setAutoplay(true);
    }
  });

  useEffect(() => {
    if (!video.current) return;
    video.current.volume = settings.volume;
    video.current.muted = settings.muted;
  }, [settings.volume, settings.muted, url]);

  const go = (d: number) => {
    const next = siblings[index + d];
    if (next) {
      setFileId(next.id);
      setAutoplay(true);
    }
  };

  return (
    <div className="videoplayer">
      <div className="vp-stage">
        {url ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video ref={video} src={url} controls autoPlay={autoplay} onEnded={() => go(1)} />
        ) : (
          <div className="empty">
            {error ?? "Open a video to watch it here."}
            <div>
              <button className="btn" onClick={() => setPicking(true)}>
                Open a video
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="ph-controls">
        <button className="tool" onClick={() => setPicking(true)}>
          Open...
        </button>
        <button className="tool" onClick={() => go(-1)} disabled={index <= 0} aria-label="Previous video">
          ⏮ Previous
        </button>
        <button className="tool" onClick={() => go(1)} disabled={index < 0 || index >= siblings.length - 1} aria-label="Next video">
          Next ⏭
        </button>
        <button className="tool" disabled={!url} onClick={() => void video.current?.requestFullscreen()}>
          Full screen
        </button>
        <span className="muted">{siblings.length > 1 ? `${index + 1} of ${siblings.length} in this folder` : ""}</span>
      </div>
      {picking && (
        <FileDialog
          mode="open"
          title="Open a video"
          startIn="videos"
          accept={isVideo}
          onClose={(r) => {
            setPicking(false);
            if (r?.files[0]) {
              setFileId(r.files[0].id);
              setAutoplay(true);
            }
          }}
        />
      )}
    </div>
  );
}
