// Environment helpers shared by server code, the proxy and scripts.

export type ArchiveMode = "local" | "supabase";

export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || url.includes("your-project")) return null;
  return { url, key };
}

/**
 * The archive runs against Supabase when credentials are present, and falls
 * back to the local development store (seed data + a JSON file) otherwise.
 * `ARCHIVE_DATA_MODE=local` forces local mode even when Supabase is configured.
 */
export function archiveMode(): ArchiveMode {
  if (process.env.ARCHIVE_DATA_MODE === "local") return "local";
  return supabaseConfig() ? "supabase" : "local";
}

export function localEditorPasscode(): string | null {
  const configured = process.env.LOCAL_EDITOR_PASSCODE?.trim();
  if (configured) return configured;
  // A friendly default for `npm run dev`; production builds must set their own.
  return process.env.NODE_ENV === "production" ? null : "starworks";
}
