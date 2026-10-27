// Supabase store: member data in Postgres, accounts in Supabase Auth.
// Row Level Security policies in supabase/migrations enforce ownership;
// post and thread creation go through security-definer functions that
// assign post numbers atomically and rate-limit replies.

import { createSupabaseServerClient } from "../supabase/server";
import type {
  Account,
  Favorites,
  Friendship,
  ListEntry,
  ListStatus,
  MemberPost,
  MemberThread,
  Recommendation,
  RegisterInput,
  Report,
  Result,
  Review,
  YalStore,
} from "./types";

type Row = Record<string, unknown>;

const toAccount = (r: Row): Account => ({
  id: r.id as string,
  username: r.username as string,
  avatar: (r.avatar as string) ?? "av-default",
  about: (r.about as string) ?? "",
  location: (r.location as string) ?? "",
  timeZone: (r.time_zone as string) ?? "JST",
  joinedAt: r.joined_at as string,
  recordedAt: r.recorded_at as string,
  favorites: { anime: [], manga: [], characters: [], people: [], ...((r.favorites as Partial<Favorites>) ?? {}) },
});

const toList = (r: Row): ListEntry => ({
  userId: r.user_id as string,
  animeId: r.anime_id as number,
  status: r.status as ListStatus,
  episodesWatched: (r.episodes_watched as number) ?? 0,
  score: (r.score as number | null) ?? null,
  startDate: (r.start_date as string | null) ?? null,
  finishDate: (r.finish_date as string | null) ?? null,
  notes: (r.notes as string) ?? "",
  updatedAt: r.updated_at as string,
  recordedAt: r.recorded_at as string,
});

const toThread = (r: Row): MemberThread => ({
  id: r.id as string,
  board: r.board as string,
  title: r.title as string,
  authorId: r.created_by as string,
  authorName: r.author_name as string,
  animeId: (r.anime_id as number | null) ?? null,
  createdAt: r.created_at as string,
  recordedAt: r.recorded_at as string,
});

const toPost = (r: Row): MemberPost => ({
  id: r.id as string,
  threadId: r.thread_id as string,
  number: r.number as number,
  authorId: r.author_id as string,
  authorName: r.author_name as string,
  body: r.body as string,
  postedAt: r.posted_at as string,
  recordedAt: r.recorded_at as string,
  editedAt: (r.edited_at as string | null) ?? null,
});

const toReview = (r: Row): Review => ({
  id: r.id as string,
  animeId: r.anime_id as number,
  authorId: r.author_id as string,
  authorName: r.author_name as string,
  postedAt: r.posted_at as string,
  episodesSeen: r.episodes_seen as number,
  overall: r.overall as number,
  story: r.story as number,
  animation: r.animation as number,
  sound: r.sound as number,
  character: r.character as number,
  enjoyment: r.enjoyment as number,
  body: r.body as string,
  recordedAt: r.recorded_at as string,
});

const toRec = (r: Row): Recommendation => ({
  id: r.id as string,
  fromId: r.from_id as number,
  toId: r.to_id as number,
  authorId: r.author_id as string,
  authorName: r.author_name as string,
  reason: r.reason as string,
  postedAt: r.posted_at as string,
  recordedAt: r.recorded_at as string,
});

/** Escape LIKE wildcards so usernames containing "_" match exactly. */
const likeExact = (v: string) => v.replace(/[\\%_]/g, "\\$&");

function fail<T>(error: unknown, fallback: string): Result<T> {
  const message = (error as { message?: string })?.message;
  console.error("[yal] supabase:", message ?? error);
  return { ok: false, error: fallback };
}

export class SupabaseStore implements YalStore {
  readonly mode = "supabase" as const;

  private client() {
    return createSupabaseServerClient();
  }

  async currentAccount(): Promise<Account | null> {
    const sb = await this.client();
    const { data } = await sb.auth.getUser();
    if (!data.user) return null;
    const { data: row } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    return row ? toAccount(row) : null;
  }

  async register(input: RegisterInput): Promise<Result<Account>> {
    const sb = await this.client();
    const { data: taken } = await sb.from("profiles").select("id").ilike("username", likeExact(input.username)).maybeSingle();
    if (taken) return { ok: false, error: "That username is already taken." };
    const { data, error } = await sb.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { username: input.username, avatar: input.avatar, joined_at: input.joinedAt } },
    });
    if (error || !data.user) return fail(error, error?.message ?? "Could not create the account.");
    if (!data.session) return { ok: false, error: "Account created! Check your email to confirm it, then log in." };
    const { data: row } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    return row ? { ok: true, value: toAccount(row) } : { ok: false, error: "Account created, but the profile is not ready yet." };
  }

  async signIn(login: string, password: string): Promise<Result<Account>> {
    if (!login.includes("@")) return { ok: false, error: "Please log in with your email address." };
    const sb = await this.client();
    const { data, error } = await sb.auth.signInWithPassword({ email: login.trim(), password });
    if (error || !data.user) return { ok: false, error: "Incorrect email or password." };
    const { data: row } = await sb.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
    return row ? { ok: true, value: toAccount(row) } : { ok: false, error: "Profile not found." };
  }

  async signOut() {
    const sb = await this.client();
    await sb.auth.signOut();
  }

  async getAccountByName(username: string) {
    const sb = await this.client();
    const { data } = await sb.from("profiles").select("*").ilike("username", likeExact(username)).maybeSingle();
    return data ? toAccount(data) : null;
  }

  async getAccountsById(ids: string[]) {
    if (ids.length === 0) return [];
    const sb = await this.client();
    const { data } = await sb.from("profiles").select("*").in("id", ids);
    return (data ?? []).map(toAccount);
  }

  async listAccounts() {
    const sb = await this.client();
    const { data } = await sb.from("profiles").select("*").order("joined_at", { ascending: false }).limit(500);
    return (data ?? []).map(toAccount);
  }

  async updateProfile(userId: string, patch: Partial<Pick<Account, "avatar" | "about" | "location" | "timeZone">>) {
    const sb = await this.client();
    const row: Row = {};
    if (patch.avatar !== undefined) row.avatar = patch.avatar;
    if (patch.about !== undefined) row.about = patch.about;
    if (patch.location !== undefined) row.location = patch.location;
    if (patch.timeZone !== undefined) row.time_zone = patch.timeZone;
    const { data, error } = await sb.from("profiles").update(row).eq("id", userId).select("*").single();
    return error ? fail<Account>(error, "Could not save your profile.") : { ok: true as const, value: toAccount(data) };
  }

  async setFavorite(userId: string, kind: keyof Favorites, id: number, on: boolean) {
    const sb = await this.client();
    const { data: row } = await sb.from("profiles").select("favorites").eq("id", userId).single();
    const fav: Favorites = { anime: [], manga: [], characters: [], people: [], ...((row?.favorites as Partial<Favorites>) ?? {}) };
    const list = fav[kind].filter((x) => x !== id);
    if (on) {
      if (list.length >= 10) return { ok: false as const, error: "You can have up to 10 favorites in each category." };
      list.push(id);
    }
    fav[kind] = list;
    const { error } = await sb.from("profiles").update({ favorites: fav }).eq("id", userId);
    return error ? fail<Favorites>(error, "Could not update favorites.") : { ok: true as const, value: fav };
  }

  async getList(userId: string) {
    const sb = await this.client();
    const { data } = await sb.from("anime_list_entries").select("*").eq("user_id", userId);
    return (data ?? []).map(toList);
  }

  async getListEntry(userId: string, animeId: number) {
    const sb = await this.client();
    const { data } = await sb.from("anime_list_entries").select("*").eq("user_id", userId).eq("anime_id", animeId).maybeSingle();
    return data ? toList(data) : null;
  }

  async saveListEntry(e: Omit<ListEntry, "recordedAt">) {
    const sb = await this.client();
    const { data, error } = await sb
      .from("anime_list_entries")
      .upsert({
        user_id: e.userId,
        anime_id: e.animeId,
        status: e.status,
        episodes_watched: e.episodesWatched,
        score: e.score,
        start_date: e.startDate,
        finish_date: e.finishDate,
        notes: e.notes,
        updated_at: e.updatedAt,
        recorded_at: new Date().toISOString(),
      })
      .select("*")
      .single();
    return error ? fail<ListEntry>(error, "Could not save the list entry.") : { ok: true as const, value: toList(data) };
  }

  async removeListEntry(userId: string, animeId: number) {
    const sb = await this.client();
    await sb.from("anime_list_entries").delete().eq("user_id", userId).eq("anime_id", animeId);
  }

  async listEntriesForAnime(animeId: number) {
    const sb = await this.client();
    const { data } = await sb.from("anime_list_entries").select("*").eq("anime_id", animeId);
    return (data ?? []).map(toList);
  }

  async allListEntries() {
    const sb = await this.client();
    const { data } = await sb.from("anime_list_entries").select("*").limit(5000);
    return (data ?? []).map(toList);
  }

  async listMemberThreads(board?: string) {
    const sb = await this.client();
    let q = sb.from("forum_threads").select("*").not("created_by", "is", null);
    if (board) q = q.eq("board", board);
    const { data } = await q;
    return (data ?? []).map(toThread);
  }

  async getMemberThread(id: string) {
    const sb = await this.client();
    const { data } = await sb.from("forum_threads").select("*").eq("id", id).not("created_by", "is", null).maybeSingle();
    return data ? toThread(data) : null;
  }

  async createThread(input: Omit<MemberThread, "id" | "recordedAt">, firstPostBody: string) {
    const sb = await this.client();
    const { data, error } = await sb.rpc("create_forum_thread", {
      p_board: input.board,
      p_title: input.title,
      p_anime_id: input.animeId,
      p_created_at: input.createdAt,
      p_body: firstPostBody,
    });
    if (error) return fail<MemberThread>(error, error.message.includes("wait") ? error.message : "Could not create the topic.");
    const { data: row } = await sb.from("forum_threads").select("*").eq("id", data as string).single();
    return { ok: true as const, value: toThread(row!) };
  }

  async listMemberPosts(threadId?: string) {
    const sb = await this.client();
    let q = sb.from("forum_posts").select("*").eq("provenance", "member");
    if (threadId) q = q.eq("thread_id", threadId);
    const { data } = await q;
    return (data ?? []).map(toPost);
  }

  async listMemberPostsByAuthor(authorId: string) {
    const sb = await this.client();
    const { data } = await sb.from("forum_posts").select("*").eq("author_id", authorId);
    return (data ?? []).map(toPost);
  }

  async createPost(input: Omit<MemberPost, "id" | "number" | "recordedAt" | "editedAt">, archiveMaxNumber: number) {
    const sb = await this.client();
    const { data, error } = await sb.rpc("create_forum_post", {
      p_thread_id: input.threadId,
      p_body: input.body,
      p_posted_at: input.postedAt,
      p_number_floor: archiveMaxNumber,
    });
    if (error) return fail<MemberPost>(error, error.message.includes("wait") ? error.message : "Could not post your reply.");
    const { data: row } = await sb.from("forum_posts").select("*").eq("id", data as string).single();
    return { ok: true as const, value: toPost(row!) };
  }

  async followThread(userId: string, threadId: string, on: boolean) {
    const sb = await this.client();
    if (on) await sb.from("thread_follows").upsert({ user_id: userId, thread_id: threadId });
    else await sb.from("thread_follows").delete().eq("user_id", userId).eq("thread_id", threadId);
  }

  async listFollows(userId: string) {
    const sb = await this.client();
    const { data } = await sb.from("thread_follows").select("thread_id").eq("user_id", userId);
    return (data ?? []).map((r) => r.thread_id as string);
  }

  async reportPost(input: Omit<Report, "id" | "recordedAt">) {
    const sb = await this.client();
    const { data, error } = await sb
      .from("post_reports")
      .insert({
        reporter_id: input.reporterId,
        thread_id: input.threadId,
        post_key: input.postKey,
        reason: input.reason,
        reported_at: input.reportedAt,
      })
      .select("*")
      .single();
    if (error) return fail<Report>(error, error.code === "23505" ? "You have already reported this post." : "Could not send the report.");
    return {
      ok: true as const,
      value: { ...input, id: data.id as string, recordedAt: data.recorded_at as string },
    };
  }

  async listReviews(animeId?: number) {
    const sb = await this.client();
    let q = sb.from("reviews").select("*").eq("provenance", "member");
    if (animeId !== undefined) q = q.eq("anime_id", animeId);
    const { data } = await q;
    return (data ?? []).map(toReview);
  }

  async createReview(input: Omit<Review, "id" | "recordedAt">) {
    const sb = await this.client();
    const { data, error } = await sb
      .from("reviews")
      .insert({
        anime_id: input.animeId,
        author_id: input.authorId,
        author_name: input.authorName,
        posted_at: input.postedAt,
        episodes_seen: input.episodesSeen,
        overall: input.overall,
        story: input.story,
        animation: input.animation,
        sound: input.sound,
        character: input.character,
        enjoyment: input.enjoyment,
        body: input.body,
        provenance: "member",
      })
      .select("*")
      .single();
    if (error) return fail<Review>(error, error.code === "23505" ? "You have already reviewed this anime." : "Could not save your review.");
    return { ok: true as const, value: toReview(data) };
  }

  async listRecommendations(animeId?: number) {
    const sb = await this.client();
    let q = sb.from("recommendations").select("*").eq("provenance", "member");
    if (animeId !== undefined) q = q.or(`from_id.eq.${animeId},to_id.eq.${animeId}`);
    const { data } = await q;
    return (data ?? []).map(toRec);
  }

  async createRecommendation(input: Omit<Recommendation, "id" | "recordedAt">) {
    const sb = await this.client();
    const { data, error } = await sb
      .from("recommendations")
      .insert({
        from_id: input.fromId,
        to_id: input.toId,
        author_id: input.authorId,
        author_name: input.authorName,
        reason: input.reason,
        posted_at: input.postedAt,
        provenance: "member",
      })
      .select("*")
      .single();
    if (error) return fail<Recommendation>(error, error.code === "23505" ? "You have already made this recommendation." : "Could not save your recommendation.");
    return { ok: true as const, value: toRec(data) };
  }

  async listFriends(userId: string): Promise<Friendship[]> {
    const sb = await this.client();
    const { data } = await sb.from("friendships").select("*").eq("user_id", userId);
    return (data ?? []).map((r) => ({ userId: r.user_id as string, friendName: r.friend_name as string, since: r.since as string }));
  }

  async setFriend(userId: string, friendName: string, on: boolean, since: string) {
    const sb = await this.client();
    if (on) await sb.from("friendships").upsert({ user_id: userId, friend_name: friendName, since });
    else await sb.from("friendships").delete().eq("user_id", userId).ilike("friend_name", likeExact(friendName));
  }
}
