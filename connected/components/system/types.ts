// Shapes shared by the desktop and its apps.

import type { WmState, WmAction } from "@/lib/wm";
import type { Store } from "@/lib/storage/types";
import type { SpecialFolder, Vfs } from "@/lib/vfs";

export type Presence = "online" | "away" | "busy" | "offline";

export interface UserAccount {
  id: string;
  name: string;
  /** Avatar key (public/media/avatars/<key>.png). */
  picture: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  origin: "user";
}

export type WallpaperChoice = { kind: "builtin"; key: string } | { kind: "file"; fileId: string };

export interface UserSettings {
  wallpaper: WallpaperChoice;
  wallpaperFit: "fill" | "fit" | "center" | "tile";
  accent: string;
  browser: { homepage: string; startup: "home" | "restore"; showBookmarksBar: boolean };
  messenger: { status: Presence; message: string };
  volume: number;
  muted: boolean;
}

export interface ComputerState {
  /** Simulated time = real time + offset. */
  clockOffset: number;
  timeZone: string;
  region: string;
  /** Bytes per second for downloads; 0 = unlimited. */
  connectionSpeed: number;
  installedAt: string;
  bootCount: number;
}

export interface Toast {
  id: string;
  title: string;
  body?: string;
  icon?: string;
  action?: { label: string; run: () => void };
}

export type Phase = "off" | "booting" | "login" | "desktop" | "shutting-down" | "restarting";

export interface DownloadRecord {
  id: string;
  owner: string;
  url: string;
  filename: string;
  mime: string;
  total: number;
  received: number;
  status: "downloading" | "complete" | "failed" | "cancelled";
  fileId?: string;
  startedAt: string;
  finishedAt?: string;
  error?: string;
  origin: "user";
}

export interface System {
  store: Store;
  phase: Phase;
  computer: ComputerState;
  setComputer: (patch: Partial<ComputerState>) => Promise<void>;
  now: () => number;
  users: UserAccount[];
  user: UserAccount | null;
  settings: UserSettings;
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  vfs: Vfs | null;
  folders: Record<SpecialFolder, string> | null;
  wm: WmState;
  dispatchWm: (a: WmAction) => void;
  openApp: (appId: string, args?: Record<string, unknown>) => string | null;
  notify: (t: Omit<Toast, "id">) => void;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  createUser: (name: string, picture: string, password?: string) => Promise<UserAccount>;
  updateUser: (id: string, patch: Partial<Pick<UserAccount, "name" | "picture">> & { password?: string | null }) => Promise<void>;
  logIn: (id: string, password?: string) => Promise<boolean>;
  logOff: () => void;
  shutDown: () => void;
  restart: () => void;
  powerOn: () => void;
  /** Fetches `url` into Downloads. `source` is the address shown to the user (the archive page it came from). */
  download: (url: string, filename: string, opts?: { mime?: string; source?: string }) => Promise<DownloadRecord | null>;
  cancelDownload: (id: string) => void;
  retryDownload: (id: string) => void;
  downloads: DownloadRecord[];
}
