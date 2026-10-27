"use client";

// Pieces the desktop programs share: live file listings, opening a file as
// a URL, the Open/Save dialog, the Explorer clipboard and window helpers.

import { useEffect, useEffectEvent, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { Icon } from "@/components/desktop/Icon";
import { formatSize, type FileNode, type SpecialFolder } from "@/lib/vfs";
import { iconForFile } from "./catalog";
import type { Win } from "@/lib/wm";

/** Every file and folder the current user owns, kept up to date. */
export function useFiles(): FileNode[] {
  const [files] = useCollection<FileNode>("files");
  return files;
}

export function sortNodes(list: FileNode[]): FileNode[] {
  return [...list].sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.kind === "folder" ? -1 : 1));
}

export function useChildren(folderId: string | null | undefined): FileNode[] {
  const files = useFiles();
  return useMemo(() => sortNodes(files.filter((f) => f.parentId === folderId)), [files, folderId]);
}

/** A playable/displayable URL for a file, revoked when it changes or unmounts. */
export function useFileUrl(fileId: string | null | undefined, version?: string): { url: string | null; error: string | null } {
  const { vfs } = useSystem();
  const key = fileId ? `${fileId}:${version ?? ""}` : null;
  // Results are tagged with the file they belong to, so a stale one is never shown.
  const [state, setState] = useState<{ key: string; url: string | null; error: string | null } | null>(null);
  useEffect(() => {
    if (!fileId || !vfs || !key) return;
    let alive = true;
    let revoke = () => {};
    vfs
      .openUrl(fileId)
      .then((r) => {
        if (!alive) return r.revoke();
        revoke = r.revoke;
        setState({ key, url: r.url, error: null });
      })
      .catch((e) => alive && setState({ key, url: null, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      alive = false;
      revoke();
    };
  }, [fileId, vfs, key]);
  return state && state.key === key ? { url: state.url, error: state.error } : { url: null, error: null };
}

/** Keeps the window's title bar in step with the document. */
export function useWindowTitle(win: Win, title: string) {
  const { dispatchWm } = useSystem();
  useEffect(() => {
    if (win.title !== title) dispatchWm({ type: "setTitle", id: win.id, title });
  }, [title, win.id, win.title, dispatchWm]);
}

/**
 * Runs `fn` with the window's arguments when it opens and again whenever
 * the program is asked to open something else (single-instance programs
 * receive new arguments with a fresh nonce).
 */
export function useArgs(win: Win, fn: (args: Record<string, unknown>) => void) {
  const last = useRef<unknown>(Symbol("unset"));
  const onArgs = useEffectEvent(fn);
  useEffect(() => {
    const key = win.args?.nonce ?? "first";
    if (last.current === key) return;
    last.current = key;
    onArgs(win.args ?? {});
  }, [win.args]);
}

export function useIsFocused(win: Win): boolean {
  return useSystem().wm.focused === win.id;
}

// ── Clipboard (Explorer's Cut / Copy / Paste) ─────────────────────────────

export interface ClipboardState {
  ids: string[];
  mode: "copy" | "cut";
}

let clip: ClipboardState | null = null;
const clipListeners = new Set<() => void>();

export const fileClipboard = {
  get: () => clip,
  set(next: ClipboardState | null) {
    clip = next;
    for (const l of clipListeners) l();
  },
  subscribe(l: () => void) {
    clipListeners.add(l);
    return () => void clipListeners.delete(l);
  },
};

export function useFileClipboard(): ClipboardState | null {
  return useSyncExternalStore(fileClipboard.subscribe, fileClipboard.get, () => null);
}

// ── Open / Save dialog ─────────────────────────────────────────────────────

export interface FileDialogProps {
  mode: "open" | "save";
  title?: string;
  /** Which files to show (folders always show). */
  accept?: (f: FileNode) => boolean;
  multiple?: boolean;
  startIn?: SpecialFolder | string;
  defaultName?: string;
  onClose: (result: { folderId: string; name?: string; files: FileNode[] } | null) => void;
}

const PLACES: { key: SpecialFolder; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "downloads", label: "Downloads" },
  { key: "documents", label: "My Documents" },
  { key: "pictures", label: "My Pictures" },
  { key: "music", label: "My Music" },
  { key: "videos", label: "My Videos" },
];

export function FileDialog({ mode, title, accept, multiple, startIn = "documents", defaultName = "", onClose }: FileDialogProps) {
  const { folders } = useSystem();
  const files = useFiles();
  const initial = folders ? ((folders as Record<string, string>)[startIn] ?? startIn) : null;
  const [folderId, setFolderId] = useState<string | null>(initial);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const current = files.find((f) => f.id === folderId);
  const items = sortNodes(files.filter((f) => f.parentId === folderId && (f.kind === "folder" ? f.special !== "recycle" : !accept || accept(f))));
  const picked = files.filter((f) => selected.includes(f.id));

  const submit = () => {
    if (!folderId) return;
    if (mode === "open") {
      if (!picked.length) return setError("Choose a file first.");
      onClose({ folderId, files: picked });
    } else {
      if (!name.trim()) return setError("Type a file name.");
      onClose({ folderId, name: name.trim(), files: [] });
    }
  };

  return (
    <div className="dialog-backdrop" onKeyDown={(e) => e.key === "Escape" && onClose(null)}>
      <div className="dialog file-dialog" role="dialog" aria-modal="true" aria-label={title ?? (mode === "open" ? "Open" : "Save As")}>
        <div className="titlebar">
          <span className="title">{title ?? (mode === "open" ? "Open" : "Save As")}</span>
        </div>
        <form
          className="dialog-body"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="fd-top">
            <button type="button" className="tool" disabled={!current?.parentId} onClick={() => current?.parentId && setFolderId(current.parentId)} aria-label="Up one level">
              ↑ Up
            </button>
            <span className="fd-path">{current?.name ?? ""}</span>
          </div>
          <div className="fd-main">
            <nav className="fd-places">
              {folders &&
                PLACES.map((p) => (
                  <button type="button" key={p.key} className={folderId === folders[p.key] ? "on" : ""} onClick={() => (setFolderId(folders[p.key]), setSelected([]))}>
                    {p.label}
                  </button>
                ))}
            </nav>
            <ul className="fd-list" role="listbox" aria-multiselectable={multiple}>
              {items.map((f) => (
                <li
                  key={f.id}
                  role="option"
                  aria-selected={selected.includes(f.id)}
                  className={selected.includes(f.id) ? "on" : ""}
                  onClick={(e) => {
                    setError(null);
                    if (f.kind === "folder") return setSelected([]);
                    if (mode === "save") setName(f.name);
                    setSelected((s) => (multiple && (e.ctrlKey || e.metaKey) ? (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]) : [f.id]));
                  }}
                  onDoubleClick={() => {
                    if (f.kind === "folder") {
                      setFolderId(f.id);
                      setSelected([]);
                    } else if (mode === "open") onClose({ folderId: folderId!, files: [f] });
                  }}
                >
                  <Icon name={iconForFile(f)} size={16} />
                  <span>{f.name}</span>
                  <small>{f.kind === "file" ? formatSize(f.size) : ""}</small>
                </li>
              ))}
              {items.length === 0 && <li className="muted">This folder is empty.</li>}
            </ul>
          </div>
          {mode === "save" ? (
            <label className="fd-name">
              File name:
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="File name" />
            </label>
          ) : (
            <div className="fd-name muted">{picked.length ? picked.map((p) => p.name).join(", ") : multiple ? "Ctrl+click to pick several files." : "Pick a file."}</div>
          )}
          {error && <div className="error-text">{error}</div>}
          <div className="dialog-actions">
            <button className="btn primary">{mode === "open" ? "Open" : "Save"}</button>
            <button type="button" className="btn" onClick={() => onClose(null)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const isImage = (f: Pick<FileNode, "mime">) => Boolean(f.mime?.startsWith("image/"));
export const isAudio = (f: Pick<FileNode, "mime">) => Boolean(f.mime?.startsWith("audio/"));
export const isVideo = (f: Pick<FileNode, "mime">) => Boolean(f.mime?.startsWith("video/"));
export const isText = (f: Pick<FileNode, "mime" | "name">) => Boolean(f.mime?.startsWith("text/") || f.mime === "application/json" || /\.(txt|md|log|json|html?)$/i.test(f.name));
