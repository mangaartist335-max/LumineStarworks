import { NextResponse } from "next/server";
import { createSessionClient } from "@/lib/supabase/server";

/** Completes email confirmation links from Supabase Auth. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(target, url.origin));
  }
  return NextResponse.redirect(new URL("/sign-in?error=confirmation", url.origin));
}
