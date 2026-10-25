"use client";

import { useEffect, useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { avatarUrl } from "@/components/system/defaults";
import { useDialog } from "@/components/desktop/Dialogs";
import { A, useSite, usePageTitle } from "../SiteContext";
import { channels, formatDuration, videos as archiveVideos, viewsAt, METUBE_HOST, type Video } from "@/data/metube";
import { isListed } from "@/lib/availability";
import { newId } from "@/lib/ids";
import { formatDate, iso, timeAgo } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import type { FileNode } from "@/lib/vfs";
import { Player } from "./Player";
import { COL, pairId, userHandle, type MtComment, type MtFavorite, type MtLike, type MtPlaylist, type MtProgress, type MtSub, type MtUpload, type MtView } from "./store";

/** One shape for archive videos and people's uploads. */
interface Vid {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  src: string | null;
  blobId?: string;
  thumb: string;
  duration: number;
  uploadedAt: string;
  channelKey: string;
  channelName: string;
  channelHandle: string;
  channelAvatar: string;
  baseViews: number;
  likeRatio: number;
  archiveComments: { id: string; author: string; avatar: string; text: string; at: string }[];
  origin: "archive" | "user";
}

const mt = (path: string, params?: Record<string, string | number | undefined>) => siteUrl(METUBE_HOST, path, params);

function fromArchive(v: Video, now: number): Vid {
  const ch = channels.find((c) => c.id === v.channelId)!;
  return {
    id: v.id,
    title: v.title,
    description: v.description,
    category: v.category,
    tags: v.tags,
    src: v.src,
    thumb: v.thumb,
    duration: v.duration,
    uploadedAt: v.availability.publishedAt,
    channelKey: ch.id,
    channelName: ch.name,
    channelHandle: ch.handle,
    channelAvatar: ch.avatar,
    baseViews: viewsAt(v, now),
    likeRatio: v.likeRatio,
    archiveComments: v.comments.filter((c) => Date.parse(c.at) <= now),
    origin: "archive",
  };
}

function fromUpload(u: MtUpload): Vid {
  return {
    id: u.id,
    title: u.title,
    description: u.description,
    category: u.category,
    tags: [],
    src: null,
    blobId: u.blobId,
    thumb: u.thumb,
    duration: u.duration,
    uploadedAt: u.uploadedAt,
    channelKey: `user:${u.owner}`,
    channelName: u.ownerName,
    channelHandle: userHandle(u.ownerName),
    channelAvatar: u.ownerAvatar,
    baseViews: 0,
    likeRatio: 0,
    archiveComments: [],
    origin: "user",
  };
}

/** Everything MeTube has published as of the computer's clock. */
function useCatalog() {
  const { now, computer } = useSystem();
  const [uploads] = useCollection<MtUpload>(COL.uploads, { allUsers: true });
  const [views] = useCollection<MtView>(COL.views, { allUsers: true });
  const t = now();
  return useMemo(() => {
    const localViews = new Map<string, number>();
    for (const v of views) localViews.set(v.videoId, (localViews.get(v.videoId) ?? 0) + v.count);
    const list = [
      ...archiveVideos.filter((v) => isListed(v.availability, t, computer.region)).map((v) => fromArchive(v, t)),
      ...uploads.filter((u) => Date.parse(u.uploadedAt) <= t).map(fromUpload),
    ].map((v) => ({ ...v, views: v.baseViews + (localViews.get(v.id) ?? 0) }));
    return list.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads, views, computer.region, Math.floor(t / 60000)]);
}

type CatalogVid = ReturnType<typeof useCatalog>[number];

function useVideoSrc(v: Vid | undefined): string | null {
  const { store } = useSystem();
  const [url, setUrl] = useState<string | null>(v?.src ?? null);
  useEffect(() => {
    if (!v) return;
    if (v.src) return setUrl(v.src);
    let revoke = () => {};
    let alive = true;
    store.getBlob(v.blobId!).then((b) => {
      if (!b || !alive) return;
      const u = URL.createObjectURL(b);
      revoke = () => URL.revokeObjectURL(u);
      setUrl(u);
    });
    return () => {
      alive = false;
      revoke();
    };
  }, [v, store]);
  return url;
}

function Header() {
  const { url, navigate } = useSite();
  const { user } = useSystem();
  const [q, setQ] = useState(url.params.get("search_query") ?? "");
  return (
    <header className="mt-header">
      <A href={mt("/")} className="mt-logo" aria-label="MeTube home">
        <span className="mt-logo-me">Me</span>
        <span className="mt-logo-tube">Tube</span>
      </A>
      <form
        className="mt-search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) navigate(mt("/results", { search_query: q.trim() }));
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search MeTube" placeholder="Search" />
        <button aria-label="Search">Search</button>
      </form>
      <nav className="mt-user">
        <A href={mt("/upload")} className="mt-upload-btn">
          Upload
        </A>
        {user && (
          <A href={mt(`/user/${userHandle(user.name)}`)} className="mt-me">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl(user.picture)} alt="" />
            {user.name}
          </A>
        )}
      </nav>
    </header>
  );
}

function Guide() {
  const [subs] = useCollection<MtSub>(COL.subs);
  return (
    <aside className="mt-guide" aria-label="Guide">
      <A href={mt("/")}>What to Watch</A>
      <A href={mt("/feed/subscriptions")}>My Subscriptions</A>
      <A href={mt("/feed/history")}>History</A>
      <A href={mt("/feed/favorites")}>Favorites</A>
      <A href={mt("/feed/playlists")}>Playlists</A>
      {subs.length > 0 && <div className="mt-guide-head">Subscriptions</div>}
      {subs.map((s) => {
        const ch = channels.find((c) => c.id === s.channel);
        return ch ? (
          <A key={s.id} href={mt(`/user/${ch.handle}`)}>
            {ch.name}
          </A>
        ) : null;
      })}
    </aside>
  );
}

function Tile({ v, compact }: { v: CatalogVid; compact?: boolean }) {
  const { now } = useSystem();
  return (
    <div className={compact ? "mt-tile compact" : "mt-tile"}>
      <A href={mt("/watch", { v: v.id })} className="mt-thumb" aria-label={v.title}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={v.thumb} alt="" />
        <span className="mt-duration">{formatDuration(v.duration)}</span>
      </A>
      <div className="mt-tile-info">
        <A href={mt("/watch", { v: v.id })} className="mt-tile-title">
          {v.title}
        </A>
        <div className="mt-meta">
          by <A href={mt(`/user/${v.channelHandle}`)}>{v.channelName}</A>
        </div>
        <div className="mt-meta">
          {v.views.toLocaleString("en-US")} views · {timeAgo(Date.parse(v.uploadedAt), now())}
        </div>
      </div>
    </div>
  );
}

function Home() {
  usePageTitle("MeTube - Broadcast Yourself");
  const all = useCatalog();
  const [subs] = useCollection<MtSub>(COL.subs);
  const featured = all[0];
  const subbed = all.filter((v) => subs.some((s) => s.channel === v.channelKey));
  const popular = [...all].sort((a, b) => b.views - a.views).slice(0, 8);
  const categories = [...new Set(all.map((v) => v.category))];
  return (
    <div className="mt-body">
      <Guide />
      <main className="mt-main">
        {featured && (
          <section className="mt-featured">
            <A href={mt("/watch", { v: featured.id })} className="mt-thumb big">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featured.thumb} alt="" />
              <span className="mt-duration">{formatDuration(featured.duration)}</span>
            </A>
            <div>
              <div className="mt-section-label">Featured</div>
              <A href={mt("/watch", { v: featured.id })} className="mt-featured-title">
                {featured.title}
              </A>
              <p>{featured.description}</p>
              <div className="mt-meta">
                by <A href={mt(`/user/${featured.channelHandle}`)}>{featured.channelName}</A> · {featured.views.toLocaleString("en-US")} views
              </div>
            </div>
          </section>
        )}
        {subbed.length > 0 && (
          <section>
            <h2>From your subscriptions</h2>
            <div className="mt-grid">{subbed.slice(0, 8).map((v) => <Tile key={v.id} v={v} />)}</div>
          </section>
        )}
        <section>
          <h2>Popular on MeTube</h2>
          <div className="mt-grid">{popular.map((v) => <Tile key={v.id} v={v} />)}</div>
        </section>
        {categories.map((c) => (
          <section key={c}>
            <h2>{c}</h2>
            <div className="mt-grid">{all.filter((v) => v.category === c).slice(0, 4).map((v) => <Tile key={v.id} v={v} />)}</div>
          </section>
        ))}
        {all.length === 0 && <p className="empty">No videos have been uploaded yet.</p>}
      </main>
    </div>
  );
}

function Results() {
  const { url } = useSite();
  const q = (url.params.get("search_query") ?? "").toLowerCase();
  usePageTitle(`${q} - MeTube`);
  const all = useCatalog();
  const words = q.split(/\s+/).filter(Boolean);
  const hits = all
    .map((v) => {
      const hay = `${v.title} ${v.description} ${v.tags.join(" ")} ${v.channelName} ${v.category}`.toLowerCase();
      const score = words.reduce((s, w) => s + (v.title.toLowerCase().includes(w) ? 3 : 0) + (hay.includes(w) ? 1 : 0), 0);
      return { v, score, all: words.every((w) => hay.includes(w)) };
    })
    .filter((h) => h.all && h.score > 0)
    .sort((a, b) => b.score - a.score);
  return (
    <div className="mt-body">
      <Guide />
      <main className="mt-main">
        <div className="mt-meta">About {hits.length} results</div>
        {hits.length === 0 && <p className="empty">No videos found for &quot;{q}&quot;. Try different keywords.</p>}
        <div className="mt-results">{hits.map((h) => <Tile key={h.v.id} v={h.v} compact />)}</div>
      </main>
    </div>
  );
}

function Watch() {
  const { url, navigate } = useSite();
  const { store, user, now, openApp, notify, computer } = useSystem();
  const dialog = useDialog();
  const all = useCatalog();
  const id = url.params.get("v") ?? "";
  const v = all.find((x) => x.id === id);
  const src = useVideoSrc(v);
  usePageTitle(v ? `${v.title} - MeTube` : "MeTube");
  const [likes] = useCollection<MtLike>(COL.likes, { allUsers: true });
  const [favs] = useCollection<MtFavorite>(COL.favorites);
  const [subs] = useCollection<MtSub>(COL.subs, { allUsers: true });
  const [comments] = useCollection<MtComment>(COL.comments, { allUsers: true });
  const [playlists] = useCollection<MtPlaylist>(COL.playlists);
  const [text, setText] = useState("");
  const [panel, setPanel] = useState<"none" | "add" | "share">("none");

  if (!v) {
    const exists = archiveVideos.some((x) => x.id === id);
    return (
      <div className="mt-body">
        <main className="mt-main">
          <div className="mt-unavailable">
            <h2>This video is unavailable.</h2>
            <p>{exists ? "It hasn't been uploaded yet as of your computer's date." : "Sorry about that. It may have been removed, or the link may be wrong."}</p>
            <A href={mt("/")}>Back to MeTube</A>
          </div>
        </main>
      </div>
    );
  }

  const t = now();
  const mine = user ? likes.find((l) => l.id === pairId(user.id, v.id)) : undefined;
  const localLikes = likes.filter((l) => l.videoId === v.id && l.value === 1).length;
  const localDislikes = likes.filter((l) => l.videoId === v.id && l.value === -1).length;
  const likeCount = Math.round(v.baseViews * v.likeRatio) + localLikes;
  const dislikeCount = Math.round(v.baseViews * v.likeRatio * 0.04) + localDislikes;
  const faved = favs.some((f) => f.videoId === v.id);
  const subCount = subs.filter((s) => s.channel === v.channelKey).length;
  const subscribed = user ? subs.some((s) => s.id === pairId(user.id, v.channelKey)) : false;
  const allComments = [
    ...v.archiveComments.map((c) => ({ ...c, mine: false })),
    ...comments.filter((c) => c.videoId === v.id && Date.parse(c.at) <= t).map((c) => ({ id: c.id, author: c.authorName, avatar: c.avatar, text: c.text, at: c.at, mine: c.owner === user?.id })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const related = all
    .filter((x) => x.id !== v.id)
    .map((x) => ({ x, score: (x.channelKey === v.channelKey ? 3 : 0) + (x.category === v.category ? 2 : 0) + x.tags.filter((tg) => v.tags.includes(tg)).length }))
    .sort((a, b) => b.score - a.score || b.x.views - a.x.views)
    .slice(0, 8)
    .map((r) => r.x);
  const link = mt("/watch", { v: v.id });

  const like = async (value: 1 | -1) => {
    if (!user) return;
    const lid = pairId(user.id, v.id);
    if (mine?.value === value) await store.delete(COL.likes, lid);
    else await store.put<MtLike>(COL.likes, { id: lid, owner: user.id, videoId: v.id, value });
  };

  return (
    <div className="mt-body watch">
      <main className="mt-watch-main">
        {src ? <Player videoId={v.id} src={src} poster={v.thumb} /> : <div className="mt-player loading">Loading video...</div>}
        <h1 className="mt-title">{v.title}</h1>
        <div className="mt-owner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.channelAvatar} alt="" />
          <div>
            <A href={mt(`/user/${v.channelHandle}`)} className="mt-owner-name">
              {v.channelName}
            </A>
            <div className="mt-meta">{subCount > 0 ? `${subCount} subscriber${subCount === 1 ? "" : "s"} on this computer` : ""}</div>
          </div>
          {v.channelKey !== `user:${user?.id}` && (
            <button
              className={`mt-subscribe${subscribed ? " on" : ""}`}
              onClick={async () => {
                if (!user) return;
                const sid = pairId(user.id, v.channelKey);
                if (subscribed) await store.delete(COL.subs, sid);
                else await store.put<MtSub>(COL.subs, { id: sid, owner: user.id, channel: v.channelKey, at: iso(t) });
              }}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
          <div className="mt-views">
            <strong data-views={v.views}>{v.views.toLocaleString("en-US")}</strong> views
          </div>
        </div>
        <div className="mt-actions">
          <button className={mine?.value === 1 ? "on" : ""} onClick={() => like(1)} aria-pressed={mine?.value === 1}>
            👍 Like <span>{likeCount.toLocaleString("en-US")}</span>
          </button>
          <button className={mine?.value === -1 ? "on" : ""} onClick={() => like(-1)} aria-pressed={mine?.value === -1}>
            👎 <span>{dislikeCount.toLocaleString("en-US")}</span>
          </button>
          <button
            className={faved ? "on" : ""}
            aria-pressed={faved}
            onClick={async () => {
              if (!user) return;
              const fid = pairId(user.id, v.id);
              if (faved) await store.delete(COL.favorites, fid);
              else await store.put<MtFavorite>(COL.favorites, { id: fid, owner: user.id, videoId: v.id, at: iso(t) });
            }}
          >
            ★ {faved ? "Favorited" : "Favorite"}
          </button>
          <button onClick={() => setPanel(panel === "add" ? "none" : "add")} aria-expanded={panel === "add"}>
            + Add to
          </button>
          <button onClick={() => setPanel(panel === "share" ? "none" : "share")} aria-expanded={panel === "share"}>
            Share
          </button>
        </div>
        {panel === "add" && (
          <div className="mt-panel">
            <strong>Add to playlist</strong>
            {playlists.map((p) => (
              <label key={p.id}>
                <input
                  type="checkbox"
                  checked={p.videoIds.includes(v.id)}
                  onChange={(e) => store.put<MtPlaylist>(COL.playlists, { ...p, videoIds: e.target.checked ? [...p.videoIds, v.id] : p.videoIds.filter((x) => x !== v.id) })}
                />{" "}
                {p.name} ({p.videoIds.length})
              </label>
            ))}
            <button
              className="link-btn"
              onClick={async () => {
                const name = await dialog.prompt("Playlist name:", "My playlist", { title: "New playlist" });
                if (name && user) await store.put<MtPlaylist>(COL.playlists, { id: newId("pl"), owner: user.id, name: name.slice(0, 60), videoIds: [v.id], createdAt: iso(t), origin: "user" });
              }}
            >
              + Create new playlist
            </button>
          </div>
        )}
        {panel === "share" && (
          <div className="mt-panel">
            <strong>Share this video</strong>
            <input className="field" readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Video link" style={{ width: "100%" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => openApp("messenger", { share: link, shareTitle: v.title })}>
                Send in Messenger
              </button>
              <button className="btn" onClick={() => openApp("mail", { compose: { subject: v.title, body: `Check out this video: ${link}` } })}>
                Email
              </button>
              <button
                className="btn"
                onClick={() =>
                  navigator.clipboard?.writeText(link).then(
                    () => notify({ title: "Link copied", body: link }),
                    () => notify({ title: "Couldn't copy the link", body: "Select the address and copy it instead." }),
                  )
                }
              >
                Copy link
              </button>
            </div>
          </div>
        )}
        <div className="mt-description">
          <strong>Uploaded on {formatDate(Date.parse(v.uploadedAt), computer.timeZone)}</strong>
          <p>{v.description || "No description."}</p>
          <div className="mt-meta">
            Category: {v.category}
            {v.origin === "user" && " · Uploaded from this computer"}
          </div>
        </div>
        <section className="mt-comments">
          <h3>All Comments ({allComments.length})</h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const body = text.trim();
              if (!body || !user) return;
              await store.put<MtComment>(COL.comments, { id: newId("cmt"), owner: user.id, authorName: user.name, avatar: avatarUrl(user.picture), videoId: v.id, text: body.slice(0, 500), at: iso(now()), origin: "user" });
              setText("");
            }}
          >
            <textarea className="field" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Share your thoughts" aria-label="Comment" maxLength={500} />
            <button className="btn" disabled={!text.trim()}>
              Post
            </button>
          </form>
          {allComments.map((c) => (
            <div key={c.id} className="mt-comment">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.avatar} alt="" />
              <div>
                <strong>{c.author}</strong> <span className="mt-meta">{timeAgo(Date.parse(c.at), t)}</span>
                <p>{c.text}</p>
                {c.mine && (
                  <button className="link-btn" onClick={() => store.delete(COL.comments, c.id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      </main>
      <aside className="mt-related" aria-label="Related videos">
        {related.map((r) => (
          <Tile key={r.id} v={r} compact />
        ))}
        {related.length === 0 && <p className="mt-meta">No related videos yet.</p>}
        <button className="link-btn" onClick={() => navigate(mt("/"))}>
          More videos
        </button>
      </aside>
    </div>
  );
}

function Channel() {
  const { url } = useSite();
  const { store, user, now, computer } = useSystem();
  const handle = url.path.split("/")[2] ?? "";
  const all = useCatalog();
  const ch = channels.find((c) => c.handle.toLowerCase() === handle.toLowerCase());
  const isMe = user && userHandle(user.name).toLowerCase() === handle.toLowerCase();
  const key = ch ? ch.id : isMe ? `user:${user!.id}` : null;
  const [subs] = useCollection<MtSub>(COL.subs, { allUsers: true });
  const [tab, setTab] = useState<"videos" | "about">("videos");
  usePageTitle(`${ch?.name ?? handle}'s channel - MeTube`);
  const t = now();
  if (!key || (ch && Date.parse(ch.joinedAt) > t)) {
    return (
      <div className="mt-body">
        <main className="mt-main mt-unavailable">
          <h2>This channel does not exist.</h2>
          <A href={mt("/")}>Back to MeTube</A>
        </main>
      </div>
    );
  }
  const vids = all.filter((v) => v.channelKey === key);
  const subscribed = user ? subs.some((s) => s.id === pairId(user.id, key)) : false;
  return (
    <div className="mt-body">
      <Guide />
      <main className="mt-main">
        <div className="mt-banner" style={{ background: ch?.color ?? "#555" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ch?.avatar ?? avatarUrl(user!.picture)} alt="" />
          <div>
            <h1>{ch?.name ?? user!.name}</h1>
            <div>{vids.length} videos · {subs.filter((s) => s.channel === key).length} subscribers on this computer</div>
          </div>
          {!isMe && (
            <button
              className={`mt-subscribe${subscribed ? " on" : ""}`}
              onClick={async () => {
                if (!user) return;
                const sid = pairId(user.id, key);
                if (subscribed) await store.delete(COL.subs, sid);
                else await store.put<MtSub>(COL.subs, { id: sid, owner: user.id, channel: key, at: iso(t) });
              }}
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>
        <nav className="mt-tabs">
          <button className={tab === "videos" ? "on" : ""} onClick={() => setTab("videos")}>
            Videos
          </button>
          <button className={tab === "about" ? "on" : ""} onClick={() => setTab("about")}>
            About
          </button>
        </nav>
        {tab === "videos" ? (
          <div className="mt-grid">
            {vids.map((v) => (
              <Tile key={v.id} v={v} />
            ))}
            {vids.length === 0 && <p className="empty">{isMe ? "You haven't uploaded anything yet." : "No videos yet."}</p>}
          </div>
        ) : (
          <div className="mt-about">
            <p>{ch?.about ?? `${user!.name}'s channel on MeTube.`}</p>
            <p className="mt-meta">Joined {formatDate(Date.parse(ch?.joinedAt ?? user!.createdAt), computer.timeZone)}</p>
          </div>
        )}
      </main>
    </div>
  );
}

function Feed() {
  const { url } = useSite();
  const { store } = useSystem();
  const dialog = useDialog();
  const kind = url.path.split("/")[2];
  const all = useCatalog();
  const [subs] = useCollection<MtSub>(COL.subs);
  const [favs] = useCollection<MtFavorite>(COL.favorites);
  const [playlists] = useCollection<MtPlaylist>(COL.playlists);
  const [progress] = useCollection<MtProgress>(COL.progress);
  const title = { subscriptions: "My Subscriptions", history: "History", favorites: "Favorites", playlists: "Playlists" }[kind as string] ?? "MeTube";
  usePageTitle(`${title} - MeTube`);
  let content: React.ReactNode;
  if (kind === "subscriptions") {
    const list = all.filter((v) => subs.some((s) => s.channel === v.channelKey));
    content = list.length ? <div className="mt-grid">{list.map((v) => <Tile key={v.id} v={v} />)}</div> : <p className="empty">Subscribe to channels to see their newest videos here.</p>;
  } else if (kind === "history") {
    const list = [...progress].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((p) => ({ p, v: all.find((x) => x.id === p.videoId) })).filter((x) => x.v);
    content = list.length ? (
      <div className="mt-results">
        {list.map(({ p, v }) => (
          <div key={p.id} className="mt-history-row">
            <Tile v={v!} compact />
            <div className="mt-resume-bar" title="Watched">
              <div style={{ width: `${Math.min(100, (p.position / (p.duration || 1)) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="empty">Videos you watch will show up here.</p>
    );
  } else if (kind === "favorites") {
    const list = favs.map((f) => all.find((v) => v.id === f.videoId)).filter(Boolean) as CatalogVid[];
    content = list.length ? <div className="mt-grid">{list.map((v) => <Tile key={v.id} v={v} />)}</div> : <p className="empty">Press ★ Favorite on any video to save it here.</p>;
  } else {
    content = (
      <>
        {playlists.length === 0 && <p className="empty">Use &quot;+ Add to&quot; under a video to start a playlist.</p>}
        {playlists.map((p) => (
          <div key={p.id} className="mt-playlist-row">
            <A href={mt("/playlist", { list: p.id })}>
              <strong>{p.name}</strong>
            </A>{" "}
            <span className="mt-meta">{p.videoIds.length} videos</span>{" "}
            <button
              className="link-btn"
              onClick={async () => {
                const name = await dialog.prompt("Rename playlist:", p.name, { title: "Rename" });
                if (name) await store.put(COL.playlists, { ...p, name });
              }}
            >
              Rename
            </button>
            <button className="link-btn" onClick={async () => (await dialog.confirm(`Delete the playlist "${p.name}"?`)) && store.delete(COL.playlists, p.id)}>
              Delete
            </button>
          </div>
        ))}
      </>
    );
  }
  return (
    <div className="mt-body">
      <Guide />
      <main className="mt-main">
        <h2>{title}</h2>
        {content}
      </main>
    </div>
  );
}

function PlaylistPage() {
  const { url, navigate } = useSite();
  const all = useCatalog();
  const [playlists] = useCollection<MtPlaylist>(COL.playlists, { allUsers: true });
  const p = playlists.find((x) => x.id === url.params.get("list"));
  usePageTitle(`${p?.name ?? "Playlist"} - MeTube`);
  const items = (p?.videoIds ?? []).map((id) => all.find((v) => v.id === id)).filter(Boolean) as CatalogVid[];
  return (
    <div className="mt-body">
      <Guide />
      <main className="mt-main">
        {!p ? (
          <p className="empty">This playlist doesn&apos;t exist.</p>
        ) : (
          <>
            <h2>{p.name}</h2>
            <button className="btn" disabled={!items.length} onClick={() => navigate(mt("/watch", { v: items[0].id }))}>
              ▶ Play all
            </button>
            <div className="mt-results">{items.map((v) => <Tile key={v.id} v={v} compact />)}</div>
          </>
        )}
      </main>
    </div>
  );
}

function Upload() {
  usePageTitle("Upload - MeTube");
  const { vfs, folders, store, user, now } = useSystem();
  const { navigate } = useSite();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [fileId, setFileId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("People & Blogs");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!vfs || !folders) return;
    // Any video on the computer (outside the Recycle Bin) can be uploaded.
    store.list<FileNode>("files").then((all) => setFiles(all.filter((f) => f.owner === user?.id && f.kind === "file" && f.mime?.startsWith("video/") && !f.trashed)));
  }, [vfs, folders, store, user]);
  return (
    <div className="mt-body">
      <main className="mt-main mt-upload">
        <h2>Upload a video</h2>
        <p className="mt-meta">Choose a video from your computer (WebM or MP4). Uploads are public on MeTube and stamped with your computer&apos;s date.</p>
        {files.length === 0 && <p className="empty">There are no video files on this computer yet. Put one in My Videos first.</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!vfs || !user) return;
            setBusy(true);
            setError(null);
            try {
              const file = files.find((f) => f.id === fileId)!;
              const blob = await vfs.readBlob(file.id);
              const meta = await probeVideo(blob);
              const blobId = newId("blob");
              await store.putBlob(blobId, blob);
              const id = newId("vid");
              await store.put<MtUpload>(COL.uploads, {
                id,
                owner: user.id,
                ownerName: user.name,
                ownerAvatar: avatarUrl(user.picture),
                title: title.trim().slice(0, 100),
                description: description.trim().slice(0, 2000),
                category,
                blobId,
                mime: file.mime ?? "video/webm",
                duration: meta.duration,
                thumb: meta.thumb,
                uploadedAt: iso(now()),
                origin: "user",
              });
              navigate(mt("/watch", { v: id }));
            } catch (err) {
              setError(err instanceof Error ? err.message : "That file couldn't be read as a video.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Video file
            <select className="field" value={fileId} onChange={(e) => (setFileId(e.target.value), !title && setTitle(files.find((f) => f.id === e.target.value)?.name.replace(/\.[^.]+$/, "") ?? ""))} required aria-label="Video file">
              <option value="">Choose a video...</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} aria-label="Title" />
          </label>
          <label>
            Description
            <textarea className="field" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} aria-label="Description" />
          </label>
          <label>
            Category
            <select className="field" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              {["People & Blogs", "Gaming", "Music", "Pets & Animals", "Howto & Style", "Sports", "Film & Animation", "Science & Technology", "Comedy"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          {error && <p className="error-text">{error}</p>}
          <button className="btn primary" disabled={busy || !fileId || !title.trim()}>
            {busy ? "Uploading..." : "Upload"}
          </button>
        </form>
      </main>
    </div>
  );
}

/** Reads a video's length and grabs a thumbnail frame. */
function probeVideo(blob: Blob): Promise<{ duration: number; thumb: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const v = document.createElement("video");
    v.muted = true;
    v.preload = "auto";
    v.src = url;
    const fail = () => (URL.revokeObjectURL(url), reject(new Error("That file couldn't be read as a video.")));
    v.onerror = fail;
    v.onloadedmetadata = () => {
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    };
    v.onseeked = () => {
      const c = document.createElement("canvas");
      c.width = 320;
      c.height = 180;
      c.getContext("2d")!.drawImage(v, 0, 0, 320, 180);
      const thumb = c.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      resolve({ duration: Number.isFinite(v.duration) ? v.duration : 0, thumb });
    };
    setTimeout(fail, 15000);
  });
}

export default function MeTube() {
  const { url } = useSite();
  const path = url.path.replace(/\/+$/, "") || "/";
  let page: React.ReactNode;
  if (path === "/watch") page = <Watch key={url.params.get("v")} />;
  else if (path === "/results") page = <Results />;
  else if (path.startsWith("/user/")) page = <Channel />;
  else if (path.startsWith("/feed/")) page = <Feed />;
  else if (path === "/playlist") page = <PlaylistPage />;
  else if (path === "/upload") page = <Upload />;
  else page = <Home />;
  return (
    <div className="metube">
      <Header />
      {page}
      <footer className="mt-footer">© 2013 MeTube, LLC · Broadcast Yourself</footer>
    </div>
  );
}
