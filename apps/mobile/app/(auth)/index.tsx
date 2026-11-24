import { router } from "expo-router";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AppText } from "@/components/AppText";
import { LogoMark } from "@/components/Brand";
import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme";

const POINTS = [
  { emoji: "💬", text: "Describe your idea in plain words" },
  { emoji: "🗺️", text: "Get a clear plan: features, screens and steps" },
  { emoji: "🔨", text: "Build a working app you can play with and share" },
];

export default function Welcome() {
  const { reduceMotion } = useTheme();
  const enter = (i: number) => (reduceMotion ? undefined : FadeInDown.delay(100 + i * 90).springify());
  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: "center", gap: 28 }}>
      <Animated.View entering={enter(0)} style={{ alignItems: "center", gap: 18 }}>
        <LogoMark size={72} />
        <AppText variant="display" align="center">
          From idea{"\n"}to application.
        </AppText>
        <AppText variant="body" color="muted" align="center">
          BuildBrief turns what you imagine into a real plan and a working app. No coding needed.
        </AppText>
      </Animated.View>
      <View style={{ gap: 12 }}>
        {POINTS.map((p, i) => (
          <Animated.View key={p.text} entering={enter(i + 1)} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
            <AppText style={{ fontSize: 22 }}>{p.emoji}</AppText>
            <AppText variant="bodyStrong" style={{ flex: 1 }}>{p.text}</AppText>
          </Animated.View>
        ))}
      </View>
      <Animated.View entering={enter(5)} style={{ gap: 10 }}>
        <Button title="Get started" size="lg" fullWidth icon="sparkles" onPress={() => router.push("/(auth)/sign-up")} />
        <Button title="I already have an account" variant="ghost" fullWidth onPress={() => router.push("/(auth)/sign-in")} />
      </Animated.View>
    </Screen>
  );
}
