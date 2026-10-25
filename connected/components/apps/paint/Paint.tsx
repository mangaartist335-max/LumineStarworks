"use client";

// Paint: draw with pencils, brushes and shapes, fill areas, add text, crop,
// resize and rotate, then save a PNG or make it your desktop background.

import { useCallback, useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useDialog } from "@/components/desktop/Dialogs";
import { floodFill, hexToRgba } from "@/lib/paint";
import { FileDialog, isImage, useArgs, useFiles, useIsFocused, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

type Tool = "pencil" | "brush" | "eraser" | "line" | "rect" | "ellipse" | "fill" | "picker" | "text" | "select";

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: "pencil", label: "Pencil", icon: "✏️" },
  { id: "brush", label: "Brush", icon: "🖌️" },
  { id: "eraser", label: "Eraser", icon: "🧽" },
  { id: "fill", label: "Fill with colour", icon: "🪣" },
  { id: "picker", label: "Colour picker", icon: "💧" },
  { id: "text", label: "Text", icon: "A" },
  { id: "line", label: "Line", icon: "╱" },
  { id: "rect", label: "Rectangle", icon: "▭" },
  { id: "ellipse", label: "Ellipse", icon: "◯" },
  { id: "select", label: "Select (for cropping)", icon: "⬚" },
];

const PALETTE = ["#000000", "#7f7f7f", "#880015", "#ed1c24", "#ff7f27", "#fff200", "#22b14c", "#00a2e8", "#3f48cc", "#a349a4", "#ffffff", "#c3c3c3", "#b97a57", "#ffaec9", "#ffc90e", "#efe4b0", "#b5e61d", "#99d9ea", "#7092be", "#c8bfe7"];

const MAX_SIDE = 2400;
const HISTORY = 30;

export default function Paint({ win }: AppProps) {
  const { vfs, updateSettings, notify } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const focused = useIsFocused(win);
  const main = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ w: 800, h: 520 });
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#000000");
  const [color2, setColor2] = useState("#ffffff");
  const [stroke, setStroke] = useState(4);
  const [filled, setFilled] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fileId, setFileId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [picker, setPicker] = useState<"open" | "save" | null>(null);
  const [selection, setSelection] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const [hist, setHist] = useState({ undo: 0, redo: 0 });
  const drag = useRef<{ x: number; y: number; lastX: number; lastY: number; button: number } | null>(null);
  const afterSave = useRef<((id: string) => void) | null>(null);
  const file = files.find((f) => f.id === fileId);
  useWindowTitle(win, `${dirty ? "*" : ""}${file?.name ?? "Untitled"} - Paint`);

  const ctx = () => main.current!.getContext("2d", { willReadFrequently: true })!;

  const snapshot = useCallback(() => {
    undo.current.push(ctx().getImageData(0, 0, main.current!.width, main.current!.height));
    if (undo.current.length > HISTORY) undo.current.shift();
    redo.current = [];
    setHist({ undo: undo.current.length, redo: redo.current.length });
  }, []);

  /** Sizes the canvas and paints it white (then runs `draw`). */
  const paintCanvas = useCallback((w: number, h: number, draw?: (g: CanvasRenderingContext2D) => void) => {
    const c = main.current!;
    c.width = w;
    c.height = h;
    overlay.current!.width = w;
    overlay.current!.height = h;
    const g = ctx();
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    draw?.(g);
  }, []);

  const resetCanvas = useCallback(
    (w: number, h: number, draw?: (g: CanvasRenderingContext2D) => void) => {
      paintCanvas(w, h, draw);
      setSize({ w, h });
      setSelection(null);
    },
    [paintCanvas],
  );

  useEffect(() => {
    paintCanvas(800, 520);
  }, [paintCanvas]);

  const clearHistory = () => {
    undo.current = [];
    redo.current = [];
    setHist({ undo: 0, redo: 0 });
  };

  const openFile = async (id: string) => {
    if (!vfs) return;
    try {
      const { url, revoke } = await vfs.openUrl(id);
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      resetCanvas(w, h, (g) => g.drawImage(img, 0, 0, w, h));
      revoke();
      clearHistory();
      setFileId(id);
      setDirty(false);
    } catch (e) {
      await dialog.alert(`Paint can't read this file.\n${e instanceof Error ? e.message : ""}`, { title: "Paint" });
    }
  };

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") void openFile(args.fileId);
  });

  const toPoint = (e: React.PointerEvent) => {
    const r = overlay.current!.getBoundingClientRect();
    return { x: Math.floor(((e.clientX - r.left) / r.width) * size.w), y: Math.floor(((e.clientY - r.top) / r.height) * size.h) };
  };

  const strokeStyle = (g: CanvasRenderingContext2D, button: number) => {
    const c = tool === "eraser" ? color2 : button === 2 ? color2 : color;
    g.strokeStyle = c;
    g.fillStyle = c;
    g.lineWidth = tool === "pencil" ? 1 : stroke;
    g.lineCap = "round";
    g.lineJoin = "round";
  };

  const drawShape = (g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, button: number) => {
    strokeStyle(g, button);
    g.beginPath();
    if (tool === "line") {
      g.moveTo(x0 + 0.5, y0 + 0.5);
      g.lineTo(x1 + 0.5, y1 + 0.5);
      g.stroke();
    } else if (tool === "rect") {
      if (filled) g.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
      else g.strokeRect(Math.min(x0, x1) + 0.5, Math.min(y0, y1) + 0.5, Math.abs(x1 - x0), Math.abs(y1 - y0));
    } else if (tool === "ellipse") {
      g.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
      if (filled) g.fill();
      else g.stroke();
    }
  };

  const onDown = async (e: React.PointerEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    const p = toPoint(e);
    const g = ctx();
    if (tool === "picker") {
      const d = g.getImageData(p.x, p.y, 1, 1).data;
      const hex = `#${[d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
      if (e.button === 2) setColor2(hex);
      else setColor(hex);
      return;
    }
    if (tool === "fill") {
      snapshot();
      const img = g.getImageData(0, 0, size.w, size.h);
      if (floodFill(img, p.x, p.y, hexToRgba(e.button === 2 ? color2 : color))) {
        g.putImageData(img, 0, 0);
        setDirty(true);
      }
      return;
    }
    if (tool === "text") {
      const text = await dialog.prompt("Type your text:", "", { title: "Text" });
      if (!text) return;
      snapshot();
      g.fillStyle = e.button === 2 ? color2 : color;
      g.font = `${Math.max(12, stroke * 4)}px "Segoe UI", Arial, sans-serif`;
      g.textBaseline = "top";
      text.split("\n").forEach((line, i) => g.fillText(line, p.x, p.y + i * Math.max(12, stroke * 4) * 1.2));
      setDirty(true);
      return;
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (tool !== "select") snapshot();
    else setSelection(null);
    drag.current = { x: p.x, y: p.y, lastX: p.x, lastY: p.y, button: e.button };
    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      strokeStyle(g, e.button);
      g.beginPath();
      g.arc(p.x + 0.5, p.y + 0.5, (tool === "pencil" ? 1 : stroke) / 2, 0, Math.PI * 2);
      g.fill();
    }
  };

  const onMove = (e: React.PointerEvent) => {
    const p = toPoint(e);
    setPos(p);
    const d = drag.current;
    if (!d) return;
    const g = ctx();
    const o = overlay.current!.getContext("2d")!;
    if (tool === "pencil" || tool === "brush" || tool === "eraser") {
      strokeStyle(g, d.button);
      g.beginPath();
      g.moveTo(d.lastX + 0.5, d.lastY + 0.5);
      g.lineTo(p.x + 0.5, p.y + 0.5);
      g.stroke();
      d.lastX = p.x;
      d.lastY = p.y;
      setDirty(true);
    } else {
      o.clearRect(0, 0, size.w, size.h);
      if (tool === "select") {
        o.setLineDash([4, 3]);
        o.strokeStyle = "#000";
        o.lineWidth = 1;
        o.strokeRect(Math.min(d.x, p.x) + 0.5, Math.min(d.y, p.y) + 0.5, Math.abs(p.x - d.x), Math.abs(p.y - d.y));
        o.setLineDash([]);
      } else drawShape(o, d.x, d.y, p.x, p.y, d.button);
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const p = toPoint(e);
    const o = overlay.current!.getContext("2d")!;
    if (tool === "select") {
      const w = Math.abs(p.x - d.x);
      const h = Math.abs(p.y - d.y);
      if (w > 2 && h > 2) setSelection({ x: Math.max(0, Math.min(d.x, p.x)), y: Math.max(0, Math.min(d.y, p.y)), w: Math.min(w, size.w), h: Math.min(h, size.h) });
      else o.clearRect(0, 0, size.w, size.h);
      return;
    }
    o.clearRect(0, 0, size.w, size.h);
    if (tool === "line" || tool === "rect" || tool === "ellipse") {
      drawShape(ctx(), d.x, d.y, p.x, p.y, d.button);
      setDirty(true);
    }
  };

  const doUndo = () => {
    const prev = undo.current.pop();
    if (!prev) return;
    const c = main.current!;
    redo.current.push(ctx().getImageData(0, 0, c.width, c.height));
    if (prev.width !== c.width || prev.height !== c.height) resetCanvas(prev.width, prev.height);
    ctx().putImageData(prev, 0, 0);
    setDirty(true);
    setHist({ undo: undo.current.length, redo: redo.current.length });
  };
  const doRedo = () => {
    const next = redo.current.pop();
    if (!next) return;
    const c = main.current!;
    undo.current.push(ctx().getImageData(0, 0, c.width, c.height));
    if (next.width !== c.width || next.height !== c.height) resetCanvas(next.width, next.height);
    ctx().putImageData(next, 0, 0);
    setDirty(true);
    setHist({ undo: undo.current.length, redo: redo.current.length });
  };

  const transform = (w: number, h: number, draw: (g: CanvasRenderingContext2D, src: HTMLCanvasElement) => void) => {
    snapshot();
    const src = document.createElement("canvas");
    src.width = main.current!.width;
    src.height = main.current!.height;
    src.getContext("2d")!.drawImage(main.current!, 0, 0);
    resetCanvas(w, h, (g) => draw(g, src));
    setDirty(true);
  };

  const crop = () => {
    if (!selection) return;
    const s = selection;
    transform(s.w, s.h, (g, src) => g.drawImage(src, s.x, s.y, s.w, s.h, 0, 0, s.w, s.h));
  };

  const resize = async () => {
    const v = await dialog.prompt("New canvas size in pixels (width x height):", `${size.w} x ${size.h}`, { title: "Canvas size" });
    const m = v && /^\s*(\d+)\s*[x×,]\s*(\d+)\s*$/i.exec(v);
    if (!m) return;
    const w = Math.min(MAX_SIDE, Math.max(1, +m[1]));
    const h = Math.min(MAX_SIDE, Math.max(1, +m[2]));
    const stretch = await dialog.confirm("Stretch the picture to the new size?\n(Cancel keeps the picture as it is and changes the canvas around it.)", { title: "Canvas size", okLabel: "Stretch" });
    transform(w, h, (g, src) => (stretch ? g.drawImage(src, 0, 0, w, h) : g.drawImage(src, 0, 0)));
  };

  const rotate = (deg: 90 | -90) =>
    transform(size.h, size.w, (g, src) => {
      g.translate(size.h / 2, size.w / 2);
      g.rotate((deg * Math.PI) / 180);
      g.drawImage(src, -size.w / 2, -size.h / 2);
    });

  const flip = () =>
    transform(size.w, size.h, (g, src) => {
      g.translate(size.w, 0);
      g.scale(-1, 1);
      g.drawImage(src, 0, 0);
    });

  const pngBlob = () => new Promise<Blob>((resolve, reject) => main.current!.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't save the picture."))), "image/png"));

  const save = async (as = false, then?: (id: string) => void) => {
    if (!vfs) return;
    const canOverwrite = file && file.mime === "image/png" && file.content?.kind === "blob";
    if (!as && canOverwrite) {
      await vfs.updateFile(file.id, await pngBlob());
      setDirty(false);
      then?.(file.id);
      return;
    }
    afterSave.current = then ?? null;
    setPicker("save");
  };

  const keepChanges = async () => !dirty || (await dialog.confirm(`Do you want to discard your changes to ${file?.name ?? "Untitled"}?`, { title: "Paint", okLabel: "Discard" }));

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "z") (e.preventDefault(), doUndo());
      else if (mod && k === "y") (e.preventDefault(), doRedo());
      else if (mod && k === "s") (e.preventDefault(), void save(e.shiftKey));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="paint">
      <div className="toolbar">
        <button className="tool" onClick={async () => (await keepChanges()) && (resetCanvas(800, 520), setFileId(null), setDirty(false), clearHistory())}>
          New
        </button>
        <button className="tool" onClick={async () => (await keepChanges()) && setPicker("open")}>
          Open...
        </button>
        <button className="tool" onClick={() => save()}>
          Save
        </button>
        <button className="tool" onClick={() => save(true)}>
          Save As...
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={doUndo} disabled={!hist.undo} title="Undo (Ctrl+Z)">
          ↶ Undo
        </button>
        <button className="tool" onClick={doRedo} disabled={!hist.redo} title="Redo (Ctrl+Y)">
          ↷ Redo
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={crop} disabled={!selection}>
          Crop
        </button>
        <button className="tool" onClick={resize}>
          Resize
        </button>
        <button className="tool" onClick={() => rotate(90)} title="Rotate right">
          ⟳
        </button>
        <button className="tool" onClick={() => rotate(-90)} title="Rotate left">
          ⟲
        </button>
        <button className="tool" onClick={flip} title="Flip horizontal">
          ⇋
        </button>
        <span className="ph-sep" />
        <button
          className="tool"
          onClick={() =>
            save(false, async (id) => {
              await updateSettings({ wallpaper: { kind: "file", fileId: id } });
              notify({ title: "Desktop background changed", body: "Your picture is now on the desktop.", icon: "paint" });
            })
          }
        >
          Set as desktop background
        </button>
      </div>
      <div className="pt-main">
        <div className="pt-tools" role="toolbar" aria-label="Tools">
          {TOOLS.map((t) => (
            <button key={t.id} className="tool" aria-pressed={tool === t.id} onClick={() => setTool(t.id)} title={t.label} aria-label={t.label}>
              {t.icon}
            </button>
          ))}
          <label className="pt-size" title="Size">
            Size
            <input type="range" min={1} max={40} value={stroke} onChange={(e) => setStroke(Number(e.target.value))} aria-label="Size" />
            <span>{stroke}px</span>
          </label>
          <label title="Fill shapes">
            <input type="checkbox" checked={filled} onChange={(e) => setFilled(e.target.checked)} /> Filled
          </label>
          <select className="field" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom">
            {[0.5, 1, 2, 4].map((z) => (
              <option key={z} value={z}>
                {z * 100}%
              </option>
            ))}
          </select>
        </div>
        <div className="pt-canvas-wrap" onContextMenu={(e) => e.preventDefault()}>
          <div className="pt-canvas" style={{ width: size.w * zoom, height: size.h * zoom }}>
            <canvas ref={main} style={{ width: size.w * zoom, height: size.h * zoom }} />
            <canvas ref={overlay} className={`pt-overlay tool-${tool}`} style={{ width: size.w * zoom, height: size.h * zoom }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setPos(null)} aria-label="Canvas" role="img" />
          </div>
        </div>
      </div>
      <div className="pt-palette">
        <div className="pt-current" title="Left-click colour / right-click colour">
          <span style={{ background: color }} />
          <span style={{ background: color2 }} />
        </div>
        {PALETTE.map((c) => (
          <button
            key={c}
            style={{ background: c }}
            onClick={() => setColor(c)}
            onContextMenu={(e) => {
              e.preventDefault();
              setColor2(c);
            }}
            aria-label={`Colour ${c}`}
            title="Left-click: colour 1, right-click: colour 2"
          />
        ))}
        <label className="pt-custom">
          Edit colours <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Custom colour" />
        </label>
      </div>
      <div className="statusbar">
        <span>{pos ? `${pos.x}, ${pos.y}px` : ""}</span>
        <span>
          {size.w} × {size.h}px
        </span>
        {selection && (
          <span>
            Selection {selection.w} × {selection.h}px
          </span>
        )}
      </div>
      {picker && (
        <FileDialog
          mode={picker}
          title={picker === "open" ? "Open a picture" : "Save As"}
          accept={isImage}
          startIn={picker === "open" ? "pictures" : file?.parentId ?? "pictures"}
          defaultName={(file?.name ?? "Untitled").replace(/\.[a-z0-9]+$/i, "") + ".png"}
          onClose={async (r) => {
            const mode = picker;
            setPicker(null);
            if (!r || !vfs) return;
            if (mode === "open") return void openFile(r.files[0].id);
            const name = /\.png$/i.test(r.name!) ? r.name! : `${r.name!.replace(/\.[a-z0-9]+$/i, "")}.png`;
            const existing = files.find((f) => f.parentId === r.folderId && f.name.toLowerCase() === name.toLowerCase() && f.kind === "file");
            let id: string;
            if (existing) {
              if (!(await dialog.confirm(`${name} already exists.\nDo you want to replace it?`, { title: "Confirm Save As", okLabel: "Yes" }))) return;
              id = (await vfs.updateFile(existing.id, await pngBlob())).id;
            } else id = (await vfs.writeFile(r.folderId, name, await pngBlob(), { mime: "image/png" })).id;
            setFileId(id);
            setDirty(false);
            afterSave.current?.(id);
            afterSave.current = null;
          }}
        />
      )}
    </div>
  );
}
