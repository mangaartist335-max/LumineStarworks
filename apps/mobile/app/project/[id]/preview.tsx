import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { AppText } from "@/components/AppText";
import { Banner } from "@/components/Misc";
import { shareFile } from "@/lib/exporter";
import { feedback } from "@/lib/feedback";
import { getAppHtml, getCachedProject } from "@/lib/projects";
import { withAudioBoost } from "@/shared/audioBoost";
import { useTheme } from "@/theme";

/**
 * Plays a built app. The generated app runs in its own sandboxed web view:
 * it has no bridge to BuildBrief's code, session or storage, and links that
 * try to leave the app open in the browser instead.
 */
export default function Preview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [html, setHtml] = useState<string | null | undefined>(undefined);
  const [name, setName] = useState("Your app");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    getCachedProject(id).then((p) => p && setName(p.name));
    getAppHtml(id).then((h) => setHtml(h ? withAudioBoost(h) : null));
  }, [id]);

  const iconButton = (icon: keyof typeof Ionicons.glyphMap, label: string, onPress: () => void) => (
    <Pressable onPress={() => { feedback.tap(); onPress(); }} hitSlop={10} accessibilityRole="button" accessibilityLabel={label} style={{ padding: 6 }}>
      <Ionicons name={icon} size={24} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {iconButton("close", "Close", () => router.back())}
        <AppText variant="subheading" style={{ flex: 1 }} numberOfLines={1} align="center">{name}</AppText>
        {iconButton("refresh", "Restart app", () => setReloadKey((k) => k + 1))}
        {iconButton("share-outline", "Share app file", async () => {
          if (!html) return;
          const file = (name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "app") + ".html";
          await shareFile(file, html, "text/html", "public.html");
        })}
      </View>
      {html === undefined ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator color={colors.accent} />
          <AppText color="muted">Opening your app…</AppText>
        </View>
      ) : html === null ? (
        <View style={{ padding: 20 }}>
          <Banner tone="danger" icon="alert-circle" text="This app isn't available yet. Build it from the project's Build App tab." />
        </View>
      ) : (
        <WebView
          key={reloadKey}
          source={{ html }}
          originWhitelist={["about:*", "data:*"]}
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith("about:") || req.url.startsWith("data:")) return true;
            if (/^https?:/i.test(req.url)) void WebBrowser.openBrowserAsync(req.url);
            return false;
          }}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          setSupportMultipleWindows={false}
          allowFileAccess={false}
          style={{ flex: 1, backgroundColor: "#fff" }}
          containerStyle={{ paddingBottom: insets.bottom }}
        />
      )}
    </View>
  );
}
