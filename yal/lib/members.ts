import "server-only";
import { cache } from "react";
import { IOE_ID } from "@/data/anime";
import { archiveMembers, archivePostsByMember, archivedPostCount, getArchiveMember, memberVisible } from "./archive";
import { getStore } from "./store";
import type { Account, ListEntry, ListStatus } from "./store/types";
import { happened, ms } from "./time";
import { memberPostsByAccount, memberRank } from "./forum";

/** A profile as YAL shows it: either an archive member or a live account. */
export interface Member {
  name: string;
  avatar: string;
  rank: string;
  joinedAt: string | null;
  joinedLabel: string | null;
  moderator: boolean;
  kind: "archive" | "account";
  account?: Account;
  postCount: number | null;
}

export interface DisplayListEntry {
  animeId: number;
  status: ListStatus;
  episodesWatched: number;
  score: number | null;
  startDate: string | null;
  finishDate: string | null;
  notes: string;
  updatedAt: string;
  derived: boolean;
}

const allAccounts = cache(async () => getStore().listAccounts());
const allEntries = cache(async () => getStore().allListEntries());

function monthLabel(iso: string): string {
  const d = new Date(ms(iso) + 9 * 3600_000);
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export async function findMember(name: string, asOf: string): Promise<Member | null> {
  const a = getArchiveMember(name);
  if (a) {
    if (!memberVisible(a, asOf)) return null;
    return {
      name: a.name,
      avatar: a.avatar,
      rank: a.rank,
      joinedAt: a.joinedAt,
      joinedLabel: a.joinedLabel,
      moderator: a.moderator,
      kind: "archive",
      postCount: archivedPostCount(a.name, asOf),
    };
  }
  const acc = await getStore().getAccountByName(name);
  if (!acc || !happened(acc.joinedAt, asOf)) return null;
  const posts = (await memberPostsByAccount(acc.id, asOf)).length;
  return {
    name: acc.username,
    avatar: acc.avatar,
    rank: memberRank(posts),
    joinedAt: acc.joinedAt,
    joinedLabel: monthLabel(acc.joinedAt),
    moderator: false,
    kind: "account",
    account: acc,
    postCount: posts,
  };
}

/** Whether a username exists at some later point (for "not joined yet" messages). */
export async function memberJoinsLater(name: string, asOf: string): Promise<string | null> {
  const a = getArchiveMember(name);
  if (a) return memberVisible(a, asOf) ? null : a.joinedAt;
  const acc = await getStore().getAccountByName(name);
  return acc && !happened(acc.joinedAt, asOf) ? acc.joinedAt : null;
}

export async function visibleMembers(asOf: string): Promise<Member[]> {
  const archived: Member[] = archiveMembers()
    .filter((m) => memberVisible(m, asOf))
    .map((m) => ({
      name: m.name,
      avatar: m.avatar,
      rank: m.rank,
      joinedAt: m.joinedAt,
      joinedLabel: m.joinedLabel,
      moderator: m.moderator,
      kind: "archive",
      postCount: archivedPostCount(m.name, asOf),
    }));
  const accounts: Member[] = (await allAccounts())
    .filter((a) => happened(a.joinedAt, asOf))
    .map((a) => ({
      name: a.username,
      avatar: a.avatar,
      rank: "Member",
      joinedAt: a.joinedAt,
      joinedLabel: monthLabel(a.joinedAt),
      moderator: false,
      kind: "account",
      account: a,
      postCount: null,
    }));
  return [...archived, ...accounts];
}

/**
 * Archive members have no recovered lists. Posting in an episode thread is
 * evidence they were watching, so their list shows a derived "Watching"
 * entry up to the latest episode thread they posted in.
 */
export function derivedArchiveList(name: string, asOf: string): DisplayListEntry[] {
  const posts = archivePostsByMember(name, asOf).filter((p) => p.threadId.startsWith("ioe-ep") && !p.threadId.includes("-sub"));
  if (posts.length === 0) return [];
  const maxEp = Math.max(...posts.map((p) => Number(p.threadId.replace("ioe-ep", ""))));
  const first = posts.reduce((m, p) => (ms(p.at) < ms(m) ? p.at : m), posts[0].at);
  const last = posts.reduce((m, p) => (ms(p.at) > ms(m) ? p.at : m), posts[0].at);
  return [
    {
      animeId: IOE_ID,
      status: "Watching",
      episodesWatched: maxEp,
      score: null,
      startDate: first.slice(0, 10),
      finishDate: null,
      notes: "",
      updatedAt: last,
      derived: true,
    },
  ];
}

export async function memberList(member: Member, asOf: string): Promise<DisplayListEntry[]> {
  if (member.kind === "archive") return derivedArchiveList(member.name, asOf);
  const entries = await getStore().getList(member.account!.id);
  return entries.filter((e) => happened(e.updatedAt, asOf)).map((e) => toDisplay(e));
}

function toDisplay(e: ListEntry): DisplayListEntry {
  return {
    animeId: e.animeId,
    status: e.status,
    episodesWatched: e.episodesWatched,
    score: e.score,
    startDate: e.startDate,
    finishDate: e.finishDate,
    notes: e.notes,
    updatedAt: e.updatedAt,
    derived: false,
  };
}

/** List entries for one anime across members, as of a moment. */
export async function entriesForAnime(animeId: number, asOf: string) {
  const accounts = new Map((await allAccounts()).map((a) => [a.id, a]));
  const live = (await allEntries()).filter(
    (e) => e.animeId === animeId && happened(e.updatedAt, asOf) && accounts.get(e.userId) && happened(accounts.get(e.userId)!.joinedAt, asOf),
  );
  const derived = archiveMembers()
    .filter((m) => memberVisible(m, asOf))
    .flatMap((m) => derivedArchiveList(m.name, asOf).filter((e) => e.animeId === animeId));
  return { live, derived };
}

export async function favoritesCount(kind: "anime" | "manga" | "characters" | "people", id: number, asOf: string) {
  return (await allAccounts()).filter((a) => happened(a.joinedAt, asOf) && a.favorites[kind].includes(id)).length;
}
