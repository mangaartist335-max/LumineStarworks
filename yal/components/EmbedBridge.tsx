"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { EmbedLocationMessage } from "@/lib/embed";

/**
 * Tells the Connected Desktop browser which page is showing, so its address
 * bar and history stay in step. Messages go only to the allowed desktop
 * origins; postMessage drops any whose origin does not match the parent.
 */
export function EmbedBridge({ origins }: { origins: string[] }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    if (window.parent === window) return;
    const message: EmbedLocationMessage = {
      type: "yal:location",
      path: `${pathname}${search ? `?${search}` : ""}${window.location.hash}`,
      title: document.title,
    };
    // The title updates after navigation; give it a moment.
    const t = window.setTimeout(() => {
      message.title = document.title;
      for (const origin of origins) window.parent.postMessage(message, origin);
    }, 50);
    return () => window.clearTimeout(t);
  }, [pathname, search, origins]);
  return null;
}
