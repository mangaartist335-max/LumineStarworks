"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { getAnime } from "@/lib/catalog";
import { firstError, listEntrySchema } from "@/lib/validation";
import { formatDateTime, happened } from "@/lib/time";
import { LIST_STATUSES, type ListStatus } from "@/lib/store/types";
import type { FormState } from "./auth";

async function requireAccount(next: string) {
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(next)}`);
  return { viewer, account: viewer.account };
}

/** One-click add from an anime page. */
export async function quickAddAction(formData: FormData) {
  const animeId = Number(formData.get("animeId"));
  const { viewer, account } = await requireAccount(`/anime/${animeId}`);
  const anime = getAnime(animeId, viewer.asOf);
  if (!anime || !happened(account.joinedAt, viewer.asOf)) return;
  const statusRaw = String(formData.get("status") ?? "Plan to Watch");
  const status: ListStatus = (LIST_STATUSES as readonly string[]).includes(statusRaw) ? (statusRaw as ListStatus) : "Plan to Watch";
  const store = getStore();
  const existing = await store.getListEntry(account.id, animeId);
  await store.saveListEntry({
    userId: account.id,
    animeId,
    status,
    episodesWatched: existing?.episodesWatched ?? 0,
    score: existing?.score ?? null,
    startDate: existing?.startDate ?? null,
    finishDate: existing?.finishDate ?? null,
    notes: existing?.notes ?? "",
    updatedAt: viewer.asOf,
  });
  refresh();
}

export async function saveListEntryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = listEntrySchema.safeParse({
    animeId: formData.get("animeId"),
    status: formData.get("status"),
    episodesWatched: formData.get("episodesWatched") || "0",
    score: String(formData.get("score") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    finishDate: String(formData.get("finishDate") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const { viewer, account } = await requireAccount(`/ownlist/anime/${d.animeId}/edit`);
  if (!happened(account.joinedAt, viewer.asOf)) {
    return { error: `Your account joined YAL on ${formatDateTime(account.joinedAt)}. Travel to a date after that to edit your list.` };
  }
  const anime = getAnime(d.animeId, viewer.asOf);
  if (!anime) return { error: "That anime is not in the database at this point in time." };
  if (anime.episodesPlanned !== null && d.episodesWatched > anime.episodesPlanned) {
    return { error: `This anime has ${anime.episodesPlanned} episodes.` };
  }
  if (d.startDate && d.finishDate && d.finishDate < d.startDate) return { error: "The finish date is before the start date." };
  const result = await getStore().saveListEntry({
    userId: account.id,
    animeId: d.animeId,
    status: d.status,
    episodesWatched: d.status === "Completed" && anime.episodesPlanned !== null ? anime.episodesPlanned : d.episodesWatched,
    score: d.score,
    startDate: d.startDate,
    finishDate: d.finishDate,
    notes: d.notes,
    updatedAt: viewer.asOf,
  });
  if (!result.ok) return { error: result.error };
  redirect(`/animelist/${encodeURIComponent(account.username)}?updated=${d.animeId}`);
}

export async function removeListEntryAction(formData: FormData) {
  const animeId = Number(formData.get("animeId"));
  const { account } = await requireAccount(`/ownlist/anime/${animeId}/edit`);
  await getStore().removeListEntry(account.id, animeId);
  redirect(`/animelist/${encodeURIComponent(account.username)}`);
}

/** +1 episode button on the list page. */
export async function incrementEpisodeAction(formData: FormData) {
  const animeId = Number(formData.get("animeId"));
  const { viewer, account } = await requireAccount(`/animelist`);
  const store = getStore();
  const entry = await store.getListEntry(account.id, animeId);
  const anime = getAnime(animeId, viewer.asOf);
  if (!entry || !anime || !happened(account.joinedAt, viewer.asOf)) return;
  const max = anime.episodesPlanned ?? Infinity;
  const episodesWatched = Math.min(entry.episodesWatched + 1, max);
  const status: ListStatus = episodesWatched === max ? "Completed" : entry.status === "Plan to Watch" ? "Watching" : entry.status;
  await store.saveListEntry({ ...entry, episodesWatched, status, updatedAt: viewer.asOf });
  refresh();
}

