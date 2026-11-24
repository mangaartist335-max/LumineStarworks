import "react-native-url-polyfill/auto";
import { AppState } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";
import { secureStorage } from "./secureStorage";

// Same Supabase project as the website, so accounts and projects are shared.
// The session is persisted in secure storage and refreshed automatically.
export const supabase = createClient(SUPABASE_URL || "https://placeholder.supabase.co", SUPABASE_KEY || "placeholder", {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Only refresh tokens while the app is in the foreground (saves battery).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
