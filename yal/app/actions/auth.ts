"use server";

import { redirect } from "next/navigation";
import { getStore } from "@/lib/store";
import { getViewer } from "@/lib/viewer";
import { getArchiveMember } from "@/lib/archive";
import { firstError, registerSchema, RESERVED_NAMES, safeNext } from "@/lib/validation";

export type FormState = { error?: string; ok?: string } | null;

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const login = String(formData.get("login") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!login || !password) return { error: "Please fill in both fields." };
  const result = await getStore().signIn(login, password);
  if (!result.ok) return { error: result.error };
  redirect(safeNext(formData.get("next"), `/profile/${encodeURIComponent(result.value.username)}`));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    avatar: formData.get("avatar"),
    terms: formData.get("terms"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (formData.get("password") !== formData.get("password2")) return { error: "The two passwords don't match." };
  const { username, email, password, avatar } = parsed.data;
  if (RESERVED_NAMES.includes(username.toLowerCase()) || getArchiveMember(username)) {
    return { error: "That username is already taken." };
  }
  const { asOf } = await getViewer();
  const result = await getStore().register({ username, email, password, avatar, joinedAt: asOf });
  if (!result.ok) return { error: result.error };
  redirect(`/profile/${encodeURIComponent(result.value.username)}?welcome=1`);
}

export async function signOutAction() {
  await getStore().signOut();
  redirect("/");
}
