import { Emitter, type ChangeEvent, type Store, type StoredDoc } from "./types";

/** In-memory Store for tests and server rendering. Values are cloned like IndexedDB would. */
export class MemoryStore implements Store {
  private docs = new Map<string, Map<string, unknown>>();
  private blobs = new Map<string, Blob>();
  private kv = new Map<string, unknown>();
  private emitter = new Emitter();

  private col(name: string) {
    let c = this.docs.get(name);
    if (!c) this.docs.set(name, (c = new Map()));
    return c;
  }

  async get<T extends StoredDoc>(collection: string, id: string) {
    const v = this.col(collection).get(id);
    return v === undefined ? undefined : (structuredClone(v) as T);
  }
  async put<T extends StoredDoc>(collection: string, doc: T) {
    this.col(collection).set(doc.id, structuredClone(doc));
    this.emitter.emit({ kind: "doc", collection, key: doc.id });
  }
  async delete(collection: string, id: string) {
    this.col(collection).delete(id);
    this.emitter.emit({ kind: "doc", collection, key: id });
  }
  async list<T extends StoredDoc>(collection: string) {
    return [...this.col(collection).values()].map((v) => structuredClone(v) as T);
  }

  async getBlob(id: string) {
    return this.blobs.get(id);
  }
  async putBlob(id: string, blob: Blob) {
    this.blobs.set(id, blob);
    this.emitter.emit({ kind: "blob", key: id });
  }
  async deleteBlob(id: string) {
    this.blobs.delete(id);
    this.emitter.emit({ kind: "blob", key: id });
  }

  async kvGet<T>(key: string) {
    const v = this.kv.get(key);
    return v === undefined ? undefined : (structuredClone(v) as T);
  }
  async kvSet<T>(key: string, value: T) {
    this.kv.set(key, structuredClone(value));
    this.emitter.emit({ kind: "kv", key });
  }

  subscribe(listener: (e: ChangeEvent) => void) {
    return this.emitter.on(listener);
  }
}
