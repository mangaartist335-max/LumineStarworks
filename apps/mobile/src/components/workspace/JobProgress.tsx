import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useTheme } from "@/theme";
import { AppText } from "../AppText";
import { LogoMark } from "../Brand";
import { Card } from "../Card";
import { ProgressBar } from "../ProgressBar";

/**
 * Progress for a background job. The status itself is real (read from the
 * server); the step text and bar pace the typical duration so the wait
 * feels alive, and stop short of 100% until the server says it's done.
 */
export function JobProgress({ title, steps, startedAt, typicalSeconds }: { title: string; steps: string[]; startedAt: number | null; typicalSeconds: number }) {
  const { reduceMotion } = useTheme();
  const [elapsed, setElapsed] = useState(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const begin = startedAt ?? Date.now();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - begin) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  useEffect(() => {
    if (!reduceMotion) pulse.set(withRepeat(withTiming(1.08, { duration: 900 }), -1, true));
  }, [reduceMotion, pulse]);
  const logo = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  const ratio = Math.min(0.94, 0.06 + (elapsed / typicalSeconds) * 0.85);
  const step = Math.min(steps.length - 1, Math.floor((elapsed / typicalSeconds) * steps.length));
  const mins = Math.floor(elapsed / 60);
  const secs = String(elapsed % 60).padStart(2, "0");

  return (
    <Card style={{ alignItems: "center", gap: 16, paddingVertical: 28 }} accessibilityLiveRegion="polite">
      <Animated.View style={logo}>
        <LogoMark size={64} />
      </Animated.View>
      <AppText variant="heading" align="center">{title}</AppText>
      <Animated.View key={step} entering={reduceMotion ? undefined : FadeIn.duration(300)}>
        <AppText color="muted" align="center">{steps[step]}</AppText>
      </Animated.View>
      <View style={{ alignSelf: "stretch" }}>
        <ProgressBar value={ratio} />
      </View>
      <AppText variant="caption" color="faint" align="center">
        {mins}:{secs} · Feel free to leave. We’ll let you know when it’s ready.
      </AppText>
    </Card>
  );
}
