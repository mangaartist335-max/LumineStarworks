// The recovered forum archive: Impact of Eden episode threads, their
// subthreads, the reconstructed general threads, and the members who
// posted in them. Pure functions over bundled data, no storage access.

import rawArchive from "@/data/generated/ioe-threads.json";
import { boards, seedThreads, type SeedThread } from "@/data/forums";
import { IOE_ID } from "@/data/anime";
import { IOE_PHASE, phaseEnabled } from "@/data/release";
import type { ArchiveMember, ArchivedThreadFile, ForumBoard, Thread } from "@/data/types";
import { happened, monthYearToIso, ms } from "./time";

const archive = rawArchive as unknown as ArchivedThreadFile;

/** A post as the thread page renders it, whatever its origin. */
export interface DisplayPost {
  key: string;
  threadId: string;
  number: number;
  author: string;
  avatar: string;
  rank: string | null;
  moderator: boolean;
  joinedLabel: string | null;
  postCount: number | null;
  online: boolean;
  /** When the post exists for visibility and ordering purposes. */
  at: string;
  /** The timestamp as recorded in the archive, when it differs from `at`. */
  displayAt?: string;
  tz: string;
  body: string;
  announcement?: boolean;
  editedAt?: string;
  editedTz?: string;
  editReason?: string;
  origin: "archive" | "reconstructed" | "member";
  accountId?: string;
}

interface ThreadRecord {
  thread: Thread;
  posts: DisplayPost[]; // archive / reconstructed posts in number order
}

// ── Members ──────────────────────────────────────────────────────────────

const membersByKey = new Map<string, ArchiveMember>();
for (const u of archive.users) {
  membersByKey.set(u.name.toLowerCase(), {
    name: u.name,
    avatar: u.avatar,
    rank: u.mod ? "Moderator" : u.rank ?? "Member",
    joinedAt: u.joined ? monthYearToIso(u.joined) : null,
    joinedLabel: u.joined,
    moderator: u.mod,
    provenance: "archived",
  });
}

export function archiveMembers(): ArchiveMember[] {
  return [...membersByKey.values()];
}

export function getArchiveMember(name: string): ArchiveMember | null {
  return membersByKey.get(name.toLowerCase()) ?? null;
}

/** A member exists from their join month onward (or from their first post if earlier). */
export function memberVisible(m: ArchiveMember, asOf: string): boolean {
  const first = firstActivity.get(m.name.toLowerCase());
  const from = [m.joinedAt, first].filter(Boolean).map((x) => ms(x!));
  return from.length === 0 || Math.min(...from) <= ms(asOf);
}

// ── Threads ──────────────────────────────────────────────────────────────

const records = new Map<string, ThreadRecord>();
const firstActivity = new Map<string, string>();
// Archived post-count snapshots per member, sorted by time.
const postCountSnapshots = new Map<string, { at: string; count: number }[]>();

/**
 * A post cannot predate its thread. One archived timestamp does: Episode 1
 * #82 reads "Oct 5, 2013, 04:02 EDT", a day before the thread existed, while
 * #81 and #83 bracket Oct 6 04:02 EDT exactly. When shifting a predating post
 * by whole days lands it between its neighbours, that slot is used for
 * ordering and visibility; otherwise it is clamped to the thread's creation.
 * The archived timestamp is still displayed as recorded.
 */
export function effectiveTime(at: string, threadCreated: string, prevAt?: string, nextAt?: string): string {
  if (ms(at) >= ms(threadCreated)) return at;
  for (let days = 1; days <= 2; days++) {
    const shifted = new Date(ms(at) + days * 86400_000).toISOString();
    const afterPrev = !prevAt || ms(shifted) >= ms(prevAt);
    const beforeNext = !nextAt || ms(shifted) <= ms(nextAt);
    if (ms(shifted) >= ms(threadCreated) && afterPrev && beforeNext) return shifted;
  }
  return threadCreated;
}

function noteActivity(name: string, at: string) {
  const k = name.toLowerCase();
  const prev = firstActivity.get(k);
  if (!prev || ms(at) < ms(prev)) firstActivity.set(k, at);
}

// The recovered threads are all Impact of Eden episode discussions, which
// belong to a later development phase (data/release.ts).
const activeArchiveThreads = phaseEnabled(IOE_PHASE) ? archive.threads : [];

for (const t of activeArchiveThreads) {
  const id = `ioe-ep${t.episode}`;
  const maxPostAt = t.posts.reduce((m, p) => (ms(p.at) > ms(m) ? p.at : m), t.archive.lastReplyAt);
  const capturedAt = ms(maxPostAt) > ms(t.archive.lastReplyAt) ? maxPostAt : t.archive.lastReplyAt;
  const subthreads = (t.sidebar.hotSubthreads ?? []).map((s, i) => ({ ...s, threadId: `${id}-sub${i + 1}` }));
  const thread: Thread = {
    id,
    board: "episode",
    title: t.title,
    author: "YALBot",
    createdAt: t.createdAt,
    createdTz: t.createdTz,
    animeId: IOE_ID,
    episode: t.episode,
    snapshot: { capturedAt, ...t.archive },
    sidebar: { ...t.sidebar, hotSubthreads: subthreads },
    postsRecovered: true,
    provenance: "archived",
  };
  const posts: DisplayPost[] = t.posts.map((p, i) => {
    const member = getArchiveMember(p.author);
    const at = effectiveTime(p.at, t.createdAt, t.posts[i - 1]?.at, t.posts[i + 1]?.at);
    noteActivity(p.author, at);
    if (p.authorPosts !== null) {
      const list = postCountSnapshots.get(p.author.toLowerCase()) ?? [];
      list.push({ at, count: p.authorPosts });
      postCountSnapshots.set(p.author.toLowerCase(), list);
    }
    return {
      key: `${id}-${p.n}`,
      threadId: id,
      number: p.n,
      author: p.author,
      avatar: p.av,
      rank: p.rank ?? member?.rank ?? null,
      moderator: member?.moderator ?? false,
      joinedLabel: member?.joinedLabel ?? null,
      postCount: p.authorPosts,
      online: p.online,
      at,
      tz: p.tz,
      body: p.body,
      announcement: p.announcement,
      editedAt: p.editedAt,
      editedTz: p.editedTz,
      editReason: p.editReason,
      origin: "archive",
      ...(at !== p.at ? { displayAt: p.at } : {}),
    };
  });
  records.set(id, { thread, posts });

  // Hot subthreads named in the archive snapshot. Their posts were not
  // recovered, so they exist only from the snapshot's capture onward.
  subthreads.forEach((s) => {
    records.set(s.threadId, {
      thread: {
        id: s.threadId,
        board: "episode",
        title: s.title,
        author: "Unknown (not recovered)",
        createdAt: capturedAt,
        animeId: IOE_ID,
        episode: t.episode,
        parentThreadId: id,
        postsRecovered: false,
        snapshot: {
          capturedAt,
          replies: s.replies,
          views: 0,
          lastReplyAt: capturedAt,
          lastReplyBy: "",
          status: "Open",
        },
        provenance: "archived",
      },
      posts: [],
    });
  });
}

for (const st of seedThreads as SeedThread[]) {
  const { posts, ...thread } = st;
  records.set(st.id, {
    thread,
    posts: posts.map((p, i) => {
      const member = getArchiveMember(p.author);
      noteActivity(p.author, p.at);
      return {
        key: `${st.id}-${i + 1}`,
        threadId: st.id,
        number: i + 1,
        author: p.author,
        avatar: member?.avatar ?? "av-default",
        rank: member?.rank ?? "Member",
        moderator: member?.moderator ?? false,
        joinedLabel: member?.joinedLabel ?? null,
        postCount: null,
        online: false,
        at: p.at,
        tz: "JST",
        body: p.body,
        announcement: p.author === "YALBot" && i === 0,
        editedAt: p.editedAt,
        editReason: p.editReason,
        origin: "reconstructed",
      };
    }),
  });
}

for (const list of postCountSnapshots.values()) list.sort((a, b) => ms(a.at) - ms(b.at));

/** A member's archived post count as of a moment, from the nearest earlier snapshot. */
export function archivedPostCount(name: string, asOf: string): number | null {
  const list = postCountSnapshots.get(name.toLowerCase());
  if (!list) return null;
  let found: number | null = null;
  for (const s of list) {
    if (ms(s.at) <= ms(asOf)) found = s.count;
    else break;
  }
  return found;
}

export function allBoards(): ForumBoard[] {
  return boards;
}

export function getBoard(slug: string): ForumBoard | null {
  return boards.find((b) => b.slug === slug) ?? null;
}

export function archiveThreads(): Thread[] {
  return [...records.values()].map((r) => r.thread);
}

export function getArchiveThread(id: string): Thread | null {
  return records.get(id)?.thread ?? null;
}

export function threadVisible(t: Thread, asOf: string): boolean {
  return happened(t.createdAt, asOf);
}

/** Archive/reconstructed posts in a thread that existed by asOf, in post-number order. */
export function archivePostsAsOf(threadId: string, asOf: string): DisplayPost[] {
  const r = records.get(threadId);
  if (!r) return [];
  return r.posts.filter((p) => happened(p.at, asOf));
}

// Index of archive posts per member, newest first.
const postsByMember = new Map<string, DisplayPost[]>();
for (const r of records.values()) {
  for (const p of r.posts) {
    const k = p.author.toLowerCase();
    const list = postsByMember.get(k) ?? [];
    list.push(p);
    postsByMember.set(k, list);
  }
}
for (const list of postsByMember.values()) list.sort((a, b) => ms(b.at) - ms(a.at));

export function archivePostsByMember(name: string, asOf: string): DisplayPost[] {
  const list = postsByMember.get(name.toLowerCase()) ?? [];
  return list.filter((p) => happened(p.at, asOf) && threadVisible(records.get(p.threadId)!.thread, asOf));
}

/** The snapshot applies only once its capture moment has passed. */
export function visibleSnapshot(t: Thread, asOf: string) {
  return t.snapshot && happened(t.snapshot.capturedAt, asOf) ? t.snapshot : null;
}

/** All archive posts across threads (for statistics). */
export function allArchivePosts(): DisplayPost[] {
  return [...records.values()].flatMap((r) => r.posts);
}

export function threadsForAnime(animeId: number): Thread[] {
  return archiveThreads().filter((t) => t.animeId === animeId);
}

export function episodeThread(animeId: number, episode: number): Thread | null {
  return archiveThreads().find((t) => t.animeId === animeId && t.episode === episode && !t.parentThreadId) ?? null;
}

export const ARCHIVE_STATS = {
  threads: archive.threads.length,
  posts: archive.threads.reduce((n, t) => n + t.posts.length, 0),
  members: archive.users.length,
};
