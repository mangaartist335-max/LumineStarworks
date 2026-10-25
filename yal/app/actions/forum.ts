"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { archiveMaxNumber, getThread } from "@/lib/forum";
import { getBoard } from "@/lib/archive";
import { getAnime } from "@/lib/catalog";
import { firstError, postBodySchema, threadTitleSchema } from "@/lib/validation";
import { formatDateTime, happened } from "@/lib/time";
import type { FormState } from "./auth";

/** Members can act only from their join date onward in the archive timeline. */
async function requireMember(next: string) {
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(next)}`);
  const account = viewer.account;
  if (!happened(account.joinedAt, viewer.asOf)) {
    return {
      viewer,
      account,
      error: `Your account joined YAL on ${formatDateTime(account.joinedAt)}. Travel to a date after that to post.`,
    };
  }
  return { viewer, account, error: null as string | null };
}

export async function postReplyAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const threadId = String(formData.get("threadId") ?? "");
  const { viewer, account, error } = await requireMember(`/forum/thread/${threadId}`);
  if (error) return { error };
  const thread = await getThread(threadId, viewer.asOf);
  if (!thread) return { error: "This topic does not exist at this point in the archive." };
  if (thread.locked) return { error: "This topic is locked." };
  const body = postBodySchema.safeParse(formData.get("body"));
  if (!body.success) return { error: firstError(body.error) };

  const store = getStore();
  const result = await store.createPost(
    { threadId, authorId: account.id, authorName: account.username, body: body.data, postedAt: viewer.asOf },
    archiveMaxNumber(threadId),
  );
  if (!result.ok) return { error: result.error };
  if (formData.get("notify")) await store.followThread(account.id, threadId, true);
  redirect(`/forum/thread/${threadId}?page=last#p${result.value.number}`);
}

export async function createThreadAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const board = String(formData.get("board") ?? "");
  const { viewer, account, error } = await requireMember(`/forum/new?board=${board}`);
  if (error) return { error };
  if (!getBoard(board) || board === "episode") return { error: "Please choose a board. Episode threads are opened by YALBot." };
  const title = threadTitleSchema.safeParse(formData.get("title"));
  if (!title.success) return { error: firstError(title.error) };
  const body = postBodySchema.safeParse(formData.get("body"));
  if (!body.success) return { error: firstError(body.error) };
  const animeRaw = Number(formData.get("animeId") || 0);
  const animeId = animeRaw && getAnime(animeRaw, viewer.asOf) ? animeRaw : null;

  const store = getStore();
  const result = await store.createThread(
    { board, title: title.data, authorId: account.id, authorName: account.username, animeId, createdAt: viewer.asOf },
    body.data,
  );
  if (!result.ok) return { error: result.error };
  await store.followThread(account.id, result.value.id, true);
  redirect(`/forum/thread/${result.value.id}`);
}

export async function toggleFollowAction(formData: FormData) {
  const threadId = String(formData.get("threadId") ?? "");
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/forum/thread/${threadId}`)}`);
  if (!(await getThread(threadId, viewer.asOf))) return;
  await getStore().followThread(viewer.account.id, threadId, formData.get("follow") === "1");
  refresh();
}

export async function reportPostAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const threadId = String(formData.get("threadId") ?? "");
  const postKey = String(formData.get("postKey") ?? "");
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/forum/report?thread=${threadId}&post=${postKey}`)}`);
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) return { error: "Please tell the moderators what's wrong (at least 5 characters)." };
  if (reason.length > 1000) return { error: "Please keep reports under 1,000 characters." };
  if (!(await getThread(threadId, viewer.asOf))) return { error: "This topic does not exist at this point in the archive." };
  const result = await getStore().reportPost({
    reporterId: viewer.account.id,
    threadId,
    postKey,
    reason,
    reportedAt: viewer.asOf,
  });
  if (!result.ok) return { error: result.error };
  return { ok: "Thanks! Your report was sent to the moderators." };
}
