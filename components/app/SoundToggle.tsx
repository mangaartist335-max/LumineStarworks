"use client";

import { Volume2, VolumeX } from "lucide-react";
import { setSfxEnabled, useSfxEnabled } from "@/lib/sfx";

export function SoundToggle() {
  const enabled = useSfxEnabled();
  return (
    <button
      type="button"
      onClick={() => setSfxEnabled(!enabled)}
      aria-pressed={enabled}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
    >
      {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
      Sound effects: {enabled ? "On" : "Off"}
    </button>
  );
}
