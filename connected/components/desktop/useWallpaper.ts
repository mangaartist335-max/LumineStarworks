"use client";

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import type { WallpaperChoice } from "@/components/system/types";

export const builtinWallpaperUrl = (key: string) => `/media/wallpapers/${key}.jpg`;

/** Resolves the wallpaper setting to a URL (a picture file is read from the file system). */
export function useWallpaperUrl(choice: WallpaperChoice): string | null {
  const { vfs } = useSystem();
  const fileId = choice.kind === "file" ? choice.fileId : null;
  const [file, setFile] = useState<{ fileId: string; url: string } | null>(null);
  useEffect(() => {
    if (!fileId || !vfs) return;
    let revoke = () => {};
    let alive = true;
    vfs
      .openUrl(fileId)
      .then((r) => {
        if (!alive) return r.revoke();
        revoke = r.revoke;
        setFile({ fileId, url: r.url });
      })
      // The picture was deleted: fall back to the default background.
      .catch(() => alive && setFile({ fileId, url: builtinWallpaperUrl("connected-blue") }));
    return () => {
      alive = false;
      revoke();
    };
  }, [fileId, vfs]);
  if (choice.kind === "builtin") return builtinWallpaperUrl(choice.key);
  return file && file.fileId === fileId ? file.url : null;
}
