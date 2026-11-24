import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useState, type ReactNode } from "react";
import { Pressable, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { feedback } from "@/lib/feedback";
import { useTheme } from "@/theme";
import { AppText } from "./AppText";
import { Card } from "./Card";

/** A blueprint section with a copy button; optionally collapsible. */
export function SectionCard({
  title,
  icon,
  copyText,
  collapsible,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  copyText?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const { colors, reduceMotion } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!copyText) return;
    await Clipboard.setStringAsync(copyText);
    feedback.copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Pressable
          style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 10 }}
          onPress={collapsible ? () => { feedback.select(); setOpen((o) => !o); } : undefined}
          accessibilityRole={collapsible ? "button" : "header"}
          accessibilityState={collapsible ? { expanded: open } : undefined}
        >
          {icon ? <Ionicons name={icon} size={18} color={colors.accent} /> : null}
          <AppText variant="subheading" style={{ flex: 1 }}>
            {title}
          </AppText>
          {collapsible ? <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.muted} /> : null}
        </Pressable>
        {copyText ? (
          <Pressable
            onPress={copy}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Copy ${title}`}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color={copied ? colors.success : colors.muted} />
            <AppText variant="caption" style={{ color: copied ? colors.success : colors.muted }}>
              {copied ? "Copied" : "Copy"}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {open ? (
        <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(200)} style={{ gap: 10 }}>
          {children}
        </Animated.View>
      ) : null}
    </Card>
  );
}

export function Bullets({ items, numbered }: { items: string[]; numbered?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 8 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10 }}>
          {numbered ? (
            <AppText variant="caption" style={{ color: colors.accent, fontWeight: "800", minWidth: 18 }}>
              {i + 1}.
            </AppText>
          ) : (
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 8 }} />
          )}
          <AppText variant="body" color="muted" style={{ flex: 1 }}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function CodeBlock({ text }: { text: string }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12 }}>
      <AppText variant="mono" color="muted" selectable>
        {text}
      </AppText>
    </View>
  );
}
