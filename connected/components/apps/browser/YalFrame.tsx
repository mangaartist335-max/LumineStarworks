"use client";

// YourAnimeList is its own website (the yal/ app), so it is shown in a
// sandboxed frame. The desktop clock travels with each request (?asof=),
// YAL's embedded mode hides its own time toolbar, and YAL reports each page
// it shows (postMessage) so the address bar and history follow along.

import { useEffect, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useSite } from "@/components/sites/SiteContext";
import { iso } from "@/lib/time";

export const YAL_ORIGIN = process.env.NEXT_PUBLIC_YAL_ORIGIN ?? "http://localhost:3100";
export const YAL_PUBLIC = "http://yal.connectedera.local";

interface LocationMessage {
  type: "yal:location";
  path: string;
  title: string;
}

export function YalFrame() {
  const { url, navigate, setTitle } = useSite();
  const { now } = useSystem();
  const requested = `${url.path}${url.params.toString() ? `?${url.params.toString()}` : ""}`;
  const shownPath = useRef<string | null>(null);
  const [src, setSrc] = useState(() => frameSrc(requested, now()));
  // The frame address that never reported in (YAL's server isn't running).
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);

  // Back/Forward to a different YAL page loads it in the frame.
  useEffect(() => {
    if (shownPath.current !== null && shownPath.current !== requested) setSrc(frameSrc(requested, now()));
  }, [requested, now]);

  useEffect(() => {
    const onMessage = (e: MessageEvent<LocationMessage>) => {
      if (e.origin !== new URL(YAL_ORIGIN).origin || e.source !== frame.current?.contentWindow) return;
      if (e.data?.type !== "yal:location" || typeof e.data.path !== "string") return;
      setFailedSrc(null);
      shownPath.current = e.data.path;
      setTitle(e.data.title || "YourAnimeList");
      if (e.data.path !== requested) navigate(`${YAL_PUBLIC}${e.data.path}`);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [requested, navigate, setTitle]);

  // If YAL never reports in, its server isn't running.
  useEffect(() => {
    const t = setTimeout(() => {
      if (shownPath.current === null) setFailedSrc(src);
    }, 8000);
    return () => clearTimeout(t);
  }, [src]);

  return (
    <div className="yal-frame">
      <iframe
        ref={frame}
        src={src}
        title="YourAnimeList"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      {failedSrc === src && (
        <div className="special-page overlay">
          <h1>YourAnimeList isn&apos;t responding</h1>
          <p>
            YAL runs as its own server. Start it with <code>npm run dev:all</code> (or <code>cd yal && npm run dev -- -p 3100</code>), then reload this page.
          </p>
        </div>
      )}
    </div>
  );
}

function frameSrc(path: string, nowMs: number): string {
  const u = new URL(path, YAL_ORIGIN);
  u.searchParams.set("asof", iso(nowMs));
  u.searchParams.set("embed", "1");
  return u.toString();
}
