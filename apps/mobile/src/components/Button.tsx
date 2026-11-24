import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { feedback } from "@/lib/feedback";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { PressableScale } from "./PressableScale";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Plays the tap sound/haptic (default true). */
  withFeedback?: boolean;
  accessibilityHint?: string;
}

const HEIGHT: Record<Size, number> = { sm: 38, md: 48, lg: 56 };
const FONT: Record<Size, "caption" | "bodyStrong" | "subheading"> = { sm: "caption", md: "bodyStrong", lg: "subheading" };

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  fullWidth,
  style,
  withFeedback = true,
  accessibilityHint,
}: ButtonProps) {
  const { colors, radius } = useTheme();
  const inactive = disabled || loading;

  const fg =
    variant === "primary" ? colors.onAccent : variant === "danger" ? colors.danger : colors.text;
  const content = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : icon ? (
        <Ionicons name={icon} size={size === "sm" ? 16 : 19} color={fg} />
      ) : null}
      <AppText variant={FONT[size]} style={{ color: fg, fontWeight: "700" }} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );

  const shape: ViewStyle = {
    height: HEIGHT[size],
    borderRadius: size === "lg" ? radius.lg : radius.md,
    paddingHorizontal: size === "sm" ? 14 : 20,
    alignItems: "center",
    justifyContent: "center",
    opacity: inactive ? 0.55 : 1,
    alignSelf: fullWidth ? "stretch" : "auto",
  };

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={() => {
        if (withFeedback) feedback.tap();
        onPress?.();
      }}
      style={[fullWidth && { alignSelf: "stretch" }, style]}
    >
      {variant === "primary" ? (
        <LinearGradient
          colors={[colors.accent, colors.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[shape, styles.shadow, { shadowColor: colors.accent }]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            shape,
            variant === "secondary" && { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
            variant === "danger" && { backgroundColor: colors.dangerSoft, borderWidth: 1, borderColor: colors.danger + "55" },
          ]}
        >
          {content}
        </View>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  shadow: { shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
