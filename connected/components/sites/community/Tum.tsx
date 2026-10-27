"use client";

// Tum: personal blogs with custom themes, art posts, reblogs, likes,
// follows and comments. Blogs live at <name>.tum.connectedera.local; the dashboard and
// Explore pages live at tum.connectedera.local.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { avatarUrl } from "@/components/system/defaults";
import { A, useSite, usePageTitle } from "../SiteContext";
import { tumBlogs, type TumBlog } from "@/data/community";
import { newId } from "@/lib/ids";
import { formatDate, iso, timeAgo } from "@/lib/time";
import { userHandle } from "../metube/store";
import { BlobImage, Linkified, PicturePicker } from "./text";

interface UserBlog {
  id: string; // blog name
  owner: string;
  title: string;
  description: string;
  avatar: string;
  theme: TumBlog["theme"];
  createdAt: string;
  origin: "user";
}
interface UserTumPost {
  id: string;
  owner: string;
  blog: string;
  title?: string;
  text: string;
  imageBlob?: string;
  image?: string;
  tags: string[];
  at: string;
  rebloggedFrom?: string;
  origin: "user";
}
interface TumNote {
  id: string;
  owner: string;
  postId: string;
  kind: "like" | "comment";
  author: string;
  text?: string;
  at: string;
}
interface TumFollow {
  id: string;
  owner: string;
  blog: string;
}

interface Post {
  id: string;
  blog: string;
  title?: string;
  text: string;
  image?: string;
  imageBlob?: string;
  tags: string[];
  at: string;
  baseNotes: number;
  rebloggedFrom?: string;
  owner?: string;
}

const blogUrl = (name: string, path = "/") => `http://${name}.tum.connectedera.local${path}`;
const tum = (path = "/") => `http://tum.connectedera.local${path}`;

const THEMES: { name: string; theme: TumBlog["theme"] }[] = [
  { name: "Paper", theme: { bg: "#fbf8f2", text: "#2d2a26", accent: "#b5522c", font: "Georgia, serif" } },
  { name: "Midnight", theme: { bg: "#151a2e", text: "#e3e8ff", accent: "#7fb2ff", font: "'Trebuchet MS', sans-serif" } },
  { name: "Mint", theme: { bg: "#effaf4", text: "#1f3a2c", accent: "#2f9e64", font: "Verdana, sans-serif" } },
  { name: "Bubblegum", theme: { bg: "#fff0f6", text: "#3d2433", accent: "#d6408a", font: "'Comic Sans MS', 'Trebuchet MS', sans-serif" } },
  { name: "Typewriter", theme: { bg: "#f2f2ee", text: "#222", accent: "#555", font: "'Courier New', monospace" } },
];

function useTum() {
  const { now } = useSystem();
  const [userBlogs] = useCollection<UserBlog>("tum.blogs", { allUsers: true });
  const [userPosts] = useCollection<UserTumPost>("tum.posts", { allUsers: true });
  const [notes] = useCollection<TumNote>("tum.notes", { allUsers: true });
  const t = now();
  const blogs: (TumBlog & { owner?: string })[] = [
    ...tumBlogs.filter((b) => Date.parse(b.createdAt) <= t).map((b) => ({ ...b, posts: b.posts.filter((p) => Date.parse(p.at) <= t) })),
    ...userBlogs.filter((b) => Date.parse(b.createdAt) <= t).map((b) => ({ name: b.id, title: b.title, description: b.description, avatar: b.avatar, createdAt: b.createdAt, tags: [], theme: b.theme, posts: [], owner: b.owner })),
  ];
  const posts: Post[] = [
    ...blogs.flatMap((b) => b.posts.map((p) => ({ id: p.id, blog: b.name, title: p.title, text: p.text, image: p.image, tags: p.tags, at: p.at, baseNotes: p.notes }))),
    ...userPosts.filter((p) => Date.parse(p.at) <= t).map((p) => ({ id: p.id, blog: p.blog, title: p.title, text: p.text, image: p.image, imageBlob: p.imageBlob, tags: p.tags, at: p.at, baseNotes: 0, rebloggedFrom: p.rebloggedFrom, owner: p.owner })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  return { blogs, posts, notes, userBlogs };
}

function PostCard({ p, theme }: { p: Post; theme?: TumBlog["theme"] }) {
  const { store, user, now } = useSystem();
  const { notes, userBlogs } = useTum();
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const mine = notes.filter((n) => n.postId === p.id);
  const liked = user ? mine.some((n) => n.kind === "like" && n.owner === user.id) : false;
  const myBlog = userBlogs.find((b) => b.owner === user?.id);
  return (
    <article className="tum-post" style={theme ? { borderColor: theme.accent } : undefined}>
      {p.rebloggedFrom && <div className="tum-reblog">↻ reblogged from {p.rebloggedFrom}</div>}
      {p.title && <h3>{p.title}</h3>}
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt={p.title ?? "Picture"} className="tum-image" />
      )}
      {p.imageBlob && <BlobImage blobId={p.imageBlob} alt={p.title ?? "Picture"} className="tum-image" />}
      <p>
        <Linkified text={p.text} />
      </p>
      {p.tags.length > 0 && (
        <div className="tum-tags">
          {p.tags.map((t) => (
            <A key={t} href={tum(`/tagged/${encodeURIComponent(t)}`)}>
              #{t}
            </A>
          ))}
        </div>
      )}
      <div className="tum-foot">
        <A href={blogUrl(p.blog, `/post/${p.id}`)}>{timeAgo(Date.parse(p.at), now())}</A>
        <button className="link-btn" onClick={() => setOpen(!open)}>
          {p.baseNotes + mine.length} notes
        </button>
        <button
          className={`tum-like${liked ? " on" : ""}`}
          aria-pressed={liked}
          onClick={async () => {
            if (!user) return;
            const id = `${user.id}:like:${p.id}`;
            if (liked) await store.delete("tum.notes", id);
            else await store.put<TumNote>("tum.notes", { id, owner: user.id, postId: p.id, kind: "like", author: user.name, at: iso(now()) });
          }}
        >
          ♥
        </button>
        {myBlog && p.blog !== myBlog.id && (
          <button
            className="link-btn"
            onClick={() => store.put<UserTumPost>("tum.posts", { id: newId("post"), owner: user!.id, blog: myBlog.id, title: p.title, text: p.text, image: p.image, imageBlob: p.imageBlob, tags: p.tags, at: iso(now()), rebloggedFrom: p.blog, origin: "user" })}
          >
            Reblog
          </button>
        )}
        {p.owner === user?.id && (
          <button className="link-btn" onClick={() => store.delete("tum.posts", p.id)}>
            Delete
          </button>
        )}
      </div>
      {open && (
        <div className="tum-notes">
          {mine.map((n) => (
            <div key={n.id}>{n.kind === "like" ? `♥ ${n.author} liked this` : `💬 ${n.author}: ${n.text}`}</div>
          ))}
          {p.baseNotes > 0 && <div className="muted">and {p.baseNotes} notes from before</div>}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!user || !comment.trim()) return;
              await store.put<TumNote>("tum.notes", { id: newId("cmt"), owner: user.id, postId: p.id, kind: "comment", author: user.name, text: comment.trim().slice(0, 300), at: iso(now()) });
              setComment("");
            }}
          >
            <input className="field" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Say something nice" aria-label="Comment" />
            <button className="btn">Comment</button>
          </form>
        </div>
      )}
    </article>
  );
}

function Composer({ blog }: { blog: string }) {
  const { store, user, now, vfs } = useSystem();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [fileId, setFileId] = useState("");
  return (
    <form
      className="tum-compose"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user || !vfs || (!text.trim() && !fileId)) return;
        let imageBlob: string | undefined;
        if (fileId) {
          imageBlob = newId("blob");
          await store.putBlob(imageBlob, await vfs.readBlob(fileId));
        }
        await store.put<UserTumPost>("tum.posts", {
          id: newId("post"),
          owner: user.id,
          blog,
          title: title.trim() || undefined,
          text: text.trim(),
          imageBlob,
          tags: tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean),
          at: iso(now()),
          origin: "user",
        });
        setTitle("");
        setText("");
        setTags("");
        setFileId("");
      }}
    >
      <strong>New post</strong>
      <input className="field" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Post title" />
      <textarea className="field" rows={3} placeholder="Write something, or add a picture" value={text} onChange={(e) => setText(e.target.value)} aria-label="Post text" />
      <div className="tum-row">
        <PicturePicker value={fileId} onChange={setFileId} />
        <input className="field" placeholder="tags, separated by commas" value={tags} onChange={(e) => setTags(e.target.value)} aria-label="Tags" />
        <button className="btn primary" disabled={!text.trim() && !fileId}>
          Post
        </button>
      </div>
      <small className="muted">Only post your own pictures, or ones you have permission to share.</small>
    </form>
  );
}

function Dashboard() {
  usePageTitle("Tum");
  const { user, store, now } = useSystem();
  const { blogs, posts, userBlogs } = useTum();
  const [follows] = useCollection<TumFollow>("tum.follows");
  const myBlog = userBlogs.find((b) => b.owner === user?.id);
  const followed = posts.filter((p) => p.blog === myBlog?.id || follows.some((f) => f.blog === p.blog));
  return (
    <div className="tum-dash">
      <main>
        {myBlog ? (
          <Composer blog={myBlog.id} />
        ) : (
          user && (
            <div className="tum-compose">
              <strong>Start your own Tum blog</strong>
              <p>Share drawings, photos and thoughts. You can change how it looks any time.</p>
              <button
                className="btn primary"
                onClick={() =>
                  store.put<UserBlog>("tum.blogs", {
                    id: userHandle(user.name).toLowerCase(),
                    owner: user.id,
                    title: `${user.name}'s blog`,
                    description: "Little things from my corner of the internet.",
                    avatar: avatarUrl(user.picture),
                    theme: THEMES[0].theme,
                    createdAt: iso(now()),
                    origin: "user",
                  })
                }
              >
                Create {userHandle(user.name).toLowerCase()}.tum.connectedera.local
              </button>
            </div>
          )
        )}
        <h2>{followed.length ? "Your dashboard" : "Fresh on Tum"}</h2>
        {(followed.length ? followed : posts).slice(0, 20).map((p) => (
          <div key={p.id}>
            <A href={blogUrl(p.blog)} className="tum-from">
              {p.blog}
            </A>
            <PostCard p={p} />
          </div>
        ))}
      </main>
      <aside>
        <h3>Blogs to follow</h3>
        {blogs.map((b) => (
          <div key={b.name} className="tum-blog-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.avatar} alt="" />
            <A href={blogUrl(b.name)}>{b.title}</A>
            {user && b.name !== myBlog?.id && (
              <button
                className="btn"
                onClick={async () => {
                  const id = `${user.id}:${b.name}`;
                  if (follows.some((f) => f.blog === b.name)) await store.delete("tum.follows", id);
                  else await store.put<TumFollow>("tum.follows", { id, owner: user.id, blog: b.name });
                }}
              >
                {follows.some((f) => f.blog === b.name) ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        ))}
        <h3>Explore</h3>
        <A href={tum("/tagged/fan art")}>#fan art gallery</A>
        <br />
        <A href={tum("/tagged/recipe")}>#recipe</A>
        <br />
        <A href={tum("/tagged/star courier")}>#star courier</A>
      </aside>
    </div>
  );
}

function Tagged({ tag }: { tag: string }) {
  usePageTitle(`#${tag} on Tum`);
  const { posts } = useTum();
  const hits = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
  const pictures = hits.filter((p) => p.image || p.imageBlob);
  return (
    <div className="tum-dash">
      <main>
        <h2>#{tag}</h2>
        {pictures.length > 0 && (
          <div className="tum-gallery">
            {pictures.map((p) => (
              <A key={p.id} href={blogUrl(p.blog, `/post/${p.id}`)} className="tum-gallery-item">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title ?? ""} />
                ) : (
                  <BlobImage blobId={p.imageBlob!} alt={p.title ?? ""} />
                )}
                <small>{p.blog}</small>
              </A>
            ))}
          </div>
        )}
        {hits.map((p) => (
          <PostCard key={p.id} p={p} />
        ))}
        {hits.length === 0 && <p className="empty">No posts tagged #{tag} yet.</p>}
      </main>
    </div>
  );
}

function Blog({ name }: { name: string }) {
  const { url } = useSite();
  const { store, user, computer } = useSystem();
  const { blogs, posts, userBlogs } = useTum();
  const blog = blogs.find((b) => b.name === name);
  const own = userBlogs.find((b) => b.id === name && b.owner === user?.id);
  const [customizing, setCustomizing] = useState(false);
  usePageTitle(blog ? blog.title : "There's nothing here.");
  if (!blog) {
    return (
      <div className="tum-missing">
        <h1>There&apos;s nothing here.</h1>
        <p>Whatever you were looking for doesn&apos;t live here (yet).</p>
        <A href={tum("/")}>Go to Tum</A>
      </div>
    );
  }
  const postId = url.path.startsWith("/post/") ? url.path.split("/")[2] : null;
  const list = posts.filter((p) => p.blog === name && (!postId || p.id === postId));
  const th = blog.theme;
  return (
    <div className="tum-blog" style={{ background: th.bg, color: th.text, fontFamily: th.font }}>
      <header style={{ borderColor: th.accent }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={blog.avatar} alt="" />
        <div>
          <A href={blogUrl(name)} style={{ color: th.accent }} className="tum-blog-title">
            {blog.title}
          </A>
          <p>{blog.description}</p>
        </div>
        <nav>
          <A href={tum("/")} style={{ color: th.accent }}>
            Dashboard
          </A>
          {own && (
            <button className="btn" onClick={() => setCustomizing(!customizing)}>
              Customize
            </button>
          )}
        </nav>
      </header>
      {own && customizing && (
        <form
          className="tum-customize"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const themeName = String(f.get("theme"));
            await store.put<UserBlog>("tum.blogs", { ...own, title: String(f.get("title")).slice(0, 60) || own.title, description: String(f.get("description")).slice(0, 200), theme: THEMES.find((t) => t.name === themeName)?.theme ?? own.theme });
            setCustomizing(false);
          }}
        >
          <label>
            Title <input className="field" name="title" defaultValue={own.title} />
          </label>
          <label>
            Description <input className="field" name="description" defaultValue={own.description} />
          </label>
          <label>
            Theme{" "}
            <select className="field" name="theme" defaultValue={THEMES.find((t) => t.theme.bg === own.theme.bg)?.name}>
              {THEMES.map((t) => (
                <option key={t.name}>{t.name}</option>
              ))}
            </select>
          </label>
          <button className="btn primary">Save</button>
        </form>
      )}
      <main>
        {own && !postId && <Composer blog={name} />}
        {list.map((p) => (
          <PostCard key={p.id} p={p} theme={th} />
        ))}
        {list.length === 0 && <p className="empty">No posts yet.</p>}
      </main>
      <footer>Blogging since {formatDate(Date.parse(blog.createdAt), computer.timeZone)}</footer>
    </div>
  );
}

export default function Tum() {
  const { url } = useSite();
  const sub = url.host.endsWith(".tum.connectedera.local") ? url.host.slice(0, -".tum.connectedera.local".length) : null;
  if (sub) return <Blog name={sub} />;
  const tagged = url.path.startsWith("/tagged/") ? decodeURIComponent(url.path.slice(8)) : null;
  return (
    <div className="tum">
      <header className="tum-header">
        <A href={tum("/")} className="tum-logo">
          tum
        </A>
        <A href={tum("/")}>Dashboard</A>
        <A href={tum("/tagged/fan art")}>Fan art</A>
      </header>
      {tagged ? <Tagged tag={tagged} /> : <Dashboard />}
    </div>
  );
}
