"use client";

// InkPocket: a fan fiction archive. Read stories by fandom, leave reviews,
// keep favourites, pick up where you left off, and post your own stories
// chapter by chapter.

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { useDialog } from "@/components/desktop/Dialogs";
import { A, useSite, usePageTitle } from "../SiteContext";
import { archiveReviews, archiveStories, fandomById, fandoms, INKPOCKET_HOST, wordCount, type FicChapter } from "@/data/fanfic";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { userHandle } from "../metube/store";
import { Linkified } from "./text";

const ip = (path = "/") => siteUrl(INKPOCKET_HOST, path);

interface UserStory {
  id: string;
  owner: string;
  author: string;
  title: string;
  fandom: string;
  rating: "Everyone" | "Teen";
  genres: string[];
  summary: string;
  complete: boolean;
  createdAt: string;
  origin: "user";
}
interface UserChapter {
  id: string;
  owner: string;
  storyId: string;
  number: number;
  title: string;
  text: string;
  at: string;
  origin: "user";
}
interface Review {
  id: string;
  owner: string;
  storyId: string;
  chapter: number;
  name: string;
  text: string;
  at: string;
  origin: "user";
}
interface Favorite {
  id: string;
  owner: string;
  storyId: string;
  at: string;
}
interface Progress {
  id: string;
  owner: string;
  storyId: string;
  chapter: number;
  at: string;
}

interface Story {
  id: string;
  title: string;
  author: string;
  fandom: string;
  rating: string;
  genres: string[];
  summary: string;
  complete: boolean;
  chapters: FicChapter[];
  favorites: number;
  words: number;
  updated: string;
  published: string;
  mine: boolean;
  user: boolean;
}

function useStories(): Story[] {
  const { now, user } = useSystem();
  const [userStories] = useCollection<UserStory>("inkpocket.stories", { allUsers: true });
  const [userChapters] = useCollection<UserChapter>("inkpocket.chapters", { allUsers: true });
  const [favs] = useCollection<Favorite>("inkpocket.favorites", { allUsers: true });
  const t = now();
  const shape = (base: Omit<Story, "words" | "updated" | "published" | "favorites"> & { baseFavorites: number }): Story | null => {
    if (!base.chapters.length) return null;
    return {
      ...base,
      favorites: base.baseFavorites + favs.filter((f) => f.storyId === base.id).length,
      words: base.chapters.reduce((n, c) => n + wordCount(c.text), 0),
      published: base.chapters[0].at,
      updated: base.chapters[base.chapters.length - 1].at,
    };
  };
  const out: Story[] = [];
  for (const s of archiveStories) {
    const st = shape({ ...s, chapters: s.chapters.filter((c) => Date.parse(c.at) <= t), mine: false, user: false });
    if (st) out.push({ ...st, complete: s.complete && st.chapters.length === s.chapters.length });
  }
  for (const s of userStories) {
    const chapters = userChapters
      .filter((c) => c.storyId === s.id && Date.parse(c.at) <= t)
      .sort((a, b) => a.number - b.number)
      .map((c) => ({ title: c.title, at: c.at, text: c.text }));
    const st = shape({ ...s, chapters, baseFavorites: 0, mine: s.owner === user?.id, user: true });
    if (st) out.push(st);
  }
  return out.sort((a, b) => b.updated.localeCompare(a.updated));
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user } = useSystem();
  return (
    <div className="inkpocket">
      <header className="ip-header">
        <A href={ip("/")} className="ip-logo">
          ✒ InkPocket
        </A>
        <nav>
          <A href={ip("/")}>Fandoms</A>
          {user && <A href={ip("/favorites")}>Favourites</A>}
          {user && <A href={ip("/write")}>Write a story</A>}
          {user && <A href={ip(`/u/${userHandle(user.name)}`)}>My stories</A>}
        </nav>
      </header>
      <main className="ip-main">{children}</main>
      <footer className="ip-foot">InkPocket is a fan archive. Stories belong to their writers; characters belong to their creators.</footer>
    </div>
  );
}

function StoryRow({ s }: { s: Story }) {
  const { computer } = useSystem();
  return (
    <div className="ip-story">
      <A href={ip(`/s/${s.id}`)} className="ip-title">
        {s.title}
      </A>{" "}
      by <A href={ip(`/u/${s.author}`)}>{s.author}</A>
      <p>{s.summary}</p>
      <div className="ip-meta">
        {fandomById(s.fandom)?.name} · Rated {s.rating} · {s.genres.join("/")} · Chapters: {s.chapters.length} · Words: {s.words.toLocaleString("en-US")} · Favs: {s.favorites} · Updated: {formatDate(Date.parse(s.updated), computer.timeZone)}
        {s.complete ? " · Complete" : ""}
      </div>
    </div>
  );
}

/** Fandoms whose original has come out by the computer's date. */
function useFandoms() {
  const { now } = useSystem();
  const t = now();
  return fandoms.filter((f) => Date.parse(f.since) <= t);
}

function Home() {
  usePageTitle("InkPocket - Fan fiction archive");
  const stories = useStories();
  const shownFandoms = useFandoms();
  const [progress] = useCollection<Progress>("inkpocket.progress");
  const continuing = [...progress]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((p) => ({ p, s: stories.find((x) => x.id === p.storyId) }))
    .filter((x) => x.s)
    .slice(0, 3);
  return (
    <Shell>
      {continuing.length > 0 && (
        <section>
          <h2>Continue reading</h2>
          <ul className="ip-list">
            {continuing.map(({ p, s }) => (
              <li key={p.id}>
                <A href={ip(`/s/${s!.id}/${p.chapter}`)}>{s!.title}</A> <span className="ip-muted">chapter {p.chapter} of {s!.chapters.length}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2>Fandoms</h2>
        <div className="ip-fandoms">
          {shownFandoms.map((f) => {
            const n = stories.filter((s) => s.fandom === f.id).length;
            return (
              <A key={f.id} href={ip(`/fandom/${f.id}`)} className="ip-fandom">
                <strong>{f.name}</strong>
                <span>
                  {f.kind} · {n} {n === 1 ? "story" : "stories"}
                </span>
              </A>
            );
          })}
        </div>
      </section>
      <section>
        <h2>Just updated</h2>
        {stories.slice(0, 6).map((s) => (
          <StoryRow key={s.id} s={s} />
        ))}
        {stories.length === 0 && <p className="empty">No stories yet.</p>}
      </section>
    </Shell>
  );
}

function FandomPage({ id }: { id: string }) {
  const f = useFandoms().find((x) => x.id === id);
  const { url } = useSite();
  const filter = url.params.get("status");
  const stories = useStories().filter((s) => s.fandom === id && (!filter || (filter === "complete" ? s.complete : !s.complete)));
  usePageTitle(`${f?.name ?? "Fandom"} fan fiction - InkPocket`);
  if (!f) return <Shell><p className="empty">That fandom isn&apos;t on InkPocket.</p></Shell>;
  return (
    <Shell>
      <h1>{f.name} fan fiction</h1>
      <p className="ip-muted">
        Original: <A href={f.sourceUrl}>{f.kind === "Game" ? "the game" : f.kind === "Manga" ? "the manga on MangaShelf" : "MangaShelf"}</A>
      </p>
      <div className="ip-filters">
        <A href={ip(`/fandom/${id}`)} className={!filter ? "on" : ""}>
          All
        </A>
        <A href={siteUrl(INKPOCKET_HOST, `/fandom/${id}`, { status: "complete" })} className={filter === "complete" ? "on" : ""}>
          Complete
        </A>
        <A href={siteUrl(INKPOCKET_HOST, `/fandom/${id}`, { status: "progress" })} className={filter === "progress" ? "on" : ""}>
          In progress
        </A>
      </div>
      {stories.map((s) => (
        <StoryRow key={s.id} s={s} />
      ))}
      {stories.length === 0 && <p className="empty">No stories here yet. Why not write one?</p>}
    </Shell>
  );
}

function Reader({ id, n }: { id: string; n: number }) {
  const { store, user, now, computer } = useSystem();
  const dialog = useDialog();
  const { navigate } = useSite();
  const s = useStories().find((x) => x.id === id);
  const [reviews] = useCollection<Review>("inkpocket.reviews", { allUsers: true });
  const [favs] = useCollection<Favorite>("inkpocket.favorites");
  const [text, setText] = useState("");
  const chapter = s?.chapters[n - 1];
  usePageTitle(s ? `${s.title} Chapter ${n}${chapter ? `: ${chapter.title}` : ""} - InkPocket` : "Story not found - InkPocket");

  // Remember where you are.
  useEffect(() => {
    if (!s || !chapter || !user) return;
    void store.put<Progress>("inkpocket.progress", { id: `${user.id}:${s.id}`, owner: user.id, storyId: s.id, chapter: n, at: iso(now()) });
  }, [s, chapter, n, user, store, now]);

  if (!s || !chapter) {
    return (
      <Shell>
        <h1>Story not found</h1>
        <p>This story or chapter isn&apos;t available (yet).</p>
      </Shell>
    );
  }
  const t = now();
  const chapterReviews = [
    ...archiveReviews.filter((r) => r.storyId === id && r.chapter === n && Date.parse(r.at) <= t).map((r, i) => ({ ...r, id: `${id}-${n}-${i}`, mine: false })),
    ...reviews.filter((r) => r.storyId === id && r.chapter === n && Date.parse(r.at) <= t).map((r) => ({ ...r, mine: r.owner === user?.id })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const faved = favs.some((f) => f.storyId === id);

  return (
    <Shell>
      <div className="ip-crumbs">
        <A href={ip(`/fandom/${s.fandom}`)}>{fandomById(s.fandom)?.name}</A> »
      </div>
      <h1 className="ip-story-title">{s.title}</h1>
      <div>
        by <A href={ip(`/u/${s.author}`)}>{s.author}</A>
      </div>
      <p className="ip-summary">{s.summary}</p>
      <div className="ip-meta">
        Rated {s.rating} · {s.genres.join("/")} · Chapters: {s.chapters.length} · Words: {s.words.toLocaleString("en-US")} · Favs: {s.favorites} · Published: {formatDate(Date.parse(s.published), computer.timeZone)}
        {s.chapters.length > 1 ? ` · Updated: ${formatDate(Date.parse(s.updated), computer.timeZone)}` : ""}
        {s.complete ? " · Complete" : ""}
      </div>
      <div className="ip-tools">
        {s.chapters.length > 1 && (
          <select className="field" value={n} onChange={(e) => navigate(ip(`/s/${id}/${e.target.value}`))} aria-label="Chapter">
            {s.chapters.map((c, i) => (
              <option key={i} value={i + 1}>
                {i + 1}. {c.title}
              </option>
            ))}
          </select>
        )}
        {user && (
          <button
            className={`btn${faved ? " primary" : ""}`}
            onClick={async () => {
              const fid = `${user.id}:${id}`;
              if (faved) await store.delete("inkpocket.favorites", fid);
              else await store.put<Favorite>("inkpocket.favorites", { id: fid, owner: user.id, storyId: id, at: iso(now()) });
            }}
          >
            {faved ? "★ Favourited" : "☆ Favourite"}
          </button>
        )}
        {s.mine && (
          <>
            <A href={ip(`/s/${id}/add`)} className="btn">
              Add a chapter
            </A>
            <button
              className="btn"
              onClick={async () => {
                const doc = await store.get<UserStory>("inkpocket.stories", id);
                if (doc) await store.put<UserStory>("inkpocket.stories", { ...doc, complete: !doc.complete });
              }}
            >
              {s.complete ? "Mark as in progress" : "Mark as complete"}
            </button>
            <button
              className="btn"
              onClick={async () => {
                if (!(await dialog.confirm(`Delete "${s.title}" and all its chapters?`, { title: "Delete story", okLabel: "Delete" }))) return;
                for (const c of await store.list<UserChapter>("inkpocket.chapters")) if (c.storyId === id) await store.delete("inkpocket.chapters", c.id);
                await store.delete("inkpocket.stories", id);
                navigate(ip("/"));
              }}
            >
              Delete story
            </button>
          </>
        )}
      </div>
      <article className="ip-chapter">
        <h2>
          Chapter {n}: {chapter.title}
        </h2>
        {chapter.text.split(/\n\s*\n/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </article>
      <div className="ip-pager">
        {n > 1 ? <A href={ip(`/s/${id}/${n - 1}`)}>« Previous chapter</A> : <span />}
        {n < s.chapters.length ? <A href={ip(`/s/${id}/${n + 1}`)}>Next chapter »</A> : <span className="ip-muted">{s.complete ? "The End" : "To be continued..."}</span>}
      </div>
      <section className="ip-reviews">
        <h3>Reviews for this chapter ({chapterReviews.length})</h3>
        {chapterReviews.map((r) => (
          <div key={r.id} className="ip-review">
            <strong>{r.name}</strong> <span className="ip-muted">{formatDate(Date.parse(r.at), computer.timeZone)}</span>
            {r.mine && (
              <button className="link-btn" onClick={() => store.delete("inkpocket.reviews", r.id)}>
                Delete
              </button>
            )}
            <div>
              <Linkified text={r.text} />
            </div>
          </div>
        ))}
        {user && (
          <form
            className="ip-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim()) return;
              await store.put<Review>("inkpocket.reviews", { id: newId("cmt"), owner: user.id, storyId: id, chapter: n, name: userHandle(user.name), text: text.trim().slice(0, 2000), at: iso(now()), origin: "user" });
              setText("");
            }}
          >
            <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something nice to the writer" aria-label="Review" maxLength={2000} />
            <button className="btn primary" disabled={!text.trim()}>
              Post review
            </button>
          </form>
        )}
      </section>
    </Shell>
  );
}

function AuthorPage({ name }: { name: string }) {
  const stories = useStories().filter((s) => s.author.toLowerCase() === name.toLowerCase());
  usePageTitle(`${name} - InkPocket`);
  return (
    <Shell>
      <h1>{name}</h1>
      <p className="ip-muted">
        {stories.length} {stories.length === 1 ? "story" : "stories"}
      </p>
      {stories.map((s) => (
        <StoryRow key={s.id} s={s} />
      ))}
      {stories.length === 0 && <p className="empty">No stories yet.</p>}
    </Shell>
  );
}

function Favorites() {
  usePageTitle("Favourites - InkPocket");
  const stories = useStories();
  const [favs] = useCollection<Favorite>("inkpocket.favorites");
  const list = favs.map((f) => stories.find((s) => s.id === f.storyId)).filter(Boolean) as Story[];
  return (
    <Shell>
      <h1>Your favourite stories</h1>
      {list.map((s) => (
        <StoryRow key={s.id} s={s} />
      ))}
      {list.length === 0 && <p className="empty">Tap ☆ Favourite on a story to keep it here.</p>}
    </Shell>
  );
}

function Write({ storyId }: { storyId?: string }) {
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const stories = useStories();
  const shownFandoms = useFandoms();
  const existing = storyId ? stories.find((s) => s.id === storyId && s.mine) : undefined;
  const [title, setTitle] = useState("");
  const [fandom, setFandom] = useState(shownFandoms[0]?.id ?? fandoms[0].id);
  const [rating, setRating] = useState<"Everyone" | "Teen">("Everyone");
  const [genres, setGenres] = useState("");
  const [summary, setSummary] = useState("");
  const [chTitle, setChTitle] = useState("");
  const [chText, setChText] = useState("");
  usePageTitle(existing ? `Add a chapter to ${existing.title} - InkPocket` : "Write a story - InkPocket");
  if (!user) return null;
  if (storyId && !existing) return <Shell><p className="empty">You can only add chapters to your own stories.</p></Shell>;
  return (
    <Shell>
      <h1>{existing ? `Add chapter ${existing.chapters.length + 1} to "${existing.title}"` : "Write a new story"}</h1>
      <form
        className="ip-form ip-write"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!chText.trim() || (!existing && (!title.trim() || !summary.trim()))) return;
          const at = iso(now());
          let id = existing?.id;
          if (!id) {
            id = newId("post");
            await store.put<UserStory>("inkpocket.stories", { id, owner: user.id, author: userHandle(user.name), title: title.trim().slice(0, 100), fandom, rating, genres: genres.split(",").map((g) => g.trim()).filter(Boolean).slice(0, 3), summary: summary.trim().slice(0, 400), complete: false, createdAt: at, origin: "user" });
          }
          const number = (existing?.chapters.length ?? 0) + 1;
          await store.put<UserChapter>("inkpocket.chapters", { id: newId("chap"), owner: user.id, storyId: id, number, title: chTitle.trim().slice(0, 100) || `Chapter ${number}`, text: chText.trim().slice(0, 60000), at, origin: "user" });
          navigate(ip(`/s/${id}/${number}`));
        }}
      >
        {!existing && (
          <>
            <label>
              Title <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Story title" maxLength={100} />
            </label>
            <label>
              Fandom
              <select className="field" value={fandom} onChange={(e) => setFandom(e.target.value)} aria-label="Fandom">
                {shownFandoms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Rating
              <select className="field" value={rating} onChange={(e) => setRating(e.target.value as "Everyone" | "Teen")} aria-label="Rating">
                <option>Everyone</option>
                <option>Teen</option>
              </select>
            </label>
            <label>
              Genres (up to three, separated by commas) <input className="field" value={genres} onChange={(e) => setGenres(e.target.value)} aria-label="Genres" placeholder="Adventure, Humor" />
            </label>
            <label>
              Summary <textarea className="field" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} aria-label="Summary" maxLength={400} />
            </label>
          </>
        )}
        <label>
          Chapter title <input className="field" value={chTitle} onChange={(e) => setChTitle(e.target.value)} aria-label="Chapter title" maxLength={100} />
        </label>
        <label>
          Chapter text <textarea className="field" rows={14} value={chText} onChange={(e) => setChText(e.target.value)} aria-label="Chapter text" />
        </label>
        <div className="ip-muted">{wordCount(chText)} words · Leave a blank line between paragraphs.</div>
        <button className="btn primary" disabled={!chText.trim() || (!existing && (!title.trim() || !summary.trim()))}>
          {existing ? "Post chapter" : "Post story"}
        </button>
        <p className="ip-muted">Please only post your own writing. Be kind in reviews!</p>
      </form>
    </Shell>
  );
}

export default function InkPocket() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean);
  if (parts[0] === "s" && parts[1]) {
    if (parts[2] === "add") return <Write storyId={parts[1]} />;
    return <Reader key={`${parts[1]}-${parts[2] ?? 1}`} id={parts[1]} n={Math.max(1, Number(parts[2] ?? 1) || 1)} />;
  }
  if (parts[0] === "fandom" && parts[1]) return <FandomPage id={parts[1]} />;
  if (parts[0] === "u" && parts[1]) return <AuthorPage name={decodeURIComponent(parts[1])} />;
  if (parts[0] === "favorites") return <Favorites />;
  if (parts[0] === "write") return <Write />;
  return <Home />;
}
