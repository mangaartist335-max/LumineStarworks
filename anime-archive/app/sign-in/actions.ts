"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOCAL_EDITOR_COOKIE } from "@/lib/auth-constants";
import { localEditorToken } from "@/lib/auth";
import { archiveMode, localEditorPasscode } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

/** Only allow redirects back into this site. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const next = safeNext(formData.get("next"));

  if (archiveMode() === "local") {
    const expected = localEditorPasscode();
    if (!expected) return { error: "Local editing is turned off. Set LOCAL_EDITOR_PASSCODE to enable it." };
    if (formData.get("passcode") !== expected) return { error: "That passcode doesn't match. Check LOCAL_EDITOR_PASSCODE in your environment." };
    (await cookies()).set(LOCAL_EDITOR_COOKIE, localEditorToken(expected), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    redirect(next);
  }

  const parsed = z.object({ email: z.email("Enter a valid email address"), password: z.string().min(1, "Enter your password") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (archiveMode() === "local") return { error: "Accounts are only needed when the archive runs on Supabase." };
  const parsed = z
    .object({
      display_name: z.string().trim().min(1, "Tell us what to call you").max(80),
      email: z.email("Enter a valid email address"),
      password: z.string().min(8, "Use at least 8 characters"),
    })
    .safeParse({ display_name: formData.get("display_name"), email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createSessionClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.display_name }, emailRedirectTo: `${origin}/auth/callback?next=/admin` },
  });
  if (error) return { error: error.message };
  if (!data.session) return { message: "Check your inbox to confirm your email, then sign in." };
  redirect("/admin");
}

export async function signOut() {
  if (archiveMode() === "local") {
    (await cookies()).delete(LOCAL_EDITOR_COOKIE);
  } else {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
