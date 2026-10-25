"use client";

// Which archive website serves which address.

import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { IconName } from "@/components/desktop/Icon";

export interface SiteDef {
  host: string;
  name: string;
  icon: IconName;
  /** Served inside the desktop as a component. YAL is a separate server shown in a frame. */
  Component?: LazyExoticComponent<ComponentType>;
  frame?: "yal";
}

const site = (host: string, name: string, icon: IconName, loader: () => Promise<{ default: ComponentType }>): SiteDef => ({ host, name, icon, Component: lazy(loader) });

export const SITES: SiteDef[] = [
  site("goggle.com", "Goggle", "search", () => import("./goggle/Goggle")),
  site("metube.com", "MeTube", "metube", () => import("./metube/MeTube")),
  site("mangashelf.net", "MangaShelf", "manga", () => import("./manga/MangaShelf")),
  site("wallpapergarden.com", "WallpaperGarden", "photos", () => import("./wallpapers/WallpaperGarden")),
  site("birdie.com", "Birdie", "messenger", () => import("./community/Birdie")),
  site("tum.com", "Tum", "file-image", () => import("./community/Tum")),
  site("3chan.org", "3Chan", "file-text", () => import("./community/ThreeChan")),
  site("technook.net", "TechNook Forums", "computer", () => import("./community/TechNook")),
  site("freewarecorner.com", "Freeware Corner", "download", () => import("./static/StaticSite")),
  site("pantryrecipes.com", "Pantry Recipes", "file-text", () => import("./static/StaticSite")),
  site("connectmail.net", "ConnectMail", "mail", () => import("./static/StaticSite")),
  { host: "youranimelist.net", name: "YourAnimeList", icon: "star", frame: "yal" },
];

export function siteForHost(host: string): SiteDef | undefined {
  const h = host.toLowerCase().replace(/^www\./, "");
  return SITES.find((s) => h === s.host || h.endsWith(`.${s.host}`));
}
