"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { A, useSite, usePageTitle } from "../SiteContext";
import { mangaTitles, MANGASHELF_HOST, pageUrl, type MangaChapter, type MangaTitle } from "@/data/manga";
import { isListed } from "@/lib/availability";
import { newId } from "@/lib/ids";
import { formatDate, iso, timeAgo } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { readZip } from "@/lib/zip";
import type { FileNode } from "@/lib/vfs";

const ms = (path: string, params?: Record<string, string | number | undefined>) => siteUrl(MANGASHELF_HOST, path, params);

interface Progress {
  id: string;
  owner: string;
  mangaId: string;
  chapterId: string;
  page: number;
  pages: number;
  updatedAt: string;
}
interface MgBookmark {
  id: string;
  owner: string;
  mangaId: string;
  chapterId: string;
  page: number;
  note: string;
  at: string;
  origin: "user";
}
interface MgFavorite {
  id: string;
  owner: string;
  mangaId: string;
  at: string;
}
interface MgImport {
  id: string;
  owner: string;
  title: string;
  author: string;
  direction: "rtl" | "ltr";
  pages: string[]; // blob ids
  createdAt: string;
  origin: "user";
}

const COL = { progress: "manga.progress", bookmarks: "manga.bookmarks", favorites: "manga.favorites", imports: "manga.imports" };

/** Titles and chapters released as of the computer's clock, plus the user's imports. */
function useLibrary() {
  const { now, computer } = useSystem();
  const [imports] = useCollection<MgImport>(COL.imports);
  const t = now();
  return useMemo(() => {
    const titles: (MangaTitle & { imported?: MgImport })[] = mangaTitles
      .map((m) => ({ ...m, chapters: m.chapters.filter((c) => isListed(c.availability, t, computer.region)) }))
      .filter((m) => m.chapters.length > 0);
    for (const imp of imports) {
      titles.push({
        id: imp.id,
        slug: `imported-${imp.id}`,
        title: imp.title,
        author: imp.author,
        genres: ["Imported"],
        status: "Completed",
        direction: imp.direction,
        cover: "",
        synopsis: "Imported from your computer.",
        chapters: [{ id: `${imp.id}_c1`, number: 1, title: imp.title, folder: "", pages: imp.pages.length, availability: { publishedAt: imp.createdAt } }],
        imported: imp,
      });
    }
    return titles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imports, computer.region, Math.floor(t / 60000)]);
}

function Shell({ children }: { children: React.ReactNode }) {
  const { navigate, url } = useSite();
  const [q, setQ] = useState(url.params.get("q") ?? "");
  return (
    <div className="mangashelf">
      <header className="ms-header">
        <A href={ms("/")} className="ms-logo">
          Manga<span>Shelf</span>
        </A>
        <nav>
          <A href={ms("/browse")}>Browse</A>
          <A href={ms("/favorites")}>Favorites</A>
          <A href={ms("/bookmarks")}>Bookmarks</A>
          <A href={ms("/history")}>History</A>
          <A href={ms("/import")}>Import</A>
        </nav>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(ms("/browse", { q: q.trim() || undefined }));
          }}
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author or genre" aria-label="Search manga" />
          <button>Search</button>
        </form>
      </header>
      <div className="ms-body">{children}</div>
      <footer className="ms-footer">MangaShelf · Read manga online · All series shown are original works published on MangaShelf</footer>
    </div>
  );
}

function Cover({ m }: { m: MangaTitle & { imported?: MgImport } }) {
  const src = useImportedPage(m.imported, 1);
  // eslint-disable-next-line @next/next/no-img-element
  return m.cover || src ? <img className="ms-cover" src={m.cover || src!} alt={`${m.title} cover`} /> : <div className="ms-cover placeholder">{m.title}</div>;
}

function useImportedPage(imp: MgImport | undefined, page: number): string | null {
  const { store } = useSystem();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!imp) return;
    let revoke = () => {};
    let alive = true;
    store.getBlob(imp.pages[page - 1]).then((b) => {
      if (!b || !alive) return;
      const u = URL.createObjectURL(b);
      revoke = () => URL.revokeObjectURL(u);
      setUrl(u);
    });
    return () => {
      alive = false;
      revoke();
    };
  }, [imp, page, store]);
  return url;
}

const chapterLabel = (c: MangaChapter) => (c.number ? `Chapter ${c.number}: ${c.title}` : c.title);
const readUrl = (m: MangaTitle, c: MangaChapter, page?: number) => ms(`/read/${m.slug}/${c.id}`, { page: page && page > 1 ? page : undefined });

function Home() {
  usePageTitle("MangaShelf - Read Manga Online");
  const lib = useLibrary();
  const { now } = useSystem();
  const [progress] = useCollection<Progress>(COL.progress);
  const latest = lib.flatMap((m) => m.chapters.filter(() => !("imported" in m && m.imported)).map((c) => ({ m, c }))).sort((a, b) => b.c.availability.publishedAt.localeCompare(a.c.availability.publishedAt));
  const continuing = [...progress]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => {
      const m = lib.find((x) => x.id === p.mangaId);
      const c = m?.chapters.find((x) => x.id === p.chapterId);
      return m && c ? { p, m, c } : null;
    })
    .filter(Boolean)
    .slice(0, 4) as { p: Progress; m: MangaTitle; c: MangaChapter }[];
  return (
    <Shell>
      {continuing.length > 0 && (
        <section>
          <h2>Continue reading</h2>
          <div className="ms-continue">
            {continuing.map(({ p, m, c }) => (
              <A key={p.id} href={readUrl(m, c, p.page)} className="ms-continue-card">
                <Cover m={m} />
                <div>
                  <strong>{m.title}</strong>
                  <div>{chapterLabel(c)}</div>
                  <div className="ms-muted">
                    Page {p.page} of {p.pages}
                  </div>
                  <progress max={p.pages} value={p.page} />
                </div>
              </A>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2>Latest chapters</h2>
        {latest.length === 0 && <p className="empty">No chapters have been released yet.</p>}
        <ul className="ms-latest">
          {latest.slice(0, 8).map(({ m, c }) => (
            <li key={c.id}>
              <A href={ms(`/manga/${m.slug}`)}>{m.title}</A> - <A href={readUrl(m, c)}>{chapterLabel(c)}</A>
              <span className="ms-muted"> · {timeAgo(Date.parse(c.availability.publishedAt), now())}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>All series</h2>
        <div className="ms-grid">
          {lib.map((m) => (
            <A key={m.id} href={ms(`/manga/${m.slug}`)} className="ms-card">
              <Cover m={m} />
              <strong>{m.title}</strong>
              <span className="ms-muted">{m.author}</span>
            </A>
          ))}
        </div>
      </section>
    </Shell>
  );
}

function Browse() {
  const { url } = useSite();
  const lib = useLibrary();
  const q = (url.params.get("q") ?? "").toLowerCase();
  const genre = url.params.get("genre");
  const author = url.params.get("author");
  usePageTitle("Browse - MangaShelf");
  const genres = [...new Set(lib.flatMap((m) => m.genres))].sort();
  const hits = lib.filter(
    (m) =>
      (!q || `${m.title} ${m.author} ${m.genres.join(" ")} ${m.synopsis}`.toLowerCase().includes(q)) &&
      (!genre || m.genres.includes(genre)) &&
      (!author || m.author === author),
  );
  return (
    <Shell>
      <h2>{q ? `Results for "${q}"` : genre ? `Genre: ${genre}` : author ? `Manga by ${author}` : "Browse all manga"}</h2>
      <div className="ms-genres">
        <A href={ms("/browse")} className={!genre ? "on" : ""}>
          All
        </A>
        {genres.map((g) => (
          <A key={g} href={ms("/browse", { genre: g })} className={genre === g ? "on" : ""}>
            {g}
          </A>
        ))}
      </div>
      {hits.length === 0 && <p className="empty">No manga matched. Try another title, author or genre.</p>}
      <div className="ms-list">
        {hits.map((m) => (
          <div key={m.id} className="ms-list-item">
            <A href={ms(`/manga/${m.slug}`)}>
              <Cover m={m} />
            </A>
            <div>
              <A href={ms(`/manga/${m.slug}`)} className="ms-title-link">
                {m.title}
              </A>
              <div>
                by <A href={ms("/browse", { author: m.author })}>{m.author}</A> · {m.status} · {m.chapters.length} chapter{m.chapters.length === 1 ? "" : "s"}
              </div>
              <p>{m.synopsis}</p>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

function TitlePage() {
  const { url } = useSite();
  const { store, user, now, computer } = useSystem();
  const lib = useLibrary();
  const slug = url.path.split("/")[2];
  const m = lib.find((x) => x.slug === slug);
  const [favs] = useCollection<MgFavorite>(COL.favorites);
  const [progress] = useCollection<Progress>(COL.progress);
  usePageTitle(m ? `${m.title} - MangaShelf` : "MangaShelf");
  if (!m) {
    return (
      <Shell>
        <div className="empty">
          <h2>Manga not found</h2>
          <p>This series isn&apos;t available on MangaShelf as of your computer&apos;s date.</p>
        </div>
      </Shell>
    );
  }
  const fav = favs.some((f) => f.mangaId === m.id);
  const last = [...progress].filter((p) => p.mangaId === m.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const lastChapter = last && m.chapters.find((c) => c.id === last.chapterId);
  return (
    <Shell>
      <div className="ms-title">
        <Cover m={m} />
        <div>
          <h1>{m.title}</h1>
          <div>
            by <A href={ms("/browse", { author: m.author })}>{m.author}</A>
          </div>
          <div className="ms-genres small">
            {m.genres.map((g) => (
              <A key={g} href={ms("/browse", { genre: g })}>
                {g}
              </A>
            ))}
          </div>
          <div className="ms-muted">
            {m.status} · Reads {m.direction === "rtl" ? "right to left" : "left to right"}
          </div>
          <p>{m.synopsis}</p>
          <div className="ms-actions">
            <A className="ms-btn primary" href={lastChapter ? readUrl(m, lastChapter, last.page) : readUrl(m, m.chapters[0])}>
              {lastChapter ? `Continue: ${chapterLabel(lastChapter)}, page ${last.page}` : "Start reading"}
            </A>
            <button
              className={`ms-btn${fav ? " on" : ""}`}
              aria-pressed={fav}
              onClick={async () => {
                if (!user) return;
                const id = `${user.id}:${m.id}`;
                if (fav) await store.delete(COL.favorites, id);
                else await store.put<MgFavorite>(COL.favorites, { id, owner: user.id, mangaId: m.id, at: iso(now()) });
              }}
            >
              {fav ? "★ In favorites" : "☆ Add to favorites"}
            </button>
          </div>
        </div>
      </div>
      <h2>Chapters</h2>
      <ul className="ms-chapters">
        {m.chapters.map((c) => {
          const p = progress.find((x) => x.chapterId === c.id);
          return (
            <li key={c.id}>
              <A href={readUrl(m, c)}>{chapterLabel(c)}</A>
              <span className="ms-muted">
                {" "}
                · {c.pages} pages · {formatDate(Date.parse(c.availability.publishedAt), computer.timeZone)}
                {p ? ` · read to page ${p.page}` : ""}
              </span>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function Reader() {
  const { url, navigate } = useSite();
  const { store, user, now } = useSystem();
  const lib = useLibrary();
  const [, slug, chapterId] = url.path.split("/").slice(1);
  const m = lib.find((x) => x.slug === slug);
  const ci = m ? m.chapters.findIndex((c) => c.id === chapterId) : -1;
  const c = m && ci >= 0 ? m.chapters[ci] : undefined;
  const page = Math.min(Math.max(1, Number(url.params.get("page") ?? 1)), c?.pages ?? 1);
  const [direction, setDirection] = useState<"rtl" | "ltr">(m?.direction ?? "rtl");
  const [zoom, setZoom] = useState<"height" | "width" | number>("height");
  const [bookmarks] = useCollection<MgBookmark>(COL.bookmarks);
  const box = useRef<HTMLDivElement>(null);
  const importedSrc = useImportedPage(m && "imported" in m ? m.imported : undefined, page);
  usePageTitle(m && c ? `${m.title} - ${chapterLabel(c)} - Page ${page} - MangaShelf` : "MangaShelf Reader");

  // Save progress whenever the page changes.
  useEffect(() => {
    if (!m || !c || !user) return;
    void store.put<Progress>(COL.progress, { id: `${user.id}:${c.id}`, owner: user.id, mangaId: m.id, chapterId: c.id, page, pages: c.pages, updatedAt: iso(now()) });
  }, [m, c, page, user, store, now]);

  const go = useCallback(
    (delta: number) => {
      if (!m || !c) return;
      const next = page + delta;
      if (next >= 1 && next <= c.pages) navigate(readUrl(m, c, next), { replace: true });
      else if (next > c.pages && m.chapters[ci + 1]) navigate(readUrl(m, m.chapters[ci + 1]));
      else if (next < 1 && m.chapters[ci - 1]) navigate(readUrl(m, m.chapters[ci - 1], m.chapters[ci - 1].pages));
    },
    [m, c, ci, page, navigate],
  );

  if (!m || !c) {
    return (
      <Shell>
        <div className="empty">
          <h2>Chapter not available</h2>
          <p>This chapter hasn&apos;t been released yet as of your computer&apos;s date, or the link is wrong.</p>
          <A href={ms("/")}>Back to MangaShelf</A>
        </div>
      </Shell>
    );
  }

  // In right-to-left mode, the left side of the page goes forward.
  const leftDelta = direction === "rtl" ? 1 : -1;
  const src = "imported" in m && m.imported ? importedSrc : pageUrl(c, page);
  const marked = bookmarks.find((b) => b.chapterId === c.id && b.page === page);
  const imgStyle: React.CSSProperties = zoom === "height" ? { maxHeight: "calc(100% - 4px)", maxWidth: "100%" } : zoom === "width" ? { width: "100%" } : { width: `${zoom * 8}px` };

  return (
    <div
      className="ms-reader"
      ref={box}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") (e.preventDefault(), go(leftDelta));
        if (e.key === "ArrowRight") (e.preventDefault(), go(-leftDelta));
        if (e.key === "f") void (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen());
      }}
      data-page={page}
    >
      <div className="ms-reader-bar">
        <A href={ms(`/manga/${m.slug}`)}>← {m.title}</A>
        <select className="field" value={c.id} onChange={(e) => navigate(readUrl(m, m.chapters.find((x) => x.id === e.target.value)!))} aria-label="Chapter">
          {m.chapters.map((x) => (
            <option key={x.id} value={x.id}>
              {chapterLabel(x)}
            </option>
          ))}
        </select>
        <select className="field" value={page} onChange={(e) => navigate(readUrl(m, c, Number(e.target.value)), { replace: true })} aria-label="Page">
          {Array.from({ length: c.pages }, (_, i) => (
            <option key={i} value={i + 1}>
              Page {i + 1} / {c.pages}
            </option>
          ))}
        </select>
        <button className="tool" onClick={() => setDirection(direction === "rtl" ? "ltr" : "rtl")} title="Reading direction">
          {direction === "rtl" ? "Right to left ⇐" : "Left to right ⇒"}
        </button>
        <button className="tool" aria-pressed={zoom === "height"} onClick={() => setZoom("height")}>
          Fit height
        </button>
        <button className="tool" aria-pressed={zoom === "width"} onClick={() => setZoom("width")}>
          Fit width
        </button>
        <button className="tool" onClick={() => setZoom((z) => Math.max(40, (typeof z === "number" ? z : 100) - 20))} aria-label="Zoom out">
          −
        </button>
        <button className="tool" onClick={() => setZoom((z) => Math.min(300, (typeof z === "number" ? z : 100) + 20))} aria-label="Zoom in">
          +
        </button>
        <button
          className="tool"
          aria-pressed={Boolean(marked)}
          onClick={async () => {
            if (!user) return;
            if (marked) await store.delete(COL.bookmarks, marked.id);
            else await store.put<MgBookmark>(COL.bookmarks, { id: newId("bm"), owner: user.id, mangaId: m.id, chapterId: c.id, page, note: "", at: iso(now()), origin: "user" });
          }}
        >
          {marked ? "★ Bookmarked" : "☆ Bookmark page"}
        </button>
        <button className="tool" onClick={() => void (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen())}>
          Full screen
        </button>
      </div>
      <div className={`ms-stage${typeof zoom === "number" || zoom === "width" ? " scroll" : ""}`}>
        <button className="ms-turn left" onClick={() => go(leftDelta)} aria-label={direction === "rtl" ? "Next page" : "Previous page"}>
          ‹
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src && <img src={src} alt={`${m.title}, page ${page}`} style={imgStyle} onClick={(e) => go(e.nativeEvent.offsetX < (e.currentTarget.width / 2) ? leftDelta : -leftDelta)} />}
        <button className="ms-turn right" onClick={() => go(-leftDelta)} aria-label={direction === "rtl" ? "Previous page" : "Next page"}>
          ›
        </button>
      </div>
      <div className="ms-reader-foot">
        {direction === "rtl" ? "Reading right to left: click the left side (or press ←) for the next page." : "Reading left to right: click the right side (or press →) for the next page."}
      </div>
    </div>
  );
}

function ListPage({ kind }: { kind: "favorites" | "bookmarks" | "history" }) {
  const lib = useLibrary();
  const { store, computer } = useSystem();
  const [favs] = useCollection<MgFavorite>(COL.favorites);
  const [bookmarks] = useCollection<MgBookmark>(COL.bookmarks);
  const [progress] = useCollection<Progress>(COL.progress);
  const title = { favorites: "Favorites", bookmarks: "Bookmarks", history: "Reading history" }[kind];
  usePageTitle(`${title} - MangaShelf`);
  const find = (mangaId: string, chapterId?: string) => {
    const m = lib.find((x) => x.id === mangaId);
    return { m, c: m?.chapters.find((x) => x.id === chapterId) };
  };
  return (
    <Shell>
      <h2>{title}</h2>
      {kind === "favorites" && (favs.length ? favs.map((f) => { const { m } = find(f.mangaId); return m ? <div key={f.id} className="ms-row"><A href={ms(`/manga/${m.slug}`)}>{m.title}</A> <span className="ms-muted">by {m.author}</span></div> : null; }) : <p className="empty">Add series to your favorites from their page.</p>)}
      {kind === "bookmarks" &&
        (bookmarks.length ? (
          [...bookmarks].sort((a, b) => b.at.localeCompare(a.at)).map((b) => {
            const { m, c } = find(b.mangaId, b.chapterId);
            return m && c ? (
              <div key={b.id} className="ms-row">
                <A href={readUrl(m, c, b.page)}>
                  {m.title} - {chapterLabel(c)}, page {b.page}
                </A>{" "}
                <span className="ms-muted">{formatDate(Date.parse(b.at), computer.timeZone)}</span>{" "}
                <button className="link-btn" onClick={() => store.delete(COL.bookmarks, b.id)}>
                  Remove
                </button>
              </div>
            ) : null;
          })
        ) : (
          <p className="empty">Bookmark a page in the reader with ☆ Bookmark page.</p>
        ))}
      {kind === "history" &&
        (progress.length ? (
          [...progress].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((p) => {
            const { m, c } = find(p.mangaId, p.chapterId);
            return m && c ? (
              <div key={p.id} className="ms-row">
                <A href={readUrl(m, c, p.page)}>
                  {m.title} - {chapterLabel(c)}
                </A>{" "}
                <span className="ms-muted">
                  page {p.page} of {p.pages} · {formatDate(Date.parse(p.updatedAt), computer.timeZone)}
                </span>
              </div>
            ) : null;
          })
        ) : (
          <p className="empty">Chapters you read show up here.</p>
        ))}
    </Shell>
  );
}

function ImportPage() {
  usePageTitle("Import manga - MangaShelf");
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const dialog = useDialog();
  const [files] = useCollection<FileNode>("files");
  const usable = files.filter((f) => f.kind === "file" && !f.trashed && (f.mime?.startsWith("image/") || /\.(zip|cbz)$/i.test(f.name)));
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [busy, setBusy] = useState(false);
  const { vfs } = useSystem();
  return (
    <Shell>
      <h2>Import manga from your computer</h2>
      <p>Pick page images (in reading order) or a single .cbz / .zip archive of pages. Only import your own work or pages you have permission to use.</p>
      <form
        className="ms-import"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!user || !vfs) return;
          setBusy(true);
          try {
            const blobs: Blob[] = [];
            for (const id of picked) {
              const node = usable.find((f) => f.id === id)!;
              const data = await vfs.readBlob(id);
              if (/\.(zip|cbz)$/i.test(node.name)) {
                const entries = readZip(new Uint8Array(await data.arrayBuffer()))
                  .filter((en) => !en.isDirectory && /\.(png|jpe?g|gif|webp)$/i.test(en.name))
                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
                for (const en of entries) blobs.push(new Blob([(await en.read()) as BlobPart], { type: /\.png$/i.test(en.name) ? "image/png" : "image/jpeg" }));
              } else blobs.push(data);
            }
            if (!blobs.length) throw new Error("No page images were found.");
            const pages: string[] = [];
            for (const b of blobs) {
              const id = newId("blob");
              await store.putBlob(id, b);
              pages.push(id);
            }
            const id = newId("mg");
            await store.put<MgImport>(COL.imports, { id, owner: user.id, title: title.trim() || "Untitled", author: author.trim() || user.name, direction, pages, createdAt: iso(now()), origin: "user" });
            navigate(ms(`/manga/imported-${id}`));
          } catch (err) {
            await dialog.alert(err instanceof Error ? err.message : String(err), { title: "Import failed" });
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset>
          <legend>Pages ({picked.length} selected)</legend>
          {usable.length === 0 && <p className="ms-muted">No pictures or archives on this computer yet.</p>}
          <div className="ms-picker">
            {usable.map((f) => (
              <label key={f.id}>
                <input type="checkbox" checked={picked.includes(f.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, f.id] : p.filter((x) => x !== f.id)))} /> {f.name}
              </label>
            ))}
          </div>
        </fieldset>
        <label>
          Title <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required aria-label="Title" />
        </label>
        <label>
          Author <input className="field" value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Author" />
        </label>
        <label>
          Reading direction{" "}
          <select className="field" value={direction} onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}>
            <option value="rtl">Right to left (manga)</option>
            <option value="ltr">Left to right (comics)</option>
          </select>
        </label>
        <button className="btn primary" disabled={busy || !picked.length || !title.trim()}>
          {busy ? "Importing..." : "Import"}
        </button>
      </form>
    </Shell>
  );
}

export default function MangaShelf() {
  const { url } = useSite();
  const path = url.path.replace(/\/+$/, "") || "/";
  if (path.startsWith("/read/")) return <Reader key={path} />;
  if (path.startsWith("/manga/")) return <TitlePage />;
  if (path === "/browse") return <Browse />;
  if (path === "/favorites") return <ListPage kind="favorites" />;
  if (path === "/bookmarks") return <ListPage kind="bookmarks" />;
  if (path === "/history") return <ListPage kind="history" />;
  if (path === "/import") return <ImportPage />;
  return <Home />;
}
