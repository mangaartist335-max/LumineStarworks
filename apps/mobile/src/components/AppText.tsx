import { Text, type TextProps, type TextStyle } from "react-native";
import { useTheme } from "@/theme";

export type TextVariant = "display" | "title" | "heading" | "subheading" | "body" | "bodyStrong" | "caption" | "label" | "mono";

const VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -0.8 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800", letterSpacing: -0.5 },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: "700", letterSpacing: -0.3 },
  subheading: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  mono: { fontSize: 12.5, lineHeight: 18, fontFamily: "Menlo" },
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: "text" | "muted" | "faint" | "accent" | "danger" | "success" | "warning" | "onAccent";
  align?: TextStyle["textAlign"];
}

export function AppText({ variant = "body", color, align, style, ...props }: AppTextProps) {
  const { colors, textScale } = useTheme();
  const base = VARIANTS[variant];
  const resolvedColor =
    color === undefined
      ? variant === "caption" || variant === "label"
        ? colors.muted
        : colors.text
      : colors[color];
  return (
    <Text
      maxFontSizeMultiplier={1.8}
      {...props}
      style={[
        base,
        {
          color: resolvedColor,
          textAlign: align,
          fontSize: (base.fontSize ?? 15) * textScale,
          lineHeight: base.lineHeight ? base.lineHeight * textScale : undefined,
        },
        style,
      ]}
    />
  );
}
