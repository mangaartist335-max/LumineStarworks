import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseConfig } from "@/lib/env";

/** A Supabase client bound to the visitor's session cookies (server components, actions, route handlers). */
export async function createSessionClient() {
  const config = supabaseConfig();
  if (!config) throw new Error("Supabase is not configured.");
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component without a mutable cookie jar.
          // Safe to ignore because proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
