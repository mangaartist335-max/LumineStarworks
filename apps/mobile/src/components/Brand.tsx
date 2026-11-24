import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

export function LogoMark({ size = 44 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.accent, colors.accentAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: "center", justifyContent: "center" }}
    >
      <AppText style={{ color: "#fff", fontWeight: "900", fontSize: size * 0.5 }} allowFontScaling={false}>
        B
      </AppText>
    </LinearGradient>
  );
}

export function Wordmark() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <LogoMark size={34} />
      <AppText variant="heading">BuildBrief</AppText>
    </View>
  );
}
