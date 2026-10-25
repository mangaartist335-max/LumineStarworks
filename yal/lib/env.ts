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
