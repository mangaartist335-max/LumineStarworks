// Local demonstration store: a JSON file under YAL_DATA_DIR (default
// `.data/`). Used whenever Supabase credentials are not configured.
//
// Writes are serialised through a promise queue and saved atomically
// (temp file + rename). Passwords are hashed with scrypt; sessions are
// random tokens stored as SHA-256 hashes.

import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { hashPassword, newToken, sha256, verifyPassword } from "./password";
import type {
  Account,
  Favorites,
  Friendship,
  ListEntry,
  MemberPost,
  MemberThread,
  Recommendation,
  RegisterInput,
  Report,
  Result,
  Review,
  YalStore,
} from "./types";

export const SESSION_COOKIE = "yal_session";
const SESSION_DAYS = 30;

interface StoredAccount extends Account {
  email: string;
  passwordHash: string;
}

interface LocalData {
  version: 1;
  accounts: StoredAccount[];
  sessions: { tokenHash: string; userId: string; expiresAt: string }[];
  lists: ListEntry[];
  threads: MemberThread[];
  posts: MemberPost[];
  follows: { userId: string; threadId: string }[];
  reports: Report[];
  reviews: Review[];
  recommendations: Recommendation[];
  friends: Friendship[];
}

const empty = (): LocalData => ({
  version: 1,
  accounts: [],
  sessions: [],
  lists: [],
  threads: [],
  posts: [],
  follows: [],
  reports: [],
  reviews: [],
  recommendations: [],
  friends: [],
});

export function localDataFile(): string {
  // The data file is runtime state, not a build input; the turbopackIgnore
  // hints below keep the bundler from tracing the whole project for it.
  const dir = process.env.YAL_DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".data");
  return path.join(dir, "yal.local.json");
}

type Cache = { file: string; mtimeMs: number; data: LocalData; queue: Promise<unknown> };
const g = globalThis as unknown as { __yalLocal?: Cache };

/** Load the data file, re-reading it whenever it changed on disk (e.g. after a reset). */
async function load(): Promise<Cache> {
  const cached = g.__yalLocal;
  const file = cached?.file ?? localDataFile();
  let mtimeMs = 0;
  try {
    mtimeMs = (await fs.stat(/*turbopackIgnore: true*/ file)).mtimeMs;
  } catch {
    mtimeMs = 0;
  }
  if (cached && cached.mtimeMs === mtimeMs) return cached;
  let data = empty();
  if (mtimeMs) {
    try {
      data = { ...empty(), ...JSON.parse(await fs.readFile(/*turbopackIgnore: true*/ file, "utf8")) };
    } catch {
      console.warn(`[yal] ${file} is not valid JSON; starting from an empty store`);
    }
  }
  g.__yalLocal = { file, mtimeMs, data, queue: cached?.queue ?? Promise.resolve() };
  return g.__yalLocal;
}

async function persist(c: Cache) {
  const write = async (file: string) => {
    await fs.mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(/*turbopackIgnore: true*/ tmp, JSON.stringify(c.data, null, 1), "utf8");
    await fs.rename(/*turbopackIgnore: true*/ tmp, file);
    c.file = file;
    c.mtimeMs = (await fs.stat(/*turbopackIgnore: true*/ file)).mtimeMs;
  };
  try {
    await write(c.file);
  } catch (err) {
    // Read-only deployments (e.g. serverless) fall back to the temp dir.
    const fallback = path.join(os.tmpdir(), "yal-data", "yal.local.json");
    if (c.file === fallback) throw err;
    console.warn(`[yal] could not write ${c.file}; using ${fallback} (data is not durable there)`);
    await write(fallback);
  }
}

/** Run a read-modify-write against the data file, one at a time. */
async function mutate<T>(fn: (d: LocalData) => T | Promise<T>): Promise<T> {
  const c = await load();
  const run = c.queue.then(async () => {
    const fresh = await load();
    const out = await fn(fresh.data);
    await persist(fresh);
    return out;
  });
  c.queue = run.catch(() => undefined);
  return run;
}

async function read<T>(fn: (d: LocalData) => T): Promise<T> {
  const c = await load();
  return fn(c.data);
}

const publicAccount = (a: StoredAccount): Account => {
  const { email: _email, passwordHash: _hash, ...rest } = a;
  void _email;
  void _hash;
  return rest;
};

const nowIso = () => new Date().toISOString();

async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 3600,
  });
}

export class LocalStore implements YalStore {
  readonly mode = "local" as const;

  async currentAccount(): Promise<Account | null> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const hash = sha256(token);
    return read((d) => {
      const s = d.sessions.find((x) => x.tokenHash === hash && new Date(x.expiresAt).getTime() > Date.now());
      const a = s && d.accounts.find((x) => x.id === s.userId);
      return a ? publicAccount(a) : null;
    });
  }

  async register(input: RegisterInput): Promise<Result<Account>> {
    const passwordHash = await hashPassword(input.password);
    const token = newToken();
    const result = await mutate<Result<Account>>((d) => {
      const lower = input.username.toLowerCase();
      if (d.accounts.some((a) => a.username.toLowerCase() === lower)) return { ok: false, error: "That username is already taken." };
      if (d.accounts.some((a) => a.email.toLowerCase() === input.email.toLowerCase()))
        return { ok: false, error: "An account with that email already exists." };
      const account: StoredAccount = {
        id: randomUUID(),
        username: input.username,
        email: input.email,
        passwordHash,
        avatar: input.avatar,
        about: "",
        location: "",
        timeZone: "JST",
        joinedAt: input.joinedAt,
        recordedAt: nowIso(),
        favorites: { anime: [], manga: [], characters: [], people: [] },
      };
      d.accounts.push(account);
      d.sessions.push({
        tokenHash: sha256(token),
        userId: account.id,
        expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString(),
      });
      return { ok: true, value: publicAccount(account) };
    });
    if (result.ok) await setSessionCookie(token);
    return result;
  }

  async signIn(login: string, password: string): Promise<Result<Account>> {
    const lower = login.trim().toLowerCase();
    const account = await read((d) =>
      d.accounts.find((a) => a.username.toLowerCase() === lower || a.email.toLowerCase() === lower),
    );
    // Verify against a dummy hash when the account is missing to keep timing uniform.
    const ok = await verifyPassword(
      password,
      account?.passwordHash ?? "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    );
    if (!account || !ok) return { ok: false, error: "Incorrect username or password." };
    const token = newToken();
    await mutate((d) => {
      d.sessions = d.sessions.filter((s) => new Date(s.expiresAt).getTime() > Date.now());
      d.sessions.push({
        tokenHash: sha256(token),
        userId: account.id,
        expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString(),
      });
    });
    await setSessionCookie(token);
    return { ok: true, value: publicAccount(account) };
  }

  async signOut(): Promise<void> {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      const hash = sha256(token);
      await mutate((d) => {
        d.sessions = d.sessions.filter((s) => s.tokenHash !== hash);
      });
    }
    jar.delete(SESSION_COOKIE);
  }

  async getAccountByName(username: string): Promise<Account | null> {
    const lower = username.toLowerCase();
    return read((d) => {
      const a = d.accounts.find((x) => x.username.toLowerCase() === lower);
      return a ? publicAccount(a) : null;
    });
  }

  async getAccountsById(ids: string[]): Promise<Account[]> {
    const set = new Set(ids);
    return read((d) => d.accounts.filter((a) => set.has(a.id)).map(publicAccount));
  }

  async listAccounts(): Promise<Account[]> {
    return read((d) => d.accounts.map(publicAccount));
  }

  async updateProfile(userId: string, patch: Partial<Pick<Account, "avatar" | "about" | "location" | "timeZone">>) {
    return mutate<Result<Account>>((d) => {
      const a = d.accounts.find((x) => x.id === userId);
      if (!a) return { ok: false, error: "Account not found." };
      Object.assign(a, patch);
      return { ok: true, value: publicAccount(a) };
    });
  }

  async setFavorite(userId: string, kind: keyof Favorites, id: number, on: boolean) {
    return mutate<Result<Favorites>>((d) => {
      const a = d.accounts.find((x) => x.id === userId);
      if (!a) return { ok: false, error: "Account not found." };
      const list = a.favorites[kind].filter((x) => x !== id);
      if (on) {
        if (list.length >= 10) return { ok: false, error: "You can have up to 10 favorites in each category." };
        list.push(id);
      }
      a.favorites[kind] = list;
      return { ok: true, value: a.favorites };
    });
  }

  async getList(userId: string) {
    return read((d) => d.lists.filter((l) => l.userId === userId));
  }

  async getListEntry(userId: string, animeId: number) {
    return read((d) => d.lists.find((l) => l.userId === userId && l.animeId === animeId) ?? null);
  }

  async saveListEntry(entry: Omit<ListEntry, "recordedAt">) {
    return mutate<Result<ListEntry>>((d) => {
      const saved: ListEntry = { ...entry, recordedAt: nowIso() };
      d.lists = d.lists.filter((l) => !(l.userId === entry.userId && l.animeId === entry.animeId));
      d.lists.push(saved);
      return { ok: true, value: saved };
    });
  }

  async removeListEntry(userId: string, animeId: number) {
    await mutate((d) => {
      d.lists = d.lists.filter((l) => !(l.userId === userId && l.animeId === animeId));
    });
  }

  async listEntriesForAnime(animeId: number) {
    return read((d) => d.lists.filter((l) => l.animeId === animeId));
  }

  async allListEntries() {
    return read((d) => [...d.lists]);
  }

  async listMemberThreads(board?: string) {
    return read((d) => d.threads.filter((t) => !board || t.board === board));
  }

  async getMemberThread(id: string) {
    return read((d) => d.threads.find((t) => t.id === id) ?? null);
  }

  async createThread(input: Omit<MemberThread, "id" | "recordedAt">, firstPostBody: string) {
    return mutate<Result<MemberThread>>((d) => {
      const thread: MemberThread = { ...input, id: `m-${randomUUID().slice(0, 8)}`, recordedAt: nowIso() };
      d.threads.push(thread);
      d.posts.push({
        id: randomUUID(),
        threadId: thread.id,
        number: 1,
        authorId: input.authorId,
        authorName: input.authorName,
        body: firstPostBody,
        postedAt: input.createdAt,
        recordedAt: thread.recordedAt,
        editedAt: null,
      });
      return { ok: true, value: thread };
    });
  }

  async listMemberPosts(threadId?: string) {
    return read((d) => d.posts.filter((p) => !threadId || p.threadId === threadId));
  }

  async listMemberPostsByAuthor(authorId: string) {
    return read((d) => d.posts.filter((p) => p.authorId === authorId));
  }

  async createPost(input: Omit<MemberPost, "id" | "number" | "recordedAt" | "editedAt">, archiveMaxNumber: number) {
    return mutate<Result<MemberPost>>((d) => {
      const last = d.posts
        .filter((p) => p.threadId === input.threadId && p.authorId === input.authorId)
        .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
      if (last && Date.now() - new Date(last.recordedAt).getTime() < 10_000)
        return { ok: false, error: "Please wait a few seconds before posting again." };
      const maxMember = d.posts.filter((p) => p.threadId === input.threadId).reduce((m, p) => Math.max(m, p.number), 0);
      const post: MemberPost = {
        ...input,
        id: randomUUID(),
        number: Math.max(maxMember, archiveMaxNumber) + 1,
        recordedAt: nowIso(),
        editedAt: null,
      };
      d.posts.push(post);
      return { ok: true, value: post };
    });
  }

  async followThread(userId: string, threadId: string, on: boolean) {
    await mutate((d) => {
      d.follows = d.follows.filter((f) => !(f.userId === userId && f.threadId === threadId));
      if (on) d.follows.push({ userId, threadId });
    });
  }

  async listFollows(userId: string) {
    return read((d) => d.follows.filter((f) => f.userId === userId).map((f) => f.threadId));
  }

  async reportPost(input: Omit<Report, "id" | "recordedAt">) {
    return mutate<Result<Report>>((d) => {
      if (d.reports.some((r) => r.reporterId === input.reporterId && r.postKey === input.postKey))
        return { ok: false, error: "You have already reported this post." };
      const report: Report = { ...input, id: randomUUID(), recordedAt: nowIso() };
      d.reports.push(report);
      return { ok: true, value: report };
    });
  }

  async listReviews(animeId?: number) {
    return read((d) => d.reviews.filter((r) => animeId === undefined || r.animeId === animeId));
  }

  async createReview(input: Omit<Review, "id" | "recordedAt">) {
    return mutate<Result<Review>>((d) => {
      if (d.reviews.some((r) => r.authorId === input.authorId && r.animeId === input.animeId))
        return { ok: false, error: "You have already reviewed this anime." };
      const review: Review = { ...input, id: randomUUID(), recordedAt: nowIso() };
      d.reviews.push(review);
      return { ok: true, value: review };
    });
  }

  async listRecommendations(animeId?: number) {
    return read((d) =>
      d.recommendations.filter((r) => animeId === undefined || r.fromId === animeId || r.toId === animeId),
    );
  }

  async createRecommendation(input: Omit<Recommendation, "id" | "recordedAt">) {
    return mutate<Result<Recommendation>>((d) => {
      if (d.recommendations.some((r) => r.authorId === input.authorId && r.fromId === input.fromId && r.toId === input.toId))
        return { ok: false, error: "You have already made this recommendation." };
      const rec: Recommendation = { ...input, id: randomUUID(), recordedAt: nowIso() };
      d.recommendations.push(rec);
      return { ok: true, value: rec };
    });
  }

  async listFriends(userId: string) {
    return read((d) => d.friends.filter((f) => f.userId === userId));
  }

  async setFriend(userId: string, friendName: string, on: boolean, since: string) {
    await mutate((d) => {
      d.friends = d.friends.filter((f) => !(f.userId === userId && f.friendName.toLowerCase() === friendName.toLowerCase()));
      if (on) d.friends.push({ userId, friendName, since });
    });
  }
}
