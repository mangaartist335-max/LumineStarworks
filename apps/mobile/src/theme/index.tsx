import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSettings } from "@/lib/settings";
import { dark, light, radius, space, type Palette } from "./colors";

export interface Theme {
  colors: Palette;
  isDark: boolean;
  radius: typeof radius;
  space: typeof space;
  /** Multiply font sizes by this (user's in-app text size). */
  textScale: number;
  reduceMotion: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const systemReducedMotion = useReducedMotion();
  const { settings } = useSettings();

  const theme = useMemo<Theme>(() => {
    const isDark = settings.themeMode === "system" ? scheme !== "light" : settings.themeMode === "dark";
    const reduceMotion =
      settings.motion === "system" ? systemReducedMotion : settings.motion === "reduced";
    return {
      colors: isDark ? dark : light,
      isDark,
      radius,
      space,
      textScale: settings.textScale,
      reduceMotion,
    };
  }, [scheme, systemReducedMotion, settings.themeMode, settings.motion, settings.textScale]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
