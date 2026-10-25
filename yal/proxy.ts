import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AS_OF_COOKIE, AS_OF_PARAM, parseAsOfInput } from "@/lib/time";
import { EMBED_COOKIE, EMBED_PARAM } from "@/lib/embed";
import { supabaseConfig } from "@/lib/env";

// 1. `?asof=2013-10-06` (or a full timestamp) travels to that moment: the
//    choice is saved in a cookie and the clean URL is loaded.
//    `?embed=1` (or `0`) does the same for embedded mode, used when the
//    Connected Desktop browser shows YAL in a frame.
// 2. In Supabase mode, refresh the auth session cookie on every request.
export async function proxy(request: NextRequest) {
  const asofParam = request.nextUrl.searchParams.get(AS_OF_PARAM);
  const embedParam = request.nextUrl.searchParams.get(EMBED_PARAM);
  if (asofParam !== null || embedParam !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(AS_OF_PARAM);
    url.searchParams.delete(EMBED_PARAM);
    const response = NextResponse.redirect(url);
    const parsed = asofParam !== null ? parseAsOfInput(asofParam) : null;
    if (parsed) {
      response.cookies.set(AS_OF_COOKIE, parsed, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    }
    if (embedParam === "1") response.cookies.set(EMBED_COOKIE, "1", { path: "/", sameSite: "lax" });
    if (embedParam === "0") response.cookies.delete(EMBED_COOKIE);
    return response;
  }

  let response = NextResponse.next({ request });
  const cfg = supabaseConfig();
  if (cfg) {
    const supabase = createServerClient(cfg.url, cfg.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    });
    await supabase.auth.getUser();
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|avatars.svg|covers/).*)"],
};
