"use client";

// Archive Manager: look inside ZIP files, extract them, and make new ones
// from files and folders on your computer.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useDialog } from "@/components/desktop/Dialogs";
import { Icon } from "@/components/desktop/Icon";
import { readZip, writeZip, type ZipEntry } from "@/lib/zip";
import { formatSize, mimeFor, type FileNode, type Vfs } from "@/lib/vfs";
import { appForFile, iconForFile } from "../catalog";
import { FileDialog, useArgs, useFiles, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

/** Writes ZIP entries into `folderId`, recreating their sub-folders. */
async function extractEntries(vfs: Vfs, entries: ZipEntry[], folderId: string): Promise<FileNode[]> {
  const folderFor = new Map<string, string>([["", folderId]]);
  const ensure = async (path: string): Promise<string> => {
    if (folderFor.has(path)) return folderFor.get(path)!;
    const i = path.lastIndexOf("/");
    const parent = await ensure(i >= 0 ? path.slice(0, i) : "");
    const name = path.slice(i + 1);
    const existing = (await vfs.list(parent)).find((n) => n.kind === "folder" && n.name === name);
    const id = existing ? existing.id : (await vfs.createFolder(parent, name)).id;
    folderFor.set(path, id);
    return id;
  };
  const out: FileNode[] = [];
  for (const e of entries) {
    const clean = e.name.replace(/\\/g, "/").split("/").filter((p) => p && p !== "." && p !== "..").join("/");
    if (!clean) continue;
    if (e.isDirectory) {
      await ensure(clean);
      continue;
    }
    const i = clean.lastIndexOf("/");
    const parent = await ensure(i >= 0 ? clean.slice(0, i) : "");
    const name = clean.slice(i + 1);
    const data = await e.read();
    out.push(await vfs.writeFile(parent, name, new Blob([data as BlobPart], { type: mimeFor(name) })));
  }
  return out;
}

/** Collects files (recursing into folders) as ZIP entries. */
async function gather(vfs: Vfs, ids: string[]): Promise<{ name: string; data: Uint8Array; modified: Date }[]> {
  const out: { name: string; data: Uint8Array; modified: Date }[] = [];
  const walk = async (node: FileNode, prefix: string) => {
    if (node.kind === "folder") {
      for (const child of await vfs.list(node.id)) await walk(child, `${prefix}${node.name}/`);
      return;
    }
    out.push({ name: `${prefix}${node.name}`, data: new Uint8Array(await (await vfs.readBlob(node.id)).arrayBuffer()), modified: new Date(node.modified) });
  };
  for (const id of ids) await walk(await vfs.mustGet(id), "");
  return out;
}

export default function Archive({ win }: AppProps) {
  const { vfs, folders, openApp, notify } = useSystem();
  const dialog = useDialog();
  const files = useFiles();
  const [zipId, setZipId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ZipEntry[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [making, setMaking] = useState<string[] | null>(null);
  const [zipName, setZipName] = useState("Archive.zip");
  const [picker, setPicker] = useState<"open" | "add" | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const zip = files.find((f) => f.id === zipId);
  useWindowTitle(win, making ? "New archive - Archive Manager" : zip ? `${zip.name} - Archive Manager` : "Archive Manager");

  const fail = (e: unknown) => dialog.alert(e instanceof Error ? e.message : String(e), { title: "Archive Manager" });

  const extract = async (id = zipId, list = entries, only?: string[]) => {
    if (!vfs || !id) return;
    const node = await vfs.get(id);
    if (!node?.parentId) return;
    const base = node.name.replace(/\.(zip|cbz)$/i, "");
    const name = await dialog.prompt("Extract the files into a new folder named:", base, { title: "Extract", okLabel: "Extract" });
    if (!name) return;
    setBusy("Extracting...");
    try {
      const target = await vfs.createFolder(node.parentId, name);
      const chosen = only ? list.filter((e) => only.includes(e.name)) : list;
      const written = await extractEntries(vfs, chosen, target.id);
      notify({ title: "Extraction complete", body: `${written.length} file${written.length === 1 ? "" : "s"} extracted to ${target.name}.`, icon: "archive" });
      openApp("explorer", { folderId: target.id });
    } catch (e) {
      await fail(e);
    } finally {
      setBusy(null);
    }
  };

  const open = async (id: string, extractNow = false) => {
    if (!vfs) return;
    try {
      const bytes = new Uint8Array(await (await vfs.readBlob(id)).arrayBuffer());
      const list = readZip(bytes);
      setZipId(id);
      setEntries(list);
      setSelected([]);
      setMaking(null);
      if (extractNow) await extract(id, list);
    } catch (e) {
      await fail(e);
    }
  };

  useArgs(win, (args) => {
    if (typeof args.fileId === "string") void open(args.fileId, Boolean(args.extract));
    if (Array.isArray(args.addFiles)) {
      const ids = args.addFiles as string[];
      setMaking(ids);
      const first = files.find((f) => f.id === ids[0]);
      setZipName(`${first ? first.name.replace(/\.[a-z0-9]+$/i, "") : "Archive"}${ids.length > 1 ? " and more" : ""}.zip`);
    }
  });

  const openEntry = async (e: ZipEntry) => {
    if (!vfs || !folders || e.isDirectory) return;
    const name = e.name.split("/").pop()!;
    const node = await vfs.writeFile(folders.downloads, name, new Blob([(await e.read()) as BlobPart], { type: mimeFor(name) }), { source: zip ? `Extracted from ${zip.name}` : undefined });
    const t = appForFile(node);
    if (t) openApp(t.appId, t.args);
    else notify({ title: "Extracted to Downloads", body: node.name, icon: "archive" });
  };

  const create = async () => {
    if (!vfs || !making?.length) return;
    const first = files.find((f) => f.id === making[0]);
    const dest = first?.parentId ?? folders?.documents;
    if (!dest) return;
    const name = /\.zip$/i.test(zipName) ? zipName : `${zipName}.zip`;
    setBusy("Compressing...");
    try {
      const data = await writeZip(await gather(vfs, making));
      const node = await vfs.writeFile(dest, name, new Blob([data as BlobPart], { type: "application/zip" }), { mime: "application/zip" });
      notify({ title: "Archive created", body: node.name, icon: "archive" });
      openApp("explorer", { folderId: dest, select: node.id });
      await open(node.id);
    } catch (e) {
      await fail(e);
    } finally {
      setBusy(null);
    }
  };

  const totalSize = entries.reduce((s, e) => s + e.size, 0);
  const totalPacked = entries.reduce((s, e) => s + e.compressedSize, 0);

  return (
    <div className="archive">
      <div className="toolbar">
        <button className="tool" onClick={() => setPicker("open")}>
          Open archive...
        </button>
        <button className="tool" onClick={() => (setMaking([]), setZipName("Archive.zip"))}>
          New archive
        </button>
        {zip && !making && (
          <>
            <button className="tool" onClick={() => extract()} disabled={!entries.length || Boolean(busy)}>
              Extract all...
            </button>
            <button className="tool" onClick={() => extract(zipId, entries, selected)} disabled={!selected.length || Boolean(busy)}>
              Extract selected...
            </button>
          </>
        )}
        <span style={{ flex: 1 }} />
        {busy && <span className="muted">{busy}</span>}
      </div>
      {making ? (
        <div className="ar-make">
          <h2>Make a new ZIP archive</h2>
          <ul className="ar-list">
            {making.map((id) => {
              const f = files.find((x) => x.id === id);
              return f ? (
                <li key={id}>
                  <Icon name={iconForFile(f)} size={16} /> {f.name} <span className="muted">{f.kind === "folder" ? "folder" : formatSize(f.size)}</span>
                  <button className="link-btn" onClick={() => setMaking(making.filter((x) => x !== id))}>
                    Remove
                  </button>
                </li>
              ) : null;
            })}
            {making.length === 0 && <li className="muted">No files yet.</li>}
          </ul>
          <div className="st-row">
            <button className="btn" onClick={() => setPicker("add")}>
              Add files...
            </button>
            <label>
              Archive name <input className="field" value={zipName} onChange={(e) => setZipName(e.target.value)} aria-label="Archive name" />
            </label>
            <button className="btn primary" onClick={create} disabled={!making.length || !zipName.trim() || Boolean(busy)}>
              Create archive
            </button>
          </div>
          <p className="muted">The archive is saved in the same folder as the first file.</p>
        </div>
      ) : zip ? (
        <div className="scroll">
          <table className="ex-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Packed</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.name}
                  className={selected.includes(e.name) ? "selected" : ""}
                  onClick={(ev) => setSelected((s) => (ev.ctrlKey || ev.metaKey ? (s.includes(e.name) ? s.filter((x) => x !== e.name) : [...s, e.name]) : [e.name]))}
                  onDoubleClick={() => openEntry(e)}
                >
                  <td>
                    <Icon name={e.isDirectory ? "folder" : iconForFile({ kind: "file", name: e.name, mime: mimeFor(e.name) })} size={16} /> {e.name}
                  </td>
                  <td className="num">{e.isDirectory ? "" : formatSize(e.size)}</td>
                  <td className="num">{e.isDirectory ? "" : formatSize(e.compressedSize)}</td>
                  <td>{e.modified.toLocaleDateString("en-US")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {entries.length === 0 && <div className="empty">This archive is empty.</div>}
        </div>
      ) : (
        <div className="empty">
          <p>Open a ZIP file to see what&apos;s inside, or make a new one.</p>
          <p className="muted">Tip: in Explorer, right-click files and choose &quot;Add to ZIP archive...&quot;.</p>
        </div>
      )}
      <div className="statusbar">
        {zip && !making && (
          <span>
            {entries.filter((e) => !e.isDirectory).length} files · {formatSize(totalSize)} · packed to {formatSize(totalPacked)}
          </span>
        )}
        {zip && !making && <span>Double-click a file to open it.</span>}
      </div>
      {picker && (
        <FileDialog
          mode="open"
          title={picker === "open" ? "Open archive" : "Add files"}
          multiple={picker === "add"}
          startIn={picker === "open" ? "downloads" : "documents"}
          accept={picker === "open" ? (f) => /\.(zip|cbz)$/i.test(f.name) : undefined}
          onClose={(r) => {
            const mode = picker;
            setPicker(null);
            if (!r?.files.length) return;
            if (mode === "open") void open(r.files[0].id);
            else setMaking((m) => [...(m ?? []), ...r.files.map((f) => f.id).filter((id) => !(m ?? []).includes(id))]);
          }}
        />
      )}
    </div>
  );
}
