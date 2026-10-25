"use client";

// Photo Viewer: look through the pictures in a folder, zoom, rotate, run a
// slide show and set one as the desktop background.

import { useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useDialog } from "@/components/desktop/Dialogs";
import { formatDateTime } from "@/lib/time";
import { formatSize } from "@/lib/vfs";
import { FileDialog, isImage, useArgs, useFileUrl, useFiles, useIsFocused, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

export default function Photos({ win }: AppProps) {
  const { vfs, updateSettings, settings, openApp, notify, computer } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const focused = useIsFocused(win);
  const [fileId, setFileId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [rotation, setRotation] = useState(0);
  const [slideshow, setSlideshow] = useState(false);
  const [picking, setPicking] = useState(false);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") setFileId(args.fileId);
  });

  const file = files.find((f) => f.id === fileId);
  const siblings = useMemo(() => (file ? files.filter((f) => f.parentId === file.parentId && f.kind === "file" && isImage(f)).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })) : []), [files, file]);
  const index = siblings.findIndex((f) => f.id === fileId);
  const { url, error } = useFileUrl(fileId, file?.modified);
  useWindowTitle(win, file ? `${file.name} - Photo Viewer` : "Photo Viewer");

  const step = (d: number) => {
    if (!siblings.length) return;
    const next = siblings[(index + d + siblings.length) % siblings.length];
    setFileId(next.id);
    setZoom("fit");
    setRotation(0);
    setNatural(null);
  };

  useEffect(() => {
    if (!slideshow) return;
    const t = setInterval(() => step(1), 3500);
    return () => clearInterval(t);
  });

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(1.25);
      else if (e.key === "-") zoomBy(0.8);
      else if (e.key === "Escape" && slideshow) stopSlideshow();
      else if ((e.ctrlKey || e.metaKey) && e.key === ".") setRotation((r) => r + 90);
      else if ((e.ctrlKey || e.metaKey) && e.key === ",") setRotation((r) => r - 90);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const fitScale = () => {
    const el = stage.current;
    if (!el || !natural) return 1;
    const sideways = Math.abs(rotation % 180) === 90;
    const w = sideways ? natural.h : natural.w;
    const h = sideways ? natural.w : natural.h;
    return Math.min(1, (el.clientWidth - 20) / w, (el.clientHeight - 20) / h);
  };
  const scale = zoom === "fit" ? fitScale() : zoom;
  const zoomBy = (f: number) => setZoom(Math.min(8, Math.max(0.05, (zoom === "fit" ? fitScale() : zoom) * f)));

  const stopSlideshow = () => {
    setSlideshow(false);
    if (document.fullscreenElement) void document.exitFullscreen();
  };

  const isWallpaper = settings.wallpaper.kind === "file" && settings.wallpaper.fileId === fileId;

  return (
    <div className={`photos${slideshow ? " slideshow" : ""}`}>
      <div className="toolbar">
        <button className="tool" onClick={() => setPicking(true)}>
          Open...
        </button>
        <button
          className="tool"
          disabled={!file || isWallpaper}
          onClick={async () => {
            if (!file) return;
            await updateSettings({ wallpaper: { kind: "file", fileId: file.id } });
            notify({ title: "Desktop background changed", body: file.name, icon: "photos" });
          }}
        >
          {isWallpaper ? "This is your desktop background" : "Set as desktop background"}
        </button>
        <button className="tool" disabled={!file} onClick={() => file && openApp("paint", { fileId: file.id })}>
          Edit in Paint
        </button>
        <button
          className="tool"
          disabled={!file}
          onClick={async () => {
            if (!file || !vfs) return;
            if (!(await dialog.confirm(`Are you sure you want to move "${file.name}" to the Recycle Bin?`, { title: "Delete File", okLabel: "Yes" }))) return;
            const next = siblings.length > 1 ? siblings[(index + 1) % siblings.length].id : null;
            await vfs.trash(file.id);
            setFileId(next);
          }}
        >
          Delete
        </button>
        <span style={{ flex: 1 }} />
        {file && natural && (
          <span className="muted">
            {natural.w} × {natural.h} · {formatSize(file.size)} · {formatDateTime(Date.parse(file.modified), computer.timeZone)}
          </span>
        )}
      </div>
      <div className="ph-stage" ref={stage} onDoubleClick={() => setZoom(zoom === "fit" ? 1 : "fit")}>
        {!fileId && (
          <div className="empty">
            <p>Open a picture to view it here.</p>
            <button className="btn" onClick={() => setPicking(true)}>
              Open a picture
            </button>
          </div>
        )}
        {error && <div className="empty error-text">{error}</div>}
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={file?.name ?? ""}
            onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            style={natural ? { width: natural.w * scale, height: natural.h * scale, transform: `rotate(${rotation}deg)` } : { visibility: "hidden" }}
            data-rotation={rotation}
          />
        )}
      </div>
      <div className="ph-controls">
        <button className="tool" onClick={() => zoomBy(0.8)} disabled={!url} aria-label="Zoom out" title="Zoom out (-)">
          −
        </button>
        <span className="ph-zoom">{url ? `${Math.round(scale * 100)}%` : ""}</span>
        <button className="tool" onClick={() => zoomBy(1.25)} disabled={!url} aria-label="Zoom in" title="Zoom in (+)">
          +
        </button>
        <button className="tool" onClick={() => setZoom("fit")} aria-pressed={zoom === "fit"} disabled={!url}>
          Fit
        </button>
        <button className="tool" onClick={() => setZoom(1)} aria-pressed={zoom === 1} disabled={!url}>
          Actual size
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={() => step(-1)} disabled={siblings.length < 2} aria-label="Previous picture" title="Previous (←)">
          ◀
        </button>
        <button
          className="tool ph-play"
          disabled={siblings.length < 1}
          onClick={() => {
            if (slideshow) return stopSlideshow();
            setSlideshow(true);
            setZoom("fit");
            void stage.current?.parentElement?.requestFullscreen?.().catch(() => {});
          }}
        >
          {slideshow ? "Stop slide show" : "Play slide show"}
        </button>
        <button className="tool" onClick={() => step(1)} disabled={siblings.length < 2} aria-label="Next picture" title="Next (→)">
          ▶
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={() => setRotation((r) => r - 90)} disabled={!url} aria-label="Rotate counterclockwise" title="Rotate counterclockwise (Ctrl+,)">
          ⟲
        </button>
        <button className="tool" onClick={() => setRotation((r) => r + 90)} disabled={!url} aria-label="Rotate clockwise" title="Rotate clockwise (Ctrl+.)">
          ⟳
        </button>
        <span className="muted">{siblings.length > 1 ? `${index + 1} of ${siblings.length}` : ""}</span>
      </div>
      {picking && (
        <FileDialog
          mode="open"
          title="Open a picture"
          startIn="pictures"
          accept={isImage}
          onClose={(r) => {
            setPicking(false);
            if (r?.files[0]) {
              setFileId(r.files[0].id);
              setZoom("fit");
              setRotation(0);
              setNatural(null);
            }
          }}
        />
      )}
    </div>
  );
}
