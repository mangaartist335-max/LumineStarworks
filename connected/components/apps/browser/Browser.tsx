"use client";

import { Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import { Icon } from "@/components/desktop/Icon";
import type { AppProps } from "../registry";
import { activeTab, browserReducer, canGoBack, canGoForward, currentEntry, newBrowser, type BrowserState } from "@/lib/browser-model";
import { interpretInput, NEW_TAB_URL, parseUrl } from "@/lib/web/url";
import { newId } from "@/lib/ids";
import { iso } from "@/lib/time";
import { SiteCtx, type SiteContextValue } from "@/components/sites/SiteContext";
import { siteForHost } from "@/components/sites/registry";
import { getSearchIndex } from "@/components/sites/searchIndex";
import { AboutPage } from "./AboutPages";
import { LivePage, NotFoundPage } from "./SpecialPages";
import { YalFrame } from "./YalFrame";

export interface Bookmark {
  id: string;
  owner: string;
  url: string;
  title: string;
  folder: "bar" | "other";
  createdAt: string;
  origin: "user";
}

export interface HistoryItem {
  id: string;
  owner: string;
  url: string;
  title: string;
  visitedAt: string;
  origin: "user";
}

function hostIcon(url: string) {
  const u = parseUrl(url);
  if (!u || u.protocol === "about:") return "browser" as const;
  return siteForHost(u.host)?.icon ?? ("browser" as const);
}

function PageView({ url, tabId, active, reloadKey, dispatchNav, setStatus }: { url: string; tabId: string; active: boolean; reloadKey: number; dispatchNav: (a: Parameters<typeof browserReducer>[1]) => void; setStatus: (s: string | null) => void }) {
  const parsed = useMemo(() => parseUrl(url), [url]);
  const navigate = useCallback<SiteContextValue["navigate"]>(
    (href, opts) => {
      const target = interpretInput(href)?.url ?? href;
      if (opts?.newTab) dispatchNav({ type: "newTab", id: newId("tab"), url: target, background: true });
      else if (opts?.replace) dispatchNav({ type: "replace", url: target, tabId });
      else dispatchNav({ type: "navigate", url: target, tabId });
    },
    [dispatchNav, tabId],
  );
  const setTitle = useCallback((title: string) => dispatchNav({ type: "setTitle", title, tabId, url }), [dispatchNav, tabId, url]);
  const ctx = useMemo<SiteContextValue | null>(() => (parsed ? { url: parsed, tabId, active, navigate, setTitle, setStatus } : null), [parsed, tabId, active, navigate, setTitle, setStatus]);

  if (!parsed || !ctx) return <NotFoundPage url={url} navigate={navigate} setTitle={setTitle} />;
  let content: React.ReactNode;
  if (parsed.protocol === "about:") {
    content = <AboutPage key={reloadKey} page={parsed.path} />;
  } else {
    const site = siteForHost(parsed.host);
    if (!site) content = <LivePage key={reloadKey} />;
    else if (site.frame === "yal") content = <YalFrame key={reloadKey} />;
    else if (site.Component) {
      const C = site.Component;
      content = <C key={`${reloadKey}`} />;
    }
  }
  return (
    <SiteCtx.Provider value={ctx}>
      <Suspense fallback={<div className="page-loading">Loading...</div>}>{content}</Suspense>
    </SiteCtx.Provider>
  );
}

export default function Browser({ win }: AppProps) {
  const sys = useSystem();
  const { settings, dispatchWm, now, user, store } = sys;
  const [savedSession, setSavedSession, sessionLoaded] = useUserValue<BrowserState | null>("browser-session", null);
  const [bookmarks] = useCollection<Bookmark>("bookmarks");
  const [history] = useCollection<HistoryItem>("history");
  const initialUrl = (win.args?.url as string | undefined) ?? settings.browser.homepage;
  const [state, dispatch] = useReducer(browserReducer, undefined, () => newBrowser(newId("tab"), initialUrl, "Loading..."));
  const restored = useRef(false);
  const [address, setAddress] = useState(initialUrl);
  const [editing, setEditing] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const addressRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tab = activeTab(state);
  const entry = tab ? currentEntry(tab) : null;

  // Session restore, if the user chose "show my tabs from last time".
  useEffect(() => {
    if (!sessionLoaded || restored.current) return;
    restored.current = true;
    if (!win.args?.url && settings.browser.startup === "restore" && savedSession?.tabs.length) {
      for (const t of savedSession.tabs) dispatch({ type: "newTab", id: newId("tab"), url: currentEntry(t).url, title: currentEntry(t).title, background: true });
      dispatch({ type: "closeTab", id: state.tabs[0].id });
    }
  }, [sessionLoaded, savedSession, settings.browser.startup, win.args, state.tabs]);

  // Opening the browser again with a new address (from Messenger, Mail...).
  const lastNonce = useRef(win.args?.nonce);
  useEffect(() => {
    if (win.args?.nonce !== lastNonce.current && typeof win.args?.url === "string") {
      lastNonce.current = win.args?.nonce;
      dispatch({ type: "newTab", id: newId("tab"), url: win.args.url as string });
    }
  }, [win.args]);

  // .url shortcut files open their address.
  useEffect(() => {
    const id = win.args?.shortcutFileId as string | undefined;
    if (!id || !sys.vfs) return;
    sys.vfs.readText(id).then((text) => {
      const m = /URL=(.+)/.exec(text);
      if (m) dispatch({ type: "navigate", url: m[1].trim() });
    });
  }, [win.args, sys.vfs]);

  // Save the session as it changes; close the window when the last tab closes.
  useEffect(() => {
    if (state.tabs.length === 0) {
      dispatchWm({ type: "close", id: win.id });
      return;
    }
    if (restored.current) void setSavedSession(state);
  }, [state, dispatchWm, win.id, setSavedSession]);

  // Keep the address bar and window title in step with the page.
  useEffect(() => {
    if (!entry) return;
    dispatchWm({ type: "setTitle", id: win.id, title: `${entry.title} - Web Browser` });
  }, [entry, dispatchWm, win.id]);
  // While you're not typing, the address bar shows the page's address.
  const pageAddress = entry ? (entry.url === NEW_TAB_URL ? "" : entry.url) : address;
  const shownAddress = editing ? address : pageAddress;

  // Record history: one entry per visit, title filled in when the page reports it.
  const visitIds = useRef(new Map<string, string>());
  useEffect(() => {
    if (!entry || !user || entry.url.startsWith("about:")) return;
    const key = `${tab.id}:${tab.index}:${entry.url}`;
    const existing = visitIds.current.get(key);
    const id = existing ?? newId("hist");
    if (!existing) visitIds.current.set(key, id);
    const title = entry.title === "Loading..." ? entry.url : entry.title;
    void store.get<HistoryItem>("history", id).then((prev) => {
      if (prev && prev.title === title) return;
      return store.put<HistoryItem>("history", { id, owner: user.id, url: entry.url, title, visitedAt: prev?.visitedAt ?? iso(now()), origin: "user" });
    });
  }, [entry, tab, user, store, now]);

  const bookmarked = entry ? bookmarks.find((b) => b.url === entry.url) : undefined;
  const toggleBookmark = useCallback(async () => {
    if (!entry || !user || entry.url.startsWith("about:newtab")) return;
    if (bookmarked) await store.delete("bookmarks", bookmarked.id);
    else await store.put<Bookmark>("bookmarks", { id: newId("bm"), owner: user.id, url: entry.url, title: entry.title, folder: "bar", createdAt: iso(now()), origin: "user" });
  }, [entry, user, bookmarked, store, now]);

  const go = (text: string) => {
    const target = interpretInput(text);
    if (!target) return;
    dispatch({ type: "navigate", url: target.url });
    setEditing(false);
    setSuggestOpen(false);
    addressRef.current?.blur();
  };

  const suggestions = useMemo(() => {
    const q = address.trim().toLowerCase();
    if (!editing || !q) return [];
    const seen = new Set<string>();
    const out: { label: string; url: string; kind: "bookmark" | "history" | "search" }[] = [];
    for (const b of bookmarks) if ((b.title + b.url).toLowerCase().includes(q) && !seen.has(b.url) && out.length < 4) (seen.add(b.url), out.push({ label: b.title, url: b.url, kind: "bookmark" }));
    for (const h of [...history].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt)))
      if ((h.title + h.url).toLowerCase().includes(q) && !seen.has(h.url) && out.length < 7) (seen.add(h.url), out.push({ label: h.title, url: h.url, kind: "history" }));
    for (const s of getSearchIndex().suggest(address, now(), [], 4)) out.push({ label: s, url: s, kind: "search" });
    return out.slice(0, 10);
  }, [address, editing, bookmarks, history, now]);

  // Keyboard shortcuts while this window is focused.
  useEffect(() => {
    if (sys.wm.focused !== win.id) return;
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      const run = (fn: () => void) => (e.preventDefault(), fn());
      if (mod && k === "t") run(() => dispatch({ type: "newTab", id: newId("tab"), url: NEW_TAB_URL }));
      else if (mod && k === "w") run(() => dispatch({ type: "closeTab", id: state.active }));
      else if (mod && k === "l") run(() => addressRef.current?.select());
      else if (mod && k === "tab") run(() => dispatch({ type: "activateOffset", delta: e.shiftKey ? -1 : 1 }));
      else if ((mod && k === "r") || e.key === "F5") run(() => dispatch({ type: "reload" }));
      else if (mod && k === "d") run(() => void toggleBookmark());
      else if (mod && k === "h") run(() => dispatch({ type: "newTab", id: newId("tab"), url: "about:history" }));
      else if (mod && k === "j") run(() => dispatch({ type: "newTab", id: newId("tab"), url: "about:downloads" }));
      else if (mod && k === "n") run(() => sys.openApp("browser", { url: NEW_TAB_URL }));
      else if (e.altKey && e.key === "ArrowLeft") run(() => dispatch({ type: "back" }));
      else if (e.altKey && e.key === "ArrowRight") run(() => dispatch({ type: "forward" }));
      else if (e.altKey && e.key === "Home") run(() => dispatch({ type: "navigate", url: settings.browser.homepage }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sys, win.id, state.active, toggleBookmark, settings.browser.homepage]);

  const bar = bookmarks.filter((b) => b.folder === "bar").sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (!tab || !entry) return null;
  return (
    <div className="browser" ref={rootRef}>
      <div className="tabstrip" role="tablist" aria-label="Tabs">
        {state.tabs.map((t) => {
          const e = currentEntry(t);
          return (
            <div key={t.id} className={`tab${t.id === state.active ? " active" : ""}`} role="tab" aria-selected={t.id === state.active} onMouseDown={(ev) => ev.button === 0 && dispatch({ type: "activate", id: t.id })} onAuxClick={(ev) => ev.button === 1 && dispatch({ type: "closeTab", id: t.id })} title={e.title}>
              <Icon name={hostIcon(e.url)} size={14} />
              <span className="tab-title">{e.title}</span>
              <button className="tab-close" aria-label={`Close tab ${e.title}`} onMouseDown={(ev) => ev.stopPropagation()} onClick={() => dispatch({ type: "closeTab", id: t.id })}>
                ×
              </button>
            </div>
          );
        })}
        <button className="new-tab" aria-label="New tab" title="New tab (Ctrl+T)" onClick={() => dispatch({ type: "newTab", id: newId("tab"), url: NEW_TAB_URL })}>
          +
        </button>
      </div>
      <div className="navbar">
        <button className="nav-btn" aria-label="Back" title="Back (Alt+Left)" disabled={!canGoBack(tab)} onClick={() => dispatch({ type: "back" })}>
          <Icon name="back" size={14} />
        </button>
        <button className="nav-btn" aria-label="Forward" title="Forward (Alt+Right)" disabled={!canGoForward(tab)} onClick={() => dispatch({ type: "forward" })}>
          <Icon name="forward" size={14} />
        </button>
        <button className="nav-btn" aria-label="Reload" title="Reload (F5)" onClick={() => dispatch({ type: "reload" })}>
          <Icon name="reload" size={14} />
        </button>
        <button className="nav-btn" aria-label="Home" title="Home" onClick={() => dispatch({ type: "navigate", url: settings.browser.homepage })}>
          <Icon name="home" size={14} />
        </button>
        <form
          className="address"
          onSubmit={(e) => {
            e.preventDefault();
            go(shownAddress);
          }}
        >
          <Icon name={hostIcon(entry.url)} size={16} />
          <input
            ref={addressRef}
            value={shownAddress}
            placeholder="Search Goggle or type an address"
            aria-label="Address and search bar"
            onChange={(e) => (setAddress(e.target.value), setEditing(true), setSuggestOpen(true))}
            onFocus={(e) => (setAddress(pageAddress), setEditing(true), e.target.select())}
            onBlur={() => setTimeout(() => (setEditing(false), setSuggestOpen(false)), 150)}
            onKeyDown={(e) => e.key === "Escape" && (setEditing(false), setSuggestOpen(false), setAddress(entry.url), addressRef.current?.blur())}
            spellCheck={false}
          />
          <button type="button" className={`star${bookmarked ? " on" : ""}`} aria-label={bookmarked ? "Remove bookmark" : "Bookmark this page"} aria-pressed={Boolean(bookmarked)} title="Bookmark this page (Ctrl+D)" onClick={toggleBookmark}>
            {bookmarked ? "★" : "☆"}
          </button>
          {suggestOpen && suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s, i) => (
                <li key={i} role="option" aria-selected={false} onMouseDown={(e) => (e.preventDefault(), go(s.url))}>
                  <Icon name={s.kind === "search" ? "search" : s.kind === "bookmark" ? "star" : "browser"} size={14} />
                  <span>{s.label}</span>
                  {s.kind !== "search" && <small>{s.url}</small>}
                </li>
              ))}
            </ul>
          )}
        </form>
        <div className="browser-menu-wrap">
          <button className="nav-btn" aria-label="Browser menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            ☰
          </button>
          {menuOpen && (
            <div className="context-menu" style={{ position: "absolute", right: 0, top: 30 }} role="menu" onMouseLeave={() => setMenuOpen(false)}>
              {[
                ["New tab", () => dispatch({ type: "newTab", id: newId("tab"), url: NEW_TAB_URL }), "Ctrl+T"],
                ["New window", () => sys.openApp("browser", { url: NEW_TAB_URL }), "Ctrl+N"],
                ["History", () => dispatch({ type: "newTab", id: newId("tab"), url: "about:history" }), "Ctrl+H"],
                ["Downloads", () => dispatch({ type: "newTab", id: newId("tab"), url: "about:downloads" }), "Ctrl+J"],
                ["Bookmarks", () => dispatch({ type: "newTab", id: newId("tab"), url: "about:bookmarks" }), ""],
                ["Preferences", () => dispatch({ type: "newTab", id: newId("tab"), url: "about:preferences" }), ""],
              ].map(([label, fn, key]) => (
                <button key={label as string} className="menu-item" role="menuitem" onClick={() => (setMenuOpen(false), (fn as () => void)())}>
                  <span style={{ flex: 1 }}>{label as string}</span>
                  <small style={{ color: "#888" }}>{key as string}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {settings.browser.showBookmarksBar && (
        <div className="bookmarks-bar" aria-label="Bookmarks bar">
          {bar.length === 0 && <span className="bookmarks-empty">Bookmark pages with the ☆ star to keep them here.</span>}
          {bar.map((b) => (
            <button key={b.id} className="bookmark" title={b.url} onClick={(e) => (e.ctrlKey ? dispatch({ type: "newTab", id: newId("tab"), url: b.url, background: true }) : dispatch({ type: "navigate", url: b.url }))}>
              <Icon name={hostIcon(b.url)} size={14} />
              <span>{b.title}</span>
            </button>
          ))}
        </div>
      )}
      <div className="viewport">
        {state.tabs.map((t) => {
          const e = currentEntry(t);
          return (
            <div key={t.id} className="tab-page" hidden={t.id !== state.active}>
              {/* YAL pages share one frame per tab, so navigating inside YAL doesn't reload it. */}
              <PageView key={parseUrl(e.url)?.host === "youranimelist.net" ? "yal" : `${t.index}:${e.url}`} url={e.url} tabId={t.id} active={t.id === state.active} reloadKey={t.reloadKey} dispatchNav={dispatch} setStatus={setStatus} />
            </div>
          );
        })}
        {status && <div className="status-bubble">{status}</div>}
      </div>
    </div>
  );
}
