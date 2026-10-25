// Browser tabs and per-tab history, as a pure reducer.

export interface HistEntry {
  url: string;
  title: string;
}

export interface Tab {
  id: string;
  entries: HistEntry[];
  index: number;
  /** Bumped by Reload so the page re-renders from scratch. */
  reloadKey: number;
}

export interface BrowserState {
  tabs: Tab[];
  active: string;
}

export type BrowserAction =
  | { type: "newTab"; id: string; url: string; title?: string; background?: boolean }
  | { type: "closeTab"; id: string }
  | { type: "activate"; id: string }
  | { type: "activateOffset"; delta: number }
  | { type: "navigate"; url: string; title?: string; tabId?: string }
  /** Replaces the current entry (redirects, or a page reporting its real address). */
  | { type: "replace"; url: string; title?: string; tabId?: string }
  | { type: "setTitle"; title: string; tabId?: string; url?: string }
  | { type: "back"; tabId?: string }
  | { type: "forward"; tabId?: string }
  | { type: "reload"; tabId?: string };

export function newBrowser(tabId: string, url: string, title = "New Tab"): BrowserState {
  return { tabs: [{ id: tabId, entries: [{ url, title }], index: 0, reloadKey: 0 }], active: tabId };
}

export const currentEntry = (tab: Tab): HistEntry => tab.entries[tab.index];
export const canGoBack = (tab: Tab) => tab.index > 0;
export const canGoForward = (tab: Tab) => tab.index < tab.entries.length - 1;
export const activeTab = (s: BrowserState): Tab => s.tabs.find((t) => t.id === s.active) ?? s.tabs[0];

function mapTab(s: BrowserState, tabId: string | undefined, fn: (t: Tab) => Tab): BrowserState {
  const id = tabId ?? s.active;
  return { ...s, tabs: s.tabs.map((t) => (t.id === id ? fn(t) : t)) };
}

export function browserReducer(s: BrowserState, a: BrowserAction): BrowserState {
  switch (a.type) {
    case "newTab": {
      const tab: Tab = { id: a.id, entries: [{ url: a.url, title: a.title ?? "New Tab" }], index: 0, reloadKey: 0 };
      const i = s.tabs.findIndex((t) => t.id === s.active);
      const tabs = [...s.tabs.slice(0, i + 1), tab, ...s.tabs.slice(i + 1)];
      return { tabs, active: a.background ? s.active : tab.id };
    }
    case "closeTab": {
      const i = s.tabs.findIndex((t) => t.id === a.id);
      if (i < 0) return s;
      const tabs = s.tabs.filter((t) => t.id !== a.id);
      if (tabs.length === 0) return { tabs, active: "" };
      const active = s.active === a.id ? tabs[Math.min(i, tabs.length - 1)].id : s.active;
      return { tabs, active };
    }
    case "activate":
      return s.tabs.some((t) => t.id === a.id) ? { ...s, active: a.id } : s;
    case "activateOffset": {
      const i = s.tabs.findIndex((t) => t.id === s.active);
      const n = s.tabs.length;
      return { ...s, active: s.tabs[(((i + a.delta) % n) + n) % n].id };
    }
    case "navigate":
      return mapTab(s, a.tabId, (t) => {
        const cur = currentEntry(t);
        if (cur.url === a.url) return { ...t, reloadKey: t.reloadKey + 1 };
        const entries = [...t.entries.slice(0, t.index + 1), { url: a.url, title: a.title ?? a.url }];
        return { ...t, entries, index: entries.length - 1 };
      });
    case "replace":
      return mapTab(s, a.tabId, (t) => {
        const entries = t.entries.slice();
        entries[t.index] = { url: a.url, title: a.title ?? entries[t.index].title };
        return { ...t, entries };
      });
    case "setTitle":
      return mapTab(s, a.tabId, (t) => {
        // Ignore titles reported for a page the tab has already left.
        if (a.url && currentEntry(t).url !== a.url) return t;
        const entries = t.entries.slice();
        entries[t.index] = { ...entries[t.index], title: a.title };
        return { ...t, entries };
      });
    case "back":
      return mapTab(s, a.tabId, (t) => (canGoBack(t) ? { ...t, index: t.index - 1 } : t));
    case "forward":
      return mapTab(s, a.tabId, (t) => (canGoForward(t) ? { ...t, index: t.index + 1 } : t));
    case "reload":
      return mapTab(s, a.tabId, (t) => ({ ...t, reloadKey: t.reloadKey + 1 }));
  }
}
