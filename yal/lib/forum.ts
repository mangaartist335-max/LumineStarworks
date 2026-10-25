import "server-only";
import { cache } from "react";
import type { ArchiveSnapshot, Thread } from "@/data/types";
import {
  archivePostsAsOf,
  archiveThreads,
  getArchiveThread,
  threadVisible,
  visibleSnapshot,
  type DisplayPost,
} from "./archive";
import { getStore } from "./store";
import type { Account, MemberPost, MemberThread } from "./store/types";
import { happened, ms } from "./time";

export interface ForumThread extends Thread {
  origin: "archive" | "reconstructed" | "member";
}

export interface ThreadSummary {
  thread: ForumThread;
  replies: number;
  /** Archived reply total for threads whose posts were not recovered. */
  archivedReplies: number | null;
  views: number | null;
  last: { author: string; at: string } | null;
  snapshot: ArchiveSnapshot | null;
}

export function memberRank(posts: number): string {
  if (posts >= 500) return "Forum Regular";
  if (posts >= 50) return "Member";
  return "Newbie";
}

const allMemberPosts = cache(async (): Promise<MemberPost[]> => getStore().listMemberPosts());
const allMemberThreads = cache(async (): Promise<MemberThread[]> => getStore().listMemberThreads());

const accountsFor = cache(async (idsKey: string): Promise<Map<string, Account>> => {
  const ids = idsKey ? idsKey.split(",") : [];
  const list = await getStore().getAccountsById(ids);
  return new Map(list.map((a) => [a.id, a]));
});

function fromMemberThread(t: MemberThread): ForumThread {
  return {
    id: t.id,
    board: t.board,
    title: t.title,
    author: t.authorName,
    createdAt: t.createdAt,
    animeId: t.animeId ?? undefined,
    provenance: "derived",
    postsRecovered: true,
    origin: "member",
  };
}

function fromArchive(t: Thread): ForumThread {
  return { ...t, origin: t.provenance === "reconstructed" ? "reconstructed" : "archive" };
}

export async function getThread(id: string, asOf: string): Promise<ForumThread | null> {
  const a = getArchiveThread(id);
  if (a) return threadVisible(a, asOf) ? fromArchive(a) : null;
  const m = (await allMemberThreads()).find((t) => t.id === id);
  return m && happened(m.createdAt, asOf) ? fromMemberThread(m) : null;
}

/** Whether a thread id exists at any time (for "not yet created" messages). */
export async function threadExistsLater(id: string, asOf: string): Promise<string | null> {
  const a = getArchiveThread(id);
  if (a && !threadVisible(a, asOf)) return a.createdAt;
  const m = (await allMemberThreads()).find((t) => t.id === id);
  if (m && !happened(m.createdAt, asOf)) return m.createdAt;
  return null;
}

/** Display posts for member replies, with their authors' current profile details. */
async function memberDisplayPosts(posts: MemberPost[], asOf: string, viewerId?: string): Promise<DisplayPost[]> {
  if (posts.length === 0) return [];
  const all = await allMemberPosts();
  const ids = [...new Set(posts.map((p) => p.authorId))].sort();
  const accounts = await accountsFor(ids.join(","));
  return posts.map((p) => {
    const acc = accounts.get(p.authorId);
    const count = all.filter((x) => x.authorId === p.authorId && happened(x.postedAt, asOf)).length;
    return {
      key: `m-${p.id}`,
      threadId: p.threadId,
      number: p.number,
      author: p.authorName,
      avatar: acc?.avatar ?? "av-default",
      rank: memberRank(count),
      moderator: false,
      joinedLabel: acc ? monthLabel(acc.joinedAt) : null,
      postCount: count,
      online: viewerId !== undefined && p.authorId === viewerId,
      at: p.postedAt,
      tz: acc?.timeZone ?? "JST",
      body: p.body,
      origin: "member",
      accountId: p.authorId,
    } satisfies DisplayPost;
  });
}

function monthLabel(iso: string): string {
  const d = new Date(ms(iso) + 9 * 3600_000);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Every post in a thread that existed by asOf, in post-number order. */
export async function threadPosts(threadId: string, asOf: string, viewerId?: string): Promise<DisplayPost[]> {
  const archived = archivePostsAsOf(threadId, asOf);
  const member = (await allMemberPosts()).filter((p) => p.threadId === threadId && happened(p.postedAt, asOf));
  const memberDisplay = await memberDisplayPosts(member, asOf, viewerId);
  return [...archived, ...memberDisplay].sort((a, b) => a.number - b.number || ms(a.at) - ms(b.at));
}

/** Highest post number used in the archive for a thread (member posts continue after it). */
export function archiveMaxNumber(threadId: string): number {
  return archivePostsAsOf(threadId, "9999-12-31T00:00:00Z").reduce((m, p) => Math.max(m, p.number), 0);
}

export async function summarize(thread: ForumThread, asOf: string): Promise<ThreadSummary> {
  const posts = await threadPosts(thread.id, asOf);
  const snapshot = visibleSnapshot(thread, asOf);
  const latest = posts.reduce<DisplayPost | null>((m, p) => (!m || ms(p.at) > ms(m.at) ? p : m), null);
  const unrecovered = thread.postsRecovered === false;
  return {
    thread,
    replies: Math.max(posts.length - 1, 0),
    archivedReplies: unrecovered && snapshot ? snapshot.replies : null,
    views: snapshot && snapshot.views > 0 ? snapshot.views : null,
    last: latest ? { author: latest.author, at: latest.at } : null,
    snapshot,
  };
}

export async function boardThreads(board: string | null, asOf: string): Promise<ThreadSummary[]> {
  const archived = archiveThreads()
    .filter((t) => (board === null || t.board === board) && threadVisible(t, asOf))
    .map(fromArchive);
  const member = (await allMemberThreads())
    .filter((t) => (board === null || t.board === board) && happened(t.createdAt, asOf))
    .map(fromMemberThread);
  const summaries = await Promise.all([...archived, ...member].map((t) => summarize(t, asOf)));
  const activity = (s: ThreadSummary) => ms(s.last?.at ?? s.thread.createdAt);
  return summaries.sort((a, b) => Number(Boolean(b.thread.pinned)) - Number(Boolean(a.thread.pinned)) || activity(b) - activity(a));
}

/** The latest posts across the forums as of a moment (home page, community feed). */
export async function recentForumPosts(asOf: string, limit = 10): Promise<(DisplayPost & { threadTitle: string })[]> {
  const threads = [
    ...archiveThreads().filter((t) => threadVisible(t, asOf)).map(fromArchive),
    ...(await allMemberThreads()).filter((t) => happened(t.createdAt, asOf)).map(fromMemberThread),
  ];
  const titles = new Map(threads.map((t) => [t.id, t.title]));
  const posts: DisplayPost[] = [];
  for (const t of threads) posts.push(...(await threadPosts(t.id, asOf)));
  return posts
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, limit)
    .map((p) => ({ ...p, threadTitle: titles.get(p.threadId) ?? "" }));
}

export async function memberPostsByAccount(accountId: string, asOf: string) {
  const posts = (await allMemberPosts()).filter((p) => p.authorId === accountId && happened(p.postedAt, asOf));
  return posts.sort((a, b) => ms(b.postedAt) - ms(a.postedAt));
}
