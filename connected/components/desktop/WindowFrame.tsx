"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { useSystem, TASKBAR_HEIGHT } from "@/components/system/system";
import { clampRect, type Win, type WinRect } from "@/lib/wm";
import { APPS } from "@/components/apps/catalog";
import { AppHost } from "@/components/apps/registry";
import { Icon } from "./Icon";

type Edge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function area() {
  return { w: window.innerWidth, h: window.innerHeight - TASKBAR_HEIGHT };
}

export const WindowFrame = memo(function WindowFrame({ win, focused }: { win: Win; focused: boolean }) {
  const { dispatchWm } = useSystem();
  const frame = useRef<HTMLDivElement>(null);
  const app = APPS[win.appId];

  const focus = useCallback(() => {
    if (!focused) dispatchWm({ type: "focus", id: win.id });
  }, [focused, dispatchWm, win.id]);

  // Dragging and resizing move the element directly for smoothness, then
  // commit the final rectangle to the window manager.
  const startDrag = (e: React.PointerEvent, edge: Edge | "move") => {
    if (e.button !== 0) return;
    if (win.maximized && edge !== "move") return;
    e.preventDefault();
    focus();
    const el = frame.current!;
    const start = { x: e.clientX, y: e.clientY };
    let rect: WinRect = { ...win.rect };
    let restoredFromMax = false;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (edge === "move") {
        if (win.maximized && !restoredFromMax) {
          if (Math.abs(dx) + Math.abs(dy) < 6) return;
          // Dragging a maximized window restores it under the pointer.
          restoredFromMax = true;
          dispatchWm({ type: "toggleMaximize", id: win.id });
          rect = { ...win.rect, x: ev.clientX - win.rect.w / 2, y: 0 };
          start.x = ev.clientX;
          start.y = ev.clientY;
          return;
        }
        const r = clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, area());
        el.style.left = `${r.x}px`;
        el.style.top = `${r.y}px`;
      } else {
        const r = { ...rect };
        if (edge.includes("e")) r.w = rect.w + dx;
        if (edge.includes("s")) r.h = rect.h + dy;
        if (edge.includes("w")) {
          r.w = rect.w - dx;
          r.x = rect.x + dx;
        }
        if (edge.includes("n")) {
          r.h = rect.h - dy;
          r.y = rect.y + dy;
        }
        if (r.w < 320) {
          if (edge.includes("w")) r.x -= 320 - r.w;
          r.w = 320;
        }
        if (r.h < 200) {
          if (edge.includes("n")) r.y -= 200 - r.h;
          r.h = 200;
        }
        Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
      }
    };
    const up = (ev: PointerEvent) => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (edge === "move") {
        if (win.maximized && !restoredFromMax) return;
        // Dropping at the very top maximizes, like Aero Snap.
        if (ev.clientY <= 2) {
          dispatchWm({ type: "move", id: win.id, x: rect.x, y: rect.y });
          dispatchWm({ type: "toggleMaximize", id: win.id });
          return;
        }
        const r = clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, area());
        dispatchWm({ type: "move", id: win.id, x: r.x, y: r.y });
      } else {
        const el2 = frame.current!;
        dispatchWm({
          type: "resize",
          id: win.id,
          rect: { x: parseFloat(el2.style.left), y: parseFloat(el2.style.top), w: parseFloat(el2.style.width), h: parseFloat(el2.style.height) },
        });
      }
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
  };

  // Keep the inline geometry in step with the window manager.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    if (win.maximized) {
      Object.assign(el.style, { left: "0px", top: "0px", width: "100%", height: "100%" });
    } else {
      Object.assign(el.style, { left: `${win.rect.x}px`, top: `${win.rect.y}px`, width: `${win.rect.w}px`, height: `${win.rect.h}px` });
    }
  }, [win.rect, win.maximized]);

  return (
    <div
      ref={frame}
      className={`window${focused ? "" : " inactive"}${win.maximized ? " maximized" : ""}${win.minimized ? " minimized" : ""}`}
      style={{ zIndex: win.z }}
      onPointerDownCapture={focus}
      role="dialog"
      aria-label={win.title}
      data-app={win.appId}
      data-window-id={win.id}
    >
      {!win.maximized &&
        (["n", "s", "e", "w", "ne", "nw", "se", "sw"] as Edge[]).map((edge) => <div key={edge} className={`resize ${edge}`} onPointerDown={(e) => startDrag(e, edge)} />)}
      <div className="titlebar" onPointerDown={(e) => startDrag(e, "move")} onDoubleClick={() => dispatchWm({ type: "toggleMaximize", id: win.id })}>
        <Icon name={app?.icon ?? "file"} size={16} />
        <span className="title">{win.title}</span>
        <div className="caption-buttons" onPointerDown={(e) => e.stopPropagation()}>
          <button aria-label="Minimize" title="Minimize" onClick={() => dispatchWm({ type: "minimize", id: win.id })}>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <rect x="1" y="7" width="8" height="2" fill="#fff" />
            </svg>
          </button>
          <button aria-label={win.maximized ? "Restore Down" : "Maximize"} title={win.maximized ? "Restore Down" : "Maximize"} onClick={() => dispatchWm({ type: "toggleMaximize", id: win.id })}>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              {win.maximized ? (
                <path d="M3 1 h6 v6 M1 3 h6 v6 h-6z" fill="none" stroke="#fff" strokeWidth="1.5" />
              ) : (
                <rect x="1" y="1" width="8" height="8" fill="none" stroke="#fff" strokeWidth="2" />
              )}
            </svg>
          </button>
          <button className="close" aria-label="Close" title="Close" onClick={() => dispatchWm({ type: "close", id: win.id })}>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
              <path d="M1.5 1.5 l7 7 M8.5 1.5 l-7 7" stroke="#fff" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
      <div className="window-body">
        <AppHost win={win} />
      </div>
    </div>
  );
});
