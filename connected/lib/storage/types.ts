// Storage interface shared by every app.
//
// Records live in named collections; file contents live as blobs; small
// settings live in a key-value area. The browser build uses IndexedDB
// (lib/storage/idb.ts) so everything survives restarts; tests use the
// in-memory version (lib/storage/memory.ts). User-created records always
// carry `origin: "user"`, which keeps them apart from authored archive
// content (which ships with the code and is never written here).

export interface StoredDoc {
  id: string;
}

export interface ChangeEvent {
  kind: "doc" | "blob" | "kv";
  collection?: string;
  key: string;
}

export interface Store {
  get<T extends StoredDoc>(collection: string, id: string): Promise<T | undefined>;
  put<T extends StoredDoc>(collection: string, doc: T): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  list<T extends StoredDoc>(collection: string): Promise<T[]>;

  getBlob(id: string): Promise<Blob | undefined>;
  putBlob(id: string, blob: Blob): Promise<void>;
  deleteBlob(id: string): Promise<void>;

  kvGet<T>(key: string): Promise<T | undefined>;
  kvSet<T>(key: string, value: T): Promise<void>;

  /** Notified after every write, from this tab or (in the browser) others. */
  subscribe(listener: (e: ChangeEvent) => void): () => void;
}

/** Fan-out helper the implementations share. */
export class Emitter {
  private listeners = new Set<(e: ChangeEvent) => void>();
  on(l: (e: ChangeEvent) => void) {
    this.listeners.add(l);
    return () => void this.listeners.delete(l);
  }
  emit(e: ChangeEvent) {
    for (const l of [...this.listeners]) l(e);
  }
}
