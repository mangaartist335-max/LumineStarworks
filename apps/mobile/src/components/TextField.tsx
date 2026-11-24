import { TextInput, View, type TextInputProps } from "react-native";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";

export interface TextFieldProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, multiline, style, ...props }: TextFieldProps) {
  const { colors, radius, textScale } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <AppText variant="bodyStrong">{label}</AppText>
          {hint ? <AppText variant="caption" color="faint">{hint}</AppText> : null}
        </View>
      ) : null}
      <TextInput
        placeholderTextColor={colors.faint}
        accessibilityLabel={label}
        multiline={multiline}
        {...props}
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.danger : colors.borderStrong,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 0,
            minHeight: multiline ? 120 : 50,
            fontSize: 16 * textScale,
            color: colors.text,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
      />
      {error ? <AppText variant="caption" color="danger">{error}</AppText> : null}
    </View>
  );
}
