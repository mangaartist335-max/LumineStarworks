import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Supabase keeps the session (access + refresh token) in this storage.
// SecureStore uses the iOS Keychain / Android Keystore, but each value is
// limited to about 2 KB, and sessions can be larger, so long values are split
// into chunks.
const CHUNK = 1800;

function safeKey(key: string) {
  return key.replace(/[^A-Za-z0-9._-]/g, "_");
}

// Web preview only: the browser has no keychain, so fall back to localStorage.
const webStorage = {
  getItem: async (key: string) => (typeof localStorage === "undefined" ? null : localStorage.getItem(key)),
  setItem: async (key: string, value: string) => {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
  },
};

const nativeStorage = {
  async getItem(key: string): Promise<string | null> {
    const base = safeKey(key);
    const count = await SecureStore.getItemAsync(`${base}__n`);
    if (!count) return SecureStore.getItemAsync(base);
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${base}__${i}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    const base = safeKey(key);
    await this.removeItem(key);
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(base, value);
      return;
    }
    const total = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < total; i++) {
      await SecureStore.setItemAsync(`${base}__${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${base}__n`, String(total));
  },

  async removeItem(key: string): Promise<void> {
    const base = safeKey(key);
    const count = await SecureStore.getItemAsync(`${base}__n`);
    if (count) {
      for (let i = 0; i < Number(count); i++) await SecureStore.deleteItemAsync(`${base}__${i}`);
      await SecureStore.deleteItemAsync(`${base}__n`);
    }
    await SecureStore.deleteItemAsync(base);
  },
};

export const secureStorage = Platform.OS === "web" ? webStorage : nativeStorage;
