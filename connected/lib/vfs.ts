// The virtual file system every app shares.
//
// Each local account gets a home folder (C:\Users\<name>) with the usual
// libraries. File contents are either a stored blob (anything the user made,
// downloaded or saved) or a reference to a sample file that ships with the
// computer, like Windows 7's Sample Pictures. Deleting moves things to the
// Recycle Bin until it is emptied.

import { newId } from "./ids";
import type { Store } from "./storage/types";
import { iso } from "./time";

export type SpecialFolder = "home" | "desktop" | "documents" | "downloads" | "pictures" | "music" | "videos" | "recycle";

export type FileContent = { kind: "blob"; blobId: string } | { kind: "url"; url: string };

export interface FileNode {
  id: string;
  owner: string;
  parentId: string | null;
  name: string;
  kind: "folder" | "file";
  mime?: string;
  size: number;
  content?: FileContent;
  /** Simulated times. */
  created: string;
  modified: string;
  special?: SpecialFolder;
  trashed?: { from: string; at: string };
  origin: "user" | "system";
  /** Where a download came from. */
  source?: string;
}

export interface SampleFile {
  folder: Exclude<SpecialFolder, "home" | "recycle">;
  subfolder?: string;
  name: string;
  url: string;
  mime: string;
  size: number;
}

const COLLECTION = "files";

const FOLDER_NAMES: Record<Exclude<SpecialFolder, "home">, string> = {
  desktop: "Desktop",
  documents: "My Documents",
  downloads: "Downloads",
  pictures: "My Pictures",
  music: "My Music",
  videos: "My Videos",
  recycle: "Recycle Bin",
};

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  webm: "video/webm",
  mp4: "video/mp4",
  txt: "text/plain",
  log: "text/plain",
  md: "text/markdown",
  html: "text/html",
  htm: "text/html",
  json: "application/json",
  pdf: "application/pdf",
  zip: "application/zip",
  cbz: "application/vnd.comicbook+zip",
  url: "application/internet-shortcut",
};

export function mimeFor(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  return MIME[ext] ?? "application/octet-stream";
}

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

const BAD_CHARS = /[\\/:*?"<>|]/;

export function validateName(name: string): string | null {
  const n = name.trim();
  if (!n) return "A file name can't be empty.";
  if (n === "." || n === "..") return "That name is reserved.";
  if (BAD_CHARS.test(n)) return 'A file name can\'t contain any of the following characters: \\ / : * ? " < > |';
  if (n.length > 200) return "That name is too long.";
  return null;
}

export class VfsError extends Error {}

export class Vfs {
  private specials: Partial<Record<SpecialFolder, string>> = {};

  constructor(
    private store: Store,
    readonly owner: string,
    private now: () => number,
    private homeName: string,
  ) {}

  private async all(): Promise<FileNode[]> {
    return (await this.store.list<FileNode>(COLLECTION)).filter((f) => f.owner === this.owner);
  }

  /** Creates the home folder and libraries on first use, plus the sample files. */
  async ensureHome(samples: SampleFile[] = []): Promise<Record<SpecialFolder, string>> {
    const nodes = await this.all();
    const at = iso(this.now());
    let home = nodes.find((n) => n.special === "home");
    const fresh = !home;
    if (!home) {
      home = this.folderNode(null, this.homeName, at, "home");
      await this.store.put(COLLECTION, home);
    }
    this.specials.home = home.id;
    for (const key of Object.keys(FOLDER_NAMES) as Exclude<SpecialFolder, "home">[]) {
      let f = nodes.find((n) => n.special === key);
      if (!f) {
        f = this.folderNode(home.id, FOLDER_NAMES[key], at, key);
        await this.store.put(COLLECTION, f);
      }
      this.specials[key] = f.id;
    }
    if (fresh) {
      for (const s of samples) {
        let parent = this.specials[s.folder]!;
        if (s.subfolder) {
          const existing = (await this.list(parent)).find((n) => n.kind === "folder" && n.name === s.subfolder);
          parent = existing ? existing.id : (await this.createFolder(parent, s.subfolder, "system")).id;
        }
        const node: FileNode = {
          id: newId("file"),
          owner: this.owner,
          parentId: parent,
          name: s.name,
          kind: "file",
          mime: s.mime,
          size: s.size,
          content: { kind: "url", url: s.url },
          created: at,
          modified: at,
          origin: "system",
        };
        await this.store.put(COLLECTION, node);
      }
    }
    return this.specials as Record<SpecialFolder, string>;
  }

  private folderNode(parentId: string | null, name: string, at: string, special?: SpecialFolder, origin: "user" | "system" = "system"): FileNode {
    return { id: newId("file"), owner: this.owner, parentId, name, kind: "folder", size: 0, created: at, modified: at, special, origin };
  }

  folder(which: SpecialFolder): string {
    const id = this.specials[which];
    if (!id) throw new VfsError("The file system isn't ready yet.");
    return id;
  }

  async get(id: string): Promise<FileNode | undefined> {
    const n = await this.store.get<FileNode>(COLLECTION, id);
    return n && n.owner === this.owner ? n : undefined;
  }

  async mustGet(id: string): Promise<FileNode> {
    const n = await this.get(id);
    if (!n) throw new VfsError("That item no longer exists.");
    return n;
  }

  /** Children, folders first, then by name. */
  async list(parentId: string): Promise<FileNode[]> {
    return (await this.all())
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, undefined, { numeric: true }) : a.kind === "folder" ? -1 : 1));
  }

  /** "C:\Users\Sam\Downloads\photo.png" */
  async path(id: string): Promise<string> {
    const parts: string[] = [];
    let cur = await this.get(id);
    while (cur) {
      parts.unshift(cur.name);
      cur = cur.parentId ? await this.get(cur.parentId) : undefined;
    }
    return ["C:", "Users", ...parts].join("\\");
  }

  async ancestors(id: string): Promise<FileNode[]> {
    const out: FileNode[] = [];
    let cur = await this.get(id);
    while (cur) {
      out.unshift(cur);
      cur = cur.parentId ? await this.get(cur.parentId) : undefined;
    }
    return out;
  }

  async isInside(id: string, ancestorId: string): Promise<boolean> {
    let cur = await this.get(id);
    while (cur) {
      if (cur.id === ancestorId) return true;
      cur = cur.parentId ? await this.get(cur.parentId) : undefined;
    }
    return false;
  }

  /** "photo.png", or "photo (2).png" if taken. */
  async uniqueName(parentId: string, name: string, ignoreId?: string): Promise<string> {
    const taken = new Set((await this.list(parentId)).filter((n) => n.id !== ignoreId).map((n) => n.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    const i = name.lastIndexOf(".");
    const base = i > 0 ? name.slice(0, i) : name;
    const ext = i > 0 ? name.slice(i) : "";
    for (let k = 2; ; k++) {
      const candidate = `${base} (${k})${ext}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
  }

  async createFolder(parentId: string, name: string, origin: "user" | "system" = "user"): Promise<FileNode> {
    const err = validateName(name);
    if (err) throw new VfsError(err);
    await this.mustGet(parentId);
    const node = this.folderNode(parentId, await this.uniqueName(parentId, name.trim()), iso(this.now()), undefined, origin);
    await this.store.put(COLLECTION, node);
    return node;
  }

  async writeFile(parentId: string, name: string, data: Blob | string, opts: { mime?: string; source?: string } = {}): Promise<FileNode> {
    const err = validateName(name);
    if (err) throw new VfsError(err);
    await this.mustGet(parentId);
    const mime = opts.mime ?? mimeFor(name);
    const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
    const blobId = newId("blob");
    await this.store.putBlob(blobId, blob);
    const at = iso(this.now());
    const node: FileNode = {
      id: newId("file"),
      owner: this.owner,
      parentId,
      name: await this.uniqueName(parentId, name.trim()),
      kind: "file",
      mime,
      size: blob.size,
      content: { kind: "blob", blobId },
      created: at,
      modified: at,
      origin: "user",
      source: opts.source,
    };
    await this.store.put(COLLECTION, node);
    return node;
  }

  /** Replaces a file's contents (Save in Notepad or Paint). */
  async updateFile(id: string, data: Blob | string): Promise<FileNode> {
    const node = await this.mustGet(id);
    if (node.kind !== "file") throw new VfsError("Only files have contents.");
    const blob = typeof data === "string" ? new Blob([data], { type: node.mime }) : data;
    const blobId = node.content?.kind === "blob" ? node.content.blobId : newId("blob");
    await this.store.putBlob(blobId, blob);
    const updated: FileNode = { ...node, size: blob.size, content: { kind: "blob", blobId }, modified: iso(this.now()), origin: "user" };
    await this.store.put(COLLECTION, updated);
    return updated;
  }

  async readBlob(id: string): Promise<Blob> {
    const node = await this.mustGet(id);
    if (node.kind !== "file" || !node.content) throw new VfsError("That item has no contents.");
    if (node.content.kind === "url") {
      const res = await fetch(node.content.url);
      if (!res.ok) throw new VfsError(`Couldn't read ${node.name}.`);
      return res.blob();
    }
    const blob = await this.store.getBlob(node.content.blobId);
    if (!blob) throw new VfsError(`${node.name} is damaged or missing.`);
    return blob;
  }

  async readText(id: string): Promise<string> {
    return (await this.readBlob(id)).text();
  }

  /** A URL media elements can play. Revoke blob: URLs when done. */
  async openUrl(id: string): Promise<{ url: string; revoke: () => void }> {
    const node = await this.mustGet(id);
    if (node.content?.kind === "url") return { url: node.content.url, revoke: () => {} };
    const url = URL.createObjectURL(await this.readBlob(id));
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }

  async rename(id: string, name: string): Promise<FileNode> {
    const node = await this.mustGet(id);
    if (node.special) throw new VfsError(`${node.name} is a system folder and can't be renamed.`);
    const err = validateName(name);
    if (err) throw new VfsError(err);
    const trimmed = name.trim();
    const clash = (await this.list(node.parentId!)).some((n) => n.id !== id && n.name.toLowerCase() === trimmed.toLowerCase());
    if (clash) throw new VfsError(`There is already a file with the name "${trimmed}" in this location.`);
    // Keep the old type when the new extension is unknown.
    const guessed = mimeFor(trimmed);
    const mime = node.kind === "file" && guessed !== "application/octet-stream" ? guessed : node.mime;
    const updated = { ...node, name: trimmed, mime, modified: iso(this.now()) };
    await this.store.put(COLLECTION, updated);
    return updated;
  }

  async move(id: string, parentId: string): Promise<FileNode> {
    const node = await this.mustGet(id);
    if (node.special) throw new VfsError(`${node.name} is a system folder and can't be moved.`);
    if (node.parentId === parentId) return node;
    if (await this.isInside(parentId, id)) throw new VfsError("The destination folder is a subfolder of the source folder.");
    await this.mustGet(parentId);
    const updated = { ...node, parentId, name: await this.uniqueName(parentId, node.name) };
    await this.store.put(COLLECTION, updated);
    return updated;
  }

  async copy(id: string, parentId: string): Promise<FileNode> {
    const node = await this.mustGet(id);
    if (node.kind === "folder" && (await this.isInside(parentId, id))) throw new VfsError("The destination folder is a subfolder of the source folder.");
    const at = iso(this.now());
    const name = await this.uniqueName(parentId, node.parentId === parentId ? copyName(node.name) : node.name);
    if (node.kind === "file") {
      let content = node.content;
      if (content?.kind === "blob") {
        const blob = await this.store.getBlob(content.blobId);
        const blobId = newId("blob");
        if (blob) await this.store.putBlob(blobId, blob);
        content = { kind: "blob", blobId };
      }
      const copy: FileNode = { ...node, id: newId("file"), parentId, name, content, created: at, modified: at, special: undefined, origin: "user", trashed: undefined };
      await this.store.put(COLLECTION, copy);
      return copy;
    }
    const folder = this.folderNode(parentId, name, at);
    await this.store.put(COLLECTION, folder);
    for (const child of await this.list(id)) await this.copy(child.id, folder.id);
    return folder;
  }

  async trash(id: string): Promise<void> {
    const node = await this.mustGet(id);
    if (node.special) throw new VfsError(`${node.name} is a system folder and can't be deleted.`);
    const recycle = this.folder("recycle");
    if (node.parentId === recycle) return this.deleteForever(id);
    await this.store.put(COLLECTION, {
      ...node,
      parentId: recycle,
      name: await this.uniqueName(recycle, node.name),
      trashed: { from: node.parentId!, at: iso(this.now()) },
    });
  }

  async restore(id: string): Promise<FileNode> {
    const node = await this.mustGet(id);
    if (!node.trashed) throw new VfsError("That item isn't in the Recycle Bin.");
    const target = (await this.get(node.trashed.from)) ? node.trashed.from : this.folder("desktop");
    const restored = { ...node, parentId: target, name: await this.uniqueName(target, node.name), trashed: undefined };
    await this.store.put(COLLECTION, restored);
    return restored;
  }

  async deleteForever(id: string): Promise<void> {
    const node = await this.mustGet(id);
    if (node.special) throw new VfsError(`${node.name} is a system folder and can't be deleted.`);
    if (node.kind === "folder") for (const child of await this.list(id)) await this.deleteForever(child.id);
    if (node.content?.kind === "blob") await this.store.deleteBlob(node.content.blobId);
    await this.store.delete(COLLECTION, id);
  }

  async emptyRecycleBin(): Promise<number> {
    const items = await this.list(this.folder("recycle"));
    for (const item of items) await this.deleteForever(item.id);
    return items.length;
  }

  /** Case-insensitive name search below a folder (the whole home by default), skipping the Recycle Bin. */
  async search(query: string, rootId: string = this.folder("home")): Promise<FileNode[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const recycle = this.specials.recycle;
    const out: FileNode[] = [];
    for (const n of await this.all()) {
      if (n.id === rootId || n.special === "recycle" || !n.name.toLowerCase().includes(q)) continue;
      if (recycle && (await this.isInside(n.id, recycle))) continue;
      if (await this.isInside(n.id, rootId)) out.push(n);
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function copyName(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? `${name.slice(0, i)} - Copy${name.slice(i)}` : `${name} - Copy`;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
