export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentAlt: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  accentSoft: string;
  overlay: string;
}

export const dark: Palette = {
  background: "#08090D",
  surface: "#111319",
  surfaceAlt: "#171A22",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "#F4F5F7",
  muted: "#A0A4B2",
  faint: "#6D7280",
  accent: "#5B7CFA",
  accentAlt: "#9163F5",
  onAccent: "#FFFFFF",
  success: "#34D399",
  warning: "#F6C453",
  danger: "#F2685C",
  successSoft: "rgba(52,211,153,0.14)",
  warningSoft: "rgba(246,196,83,0.14)",
  dangerSoft: "rgba(242,104,92,0.14)",
  accentSoft: "rgba(91,124,250,0.16)",
  overlay: "rgba(0,0,0,0.6)",
};

export const light: Palette = {
  background: "#F7F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F0F1F6",
  border: "rgba(15,18,30,0.08)",
  borderStrong: "rgba(15,18,30,0.16)",
  text: "#12141C",
  muted: "#5C6170",
  faint: "#8A8F9C",
  accent: "#4F6EF5",
  accentAlt: "#8455EE",
  onAccent: "#FFFFFF",
  success: "#0E9F6E",
  warning: "#B7791F",
  danger: "#E5484D",
  successSoft: "rgba(14,159,110,0.1)",
  warningSoft: "rgba(183,121,31,0.1)",
  dangerSoft: "rgba(229,72,77,0.1)",
  accentSoft: "rgba(79,110,245,0.1)",
  overlay: "rgba(10,12,20,0.45)",
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 };
