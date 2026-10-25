"use client";

// PDF Reader: renders PDF documents page by page with PDF.js, with zoom,
// page jumping and continuous scrolling.

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { FileDialog, useArgs, useFiles, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((m) => {
    // Copied to public/ by scripts/copy-pdf-worker.mjs.
    m.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return m;
  });
  return pdfjsPromise;
}

function Page({ doc, n, scale, onVisible }: { doc: PDFDocumentProxy; n: number; scale: number; onVisible: (n: number) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [shown, setShown] = useState(n <= 2);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) {
            setShown(true);
            if (e.intersectionRatio > 0.4) onVisible(n);
          }
        }
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [n, onVisible]);

  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void; promise: Promise<void> } | null = null;
    void doc.getPage(n).then((page) => {
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      setDims({ w: viewport.width, h: viewport.height });
      if (!shown || !canvas.current) return;
      const ratio = window.devicePixelRatio || 1;
      const c = canvas.current;
      c.width = Math.floor(viewport.width * ratio);
      c.height = Math.floor(viewport.height * ratio);
      task = page.render({ canvas: c, canvasContext: c.getContext("2d")!, viewport, transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined });
      task.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, n, scale, shown]);

  return (
    <div ref={box} className="pdf-page" style={dims ? { width: dims.w, height: dims.h } : { width: 612 * scale, height: 792 * scale }} id={`pdf-page-${n}`} data-page={n}>
      <canvas ref={canvas} style={dims ? { width: dims.w, height: dims.h } : undefined} aria-label={`Page ${n}`} />
    </div>
  );
}

export default function PdfReader({ win }: AppProps) {
  const { vfs } = useSystem();
  const files = useFiles();
  const [fileId, setFileId] = useState<string | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.25);
  const [page, setPage] = useState(1);
  const [picking, setPicking] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const file = files.find((f) => f.id === fileId);
  useWindowTitle(win, file ? `${file.name} - PDF Reader` : "PDF Reader");

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") setFileId(args.fileId);
  });

  useEffect(() => {
    if (!fileId || !vfs) return;
    let alive = true;
    let task: { destroy: () => Promise<void> } | null = null;
    setError(null);
    setDoc(null);
    (async () => {
      try {
        const [pdfjs, blob] = await Promise.all([loadPdfjs(), vfs.readBlob(fileId)]);
        if (!alive) return;
        const loading = pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) });
        task = loading;
        const d = await loading.promise;
        if (!alive) return;
        setDoc(d);
        setPage(1);
      } catch (e) {
        if (alive) setError(`This PDF couldn't be opened. ${e instanceof Error ? e.message : ""}`);
      }
    })();
    return () => {
      alive = false;
      void task?.destroy();
    };
  }, [fileId, vfs]);

  const jump = (n: number) => {
    if (!doc) return;
    const p = Math.min(doc.numPages, Math.max(1, n));
    setPage(p);
    document.getElementById(`pdf-page-${p}`)?.scrollIntoView({ block: "start" });
  };

  const fitWidth = async () => {
    if (!doc || !scroller.current) return;
    const p = await doc.getPage(page);
    const w = p.getViewport({ scale: 1 }).width;
    setScale(Math.max(0.25, (scroller.current.clientWidth - 40) / w));
  };

  return (
    <div className="pdfreader">
      <div className="toolbar">
        <button className="tool" onClick={() => setPicking(true)}>
          Open...
        </button>
        <span className="ph-sep" />
        <button className="tool" onClick={() => jump(page - 1)} disabled={!doc || page <= 1} aria-label="Previous page">
          ▲
        </button>
        <button className="tool" onClick={() => jump(page + 1)} disabled={!doc || page >= (doc?.numPages ?? 1)} aria-label="Next page">
          ▼
        </button>
        <input className="field pdf-pageno" type="number" min={1} max={doc?.numPages ?? 1} value={page} onChange={(e) => jump(Number(e.target.value))} aria-label="Page number" disabled={!doc} />
        <span>/ {doc?.numPages ?? "-"}</span>
        <span className="ph-sep" />
        <button className="tool" onClick={() => setScale((s) => Math.max(0.25, s / 1.2))} disabled={!doc} aria-label="Zoom out">
          −
        </button>
        <span className="ph-zoom">{Math.round(scale * 100)}%</span>
        <button className="tool" onClick={() => setScale((s) => Math.min(4, s * 1.2))} disabled={!doc} aria-label="Zoom in">
          +
        </button>
        <button className="tool" onClick={fitWidth} disabled={!doc}>
          Fit width
        </button>
      </div>
      <div className="pdf-pages" ref={scroller}>
        {!fileId && (
          <div className="empty">
            <p>Open a PDF document to read it.</p>
            <button className="btn" onClick={() => setPicking(true)}>
              Open a PDF
            </button>
          </div>
        )}
        {error && <div className="empty error-text">{error}</div>}
        {fileId && !doc && !error && <div className="empty">Opening...</div>}
        {doc && Array.from({ length: doc.numPages }, (_, i) => <Page key={`${fileId}-${i}`} doc={doc} n={i + 1} scale={scale} onVisible={setPage} />)}
      </div>
      {picking && (
        <FileDialog
          mode="open"
          title="Open a PDF"
          startIn="documents"
          accept={(f) => f.mime === "application/pdf"}
          onClose={(r) => {
            setPicking(false);
            if (r?.files[0]) setFileId(r.files[0].id);
          }}
        />
      )}
    </div>
  );
}
