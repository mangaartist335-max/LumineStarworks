// Environment detection. Supabase mode turns on only when both public
// settings are present and not left as the template placeholders.

export function supabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return null;
  if (url.includes("your-project") || key.startsWith("your-")) return null;
  return { url, key };
}

export function storageMode(): "local" | "supabase" {
  return supabaseConfig() ? "supabase" : "local";
}

/**
 * Origins allowed to show YAL inside a frame (the Connected Desktop browser).
 * Comma-separated; defaults to the desktop's local development addresses.
 * Trailing slashes are dropped, so a pasted "https://example.vercel.app/" works.
 */
export function embedOrigins(): string[] {
  const raw = process.env.NEXT_PUBLIC_YAL_EMBED_ORIGINS?.trim() || "http://localhost:3000,http://127.0.0.1:3000";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter((s) => /^https?:\/\/[^\s/]+$/.test(s));
}
