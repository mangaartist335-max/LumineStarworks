import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { getPlantStatus } from "../utils/dateHelper";
import type { Plant } from "../types/plant";

/** When the morning reminder goes off (local time). */
export const REMINDER_HOUR = 9;
export const REMINDER_MINUTE = 0;

// A scheduled notification's text is fixed when it's scheduled, so instead of
// one repeating reminder we schedule the next week of mornings individually,
// each naming the plants that will be overdue that day. The schedule is
// rebuilt whenever plants change and whenever the app opens.
const DAYS_AHEAD = 7;
const CHANNEL_ID = "watering-reminders";

export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Asks for permission (once) and sets up the Android channel. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Watering reminders",
      importance: AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function reminderTimeOn(dayOffset: number, from: Date): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  return date;
}

function listNames(names: string[]): string {
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length <= 4) return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`;
}

export async function rescheduleReminders(plants: Plant[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted || plants.length === 0) return;

  const now = new Date();
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const fireAt = reminderTimeOn(offset, now);
    if (fireAt <= now) continue;

    // Assumes nobody waters in between; watering reschedules everything.
    const overdue = plants
      .filter((plant) => getPlantStatus(plant, fireAt) === "overdue")
      .map((plant) => plant.name);
    if (overdue.length === 0) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: overdue.length === 1 ? "A plant is thirsty 🌱" : "Your plants are thirsty 🌱",
        body: `Time to water ${listNames(overdue)}.`,
        data: { screen: "Home" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}
