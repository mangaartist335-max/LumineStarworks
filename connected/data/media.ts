// Typed access to the generated media manifest (scripts/media/generate.py).

import manifest from "./generated/media-manifest.json";

export interface MediaEntry {
  url: string;
  size: number;
  duration?: number;
  pages?: number;
  title?: string;
  artist?: string;
  name?: string;
  width?: number;
  height?: number;
}

const m = manifest as Record<string, MediaEntry>;

export function media(key: string): MediaEntry {
  const entry = m[key];
  if (!entry) throw new Error(`Missing media "${key}". Run npm run media.`);
  return entry;
}

export function mediaUrl(key: string): string {
  return media(key).url;
}
