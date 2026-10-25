// Window manager: a pure reducer over the desktop's open windows.
//
// The desktop component renders this state; tests drive it directly.

export interface WinRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Win {
  id: string;
  appId: string;
  title: string;
  rect: WinRect;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Whatever the app was opened with (a file id, a URL...). */
  args?: Record<string, unknown>;
}

export interface WmState {
  windows: Win[];
  focused: string | null;
  topZ: number;
}

export const MIN_W = 320;
export const MIN_H = 200;
export const TITLE_BAR = 30;

export type WmAction =
  | { type: "open"; id: string; appId: string; title: string; rect: WinRect; args?: Record<string, unknown>; maximized?: boolean }
  | { type: "close"; id: string }
  | { type: "focus"; id: string }
  | { type: "minimize"; id: string }
  | { type: "toggleMaximize"; id: string }
  | { type: "restore"; id: string }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "resize"; id: string; rect: WinRect }
  | { type: "setTitle"; id: string; title: string }
  | { type: "setArgs"; id: string; args: Record<string, unknown> }
  | { type: "closeAll" };

export const emptyWm: WmState = { windows: [], focused: null, topZ: 0 };

/** The highest visible window, which takes focus when the focused one goes away. */
function nextFocus(windows: Win[], excluding?: string): string | null {
  const visible = windows.filter((w) => !w.minimized && w.id !== excluding).sort((a, b) => b.z - a.z);
  return visible[0]?.id ?? null;
}

function update(state: WmState, id: string, fn: (w: Win) => Win): Win[] {
  return state.windows.map((w) => (w.id === id ? fn(w) : w));
}

export function wmReducer(state: WmState, action: WmAction): WmState {
  switch (action.type) {
    case "open": {
      const z = state.topZ + 1;
      const rect = { ...action.rect, w: Math.max(MIN_W, action.rect.w), h: Math.max(MIN_H, action.rect.h) };
      const win: Win = { id: action.id, appId: action.appId, title: action.title, rect, z, minimized: false, maximized: Boolean(action.maximized), args: action.args };
      return { windows: [...state.windows, win], focused: win.id, topZ: z };
    }
    case "close": {
      const windows = state.windows.filter((w) => w.id !== action.id);
      const focused = state.focused === action.id ? nextFocus(windows) : state.focused;
      return { ...state, windows, focused };
    }
    case "focus": {
      const target = state.windows.find((w) => w.id === action.id);
      if (!target) return state;
      if (state.focused === action.id && target.z === state.topZ && !target.minimized) return state;
      const z = state.topZ + 1;
      return { windows: update(state, action.id, (w) => ({ ...w, z, minimized: false })), focused: action.id, topZ: z };
    }
    case "minimize": {
      const windows = update(state, action.id, (w) => ({ ...w, minimized: true }));
      const focused = state.focused === action.id ? nextFocus(windows, action.id) : state.focused;
      return { ...state, windows, focused };
    }
    case "restore":
      return wmReducer(state, { type: "focus", id: action.id });
    case "toggleMaximize": {
      const z = state.topZ + 1;
      return { windows: update(state, action.id, (w) => ({ ...w, maximized: !w.maximized, minimized: false, z })), focused: action.id, topZ: z };
    }
    case "move":
      return { ...state, windows: update(state, action.id, (w) => (w.maximized ? w : { ...w, rect: { ...w.rect, x: action.x, y: action.y } })) };
    case "resize":
      return {
        ...state,
        windows: update(state, action.id, (w) => (w.maximized ? w : { ...w, rect: { ...action.rect, w: Math.max(MIN_W, action.rect.w), h: Math.max(MIN_H, action.rect.h) } })),
      };
    case "setTitle":
      return { ...state, windows: update(state, action.id, (w) => ({ ...w, title: action.title })) };
    case "setArgs":
      return { ...state, windows: update(state, action.id, (w) => ({ ...w, args: action.args })) };
    case "closeAll":
      return { ...state, windows: [], focused: null };
  }
}

/** What clicking a taskbar button does, like Windows 7. */
export function taskbarAction(state: WmState, id: string): WmAction {
  const w = state.windows.find((x) => x.id === id);
  if (!w) return { type: "focus", id };
  if (w.minimized) return { type: "restore", id };
  if (state.focused === id) return { type: "minimize", id };
  return { type: "focus", id };
}

/** Keeps a window's title bar reachable inside the desktop area. */
export function clampRect(rect: WinRect, area: { w: number; h: number }): WinRect {
  const w = Math.min(Math.max(MIN_W, rect.w), Math.max(MIN_W, area.w));
  const h = Math.min(Math.max(MIN_H, rect.h), Math.max(MIN_H, area.h));
  const x = Math.min(Math.max(rect.x, 80 - w), area.w - 80);
  const y = Math.min(Math.max(rect.y, 0), area.h - TITLE_BAR);
  return { x, y, w, h };
}

/** Where a new window goes: cascading down-right from the last one. */
export function cascadeRect(state: WmState, size: { w: number; h: number }, area: { w: number; h: number }): WinRect {
  const n = state.windows.length % 8;
  const w = Math.min(size.w, area.w - 40);
  const h = Math.min(size.h, area.h - 40);
  return clampRect({ x: 60 + n * 28, y: 30 + n * 26, w, h }, area);
}
