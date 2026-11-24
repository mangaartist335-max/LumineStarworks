import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Tells the user's phone that a background job finished. The mobile app
 * saves its Expo push token on the user's profile; RLS means this client can
 * only read the signed-in user's own token. Never throws: a missing token,
 * an older database without the column, or a network hiccup just means no
 * notification.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  message: { title: string; body: string; projectId: string }
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .maybeSingle<{ expo_push_token: string | null }>();
    const token = data?.expo_push_token;
    if (error || !token || !/^Expo(nent)?PushToken\[.+\]$/.test(token)) return;

    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body,
        sound: "default",
        data: { url: `buildbrief://project/${message.projectId}` },
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.warn("[push.notifyUser]", error instanceof Error ? error.message : error);
  }
}
