"use client";

// SnapNest: photo albums. Upload pictures from your computer into albums
// that are public, unlisted (anyone with the share link) or private (just
// you). Tags, a slideshow and downloads included. Everything people upload
// stays on this computer.

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { FileDialog } from "@/components/apps/common";
import { A, useSite, usePageTitle } from "../SiteContext";
import { archiveAlbums, SNAPNEST_HOST } from "@/data/snapnest";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { userHandle } from "../metube/store";

const sn = (path = "/", params?: Record<string, string>) => siteUrl(SNAPNEST_HOST, path, params);
type Privacy = "public" | "unlisted" | "private";
const PRIVACY_LABEL: Record<Privacy, string> = { public: "Public: anyone can find it", unlisted: "Unlisted: only people with the link", private: "Private: only you" };

interface UserAlbum {
  id: string;
  owner: string;
  ownerName: string;
  title: string;
  description: string;
  privacy: Privacy;
  key: string;
  createdAt: string;
  origin: "user";
}
interface UserPhoto {
  id: string;
  owner: string;
  albumId: string;
  title: string;
  description: string;
  tags: string[];
  blobId: string;
  mime: string;
  name: string;
  at: string;
  origin: "user";
}

interface Photo {
  id: string;
  albumId: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  blobId?: string;
  name: string;
  at: string;
  mine: boolean;
}
interface Album {
  id: string;
  owner: string;
  ownerName: string;
  title: string;
  description: string;
  privacy: Privacy;
  key?: string;
  createdAt: string;
  photos: Photo[];
  mine: boolean;
  archive: boolean;
}

/** Every album this account may see at the computer's date (unlisted ones only with their key). */
function useAlbums(): { albums: Album[]; loaded: boolean } {
  const { now, user } = useSystem();
  const [userAlbums, , a] = useCollection<UserAlbum>("snap.albums", { allUsers: true });
  const [userPhotos, , b] = useCollection<UserPhoto>("snap.photos", { allUsers: true });
  const t = now();
  const albums: Album[] = [
    ...archiveAlbums
      .filter((x) => Date.parse(x.createdAt) <= t)
      .map((x) => ({ ...x, ownerName: x.owner, privacy: "public" as Privacy, mine: false, archive: true, photos: x.photos.filter((p) => Date.parse(p.at) <= t).map((p) => ({ ...p, albumId: x.id, name: `${p.title}.jpg`, mine: false })) })),
    ...userAlbums
      .filter((x) => Date.parse(x.createdAt) <= t && (x.privacy !== "private" || x.owner === user?.id))
      .map((x) => ({ ...x, mine: x.owner === user?.id, archive: false, photos: userPhotos.filter((p) => p.albumId === x.id && Date.parse(p.at) <= t).sort((p, q) => p.at.localeCompare(q.at)).map((p) => ({ ...p, mine: p.owner === user?.id })) })),
  ];
  return { albums, loaded: a && b };
}

/** An object URL for a stored picture, tagged with its blob so a stale one never shows. */
function useBlobUrl(blobId?: string) {
  const { store } = useSystem();
  const [state, setState] = useState<{ id: string; url: string } | null>(null);
  useEffect(() => {
    if (!blobId) return;
    let url: string | null = null;
    let alive = true;
    void store.getBlob(blobId).then((b) => {
      if (!b || !alive) return;
      url = URL.createObjectURL(b);
      setState({ id: blobId, url });
    });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [blobId, store]);
  return blobId ? (state?.id === blobId ? state.url : null) : null;
}

function Pic({ photo, className }: { photo: Photo; className?: string }) {
  const blobUrl = useBlobUrl(photo.blobId);
  const src = photo.url ?? blobUrl;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={photo.title} className={className} />
  ) : (
    <div className={`sn-loading ${className ?? ""}`}>Loading…</div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useSystem();
  return (
    <div className="snapnest">
      <header className="sn-head">
        <A href={sn("/")} className="sn-logo">
          <span aria-hidden>◉</span> SnapNest
        </A>
        <nav>
          <A href={sn("/")}>Explore</A>
          {user && <A href={sn(`/u/${userHandle(user.name)}`)}>Your albums</A>}
          {user && (
            <A href={sn("/new")} className="sn-cta">
              New album
            </A>
          )}
        </nav>
      </header>
      <main className="sn-main">{children}</main>
      <footer className="sn-foot">SnapNest · Share your photos with the people who matter</footer>
    </div>
  );
}

function AlbumCard({ album }: { album: Album }) {
  const { computer } = useSystem();
  const cover = album.photos[0];
  return (
    <A href={sn(`/album/${album.id}`, album.privacy === "unlisted" && album.key ? { key: album.key } : undefined)} className="sn-card">
      <div className="sn-cover">{cover ? <Pic photo={cover} /> : <span>No photos yet</span>}</div>
      <strong>{album.title}</strong>
      <small>
        {album.ownerName} · {album.photos.length} {album.photos.length === 1 ? "photo" : "photos"} · {formatDate(Date.parse(album.createdAt), computer.timeZone)}
        {album.privacy !== "public" ? ` · ${album.privacy}` : ""}
      </small>
    </A>
  );
}

function Home() {
  usePageTitle("SnapNest - Share your photos");
  const { albums } = useAlbums();
  const publicAlbums = albums.filter((a) => a.privacy === "public").sort((a, b) => (b.photos.at(-1)?.at ?? b.createdAt).localeCompare(a.photos.at(-1)?.at ?? a.createdAt));
  const tags = [...new Set(publicAlbums.flatMap((a) => a.photos.flatMap((p) => p.tags)))].sort();
  return (
    <Shell>
      <h1>Recently shared</h1>
      <div className="sn-grid">
        {publicAlbums.map((a) => (
          <AlbumCard key={a.id} album={a} />
        ))}
      </div>
      {tags.length > 0 && (
        <>
          <h2>Browse by tag</h2>
          <div className="sn-tags">
            {tags.map((t) => (
              <A key={t} href={sn(`/tag/${encodeURIComponent(t)}`)}>
                {t}
              </A>
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}

function AlbumPage({ id }: { id: string }) {
  const { url, navigate } = useSite();
  const { store, user, now, computer, vfs } = useSystem();
  const dialog = useDialog();
  const { albums, loaded } = useAlbums();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const album = albums.find((a) => a.id === id);
  const allowed = album && (album.privacy !== "unlisted" || album.mine || url.params.get("key") === album.key);
  usePageTitle(album && allowed ? `${album.title} - SnapNest` : "Album not available - SnapNest");
  if (!loaded) return <Shell><p className="sn-muted">Loading…</p></Shell>;
  if (!album || !allowed) {
    return (
      <Shell>
        <h1>This album isn&apos;t available</h1>
        <p>It may be private, or you might need the share link from its owner.</p>
      </Shell>
    );
  }
  const shareLink = sn(`/album/${album.id}`, album.privacy === "unlisted" && album.key ? { key: album.key } : undefined);
  const editAlbum = async (patch: Partial<UserAlbum>) => {
    const doc = await store.get<UserAlbum>("snap.albums", album.id);
    if (doc) await store.put<UserAlbum>("snap.albums", { ...doc, ...patch });
  };
  return (
    <Shell>
      <div className="sn-album-head">
        <div>
          <h1>{album.title}</h1>
          <p>{album.description}</p>
          <small className="sn-muted">
            By <A href={sn(`/u/${album.ownerName}`)}>{album.ownerName}</A> · {formatDate(Date.parse(album.createdAt), computer.timeZone)} · {PRIVACY_LABEL[album.privacy]}
          </small>
        </div>
        <div className="sn-actions">
          {album.photos.length > 0 && (
            <A href={sn(`/slideshow/${album.id}`, album.key ? { key: album.key } : undefined)} className="btn primary">
              ▶ Slideshow
            </A>
          )}
          {album.privacy !== "private" && (
            <button className="btn" onClick={() => navigator.clipboard?.writeText(shareLink).then(() => dialog.alert(`Share link copied:\n${shareLink}`, { title: "SnapNest" }), () => dialog.alert(`Share link:\n${shareLink}`, { title: "SnapNest" }))}>
              Share link
            </button>
          )}
        </div>
      </div>
      {album.mine && (
        <div className="sn-owner">
          <button className="btn" disabled={busy} onClick={() => setPicking(true)}>
            {busy ? "Uploading…" : "+ Add photos"}
          </button>
          <label>
            Who can see it:{" "}
            <select className="field" value={album.privacy} onChange={(e) => editAlbum({ privacy: e.target.value as Privacy })} aria-label="Album privacy">
              {(Object.keys(PRIVACY_LABEL) as Privacy[]).map((p) => (
                <option key={p} value={p}>
                  {PRIVACY_LABEL[p]}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn"
            onClick={async () => {
              const title = await dialog.prompt("Album title:", album.title, { title: "Rename album" });
              if (title?.trim()) await editAlbum({ title: title.trim().slice(0, 80) });
            }}
          >
            Rename
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (!(await dialog.confirm(`Delete "${album.title}" and its ${album.photos.length} photos from SnapNest? The pictures on your computer aren't touched.`, { title: "Delete album", okLabel: "Delete" }))) return;
              for (const p of await store.list<UserPhoto>("snap.photos")) {
                if (p.albumId !== album.id) continue;
                await store.deleteBlob(p.blobId);
                await store.delete("snap.photos", p.id);
              }
              await store.delete("snap.albums", album.id);
              navigate(sn("/"));
            }}
          >
            Delete album
          </button>
        </div>
      )}
      <div className="sn-photos">
        {album.photos.map((p) => (
          <A key={p.id} href={sn(`/photo/${album.id}/${p.id}`, album.key ? { key: album.key } : undefined)} className="sn-thumb" title={p.title}>
            <Pic photo={p} />
            <span>{p.title}</span>
          </A>
        ))}
        {album.photos.length === 0 && <p className="sn-muted">No photos yet{album.mine ? ". Add some from your computer!" : "."}</p>}
      </div>
      {picking && (
        <FileDialog
          mode="open"
          title="Add photos"
          multiple
          startIn="pictures"
          accept={(f) => Boolean(f.mime?.startsWith("image/"))}
          onClose={async (r) => {
            setPicking(false);
            if (!r || !user || !vfs) return;
            const files = r.files.filter((f) => f.mime?.startsWith("image/"));
            if (r.files.length && !files.length) return dialog.alert("SnapNest takes pictures (JPG, PNG, GIF or WebP). Those files aren't pictures.", { title: "SnapNest" });
            setBusy(true);
            for (const f of files) {
              const blob = await vfs.readBlob(f.id).catch(() => null);
              if (!blob) continue;
              const blobId = newId("blob");
              await store.putBlob(blobId, blob);
              await store.put<UserPhoto>("snap.photos", { id: newId("file"), owner: user.id, albumId: album.id, title: f.name.replace(/\.[^.]+$/, ""), description: "", tags: [], blobId, mime: f.mime ?? "image/jpeg", name: f.name, at: iso(now()), origin: "user" });
            }
            setBusy(false);
          }}
        />
      )}
    </Shell>
  );

}

function PhotoPage({ albumId, photoId }: { albumId: string; photoId: string }) {
  const { url, navigate } = useSite();
  const { store, folders, vfs, notify, computer } = useSystem();
  const dialog = useDialog();
  const { albums, loaded } = useAlbums();
  const album = albums.find((a) => a.id === albumId);
  const allowed = album && (album.privacy !== "unlisted" || album.mine || url.params.get("key") === album.key);
  const i = album?.photos.findIndex((p) => p.id === photoId) ?? -1;
  const photo = album && i >= 0 ? album.photos[i] : null;
  const blobUrl = useBlobUrl(photo?.blobId);
  usePageTitle(photo && allowed ? `${photo.title} - SnapNest` : "Photo not available - SnapNest");
  if (!loaded) return <Shell><p className="sn-muted">Loading…</p></Shell>;
  if (!album || !allowed || !photo) {
    return (
      <Shell>
        <h1>This photo isn&apos;t available</h1>
        <p>It may have been removed, or the album is private.</p>
      </Shell>
    );
  }
  const keyParam = album.key ? { key: album.key } : undefined;
  const go = (d: number) => {
    const next = album.photos[(i + d + album.photos.length) % album.photos.length];
    navigate(sn(`/photo/${album.id}/${next.id}`, keyParam));
  };
  const save = async (patch: Partial<UserPhoto>) => {
    const doc = await store.get<UserPhoto>("snap.photos", photo.id);
    if (doc) await store.put<UserPhoto>("snap.photos", { ...doc, ...patch });
  };
  const download = async () => {
    if (!vfs || !folders) return;
    const blob = photo.blobId ? await store.getBlob(photo.blobId) : await fetch(photo.url!).then((r) => (r.ok ? r.blob() : null)).catch(() => null);
    if (!blob) return dialog.alert("That photo couldn't be downloaded right now.", { title: "SnapNest" });
    const name = await vfs.uniqueName(folders.downloads, photo.name.includes(".") ? photo.name : `${photo.name}.jpg`);
    await vfs.writeFile(folders.downloads, name, blob, { mime: blob.type || "image/jpeg", source: sn(`/photo/${album.id}/${photo.id}`) });
    notify({ title: "Photo downloaded", body: `${name} is in your Downloads folder.` });
  };
  return (
    <Shell>
      <div className="sn-crumbs">
        <A href={sn(`/album/${album.id}`, keyParam)}>« {album.title}</A> · photo {i + 1} of {album.photos.length}
      </div>
      <div className="sn-viewer">
        <button className="sn-nav" onClick={() => go(-1)} aria-label="Previous photo">
          ‹
        </button>
        {photo.url || blobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url ?? blobUrl!} alt={photo.title} />
        ) : (
          <div className="sn-loading">Loading…</div>
        )}
        <button className="sn-nav" onClick={() => go(1)} aria-label="Next photo">
          ›
        </button>
      </div>
      <div className="sn-photo-info">
        <h1>{photo.title}</h1>
        {photo.description && <p>{photo.description}</p>}
        <small className="sn-muted">
          Uploaded by {album.ownerName} on {formatDate(Date.parse(photo.at), computer.timeZone)}
        </small>
        <div className="sn-tags">
          {photo.tags.map((t) => (
            <A key={t} href={sn(`/tag/${encodeURIComponent(t)}`)}>
              {t}
            </A>
          ))}
        </div>
        <div className="sn-actions">
          <button className="btn primary" onClick={download}>
            Download
          </button>
          {photo.mine && (
            <>
              <button
                className="btn"
                onClick={async () => {
                  const title = await dialog.prompt("Title:", photo.title, { title: "Edit photo" });
                  if (title === null) return;
                  const description = await dialog.prompt("Description:", photo.description, { title: "Edit photo" });
                  const tags = await dialog.prompt("Tags, separated by commas:", photo.tags.join(", "), { title: "Edit photo" });
                  await save({ title: title.trim().slice(0, 80) || photo.title, description: (description ?? photo.description).trim().slice(0, 500), tags: (tags ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10) });
                }}
              >
                Edit details
              </button>
              <button
                className="btn"
                onClick={async () => {
                  if (!(await dialog.confirm(`Remove "${photo.title}" from this album?`, { title: "Remove photo", okLabel: "Remove" }))) return;
                  await store.deleteBlob(photo.blobId!);
                  await store.delete("snap.photos", photo.id);
                  navigate(sn(`/album/${album.id}`, keyParam));
                }}
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Slideshow({ albumId }: { albumId: string }) {
  const { url, navigate } = useSite();
  const { albums } = useAlbums();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const album = albums.find((a) => a.id === albumId);
  const allowed = album && (album.privacy !== "unlisted" || album.mine || url.params.get("key") === album.key);
  const count = album?.photos.length ?? 0;
  usePageTitle(album ? `Slideshow: ${album.title} - SnapNest` : "Slideshow - SnapNest");
  useEffect(() => {
    if (!playing || count < 2) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % count), 3500);
    return () => clearInterval(id);
  }, [playing, count]);
  if (!album || !allowed || !count) return <Shell><p className="sn-muted">There&apos;s nothing to show.</p></Shell>;
  const photo = album.photos[index % count];
  return (
    <div className="sn-slideshow">
      <Pic photo={photo} key={photo.id} className="sn-slide" />
      <div className="sn-slide-bar">
        <strong>{photo.title}</strong>
        <span>
          {(index % count) + 1} / {count}
        </span>
        <button className="btn" onClick={() => setIndex((n) => (n - 1 + count) % count)}>
          ‹ Previous
        </button>
        <button className="btn" onClick={() => setPlaying((v) => !v)}>
          {playing ? "Pause" : "Play"}
        </button>
        <button className="btn" onClick={() => setIndex((n) => (n + 1) % count)}>
          Next ›
        </button>
        <button className="btn" onClick={() => navigate(sn(`/album/${album.id}`, album.key ? { key: album.key } : undefined))}>
          Close
        </button>
      </div>
    </div>
  );
}

function NewAlbum() {
  usePageTitle("New album - SnapNest");
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("public");
  if (!user) return null;
  return (
    <Shell>
      <h1>New album</h1>
      <form
        className="sn-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          const id = newId("fld");
          await store.put<UserAlbum>("snap.albums", { id, owner: user.id, ownerName: userHandle(user.name), title: title.trim().slice(0, 80), description: description.trim().slice(0, 500), privacy, key: newId("site").slice(5), createdAt: iso(now()), origin: "user" });
          navigate(sn(`/album/${id}`));
        }}
      >
        <label>
          Title <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Album title" maxLength={80} autoFocus />
        </label>
        <label>
          Description <textarea className="field" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} aria-label="Album description" maxLength={500} />
        </label>
        <label>
          Who can see it
          <select className="field" value={privacy} onChange={(e) => setPrivacy(e.target.value as Privacy)} aria-label="Who can see it">
            {(Object.keys(PRIVACY_LABEL) as Privacy[]).map((p) => (
              <option key={p} value={p}>
                {PRIVACY_LABEL[p]}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" disabled={!title.trim()}>
          Create album
        </button>
      </form>
    </Shell>
  );
}

function UserPage({ name }: { name: string }) {
  const { user } = useSystem();
  const { albums } = useAlbums();
  const mineToo = user && userHandle(user.name).toLowerCase() === name.toLowerCase();
  const list = albums.filter((a) => a.ownerName.toLowerCase() === name.toLowerCase() && (a.privacy === "public" || a.mine));
  usePageTitle(`${name} - SnapNest`);
  return (
    <Shell>
      <h1>{mineToo ? "Your albums" : `${name}'s albums`}</h1>
      <div className="sn-grid">
        {list.map((a) => (
          <AlbumCard key={a.id} album={a} />
        ))}
      </div>
      {list.length === 0 && <p className="sn-muted">{mineToo ? "No albums yet. Make one with New album!" : "No public albums yet."}</p>}
    </Shell>
  );
}

function TagPage({ tag }: { tag: string }) {
  const { albums } = useAlbums();
  const hits = albums.filter((a) => a.privacy === "public").flatMap((a) => a.photos.filter((p) => p.tags.includes(tag)).map((p) => ({ a, p })));
  usePageTitle(`${tag} - SnapNest`);
  return (
    <Shell>
      <h1>Photos tagged “{tag}”</h1>
      <div className="sn-photos">
        {hits.map(({ a, p }) => (
          <A key={p.id} href={sn(`/photo/${a.id}/${p.id}`)} className="sn-thumb" title={p.title}>
            <Pic photo={p} />
            <span>{p.title}</span>
          </A>
        ))}
      </div>
      {hits.length === 0 && <p className="sn-muted">No public photos with this tag yet.</p>}
    </Shell>
  );
}

export default function SnapNest() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "album" && parts[1]) return <AlbumPage key={parts[1]} id={parts[1]} />;
  if (parts[0] === "photo" && parts[1] && parts[2]) return <PhotoPage key={parts[2]} albumId={parts[1]} photoId={parts[2]} />;
  if (parts[0] === "slideshow" && parts[1]) return <Slideshow key={parts[1]} albumId={parts[1]} />;
  if (parts[0] === "new") return <NewAlbum />;
  if (parts[0] === "u" && parts[1]) return <UserPage name={parts[1]} />;
  if (parts[0] === "tag" && parts[1]) return <TagPage tag={parts[1]} />;
  return <Home />;
}
