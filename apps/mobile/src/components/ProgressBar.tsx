import { useEffect } from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme";

export function ProgressBar({ value, height = 8 }: { value: number; height?: number }) {
  const { colors, reduceMotion } = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, value));
    progress.set(reduceMotion ? clamped : withTiming(clamped, { duration: 600 }));
  }, [value, reduceMotion, progress]);

  const fill = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height, borderRadius: height, backgroundColor: colors.surfaceAlt, overflow: "hidden" }}
    >
      <Animated.View style={[{ height: "100%" }, fill]}>
        <LinearGradient
          colors={[colors.accent, colors.accentAlt]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: height }}
        />
      </Animated.View>
    </View>
  );
}
