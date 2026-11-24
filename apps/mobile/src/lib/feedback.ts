import * as Haptics from "expo-haptics";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import { getSettings } from "./settings";

export type SoundName = "tap" | "copy" | "start" | "success" | "complete" | "fanfare" | "error";

const SOURCES: Record<SoundName, number> = {
  tap: require("../../assets/sounds/tap.wav"),
  copy: require("../../assets/sounds/copy.wav"),
  start: require("../../assets/sounds/start.wav"),
  success: require("../../assets/sounds/success.wav"),
  complete: require("../../assets/sounds/complete.wav"),
  fanfare: require("../../assets/sounds/fanfare.wav"),
  error: require("../../assets/sounds/error.wav"),
};

const players: Partial<Record<SoundName, AudioPlayer>> = {};
let audioReady = false;

/** Preloads the sounds once so the first tap plays instantly. */
export async function initFeedback(): Promise<void> {
  if (audioReady) return;
  try {
    // Interaction sounds mix with other audio and follow the silent switch.
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" });
    for (const name of Object.keys(SOURCES) as SoundName[]) {
      players[name] = createAudioPlayer(SOURCES[name]);
    }
    audioReady = true;
  } catch {
    // Sound is a bonus; the app works without it.
  }
}

export function playSound(name: SoundName): void {
  const { soundEnabled, soundVolume } = getSettings();
  if (!soundEnabled || soundVolume <= 0) return;
  try {
    const player = players[name] ?? (players[name] = createAudioPlayer(SOURCES[name]));
    player.volume = Math.max(0, Math.min(1, soundVolume));
    void player.seekTo(0);
    player.play();
  } catch {
    // ignore
  }
}

type HapticKind = "light" | "medium" | "selection" | "success" | "warning" | "error";

export function haptic(kind: HapticKind = "light"): void {
  if (!getSettings().hapticsEnabled) return;
  try {
    switch (kind) {
      case "light":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "selection":
        void Haptics.selectionAsync();
        break;
      case "success":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    // ignore
  }
}

/** Sound + haptic pairs for common moments. */
export const feedback = {
  tap: () => {
    playSound("tap");
    haptic("light");
  },
  select: () => {
    playSound("tap");
    haptic("selection");
  },
  copy: () => {
    playSound("copy");
    haptic("light");
  },
  start: () => {
    playSound("start");
    haptic("medium");
  },
  success: () => {
    playSound("success");
    haptic("success");
  },
  complete: () => {
    playSound("complete");
    haptic("success");
  },
  fanfare: () => {
    playSound("fanfare");
    haptic("success");
  },
  error: () => {
    playSound("error");
    haptic("error");
  },
};
