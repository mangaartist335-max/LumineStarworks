import { View } from "react-native";
import { STATUS_LABELS, type ProjectStatus } from "@/shared/types";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

type Tone = "accent" | "success" | "warning" | "danger" | "neutral";

export function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const { colors, radius } = useTheme();
  const map: Record<Tone, [string, string]> = {
    accent: [colors.accentSoft, colors.accent],
    success: [colors.successSoft, colors.success],
    warning: [colors.warningSoft, colors.warning],
    danger: [colors.dangerSoft, colors.danger],
    neutral: [colors.surfaceAlt, colors.muted],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start" }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      <AppText variant="caption" style={{ color: fg, fontWeight: "700", fontSize: 12 }}>
        {label}
      </AppText>
    </View>
  );
}

const STATUS_TONE: Record<ProjectStatus, Tone> = {
  planning: "neutral",
  ready_to_build: "accent",
  building: "warning",
  completed: "success",
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return <Pill label={STATUS_LABELS[status]} tone={STATUS_TONE[status]} />;
}
