import { useEffect } from "react";
import { type DimensionValue } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme";

export function Skeleton({ height = 16, width = "100%", radius = 8 }: { height?: number; width?: DimensionValue; radius?: number }) {
  const { colors, reduceMotion } = useTheme();
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    if (!reduceMotion) opacity.set(withRepeat(withTiming(1, { duration: 800 }), -1, true));
  }, [reduceMotion, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height, width, borderRadius: radius, backgroundColor: colors.surfaceAlt }, style]}
    />
  );
}

export function CardSkeleton() {
  const { colors, radius } = useTheme();
  return (
    <Animated.View
      style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }}
    >
      <Skeleton width="55%" height={18} />
      <Skeleton width="90%" />
      <Skeleton width="70%" />
    </Animated.View>
  );
}
