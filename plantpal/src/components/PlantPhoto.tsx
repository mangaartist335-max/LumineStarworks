import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../utils/theme";

interface Props {
  uri: string | null;
  size: number;
  rounded?: number;
  style?: StyleProp<ViewStyle>;
}

/** A plant photo, or a friendly leaf placeholder when there isn't one. */
export function PlantPhoto({ uri, size, rounded = 12, style }: Props) {
  const frame = { width: size, height: size, borderRadius: rounded };
  if (uri) {
    return (
      <View style={[frame, styles.clip, style]}>
        <Image source={{ uri }} alt="" style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
    );
  }
  return (
    <View style={[frame, styles.placeholder, style]}>
      <Text style={{ fontSize: size * 0.42 }}>🪴</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: "hidden", backgroundColor: colors.placeholder },
  placeholder: {
    backgroundColor: colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
  },
});
