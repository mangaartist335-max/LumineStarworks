"use client";

// Explorer: browse folders, open files, and copy, move, rename, delete and
// restore them. Downloads, Pictures, Music, Videos, Documents and the
// Recycle Bin are ordinary folders here, so every program sees the same files.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useDialog } from "@/components/desktop/Dialogs";
import { ContextMenu, type MenuEntry } from "@/components/desktop/ContextMenu";
import { Icon } from "@/components/desktop/Icon";
import { useUserValue } from "@/components/system/hooks";
import { formatDateTime } from "@/lib/time";
import { formatSize, extensionOf, type FileNode, type SpecialFolder } from "@/lib/vfs";
import { appForFile, iconForFile } from "../catalog";
import { fileClipboard, isImage, sortNodes, useArgs, useFileClipboard, useFiles, useIsFocused, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

const NAV: { key: SpecialFolder; label: string }[] = [
  { key: "desktop", label: "Desktop" },
  { key: "downloads", label: "Downloads" },
  { key: "documents", label: "My Documents" },
  { key: "pictures", label: "My Pictures" },
  { key: "music", label: "My Music" },
  { key: "videos", label: "My Videos" },
];

function typeName(f: FileNode): string {
  if (f.kind === "folder") return "File folder";
  const ext = extensionOf(f.name).toUpperCase();
  if (f.mime?.startsWith("image/")) return `${ext} image`;
  if (f.mime?.startsWith("audio/")) return `${ext} audio`;
  if (f.mime?.startsWith("video/")) return `${ext} video`;
  if (f.mime === "application/pdf") return "PDF document";
  if (ext === "ZIP" || ext === "CBZ") return "Compressed (zipped) folder";
  if (ext === "URL") return "Internet shortcut";
  if (f.mime?.startsWith("text/")) return "Text document";
  return ext ? `${ext} file` : "File";
}

export default function Explorer({ win }: AppProps) {
  const sys = useSystem();
  const { vfs, folders, openApp, computer, downloads, retryDownload, cancelDownload, updateSettings } = sys;
  const dialog = useDialog();
  const files = useFiles();
  const clipboard = useFileClipboard();
  const focused = useIsFocused(win);
  const [view, setView] = useUserValue<"details" | "icons">("explorer-view", "details");
  const [hist, setHist] = useState<{ stack: string[]; index: number }>({ stack: [], index: -1 });
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileNode[] | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuEntry[] } | null>(null);
  const [sort, setSort] = useState<{ key: "name" | "modified" | "type" | "size"; dir: 1 | -1 }>({ key: "name", dir: 1 });

  const folderId = hist.stack[hist.index] ?? folders?.home ?? null;
  const folder = files.find((f) => f.id === folderId);
  const inRecycle = folder?.special === "recycle";

  const go = useCallback((id: string) => {
    setHist((h) => ({ stack: [...h.stack.slice(0, h.index + 1), id], index: h.index + 1 }));
    setSelected([]);
    setQuery("");
    setResults(null);
  }, []);

  useArgs(win, (args) => {
    const target = (args.folderId as string | undefined) ?? folders?.home;
    if (target) go(target);
    if (typeof args.select === "string") setSelected([args.select]);
  });

  const ancestors = useMemo(() => {
    const out: FileNode[] = [];
    let cur = folder;
    while (cur) {
      out.unshift(cur);
      cur = files.find((f) => f.id === cur!.parentId);
    }
    return out;
  }, [folder, files]);

  const items = useMemo(() => {
    const list = results ?? files.filter((f) => f.parentId === folderId);
    const base = sortNodes(list);
    if (sort.key === "name" && sort.dir === 1) return base;
    const val = (f: FileNode) => (sort.key === "modified" ? f.modified : sort.key === "size" ? f.size : sort.key === "type" ? typeName(f) : f.name.toLowerCase());
    return [...base].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [results, files, folderId, sort]);

  const selectedNodes = items.filter((f) => selected.includes(f.id));
  useWindowTitle(win, results ? `Search results in ${folder?.name ?? ""}` : folder?.name ?? "Explorer");

  // Re-run a search when files change while results are showing.
  useEffect(() => {
    if (!results || !vfs || !folderId || !query.trim()) return;
    void vfs.search(query, folderId).then(setResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const fail = (e: unknown) => dialog.alert(e instanceof Error ? e.message : String(e), { title: "Explorer" });

  const open = (f: FileNode) => {
    if (f.kind === "folder") return go(f.id);
    const target = appForFile(f);
    if (target) openApp(target.appId, target.args);
    else void dialog.alert(`Connected doesn't have a program that opens "${f.name}".`, { title: "Open file" });
  };

  const newFolder = async () => {
    if (!vfs || !folderId || inRecycle) return;
    const name = await dialog.prompt("Name the new folder:", "New folder", { title: "New Folder" });
    if (name) await vfs.createFolder(folderId, name).then((n) => setSelected([n.id]), fail);
  };

  const rename = async (f: FileNode) => {
    if (!vfs) return;
    const name = await dialog.prompt("New name:", f.name, { title: "Rename" });
    if (!name || name === f.name) return;
    const oldExt = extensionOf(f.name);
    if (f.kind === "file" && oldExt && extensionOf(name) !== oldExt && !(await dialog.confirm("If you change a file name extension, the file might become unusable.\n\nAre you sure you want to change it?", { title: "Rename", okLabel: "Yes" }))) return;
    await vfs.rename(f.id, name).catch(fail);
  };

  const remove = async (nodes: FileNode[]) => {
    if (!vfs || !nodes.length) return;
    const forever = inRecycle;
    const what = nodes.length === 1 ? `"${nodes[0].name}"` : `these ${nodes.length} items`;
    const ok = await dialog.confirm(forever ? `Are you sure you want to permanently delete ${what}?` : `Are you sure you want to move ${what} to the Recycle Bin?`, { title: forever ? "Delete File" : "Delete", okLabel: "Yes" });
    if (!ok) return;
    for (const n of nodes) await (forever ? vfs.deleteForever(n.id) : vfs.trash(n.id)).catch(fail);
    setSelected([]);
  };

  const paste = async (into = folderId) => {
    if (!vfs || !into || !clipboard) return;
    for (const id of clipboard.ids) await (clipboard.mode === "copy" ? vfs.copy(id, into) : vfs.move(id, into)).catch(fail);
    if (clipboard.mode === "cut") fileClipboard.set(null);
  };

  const restore = async (nodes: FileNode[]) => {
    if (!vfs) return;
    for (const n of nodes) await vfs.restore(n.id).catch(fail);
    setSelected([]);
  };

  const emptyBin = async () => {
    if (!vfs) return;
    if (await dialog.confirm("Are you sure you want to permanently delete everything in the Recycle Bin?", { title: "Empty Recycle Bin", okLabel: "Yes" })) await vfs.emptyRecycleBin();
  };

  const runSearch = async (q: string) => {
    setQuery(q);
    if (!vfs || !folderId) return;
    if (!q.trim()) return setResults(null);
    setResults(await vfs.search(q, folderId));
  };

  // Keyboard shortcuts while focused.
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "a") (e.preventDefault(), setSelected(items.map((i) => i.id)));
      else if (mod && k === "c" && selected.length) fileClipboard.set({ ids: selected, mode: "copy" });
      else if (mod && k === "x" && selected.length && !inRecycle) fileClipboard.set({ ids: selected, mode: "cut" });
      else if (mod && k === "v") void paste();
      else if (mod && e.shiftKey && k === "n") (e.preventDefault(), void newFolder());
      else if (e.key === "Delete" && selectedNodes.length) void remove(selectedNodes);
      else if (e.key === "F2" && selectedNodes.length === 1) void rename(selectedNodes[0]);
      else if (e.key === "Enter" && selectedNodes.length === 1) open(selectedNodes[0]);
      else if (e.key === "Backspace" && folder?.parentId) go(folder.parentId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const itemMenu = (e: React.MouseEvent, f: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    const sel = selected.includes(f.id) ? selectedNodes : [f];
    if (!selected.includes(f.id)) setSelected([f.id]);
    const entries: MenuEntry[] = [];
    if (inRecycle) {
      entries.push({ label: "Restore", onSelect: () => restore(sel) }, "separator", { label: "Delete permanently", onSelect: () => remove(sel) });
    } else {
      entries.push({ label: "Open", onSelect: () => open(f), disabled: sel.length > 1 });
      if (f.kind === "file" && isImage(f)) {
        entries.push({ label: "Set as desktop background", onSelect: () => updateSettings({ wallpaper: { kind: "file", fileId: f.id } }) });
        entries.push({ label: "Edit in Paint", onSelect: () => openApp("paint", { fileId: f.id }) });
      }
      if (f.kind === "file" && /\.(zip|cbz)$/i.test(f.name)) entries.push({ label: "Extract All...", onSelect: () => openApp("archive", { fileId: f.id, extract: true }) });
      entries.push({ label: "Add to ZIP archive...", onSelect: () => openApp("archive", { addFiles: sel.map((n) => n.id) }) });
      if (f.kind === "file") entries.push({ label: "Send by email", onSelect: () => openApp("mail", { compose: { attach: sel.filter((n) => n.kind === "file").map((n) => n.id) } }) });
      entries.push(
        "separator",
        { label: "Cut", onSelect: () => fileClipboard.set({ ids: sel.map((n) => n.id), mode: "cut" }) },
        { label: "Copy", onSelect: () => fileClipboard.set({ ids: sel.map((n) => n.id), mode: "copy" }) },
      );
      if (f.kind === "folder") entries.push({ label: "Paste into folder", disabled: !clipboard, onSelect: () => paste(f.id) });
      entries.push("separator", { label: "Delete", onSelect: () => remove(sel) }, { label: "Rename", disabled: sel.length > 1 || Boolean(f.special), onSelect: () => rename(f) });
      if (results) entries.push("separator", { label: "Open file location", onSelect: () => f.parentId && (go(f.parentId), setSelected([f.id])) });
    }
    setMenu({ x: e.clientX, y: e.clientY, items: entries });
  };

  const backgroundMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelected([]);
    const entries: MenuEntry[] = inRecycle
      ? [{ label: "Empty Recycle Bin", onSelect: emptyBin, disabled: items.length === 0 }, { label: "Restore all items", onSelect: () => restore(items), disabled: items.length === 0 }]
      : [
          { label: "View: Details", onSelect: () => setView("details") },
          { label: "View: Large icons", onSelect: () => setView("icons") },
          "separator",
          { label: "Paste", disabled: !clipboard, onSelect: () => paste() },
          "separator",
          { label: "New folder", onSelect: newFolder },
          {
            label: "New text document",
            onSelect: async () => {
              const name = await dialog.prompt("Name the new document:", "New Text Document.txt", { title: "New Text Document" });
              if (name && vfs && folderId) await vfs.writeFile(folderId, /\.[a-z0-9]+$/i.test(name) ? name : `${name}.txt`, "").catch(fail);
            },
          },
        ];
    setMenu({ x: e.clientX, y: e.clientY, items: entries });
  };

  // Drag files onto a folder (in the list or the side bar) to move them.
  const dropOn = (targetId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("application/x-connected-files")) e.preventDefault();
    },
    onDrop: async (e: React.DragEvent) => {
      e.preventDefault();
      const ids: string[] = JSON.parse(e.dataTransfer.getData("application/x-connected-files") || "[]");
      if (!vfs) return;
      for (const id of ids) if (id !== targetId) await (targetId === folders?.recycle ? vfs.trash(id) : vfs.move(id, targetId)).catch(fail);
    },
  });

  const pendingDownloads = folder?.special === "downloads" ? downloads.filter((d) => d.status === "downloading" || d.status === "failed").slice(0, 5) : [];
  const totalSize = selectedNodes.reduce((s, n) => s + n.size, 0);

  return (
    <div className="explorer">
      <div className="toolbar">
        <button className="tool" disabled={hist.index <= 0} onClick={() => setHist((h) => ({ ...h, index: h.index - 1 }))} aria-label="Back" title="Back">
          <Icon name="back" size={16} />
        </button>
        <button className="tool" disabled={hist.index >= hist.stack.length - 1} onClick={() => setHist((h) => ({ ...h, index: h.index + 1 }))} aria-label="Forward" title="Forward">
          <Icon name="forward" size={16} />
        </button>
        <button className="tool" disabled={!folder?.parentId} onClick={() => folder?.parentId && go(folder.parentId)} aria-label="Up" title="Up one level">
          ↑
        </button>
        <div className="ex-crumbs" aria-label="Location">
          <span className="ex-crumb-root">Computer ›</span>
          {ancestors.map((a) => (
            <button key={a.id} className="ex-crumb" onClick={() => go(a.id)} {...dropOn(a.id)}>
              {a.name} ›
            </button>
          ))}
        </div>
        <input className="field ex-search" type="search" placeholder={`Search ${folder?.name ?? ""}`} value={query} onChange={(e) => void runSearch(e.target.value)} aria-label="Search files" />
      </div>
      <div className="toolbar ex-commands">
        {inRecycle ? (
          <>
            <button className="tool" onClick={emptyBin} disabled={items.length === 0}>
              Empty the Recycle Bin
            </button>
            <button className="tool" onClick={() => restore(selectedNodes.length ? selectedNodes : items)} disabled={items.length === 0}>
              {selectedNodes.length ? "Restore the selected items" : "Restore all items"}
            </button>
          </>
        ) : (
          <>
            <button className="tool" onClick={newFolder}>
              New folder
            </button>
            <button className="tool" disabled={!selected.length} onClick={() => fileClipboard.set({ ids: selected, mode: "cut" })}>
              Cut
            </button>
            <button className="tool" disabled={!selected.length} onClick={() => fileClipboard.set({ ids: selected, mode: "copy" })}>
              Copy
            </button>
            <button className="tool" disabled={!clipboard} onClick={() => paste()}>
              Paste
            </button>
            <button className="tool" disabled={selectedNodes.length !== 1 || Boolean(selectedNodes[0]?.special)} onClick={() => rename(selectedNodes[0])}>
              Rename
            </button>
            <button className="tool" disabled={!selected.length} onClick={() => remove(selectedNodes)}>
              Delete
            </button>
            {selectedNodes.length === 1 && isImage(selectedNodes[0]) && (
              <button className="tool" onClick={() => updateSettings({ wallpaper: { kind: "file", fileId: selectedNodes[0].id } })}>
                Set as desktop background
              </button>
            )}
          </>
        )}
        <span style={{ flex: 1 }} />
        <button className="tool" aria-pressed={view === "details"} onClick={() => setView("details")}>
          Details
        </button>
        <button className="tool" aria-pressed={view === "icons"} onClick={() => setView("icons")}>
          Icons
        </button>
      </div>
      <div className="ex-main">
        <nav className="ex-nav" aria-label="Folders">
          <div className="ex-nav-head">Favorites</div>
          {folders &&
            NAV.map((n) => (
              <button key={n.key} className={folderId === folders[n.key] ? "on" : ""} onClick={() => go(folders[n.key])} {...dropOn(folders[n.key])}>
                <Icon name={iconForFile({ kind: "folder", special: n.key, name: n.label })} size={16} /> {n.label}
              </button>
            ))}
          <div className="ex-nav-head">Computer</div>
          {folders && (
            <>
              <button className={folderId === folders.home ? "on" : ""} onClick={() => go(folders.home)} {...dropOn(folders.home)}>
                <Icon name="user" size={16} /> {sys.user?.name}
              </button>
              <button className={folderId === folders.recycle ? "on" : ""} onClick={() => go(folders.recycle)} {...dropOn(folders.recycle)}>
                <Icon name="recycle" size={16} /> Recycle Bin
              </button>
            </>
          )}
        </nav>
        <div className="ex-content" onContextMenu={backgroundMenu} onMouseDown={(e) => e.target === e.currentTarget && setSelected([])}>
          {pendingDownloads.length > 0 && (
            <div className="ex-downloads">
              {pendingDownloads.map((d) => (
                <div key={d.id} className="ex-download">
                  <Icon name="download" size={16} />
                  <span>{d.filename}</span>
                  {d.status === "downloading" ? (
                    <>
                      <progress max={d.total || 1} value={d.received} />
                      <small>
                        {formatSize(d.received)}
                        {d.total ? ` of ${formatSize(d.total)}` : ""}
                      </small>
                      <button className="link-btn" onClick={() => cancelDownload(d.id)}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <small className="error-text">Failed{d.error ? `: ${d.error}` : ""}</small>
                      <button className="link-btn" onClick={() => retryDownload(d.id)}>
                        Retry
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {results && <div className="ex-search-note">{results.length} result{results.length === 1 ? "" : "s"} for &quot;{query}&quot;</div>}
          {view === "details" ? (
            <table className="ex-table">
              <thead>
                <tr>
                  {(
                    [
                      ["name", "Name"],
                      ["modified", inRecycle ? "Date deleted" : "Date modified"],
                      ["type", "Type"],
                      ["size", "Size"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }))} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                      {label}
                      {sort.key === key ? (sort.dir === 1 ? " ▲" : " ▼") : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((f) => (
                  <tr
                    key={f.id}
                    className={`${selected.includes(f.id) ? "selected" : ""}${clipboard?.mode === "cut" && clipboard.ids.includes(f.id) ? " cut" : ""}`}
                    onClick={(e) => setSelected((s) => (e.ctrlKey || e.metaKey ? (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]) : [f.id]))}
                    onDoubleClick={() => !inRecycle && open(f)}
                    onContextMenu={(e) => itemMenu(e, f)}
                    draggable={!f.special}
                    onDragStart={(e) => e.dataTransfer.setData("application/x-connected-files", JSON.stringify(selected.includes(f.id) ? selected : [f.id]))}
                    {...(f.kind === "folder" ? dropOn(f.id) : {})}
                    data-name={f.name}
                  >
                    <td>
                      <Icon name={iconForFile(f)} size={16} /> {f.name}
                    </td>
                    <td>{formatDateTime(Date.parse(inRecycle && f.trashed ? f.trashed.at : f.modified), computer.timeZone)}</td>
                    <td>{typeName(f)}</td>
                    <td className="num">{f.kind === "file" ? formatSize(f.size) : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="ex-icons">
              {items.map((f) => (
                <button
                  key={f.id}
                  className={`ex-icon${selected.includes(f.id) ? " selected" : ""}${clipboard?.mode === "cut" && clipboard.ids.includes(f.id) ? " cut" : ""}`}
                  onClick={(e) => setSelected((s) => (e.ctrlKey || e.metaKey ? (s.includes(f.id) ? s.filter((x) => x !== f.id) : [...s, f.id]) : [f.id]))}
                  onDoubleClick={() => !inRecycle && open(f)}
                  onContextMenu={(e) => itemMenu(e, f)}
                  draggable={!f.special}
                  onDragStart={(e) => e.dataTransfer.setData("application/x-connected-files", JSON.stringify(selected.includes(f.id) ? selected : [f.id]))}
                  {...(f.kind === "folder" ? dropOn(f.id) : {})}
                  data-name={f.name}
                >
                  {isImage(f) ? <Thumb f={f} /> : <Icon name={iconForFile(f)} size={48} />}
                  <span>{f.name}</span>
                </button>
              ))}
            </div>
          )}
          {items.length === 0 && <div className="empty">{results ? "No items match your search." : inRecycle ? "The Recycle Bin is empty." : "This folder is empty."}</div>}
        </div>
      </div>
      <div className="statusbar">
        <span>
          {items.length} item{items.length === 1 ? "" : "s"}
        </span>
        {selectedNodes.length > 0 && (
          <span>
            {selectedNodes.length} selected{totalSize ? ` · ${formatSize(totalSize)}` : ""}
          </span>
        )}
        {selectedNodes.length === 1 && selectedNodes[0].source && <span>Downloaded from {selectedNodes[0].source}</span>}
        {clipboard && <span>{clipboard.ids.length} item(s) ready to paste</span>}
      </div>
      {menu && <ContextMenu {...menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

function Thumb({ f }: { f: FileNode }) {
  const { vfs } = useSystem();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!vfs) return;
    let alive = true;
    let revoke = () => {};
    vfs.openUrl(f.id).then(
      (r) => {
        if (!alive) return r.revoke();
        revoke = r.revoke;
        setUrl(r.url);
      },
      () => {},
    );
    return () => {
      alive = false;
      revoke();
    };
  }, [vfs, f.id, f.modified]);
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" className="ex-thumb" /> : <Icon name="file-image" size={48} />;
}
