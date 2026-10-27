"use client";

// News Reader: follow Connected Era sites through their RSS feeds. Feeds are
// fetched into an offline cache when you refresh (and when the reader
// opens), with unread markers, folders and a fetch history per feed.

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { feedById, feeds, findFeed, type Feed, type FeedItem } from "@/data/feeds";
import { fetchFeed, shownItems, unreadIn } from "@/lib/news";
import { newId } from "@/lib/ids";
import { formatDate, formatDateTime, iso } from "@/lib/time";
import { useArgs, useWindowTitle } from "../common";
import type { AppProps } from "../registry";

interface Sub {
  id: string;
  owner: string;
  feedId: string;
  folderId: string | null;
  addedAt: string;
}
interface Folder {
  id: string;
  owner: string;
  name: string;
}
interface Cache {
  id: string;
  owner: string;
  feedId: string;
  fetchedAt: string;
  items: FeedItem[];
}
interface Read {
  id: string;
  owner: string;
  itemId: string;
  at: string;
}
interface Fetch {
  id: string;
  owner: string;
  feedId: string;
  at: string;
  found: number;
  fresh: number;
}

type View = { kind: "all" } | { kind: "unread" } | { kind: "folder"; id: string } | { kind: "feed"; id: string };

export default function NewsReader({ win }: AppProps) {
  const { store, user, now, computer, openApp } = useSystem();
  const dialog = useDialog();
  const [subs, , subsLoaded] = useCollection<Sub>("news.subs");
  const [folders] = useCollection<Folder>("news.folders");
  const [caches] = useCollection<Cache>("news.cache");
  const [reads] = useCollection<Read>("news.read");
  const [fetches] = useCollection<Fetch>("news.fetches");
  const [view, setView] = useState<View>({ kind: "all" });
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [address, setAddress] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const t = now();
  const zone = computer.timeZone;

  const read = useMemo(() => new Set(reads.map((r) => r.itemId)), [reads]);
  const itemsOf = (feedId: string) => shownItems(caches.find((c) => c.feedId === feedId)?.items ?? [], t);
  const feedOfItem = new Map<string, Feed>();
  for (const s of subs) for (const i of itemsOf(s.feedId)) feedOfItem.set(i.id, feedById(s.feedId)!);
  const inView = (s: Sub) => view.kind === "all" || view.kind === "unread" || (view.kind === "folder" && s.folderId === view.id) || (view.kind === "feed" && s.feedId === view.id);
  const list = subs
    .filter(inView)
    .flatMap((s) => itemsOf(s.feedId))
    .filter((i) => view.kind !== "unread" || !read.has(i.id))
    .sort((a, b) => b.at.localeCompare(a.at));
  const item = list.find((i) => i.id === selected) ?? null;
  const totalUnread = subs.reduce((n, s) => n + unreadIn(itemsOf(s.feedId), read), 0);
  useWindowTitle(win, totalUnread ? `News Reader (${totalUnread} unread)` : "News Reader");

  const fetchAll = async (only?: string[]) => {
    if (!user) return;
    const at = iso(now());
    for (const s of await store.list<Sub>("news.subs")) {
      if (s.owner !== user.id || (only && !only.includes(s.feedId))) continue;
      const feed = feedById(s.feedId);
      if (!feed) continue;
      const cacheId = `${user.id}:${s.feedId}`;
      const cached = await store.get<Cache>("news.cache", cacheId);
      const { items, fresh } = fetchFeed(feed, Date.parse(at), cached?.items);
      await store.put<Cache>("news.cache", { id: cacheId, owner: user.id, feedId: s.feedId, fetchedAt: at, items });
      await store.put<Fetch>("news.fetches", { id: newId("hist"), owner: user.id, feedId: s.feedId, at, found: items.length, fresh: fresh.length });
    }
  };
  const refresh = async (only?: string[]) => {
    setBusy(true);
    await fetchAll(only);
    setBusy(false);
  };

  // Fetch everything once the reader opens.
  const refreshOnOpen = useEffectEvent(() => void fetchAll());
  useEffect(() => {
    if (subsLoaded) refreshOnOpen();
  }, [subsLoaded]);

  const subscribe = async (feed: Feed) => {
    if (!user) return;
    await store.put<Sub>("news.subs", { id: `${user.id}:${feed.id}`, owner: user.id, feedId: feed.id, folderId: null, addedAt: iso(now()) });
    await refresh([feed.id]);
    setView({ kind: "feed", id: feed.id });
  };

  // Other programs can ask the reader to follow a feed: openApp("newsreader", { subscribe: url }).
  useArgs(win, (args) => {
    if (typeof args.subscribe !== "string") return;
    const feed = findFeed(args.subscribe);
    if (feed) void subscribe(feed);
  });

  const markRead = async (i: FeedItem, isRead = true) => {
    if (!user) return;
    const id = `${user.id}:${i.id}`;
    if (isRead) await store.put<Read>("news.read", { id, owner: user.id, itemId: i.id, at: iso(now()) });
    else await store.delete("news.read", id);
  };
  const open = (i: FeedItem) => {
    setSelected(i.id);
    if (!read.has(i.id)) void markRead(i);
  };
  const markAllRead = async () => {
    for (const i of list) if (!read.has(i.id)) await markRead(i);
  };
  const addByAddress = async () => {
    const a = address.trim();
    if (!/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/\S*)?$/i.test(a)) return setAddError("That doesn't look like a web address. Try something like aniwire.connectedera.local.");
    const feed = findFeed(a);
    if (!feed) return setAddError("No feed was found at that address. News Reader can follow the feeds Connected Era sites publish, like the ones listed above.");
    if (subs.some((s) => s.feedId === feed.id)) return setAddError(`You're already following ${feed.title}.`);
    setAddError(null);
    setAddress("");
    setAdding(false);
    await subscribe(feed);
  };
  const newFolder = async () => {
    if (!user) return;
    const name = (await dialog.prompt("Name for the new folder:", "", { title: "New folder", okLabel: "Create" }))?.trim();
    if (!name) return;
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return dialog.alert(`There's already a folder called "${name}".`, { title: "News Reader" });
    const id = newId("fld");
    await store.put<Folder>("news.folders", { id, owner: user.id, name: name.slice(0, 40) });
    setView({ kind: "folder", id });
  };
  const deleteFolder = async (f: Folder) => {
    if (!(await dialog.confirm(`Delete the folder "${f.name}"? Its feeds move back to the main list.`, { title: "Delete folder", okLabel: "Delete" }))) return;
    for (const s of subs) if (s.folderId === f.id) await store.put<Sub>("news.subs", { ...s, folderId: null });
    await store.delete("news.folders", f.id);
    setView({ kind: "all" });
  };
  const unsubscribe = async (feedId: string) => {
    if (!user) return;
    const feed = feedById(feedId);
    if (!(await dialog.confirm(`Stop following ${feed?.title}?`, { title: "Unsubscribe", okLabel: "Unsubscribe" }))) return;
    await store.delete("news.subs", `${user.id}:${feedId}`);
    await store.delete("news.cache", `${user.id}:${feedId}`);
    setView({ kind: "all" });
  };
  const moveTo = async (feedId: string, folderId: string | null) => {
    const s = subs.find((x) => x.feedId === feedId);
    if (s) await store.put<Sub>("news.subs", { ...s, folderId });
  };

  const step = (d: number) => {
    const i = list.findIndex((x) => x.id === selected);
    const next = list[Math.min(list.length - 1, Math.max(0, i + d))];
    if (next) open(next);
  };

  const feedRow = (s: Sub) => {
    const f = feedById(s.feedId);
    if (!f) return null;
    const n = unreadIn(itemsOf(s.feedId), read);
    return (
      <button key={s.id} className={`nr-node feed${view.kind === "feed" && view.id === s.feedId ? " on" : ""}`} onClick={() => setView({ kind: "feed", id: s.feedId })}>
        <span>{f.title}</span>
        {n > 0 && <b>{n}</b>}
      </button>
    );
  };
  const selectedFeed = view.kind === "feed" ? feedById(view.id) : null;
  const selectedSub = selectedFeed ? subs.find((s) => s.feedId === selectedFeed.id) : null;
  const history = selectedFeed ? fetches.filter((f) => f.feedId === selectedFeed.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4) : [];
  const directory = [...new Set(feeds.map((f) => f.site))];

  return (
    <div
      className="news-reader"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("input, textarea, select")) return;
        if (e.key === "j") step(1);
        else if (e.key === "k") step(-1);
        else if (e.key === "r") void refresh();
        else if (e.key === "m" && item) void markRead(item, !read.has(item.id));
        else if (e.key === "Enter" && item) openApp("browser", { url: item.link });
      }}
    >
      <div className="toolbar nr-toolbar">
        <button className="btn" onClick={() => refresh()} disabled={busy || !subs.length} title="Refresh all feeds (R)">
          {busy ? "Refreshing…" : "⟳ Refresh"}
        </button>
        <button className="btn" onClick={() => (setAdding((v) => !v), setAddError(null))}>
          + Add feed
        </button>
        <button className="btn" onClick={newFolder}>
          New folder
        </button>
        <button className="btn" onClick={markAllRead} disabled={!list.some((i) => !read.has(i.id))}>
          Mark all as read
        </button>
        <span className="muted nr-keys">J/K next and previous, M read or unread, Enter opens in the browser</span>
      </div>
      {adding && (
        <div className="nr-add">
          <h3>Follow a site</h3>
          <div className="nr-directory">
            {directory.map((site) => (
              <div key={site}>
                <strong>{site}</strong>
                {feeds
                  .filter((f) => f.site === site)
                  .map((f) => {
                    const following = subs.some((s) => s.feedId === f.id);
                    return (
                      <div key={f.id} className="nr-dir-row">
                        <span title={f.description}>{f.title}</span>
                        <button className="link-btn" disabled={following} onClick={() => subscribe(f)}>
                          {following ? "Following" : "Follow"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
          <form
            className="nr-address"
            onSubmit={(e) => {
              e.preventDefault();
              void addByAddress();
            }}
          >
            <label>
              Or type a site or feed address:{" "}
              <input className="field" value={address} onChange={(e) => (setAddress(e.target.value), setAddError(null))} placeholder="aniwire.connectedera.local" aria-label="Feed address" />
            </label>
            <button className="btn primary">Follow</button>
          </form>
          {addError && <p className="nr-error">{addError}</p>}
        </div>
      )}
      <div className="nr-body">
        <nav className="nr-tree" aria-label="Feeds">
          <button className={`nr-node${view.kind === "all" ? " on" : ""}`} onClick={() => setView({ kind: "all" })}>
            <span>All items</span>
          </button>
          <button className={`nr-node${view.kind === "unread" ? " on" : ""}`} onClick={() => setView({ kind: "unread" })}>
            <span>Unread</span>
            {totalUnread > 0 && <b>{totalUnread}</b>}
          </button>
          {folders.map((f) => (
            <div key={f.id} className="nr-folder">
              <button className={`nr-node folder${view.kind === "folder" && view.id === f.id ? " on" : ""}`} onClick={() => setView({ kind: "folder", id: f.id })}>
                <span>📁 {f.name}</span>
                {(() => {
                  const n = subs.filter((s) => s.folderId === f.id).reduce((k, s) => k + unreadIn(itemsOf(s.feedId), read), 0);
                  return n > 0 ? <b>{n}</b> : null;
                })()}
              </button>
              {subs.filter((s) => s.folderId === f.id).map(feedRow)}
            </div>
          ))}
          {subs.filter((s) => !s.folderId || !folders.some((f) => f.id === s.folderId)).map(feedRow)}
        </nav>
        <section className="nr-list" aria-label="Items">
          {view.kind === "folder" && (
            <div className="nr-listhead">
              {folders.find((f) => f.id === view.id)?.name}
              <button className="link-btn" onClick={() => deleteFolder(folders.find((f) => f.id === view.id)!)}>
                Delete folder
              </button>
            </div>
          )}
          {selectedFeed && selectedSub && (
            <div className="nr-listhead">
              <div>
                <strong>{selectedFeed.title}</strong> <span className="muted">{selectedFeed.description}</span>
              </div>
              <div className="nr-feedtools">
                <label>
                  Folder:{" "}
                  <select className="field" value={selectedSub.folderId ?? ""} onChange={(e) => moveTo(selectedFeed.id, e.target.value || null)} aria-label="Move to folder">
                    <option value="">(none)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="link-btn" onClick={() => unsubscribe(selectedFeed.id)}>
                  Unsubscribe
                </button>
              </div>
              {history.length > 0 && (
                <div className="nr-history muted">
                  Fetch history:{" "}
                  {history.map((h) => (
                    <span key={h.id}>
                      {formatDateTime(Date.parse(h.at), zone)} ({h.fresh} new)
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          {subsLoaded && subs.length === 0 ? (
            <div className="nr-empty">
              <p>You&apos;re not following any sites yet.</p>
              <button className="btn primary" onClick={() => setAdding(true)}>
                Find something to follow
              </button>
            </div>
          ) : (
            <ul>
              {list.map((i) => (
                <li key={i.id}>
                  <button className={`nr-item${read.has(i.id) ? "" : " unread"}${i.id === selected ? " on" : ""}`} onClick={() => open(i)}>
                    <span className="nr-item-title">{i.title}</span>
                    <span className="nr-item-meta">
                      {feedOfItem.get(i.id)?.title} · {formatDate(Date.parse(i.at), zone)}
                    </span>
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="nr-none muted">{view.kind === "unread" ? "All caught up!" : "Nothing here yet. Try Refresh."}</li>}
            </ul>
          )}
        </section>
        <article className="nr-read">
          {item ? (
            <>
              <h2>{item.title}</h2>
              <div className="muted">
                {feedOfItem.get(item.id)?.title} · {formatDateTime(Date.parse(item.at), zone)}
              </div>
              <p>{item.summary}</p>
              <div className="nr-actions">
                <button className="btn primary" onClick={() => openApp("browser", { url: item.link })}>
                  Open in Web Browser
                </button>
                <button className="btn" onClick={() => markRead(item, !read.has(item.id))}>
                  {read.has(item.id) ? "Mark as unread" : "Mark as read"}
                </button>
              </div>
            </>
          ) : (
            <p className="muted nr-hint">Choose an item to read it here.</p>
          )}
        </article>
      </div>
    </div>
  );
}
