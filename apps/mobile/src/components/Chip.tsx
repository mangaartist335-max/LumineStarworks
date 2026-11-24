import { feedback } from "@/lib/feedback";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";

export function Chip({
  label,
  selected,
  onPress,
  emoji,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
}) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      onPress={() => {
        feedback.select();
        onPress?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.accentSoft : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
      }}
    >
      {emoji ? <AppText variant="body">{emoji}</AppText> : null}
      <AppText variant="caption" style={{ color: selected ? colors.accent : colors.text, fontWeight: "600" }}>
        {label}
      </AppText>
    </PressableScale>
  );
}
