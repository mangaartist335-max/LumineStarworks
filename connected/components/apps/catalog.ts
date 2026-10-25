// What programs the computer has, and which one opens which kind of file.
// (The components themselves are mapped in registry.tsx.)

import type { FileNode } from "@/lib/vfs";
import type { IconName } from "@/components/desktop/Icon";

export interface AppMeta {
  title: string;
  icon: IconName;
  size: { w: number; h: number };
  singleInstance?: boolean;
  /** Listed in the Start menu's program list. */
  start?: "pinned" | "programs";
  description: string;
}

export const APPS: Record<string, AppMeta> = {
  browser: { title: "Web Browser", icon: "browser", size: { w: 1080, h: 720 }, start: "pinned", description: "Browse the web" },
  explorer: { title: "Explorer", icon: "folder", size: { w: 880, h: 560 }, start: "pinned", description: "Your files and folders" },
  messenger: { title: "Messenger", icon: "messenger", size: { w: 340, h: 580 }, singleInstance: true, start: "pinned", description: "Chat with friends" },
  mail: { title: "Mail", icon: "mail", size: { w: 980, h: 640 }, singleInstance: true, start: "pinned", description: "Read and send email" },
  music: { title: "Music Player", icon: "music", size: { w: 760, h: 500 }, singleInstance: true, start: "programs", description: "Play your music" },
  video: { title: "Video Player", icon: "video", size: { w: 780, h: 520 }, start: "programs", description: "Watch videos on your computer" },
  photos: { title: "Photo Viewer", icon: "photos", size: { w: 860, h: 620 }, start: "programs", description: "View pictures" },
  notepad: { title: "Notepad", icon: "notepad", size: { w: 660, h: 480 }, start: "programs", description: "Write and edit text" },
  paint: { title: "Paint", icon: "paint", size: { w: 920, h: 660 }, start: "programs", description: "Draw and edit pictures" },
  archive: { title: "Archive Manager", icon: "archive", size: { w: 720, h: 500 }, start: "programs", description: "Create and extract ZIP files" },
  pdf: { title: "PDF Reader", icon: "pdf", size: { w: 780, h: 660 }, start: "programs", description: "Read PDF documents" },
  calculator: { title: "Calculator", icon: "calculator", size: { w: 320, h: 420 }, singleInstance: true, start: "programs", description: "Do quick sums" },
  games: { title: "Games", icon: "games", size: { w: 780, h: 540 }, singleInstance: true, start: "programs", description: "Play games" },
  starcourier: { title: "Star Courier", icon: "rocket", size: { w: 840, h: 620 }, singleInstance: true, description: "Arcade game" },
  fieldsweeper: { title: "Field Sweeper", icon: "sweeper", size: { w: 440, h: 540 }, singleInstance: true, description: "Puzzle game" },
  settings: { title: "Control Panel", icon: "settings", size: { w: 860, h: 600 }, singleInstance: true, start: "programs", description: "Change your computer's settings" },
};

/** The program that opens a file, and what to open it with. */
export function appForFile(node: Pick<FileNode, "id" | "kind" | "mime" | "name">): { appId: string; args: Record<string, unknown> } | null {
  if (node.kind === "folder") return { appId: "explorer", args: { folderId: node.id } };
  const mime = node.mime ?? "";
  const ext = node.name.toLowerCase().split(".").pop();
  if (mime.startsWith("image/")) return { appId: "photos", args: { fileId: node.id } };
  if (mime.startsWith("audio/")) return { appId: "music", args: { fileId: node.id } };
  if (mime.startsWith("video/")) return { appId: "video", args: { fileId: node.id } };
  if (mime === "application/pdf") return { appId: "pdf", args: { fileId: node.id } };
  if (mime === "application/zip" || ext === "zip" || ext === "cbz") return { appId: "archive", args: { fileId: node.id } };
  if (ext === "url") return { appId: "browser", args: { shortcutFileId: node.id } };
  if (mime.startsWith("text/") || mime === "application/json") return { appId: "notepad", args: { fileId: node.id } };
  return null;
}

export function iconForFile(node: Pick<FileNode, "kind" | "mime" | "name" | "special">): IconName {
  if (node.kind === "folder") {
    if (node.special === "recycle") return "recycle";
    if (node.special === "pictures") return "folder-pictures";
    if (node.special === "music") return "folder-music";
    if (node.special === "videos") return "folder-videos";
    if (node.special === "downloads") return "folder-downloads";
    if (node.special === "documents") return "folder-documents";
    return "folder";
  }
  const mime = node.mime ?? "";
  const ext = node.name.toLowerCase().split(".").pop();
  if (mime.startsWith("image/")) return "file-image";
  if (mime.startsWith("audio/")) return "file-audio";
  if (mime.startsWith("video/")) return "file-video";
  if (mime === "application/pdf") return "file-pdf";
  if (mime === "application/zip" || ext === "zip" || ext === "cbz") return "file-zip";
  if (ext === "url") return "file-link";
  if (mime.startsWith("text/")) return "file-text";
  return "file";
}
