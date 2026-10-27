"use client";

import { useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { A, useSite, usePageTitle } from "@/components/sites/SiteContext";
import { Icon } from "@/components/desktop/Icon";
import { appForFile } from "@/components/apps/catalog";
import { useDialog } from "@/components/desktop/Dialogs";
import { CONNECTION_SPEEDS } from "@/components/system/defaults";
import { formatDate, formatDateTime } from "@/lib/time";
import { formatSize } from "@/lib/vfs";
import { HOME_URL, searchUrl } from "@/lib/web/url";
import type { Bookmark, HistoryItem } from "./Browser";

/** Archive sites to get started with. */
const POPULAR: [string, string][] = [
  ["MeTube", "http://metube.connectedera.local/"],
  ["MangaShelf", "http://manga.connectedera.local/"],
  ["YourAnimeList", "http://yal.connectedera.local/"],
  ["Birdie", "http://birdie.connectedera.local/"],
  ["Tum", "http://tum.connectedera.local/"],
  ["InkPocket", "http://inkpocket.connectedera.local/"],
  ["HomePlot", "http://homeplot.connectedera.local/"],
  ["WallpaperGarden", "http://wallpapers.connectedera.local/"],
  ["Freeware Corner", "http://freewarecorner.connectedera.local/"],
  ["TechNook Forums", "http://technook.connectedera.local/"],
  ["3Chan", "http://3chan.connectedera.local/"],
  ["Pantry Recipes", "http://pantryrecipes.connectedera.local/"],
];

function NewTab() {
  usePageTitle("New Tab");
  const { navigate } = useSite();
  const [history] = useCollection<HistoryItem>("history");
  const [bookmarks] = useCollection<Bookmark>("bookmarks");
  const [q, setQ] = useState("");
  const top = useMemo(() => {
    const counts = new Map<string, { title: string; n: number }>();
    for (const h of history) {
      const c = counts.get(h.url) ?? { title: h.title, n: 0 };
      counts.set(h.url, { title: h.title, n: c.n + 1 });
    }
    return [...counts.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 8);
  }, [history]);
  return (
    <div className="about newtab">
      <form
        className="newtab-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) navigate(searchUrl(q.trim()));
        }}
      >
        <div className="search-logo small" aria-hidden>
          <span className="search-logo-mark" />
          <span className="search-logo-word">Connected</span>
          <span className="search-logo-sub">Search</span>
        </div>
        <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Connected Search" aria-label="Search Connected Search" autoFocus />
      </form>
      <h2>Most visited</h2>
      {top.length === 0 ? (
        <p className="empty">Pages you visit often will show up here.</p>
      ) : (
        <div className="tiles">
          {top.map(([url, v]) => (
            <A key={url} href={url} className="tile">
              <strong>{v.title}</strong>
              <small>{url.replace(/^https?:\/\/(www\.)?/, "")}</small>
            </A>
          ))}
        </div>
      )}
      <h2>Popular sites</h2>
      <div className="tiles">
        {POPULAR.map(([title, url]) => (
          <A key={url} href={url} className="tile">
            <strong>{title}</strong>
            <small>{url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</small>
          </A>
        ))}
      </div>
      {bookmarks.length > 0 && (
        <>
          <h2>Bookmarks</h2>
          <ul className="plain-list">
            {bookmarks.map((b) => (
              <li key={b.id}>
                <A href={b.url}>{b.title}</A>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function HistoryPage() {
  usePageTitle("History");
  const { store, computer } = useSystem();
  const dialog = useDialog();
  const [history] = useCollection<HistoryItem>("history");
  const [filter, setFilter] = useState("");
  const list = history.filter((h) => (h.title + h.url).toLowerCase().includes(filter.toLowerCase())).sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  const days = new Map<string, HistoryItem[]>();
  for (const h of list) {
    const d = formatDate(Date.parse(h.visitedAt), computer.timeZone);
    days.set(d, [...(days.get(d) ?? []), h]);
  }
  return (
    <div className="about">
      <h1>History</h1>
      <div className="about-actions">
        <input className="field" placeholder="Search history" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search history" />
        <button
          className="btn"
          disabled={history.length === 0}
          onClick={async () => {
            if (await dialog.confirm("Clear all browsing history?", { title: "Clear History", okLabel: "Clear" })) for (const h of history) await store.delete("history", h.id);
          }}
        >
          Clear browsing history
        </button>
      </div>
      {list.length === 0 && <p className="empty">No history yet.</p>}
      {[...days.entries()].map(([day, items]) => (
        <section key={day}>
          <h3>{day}</h3>
          <ul className="history-list">
            {items.map((h) => (
              <li key={h.id}>
                <span className="muted">{formatDateTime(Date.parse(h.visitedAt), computer.timeZone).split(" ").slice(-2).join(" ")}</span>
                <A href={h.url}>{h.title}</A>
                <small className="muted">{h.url}</small>
                <button className="link-btn" aria-label={`Remove ${h.title} from history`} onClick={() => store.delete("history", h.id)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function DownloadsPage() {
  usePageTitle("Downloads");
  const { downloads, vfs, openApp, cancelDownload, retryDownload, computer, folders } = useSystem();
  return (
    <div className="about">
      <h1>Downloads</h1>
      <div className="about-actions">
        <button className="btn" onClick={() => openApp("explorer", { folderId: folders?.downloads })}>
          Open Downloads folder
        </button>
      </div>
      {downloads.length === 0 && <p className="empty">Files you download appear here.</p>}
      <ul className="download-list">
        {downloads.map((d) => (
          <li key={d.id} className={`download ${d.status}`}>
            <Icon name="download" size={28} />
            <div className="download-info">
              <strong>{d.filename}</strong>
              <small className="muted">{d.url}</small>
              {d.status === "downloading" ? (
                <>
                  <progress max={d.total || 1} value={d.received} aria-label={`Downloading ${d.filename}`} />
                  <small>
                    {formatSize(d.received)}
                    {d.total ? ` of ${formatSize(d.total)}` : ""}
                  </small>
                </>
              ) : (
                <small>
                  {d.status === "complete" && `${formatSize(d.total)} · ${formatDateTime(Date.parse(d.finishedAt ?? d.startedAt), computer.timeZone)}`}
                  {d.status === "failed" && `Failed: ${d.error ?? "network error"}`}
                  {d.status === "cancelled" && "Cancelled"}
                </small>
              )}
            </div>
            <div className="download-actions">
              {d.status === "downloading" && (
                <button className="link-btn" onClick={() => cancelDownload(d.id)}>
                  Cancel
                </button>
              )}
              {(d.status === "failed" || d.status === "cancelled") && (
                <button className="link-btn" onClick={() => retryDownload(d.id)}>
                  Retry
                </button>
              )}
              {d.status === "complete" && d.fileId && (
                <>
                  <button
                    className="link-btn"
                    onClick={async () => {
                      const node = await vfs?.get(d.fileId!);
                      const t = node && appForFile(node);
                      if (t) openApp(t.appId, t.args);
                    }}
                  >
                    Open
                  </button>
                  <button
                    className="link-btn"
                    onClick={async () => {
                      const node = await vfs?.get(d.fileId!);
                      openApp("explorer", { folderId: node?.parentId ?? folders?.downloads, select: d.fileId });
                    }}
                  >
                    Show in folder
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BookmarksPage() {
  usePageTitle("Bookmarks");
  const { store } = useSystem();
  const dialog = useDialog();
  const [bookmarks] = useCollection<Bookmark>("bookmarks");
  const sorted = [...bookmarks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div className="about">
      <h1>Bookmarks</h1>
      {sorted.length === 0 && <p className="empty">No bookmarks yet. Click the ☆ in the address bar to add one.</p>}
      {(["bar", "other"] as const).map((folder) => (
        <section key={folder}>
          <h3>{folder === "bar" ? "Bookmarks bar" : "Other bookmarks"}</h3>
          <ul className="history-list">
            {sorted
              .filter((b) => b.folder === folder)
              .map((b) => (
                <li key={b.id}>
                  <A href={b.url}>{b.title}</A>
                  <small className="muted">{b.url}</small>
                  <button
                    className="link-btn"
                    onClick={async () => {
                      const title = await dialog.prompt("Bookmark name:", b.title, { title: "Edit Bookmark" });
                      if (title) await store.put("bookmarks", { ...b, title });
                    }}
                  >
                    Rename
                  </button>
                  <button className="link-btn" onClick={() => store.put("bookmarks", { ...b, folder: folder === "bar" ? "other" : "bar" })}>
                    Move to {folder === "bar" ? "Other bookmarks" : "Bookmarks bar"}
                  </button>
                  <button className="link-btn" onClick={() => store.delete("bookmarks", b.id)}>
                    Delete
                  </button>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PreferencesPage() {
  usePageTitle("Preferences");
  const { settings, updateSettings, computer, setComputer } = useSystem();
  const [home, setHome] = useState(settings.browser.homepage);
  const b = settings.browser;
  return (
    <div className="about prefs">
      <h1>Preferences</h1>
      <section>
        <h3>On startup</h3>
        <label>
          <input type="radio" name="startup" checked={b.startup === "home"} onChange={() => updateSettings({ browser: { ...b, startup: "home" } })} /> Open the home page
        </label>
        <label>
          <input type="radio" name="startup" checked={b.startup === "restore"} onChange={() => updateSettings({ browser: { ...b, startup: "restore" } })} /> Continue where I left off (restore my tabs)
        </label>
      </section>
      <section>
        <h3>Home page</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void updateSettings({ browser: { ...b, homepage: home.trim() || HOME_URL } });
          }}
        >
          <input className="field" style={{ width: 360 }} value={home} onChange={(e) => setHome(e.target.value)} aria-label="Home page address" /> <button className="btn">Save</button>{" "}
          <button type="button" className="btn" onClick={() => (setHome(HOME_URL), updateSettings({ browser: { ...b, homepage: HOME_URL } }))}>
            Use Connected Search
          </button>
        </form>
      </section>
      <section>
        <h3>Appearance</h3>
        <label>
          <input type="checkbox" checked={b.showBookmarksBar} onChange={(e) => updateSettings({ browser: { ...b, showBookmarksBar: e.target.checked } })} /> Always show the bookmarks bar
        </label>
      </section>
      <section>
        <h3>Search</h3>
        <p>Address bar searches use Connected Search, the Connected Era&apos;s search engine. Its results page also offers a separate link to search today&apos;s live web in your real browser.</p>
      </section>
      <section>
        <h3>Connection</h3>
        <label>
          Download speed:{" "}
          <select className="field" value={computer.connectionSpeed} onChange={(e) => setComputer({ connectionSpeed: Number(e.target.value) })} aria-label="Download speed">
            {CONNECTION_SPEEDS.map((s) => (
              <option key={s.label} value={s.bytesPerSecond}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </section>
      <section>
        <h3>Privacy</h3>
        <A href="about:history">Manage history...</A>
      </section>
    </div>
  );
}

export function AboutPage({ page }: { page: string }) {
  switch (page) {
    case "newtab":
      return <NewTab />;
    case "history":
      return <HistoryPage />;
    case "downloads":
      return <DownloadsPage />;
    case "bookmarks":
      return <BookmarksPage />;
    case "preferences":
      return <PreferencesPage />;
    case "blank":
      return <BlankPage />;
    default:
      return <UnknownAbout page={page} />;
  }
}

function BlankPage() {
  usePageTitle("about:blank");
  return <div className="about" />;
}

function UnknownAbout({ page }: { page: string }) {
  usePageTitle("Page not found");
  return (
    <div className="about">
      <h1>about:{page}</h1>
      <p>
        There is no such browser page. Try <A href="about:history">about:history</A>, <A href="about:downloads">about:downloads</A>, <A href="about:bookmarks">about:bookmarks</A> or{" "}
        <A href="about:preferences">about:preferences</A>.
      </p>
    </div>
  );
}
