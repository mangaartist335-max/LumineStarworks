import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "../env";

export async function createSupabaseServerClient() {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error("Supabase is not configured");
  const cookieStore = await cookies();
  return createServerClient(cfg.url, cfg.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
