import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { feedback } from "@/lib/feedback";
import type { Template } from "@/lib/templates";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";

export function TemplateTile({ template, width }: { template: Template; width?: number }) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${template.title} template. ${template.tagline}`}
      onPress={() => {
        feedback.tap();
        router.push({ pathname: "/(tabs)/create", params: { template: template.id, t: String(Date.now()) } });
      }}
      style={{ width, flex: width ? undefined : 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: "hidden" }}
    >
      <LinearGradient colors={template.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 74, alignItems: "center", justifyContent: "center" }}>
        <AppText style={{ fontSize: 34 }} allowFontScaling={false}>{template.emoji}</AppText>
      </LinearGradient>
      <View style={{ padding: 12, gap: 2 }}>
        <AppText variant="bodyStrong" numberOfLines={1}>{template.title}</AppText>
        <AppText variant="caption" numberOfLines={2}>{template.tagline}</AppText>
      </View>
    </PressableScale>
  );
}
