import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { savePushToken } from "./projects";

if (Platform.OS !== "web") Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Asks for permission and saves this device's Expo push token on the user's
 * profile, so the server can say "your blueprint/app is ready" even when the
 * app is closed. Needs a real device and an EAS project id (see README);
 * otherwise it quietly does nothing.
 */
export async function registerForPushNotifications(): Promise<boolean> {
  try {
    if (!Device.isDevice) return false;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Project updates",
        importance: AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    let granted = current.granted;
    if (!granted && current.canAskAgain) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return false;

    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
      Constants.easConfig?.projectId;
    if (!projectId) return false;

    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(data);
    return true;
  } catch {
    return false;
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  try {
    await savePushToken(null);
  } catch {
    // ignore
  }
}
