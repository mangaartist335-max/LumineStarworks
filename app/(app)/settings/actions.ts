"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface SettingsActionState {
  error: string | null;
  success: boolean;
}

export async function updateDisplayNameAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const displayName = String(formData.get("displayName") || "").trim();
  if (!displayName) {
    return { error: "Name cannot be empty.", success: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be signed in.", success: false };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) {
    return { error: "Couldn't update your name. Please try again.", success: false };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { error: null, success: true };
}

export async function updatePasswordAction(
  _prevState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false };
  }
  if (password !== confirm) {
    return { error: "Those passwords don't match.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: error.message, success: false };
  }
  return { error: null, success: true };
}

export async function deleteAccountAction(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[settings.deleteAccount]", error);
    return {
      error:
        error.code === "PGRST202"
          ? "Account deletion isn't set up yet. Run supabase/migrations/0005_mobile_app.sql in Supabase."
          : "Couldn't delete your account. Please try again.",
    };
  }
  await supabase.auth.signOut();
  return { error: null };
}
