"use client";

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import type { WallpaperChoice } from "@/components/system/types";

export const builtinWallpaperUrl = (key: string) => `/media/wallpapers/${key}.jpg`;

/** Resolves the wallpaper setting to a URL (a picture file is read from the file system). */
export function useWallpaperUrl(choice: WallpaperChoice): string | null {
  const { vfs } = useSystem();
  const [url, setUrl] = useState<string | null>(choice.kind === "builtin" ? builtinWallpaperUrl(choice.key) : null);
  useEffect(() => {
    if (choice.kind === "builtin") {
      setUrl(builtinWallpaperUrl(choice.key));
      return;
    }
    if (!vfs) return;
    let revoke = () => {};
    let alive = true;
    vfs
      .openUrl(choice.fileId)
      .then((r) => {
        if (!alive) return r.revoke();
        revoke = r.revoke;
        setUrl(r.url);
      })
      // The picture was deleted: fall back to the default background.
      .catch(() => alive && setUrl(builtinWallpaperUrl("connected-blue")));
    return () => {
      alive = false;
      revoke();
    };
  }, [choice, vfs]);
  return url;
}
