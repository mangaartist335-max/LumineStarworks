import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type MotionMode = "system" | "reduced" | "full";

export interface Settings {
  themeMode: ThemeMode;
  soundEnabled: boolean;
  /** 0..1 */
  soundVolume: number;
  hapticsEnabled: boolean;
  /** Extra text size on top of the phone's own text-size setting. */
  textScale: 1 | 1.15 | 1.3;
  motion: MotionMode;
  notificationsEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  themeMode: "system",
  soundEnabled: true,
  soundVolume: 1,
  hapticsEnabled: true,
  textScale: 1,
  motion: "system",
  notificationsEnabled: true,
};

const KEY = "bb-settings";

// A module-level copy so non-React code (sounds, haptics) can read settings.
let current: Settings = DEFAULT_SETTINGS;
export const getSettings = () => current;

interface SettingsContextValue {
  settings: Settings;
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const loaded = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
          current = loaded;
          setSettings(loaded);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      current = next;
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, ready, update }), [settings, ready, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
