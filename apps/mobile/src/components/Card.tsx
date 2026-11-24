import { View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

export function Card({ style, padded = true, ...props }: ViewProps & { padded?: boolean; style?: StyleProp<ViewStyle> }) {
  const { colors, radius } = useTheme();
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    />
  );
}
