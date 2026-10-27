"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type MenuEntry = { label: string; onSelect: () => void; disabled?: boolean } | "separator";

export function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: MenuEntry[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("mousedown", away);
    window.addEventListener("keydown", key);
    ref.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => {
      window.removeEventListener("mousedown", away);
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);
  // Keep the menu on screen.
  const left = Math.min(x, window.innerWidth - 200);
  const top = Math.min(y, window.innerHeight - 30 - items.length * 26);
  // Portalled to <body>: windows use backdrop-filter, which would otherwise
  // make "position: fixed" relative to the window instead of the screen.
  return createPortal(
    <div ref={ref} className="context-menu" style={{ left, top }} role="menu">
      {items.map((item, i) =>
        item === "separator" ? (
          <div key={i} className="menu-sep" role="separator" />
        ) : (
          <button
            key={i}
            className="menu-item"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              onClose();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}
