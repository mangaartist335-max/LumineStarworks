import { DEFAULT_BOOT_TIME, DEFAULT_TIME_ZONE, ms, offsetFor } from "@/lib/time";
import { HOME_URL } from "@/lib/web/url";
import type { SampleFile } from "@/lib/vfs";
import { media } from "@/data/media";
import type { ComputerState, UserSettings } from "./types";

export const AVATARS = ["flower", "fish", "ball", "guitar", "rocket", "cat", "robot", "sun", "gamepad", "palette", "star", "leaf"];
export const avatarUrl = (key: string) => `/media/avatars/${key}.png`;

export const CONNECTION_SPEEDS: { label: string; bytesPerSecond: number }[] = [
  { label: "Dial-up (56 Kbps)", bytesPerSecond: 7_000 },
  { label: "DSL (1.5 Mbps)", bytesPerSecond: 190_000 },
  { label: "Cable (8 Mbps)", bytesPerSecond: 1_000_000 },
  { label: "Unlimited", bytesPerSecond: 0 },
];

export function defaultComputer(): ComputerState {
  return {
    clockOffset: offsetFor(ms(DEFAULT_BOOT_TIME)),
    timeZone: DEFAULT_TIME_ZONE,
    region: "US",
    connectionSpeed: 1_000_000,
    installedAt: DEFAULT_BOOT_TIME,
    bootCount: 0,
  };
}

export function defaultSettings(): UserSettings {
  return {
    wallpaper: { kind: "builtin", key: "connected-blue" },
    wallpaperFit: "fill",
    accent: "#4a8cd6",
    browser: { homepage: HOME_URL, startup: "home", showBookmarksBar: true },
    messenger: { status: "online", message: "" },
    volume: 0.8,
    muted: false,
  };
}

/** Sample files every new account starts with, like Windows 7's Sample Pictures. */
export function sampleFiles(): SampleFile[] {
  const pic = (name: string) => {
    const e = media(`sample-picture:${name}`);
    return { folder: "pictures" as const, subfolder: "Sample Pictures", name, url: e.url, mime: "image/jpeg", size: e.size };
  };
  const song = (key: string) => {
    const e = media(`music:${key}`);
    return { folder: "music" as const, subfolder: "Sample Music", name: `${e.artist} - ${e.title}.mp3`, url: e.url, mime: "audio/mpeg", size: e.size };
  };
  const doc = (key: string, name: string, mime: string) => {
    const e = media(key);
    return { folder: "documents" as const, name, url: e.url, mime, size: e.size };
  };
  const vid = (key: string, name: string) => {
    const e = media(`video:${key}`);
    return { folder: "videos" as const, subfolder: "Sample Videos", name, url: e.url, mime: "video/webm", size: e.size };
  };
  return [
    pic("Northern Lights.jpg"),
    pic("Harbor at Dusk.jpg"),
    pic("Spring Hills.jpg"),
    pic("Autumn Walk.jpg"),
    song("morning-commute"),
    song("summer-rain"),
    song("neon-night-drive"),
    song("campfire-strings"),
    doc("doc:welcome-pdf", "Welcome to your Connected PC.pdf", "application/pdf"),
    doc("doc:shopping-list.txt", "Shopping list.txt", "text/plain"),
    doc("doc:summer-plans.txt", "Summer plans.txt", "text/plain"),
    vid("biscuit-snow-day", "Snow Day.webm"),
  ];
}
