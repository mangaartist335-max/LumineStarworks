import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AS_OF_COOKIE, AS_OF_PARAM, parseAsOfInput } from "@/lib/time";
import { supabaseConfig } from "@/lib/env";

// 1. `?asof=2013-10-06` (or a full timestamp) travels to that moment: the
//    choice is saved in a cookie and the clean URL is loaded.
// 2. In Supabase mode, refresh the auth session cookie on every request.
export async function proxy(request: NextRequest) {
  const asofParam = request.nextUrl.searchParams.get(AS_OF_PARAM);
  if (asofParam !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete(AS_OF_PARAM);
    const response = NextResponse.redirect(url);
    const parsed = parseAsOfInput(asofParam);
    if (parsed) {
      response.cookies.set(AS_OF_COOKIE, parsed, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    }
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
