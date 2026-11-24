// Public configuration (EXPO_PUBLIC_* values are inlined into the app at build
// time). Secrets never live here: AI and admin keys stay on the server.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://buildbrief-beta.vercel.app").replace(/\/$/, "");

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
