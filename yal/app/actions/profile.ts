"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { getAnime, getCharacter, getManga, getPerson } from "@/lib/catalog";
import { findMember } from "@/lib/members";
import { firstError, profileSchema } from "@/lib/validation";
import type { Favorites } from "@/lib/store/types";
import type { FormState } from "./auth";

const KINDS: (keyof Favorites)[] = ["anime", "manga", "characters", "people"];

export async function toggleFavoriteAction(formData: FormData) {
  const kind = String(formData.get("kind")) as keyof Favorites;
  const id = Number(formData.get("id"));
  const back = String(formData.get("back") ?? "/");
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(back)}`);
  if (!KINDS.includes(kind) || !Number.isInteger(id)) return;
  const exists =
    kind === "anime" ? getAnime(id, viewer.asOf) : kind === "manga" ? getManga(id, viewer.asOf) : kind === "characters" ? getCharacter(id, viewer.asOf) : getPerson(id, viewer.asOf);
  if (!exists) return;
  await getStore().setFavorite(viewer.account.id, kind, id, formData.get("on") === "1");
  refresh();
}

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer.account) redirect("/login?next=/panel");
  const parsed = profileSchema.safeParse({
    avatar: formData.get("avatar"),
    about: formData.get("about") ?? "",
    location: formData.get("location") ?? "",
    timeZone: formData.get("timeZone"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const result = await getStore().updateProfile(viewer.account.id, parsed.data);
  if (!result.ok) return { error: result.error };
  return { ok: "Your profile has been saved." };
}

export async function toggleFriendAction(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const viewer = await getViewer();
  if (!viewer.account) redirect(`/login?next=${encodeURIComponent(`/profile/${name}`)}`);
  const member = await findMember(name, viewer.asOf);
  if (!member || member.name.toLowerCase() === viewer.account.username.toLowerCase()) return;
  await getStore().setFriend(viewer.account.id, member.name, formData.get("on") === "1", viewer.asOf);
  refresh();
}
