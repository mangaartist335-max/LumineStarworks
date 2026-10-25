"use server";

import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { animeUrl, getAnime } from "@/lib/catalog";
import { firstError, recommendationSchema, reviewSchema } from "@/lib/validation";
import { formatDateTime, happened } from "@/lib/time";
import type { FormState } from "./auth";

async function requireMember(next: string) {
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(next)}`);
  const error = happened(viewer.account.joinedAt, viewer.asOf)
    ? null
    : `Your account joined YAL on ${formatDateTime(viewer.account.joinedAt)}. Travel to a date after that to post.`;
  return { viewer, account: viewer.account, error };
}

export async function createReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { viewer, account, error } = await requireMember(`/anime/${d.animeId}`);
  if (error) return { error };
  const anime = getAnime(d.animeId, viewer.asOf);
  if (!anime) return { error: "That anime is not in the database at this point in time." };
  if (anime.episodesPlanned !== null && d.episodesSeen > anime.episodesPlanned) return { error: `This anime has ${anime.episodesPlanned} episodes.` };
  const result = await getStore().createReview({ ...d, authorId: account.id, authorName: account.username, postedAt: viewer.asOf });
  if (!result.ok) return { error: result.error };
  redirect(`${animeUrl(anime, "reviews")}#review-${result.value.id}`);
}

export async function createRecommendationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = recommendationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  if (d.fromId === d.toId) return { error: "Pick a different anime to recommend." };
  const { viewer, account, error } = await requireMember(`/anime/${d.fromId}`);
  if (error) return { error };
  const from = getAnime(d.fromId, viewer.asOf);
  const to = getAnime(d.toId, viewer.asOf);
  if (!from || !to) return { error: "Both anime must be in the database at this point in time." };
  const result = await getStore().createRecommendation({ ...d, authorId: account.id, authorName: account.username, postedAt: viewer.asOf });
  if (!result.ok) return { error: result.error };
  redirect(animeUrl(from, "recommendations"));
}
