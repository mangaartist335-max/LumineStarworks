import { Emitter, type ChangeEvent, type Store, type StoredDoc } from "./types";

// IndexedDB-backed Store: the computer's hard drive. One database per
// browser profile; other tabs running the desktop hear about writes through
// a BroadcastChannel, so two windows of the same computer stay in step.

const DB_NAME = "connected-era";
const DB_VERSION = 1;
const CHANNEL = "connected-era-store";

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });
}

export async function openIdbStore(name = DB_NAME): Promise<IdbStore> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains("docs")) {
        const docs = d.createObjectStore("docs", { keyPath: ["collection", "id"] });
        docs.createIndex("collection", "collection");
      }
      if (!d.objectStoreNames.contains("blobs")) d.createObjectStore("blobs");
      if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("The desktop's storage is in use by an older tab. Close other tabs and reload."));
  });
  return new IdbStore(db);
}

export class IdbStore implements Store {
  private emitter = new Emitter();
  private channel: BroadcastChannel | null = null;

  constructor(private db: IDBDatabase) {
    // Let "Reset this computer" (which deletes the database) go through.
    db.onversionchange = () => db.close();
    if (typeof BroadcastChannel !== "undefined") {
      this.channel = new BroadcastChannel(CHANNEL);
      this.channel.onmessage = (m: MessageEvent<ChangeEvent>) => this.emitter.emit(m.data);
    }
  }

  private changed(e: ChangeEvent) {
    this.emitter.emit(e);
    this.channel?.postMessage(e);
  }

  async get<T extends StoredDoc>(collection: string, id: string) {
    const tx = this.db.transaction("docs", "readonly");
    const row = await request<{ doc: T } | undefined>(tx.objectStore("docs").get([collection, id]));
    return row?.doc;
  }
  async put<T extends StoredDoc>(collection: string, doc: T) {
    const tx = this.db.transaction("docs", "readwrite");
    tx.objectStore("docs").put({ collection, id: doc.id, doc });
    await done(tx);
    this.changed({ kind: "doc", collection, key: doc.id });
  }
  async delete(collection: string, id: string) {
    const tx = this.db.transaction("docs", "readwrite");
    tx.objectStore("docs").delete([collection, id]);
    await done(tx);
    this.changed({ kind: "doc", collection, key: id });
  }
  async list<T extends StoredDoc>(collection: string) {
    const tx = this.db.transaction("docs", "readonly");
    const rows = await request<{ doc: T }[]>(tx.objectStore("docs").index("collection").getAll(collection));
    return rows.map((r) => r.doc);
  }

  async getBlob(id: string) {
    const tx = this.db.transaction("blobs", "readonly");
    return request<Blob | undefined>(tx.objectStore("blobs").get(id));
  }
  async putBlob(id: string, blob: Blob) {
    const tx = this.db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put(blob, id);
    await done(tx);
    this.changed({ kind: "blob", key: id });
  }
  async deleteBlob(id: string) {
    const tx = this.db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").delete(id);
    await done(tx);
    this.changed({ kind: "blob", key: id });
  }

  async kvGet<T>(key: string) {
    const tx = this.db.transaction("kv", "readonly");
    return request<T | undefined>(tx.objectStore("kv").get(key));
  }
  async kvSet<T>(key: string, value: T) {
    const tx = this.db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    await done(tx);
    this.changed({ kind: "kv", key });
  }

  subscribe(listener: (e: ChangeEvent) => void) {
    return this.emitter.on(listener);
  }
}

/** Erases the whole computer: every account, file and setting. */
export function eraseIdbStore(name = DB_NAME): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
