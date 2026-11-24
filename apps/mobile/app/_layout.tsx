import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppText } from "@/components/AppText";
import { Screen } from "@/components/Screen";
import { AuthProvider, useAuth } from "@/lib/auth";
import { isConfigured } from "@/lib/config";
import { initFeedback } from "@/lib/feedback";
import { registerForPushNotifications } from "@/lib/notifications";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { ThemeProvider, useTheme } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { ready, settings } = useSettings();
  const { colors, isDark, reduceMotion } = useTheme();
  const signedIn = !!session;

  useEffect(() => {
    void initFeedback();
  }, []);

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  useEffect(() => {
    if (!loading && ready) SplashScreen.hideAsync().catch(() => {});
  }, [loading, ready]);

  // Register this device for "your blueprint/app is ready" notifications.
  useEffect(() => {
    if (Platform.OS !== "web" && signedIn && settings.notificationsEnabled) void registerForPushNotifications();
  }, [signedIn, settings.notificationsEnabled]);

  // Tapping a notification opens the project it's about.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const url = response?.notification.request.content.data?.url;
      if (typeof url === "string") {
        const match = url.match(/project\/([0-9a-f-]+)/i);
        if (match) router.push(`/project/${match[1]}`);
      }
    };
    open(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(open);
    return () => sub.remove();
  }, []);

  if (!isConfigured) {
    return (
      <Screen>
        <AppText variant="title">Almost there</AppText>
        <AppText color="muted">
          This build of BuildBrief is missing its server settings. Copy apps/mobile/.env.example to .env, fill in the
          Supabase values, and restart Expo.
        </AppText>
      </Screen>
    );
  }

  if (loading || !ready) return null;

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: reduceMotion ? "fade" : "default",
        }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="project/[id]/index" />
          <Stack.Screen name="project/[id]/preview" options={{ presentation: "fullScreenModal", animation: reduceMotion ? "fade" : "slide_from_bottom" }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
