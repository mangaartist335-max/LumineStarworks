import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { archiveMode, supabaseConfig } from "@/lib/env";
import { LOCAL_EDITOR_COOKIE } from "@/lib/auth-constants";

const PROTECTED_PREFIXES = ["/admin"];

function redirectToSignIn(request: NextRequest) {
  const url = new URL("/sign-in", request.url);
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

/**
 * Refreshes the Supabase session cookie and does a quick, optimistic check
 * for the admin area. The real authorization check happens again on the
 * server (admin layout and every Server Action) — this only saves a round trip.
 */
export async function updateSession(request: NextRequest) {
  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  if (archiveMode() === "local") {
    if (isProtected && !request.cookies.get(LOCAL_EDITOR_COOKIE)) return redirectToSignIn(request);
    return NextResponse.next({ request });
  }

  const config = supabaseConfig()!;
  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected) return redirectToSignIn(request);
  return response;
}
