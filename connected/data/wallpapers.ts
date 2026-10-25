// WallpaperGarden: free desktop wallpapers. All artwork is original to the
// Connected Era (scripts/media/wallpapers.py) and offered for personal use.

import type { Availability } from "@/lib/availability";
import { media } from "./media";

export const WALLPAPER_HOST = "wallpapergarden.com";

export interface Wallpaper {
  id: string;
  key: string;
  title: string;
  artist: string;
  category: string;
  description: string;
  url: string;
  thumb: string;
  size: number;
  width: number;
  height: number;
  license: string;
  availability: Availability;
  downloads: number;
}

const LICENSE = "Free for personal desktop use. Original artwork shared by the artist on WallpaperGarden.";

function wp(key: string, artist: string, category: string, publishedAt: string, downloads: number, description: string): Wallpaper {
  const file = media(`wallpaper:${key}`);
  return {
    id: `page_wp_${key.replace(/-/g, "_")}`,
    key,
    title: file.title ?? key,
    artist,
    category,
    description,
    url: file.url,
    thumb: media(`wallpaper-thumb:${key}`).url,
    size: file.size,
    width: file.width ?? 1920,
    height: file.height ?? 1080,
    license: LICENSE,
    availability: { publishedAt, region: "global" },
    downloads,
  };
}

export const wallpapers: Wallpaper[] = [
  wp("connected-blue", "Connected Design Team", "Abstract", "2009-10-22T12:00:00Z", 91240, "Soft blue light ribbons. The default background on Connected PCs."),
  wp("aurora-lake", "Mika Sorensen", "Nature", "2011-11-03T12:00:00Z", 18320, "Northern lights over a still mountain lake, mirrored in the water."),
  wp("harbor-lights", "Leo Park", "City", "2012-03-18T12:00:00Z", 11870, "A city harbour at dusk with every window lit up."),
  wp("cherry-hills", "Aya Morita", "Nature", "2012-04-09T12:00:00Z", 15410, "Rolling spring hills with cherry blossom petals drifting by."),
  wp("starfield", "Mika Sorensen", "Space", "2012-06-30T12:00:00Z", 22050, "A deep starfield with soft purple and blue nebula clouds."),
  wp("retro-grid", "NeonByte", "Retro", "2012-10-12T12:00:00Z", 19730, "An eighties sunset over an endless neon grid."),
  wp("ocean-glass", "Leo Park", "Nature", "2013-02-21T12:00:00Z", 8240, "Light dancing through clear turquoise water."),
  wp("autumn-path", "Aya Morita", "Seasons", "2013-09-01T12:00:00Z", 2310, "A quiet path through glowing autumn trees."),
];

export const wallpaperByKey = (key: string) => wallpapers.find((w) => w.key === key);
