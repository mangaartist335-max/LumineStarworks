import { useEffect } from "react";
import { AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import {
  NavigationContainer,
  createNavigationContainerRef,
  DefaultTheme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import type { RootStackParamList } from "./src/navigation/types";
import {
  configureNotifications,
  ensureNotificationPermission,
} from "./src/services/notificationService";
import { refreshReminders } from "./src/services/plantService";
import { colors } from "./src/utils/theme";

configureNotifications();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary },
};

function goHome() {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: "Home" }] });
  }
}

export default function App() {
  const lastResponse = Notifications.useLastNotificationResponse();

  // Ask for notification permission, then build the reminder schedule.
  useEffect(() => {
    ensureNotificationPermission()
      .catch((err) => console.warn("[App] Notification setup failed", err))
      .finally(() => refreshReminders());
  }, []);

  // Rebuild reminders whenever the app comes back to the foreground, so a
  // new day's overdue list is always fresh.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshReminders();
    });
    return () => sub.remove();
  }, []);

  // Tapping a reminder (including one that launched the app) opens Home.
  useEffect(() => {
    if (lastResponse) goHome();
  }, [lastResponse]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={theme} onReady={() => lastResponse && goHome()}>
        <RootNavigator />
        <StatusBar style="dark" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
