import "server-only";
import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createClient as createCookieClient } from "@/lib/supabase/server";

export interface RequestAuth {
  supabase: SupabaseClient;
  user: User | null;
}

/**
 * Authenticates an API request from either client:
 * - The website sends its session in cookies.
 * - The mobile app sends `Authorization: Bearer <access token>`.
 *
 * A bearer token is verified with Supabase Auth (getUser checks it against
 * the auth server, not just its signature), and the returned client sends
 * that same token to the database, so Row Level Security applies exactly as
 * it does for the website: users can only ever touch their own rows.
 */
export async function getRequestAuth(request: Request): Promise<RequestAuth> {
  const header = request.headers.get("authorization");
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (token) {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }
    );
    const { data, error } = await supabase.auth.getUser(token);
    return { supabase, user: error ? null : data.user };
  }

  const supabase = await createCookieClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}
