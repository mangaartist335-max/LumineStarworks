import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { LOCAL_EDITOR_COOKIE } from "@/lib/auth-constants";
import { archiveMode, localEditorPasscode } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

export type ViewerRole = "viewer" | "editor" | "admin";

export interface Viewer {
  mode: "local" | "supabase";
  signedIn: boolean;
  name: string | null;
  email: string | null;
  role: ViewerRole;
  canEdit: boolean;
}

const ANONYMOUS = (mode: Viewer["mode"]): Viewer => ({ mode, signedIn: false, name: null, email: null, role: "viewer", canEdit: false });

/** The signed token stored in the local-editor cookie. Changing the passcode signs everyone out. */
export function localEditorToken(passcode: string): string {
  return createHmac("sha256", `${passcode}:${process.env.LOCAL_SESSION_SECRET ?? "lumine-starworks"}`).update("local-editor").digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const getViewer = cache(async (): Promise<Viewer> => {
  const mode = archiveMode();

  if (mode === "local") {
    const passcode = localEditorPasscode();
    const token = (await cookies()).get(LOCAL_EDITOR_COOKIE)?.value;
    if (passcode && token && safeEqual(token, localEditorToken(passcode))) {
      return { mode, signedIn: true, name: "Local editor", email: null, role: "admin", canEdit: true };
    }
    return ANONYMOUS(mode);
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return ANONYMOUS(mode);

  const { data: profile } = await supabase.from("archive_profiles").select("display_name, role").eq("id", user.id).maybeSingle();
  const role = (profile?.role as ViewerRole | undefined) ?? "viewer";
  return {
    mode,
    signedIn: true,
    name: profile?.display_name ?? user.email ?? "Archive member",
    email: user.email ?? null,
    role,
    canEdit: role === "editor" || role === "admin",
  };
});

/** For pages: send visitors without editor access to the sign-in page. */
export async function requireEditorPage(next = "/admin"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.signedIn) redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  return viewer;
}

export class AuthorizationError extends Error {}

/** For Server Actions: throw unless the visitor may edit the archive. */
export async function requireEditor(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer.canEdit) throw new AuthorizationError("You need editor access to change the archive.");
  return viewer;
}
