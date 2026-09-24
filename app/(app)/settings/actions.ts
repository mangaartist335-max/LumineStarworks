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
