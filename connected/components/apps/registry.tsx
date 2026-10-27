"use client";

// App components, loaded on demand when a window opens.

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import type { Win } from "@/lib/wm";

export interface AppProps {
  win: Win;
}

const COMPONENTS: Record<string, LazyExoticComponent<ComponentType<AppProps>>> = {
  browser: lazy(() => import("./browser/Browser")),
  explorer: lazy(() => import("./explorer/Explorer")),
  photos: lazy(() => import("./photos/Photos")),
  settings: lazy(() => import("./settings/Settings")),
  messenger: lazy(() => import("./messenger/Messenger")),
  mail: lazy(() => import("./mail/Mail")),
  music: lazy(() => import("./music/Music")),
  radio: lazy(() => import("./radio/Radio")),
  newsreader: lazy(() => import("./newsreader/NewsReader")),
  chat: lazy(() => import("./chat/RelayChat")),
  video: lazy(() => import("./video/VideoPlayer")),
  notepad: lazy(() => import("./notepad/Notepad")),
  paint: lazy(() => import("./paint/Paint")),
  archive: lazy(() => import("./archive/Archive")),
  pdf: lazy(() => import("./pdf/PdfReader")),
  calculator: lazy(() => import("./calculator/Calculator")),
  games: lazy(() => import("./games/Games")),
  starcourier: lazy(() => import("./games/StarCourier")),
  fieldsweeper: lazy(() => import("./games/FieldSweeper")),
};

export function AppHost({ win }: { win: Win }) {
  const C = COMPONENTS[win.appId];
  if (!C) return <div className="empty">This program isn&apos;t installed.</div>;
  return (
    <Suspense fallback={<div className="app-loading">Loading...</div>}>
      <C win={win} />
    </Suspense>
  );
}
