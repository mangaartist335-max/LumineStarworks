import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export function EmptyState({
  emoji,
  title,
  body,
  actionTitle,
  onAction,
}: {
  emoji: string;
  title: string;
  body: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ alignItems: "center", gap: 10, paddingVertical: 36, paddingHorizontal: 20, borderRadius: radius.lg, borderWidth: 1, borderStyle: "dashed", borderColor: colors.borderStrong }}>
      <AppText style={{ fontSize: 44 }}>{emoji}</AppText>
      <AppText variant="heading" align="center">{title}</AppText>
      <AppText variant="body" color="muted" align="center">{body}</AppText>
      {actionTitle && onAction ? <Button title={actionTitle} onPress={onAction} style={{ marginTop: 8 }} icon="sparkles" /> : null}
    </View>
  );
}

export function Banner({ tone = "neutral", icon, text }: { tone?: "neutral" | "danger" | "success" | "warning"; icon?: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, radius } = useTheme();
  const bg = { neutral: colors.surfaceAlt, danger: colors.dangerSoft, success: colors.successSoft, warning: colors.warningSoft }[tone];
  const fg = { neutral: colors.muted, danger: colors.danger, success: colors.success, warning: colors.warning }[tone];
  return (
    <View accessibilityRole="alert" style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: bg, borderRadius: radius.md, padding: 12 }}>
      {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginTop: 1 }} /> : null}
      <AppText variant="caption" style={{ color: fg, flex: 1, fontSize: 14 }}>{text}</AppText>
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
      <AppText variant="heading" accessibilityRole="header">{title}</AppText>
      {action && onAction ? (
        <AppText variant="bodyStrong" style={{ color: colors.accent }} onPress={onAction} accessibilityRole="button">
          {action}
        </AppText>
      ) : null}
    </View>
  );
}
