"use client";

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { avatarUrl } from "@/components/system/defaults";
import { A, useSite, usePageTitle } from "../SiteContext";
import { birdiePosts, birdieUsers } from "@/data/community";
import { newId } from "@/lib/ids";
import { iso, timeAgo } from "@/lib/time";
import { userHandle } from "../metube/store";
import { Linkified } from "./text";

const bd = (path = "/") => `http://www.birdie.com${path}`;

interface UserChirp {
  id: string;
  owner: string;
  handle: string;
  name: string;
  avatar: string;
  text: string;
  at: string;
  replyTo?: string;
  origin: "user";
}
interface Like {
  id: string;
  owner: string;
  postId: string;
}
interface Follow {
  id: string;
  owner: string;
  handle: string;
}

interface Post {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  text: string;
  at: string;
  replyTo?: string;
  likes: number;
  mine: boolean;
}

function usePosts(): Post[] {
  const { now, user } = useSystem();
  const [mine] = useCollection<UserChirp>("birdie.posts", { allUsers: true });
  const [likes] = useCollection<Like>("birdie.likes", { allUsers: true });
  const t = now();
  const count = (id: string) => likes.filter((l) => l.postId === id).length;
  return [
    ...birdiePosts
      .filter((p) => Date.parse(p.at) <= t)
      .map((p) => {
        const u = birdieUsers.find((x) => x.handle === p.author)!;
        return { id: p.id, handle: p.author, name: u.name, avatar: u.avatar, text: p.text, at: p.at, replyTo: p.replyTo, likes: p.likes + count(p.id), mine: false };
      }),
    ...mine.filter((p) => Date.parse(p.at) <= t).map((p) => ({ id: p.id, handle: p.handle, name: p.name, avatar: p.avatar, text: p.text, at: p.at, replyTo: p.replyTo, likes: count(p.id), mine: p.owner === user?.id })),
  ].sort((a, b) => b.at.localeCompare(a.at));
}

function Compose({ replyTo, prefill = "" }: { replyTo?: string; prefill?: string }) {
  const { store, user, now } = useSystem();
  const [text, setText] = useState(prefill);
  if (!user) return null;
  const left = 140 - text.length;
  return (
    <form
      className="bd-compose"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim() || left < 0) return;
        await store.put<UserChirp>("birdie.posts", { id: newId("post"), owner: user.id, handle: userHandle(user.name), name: user.name, avatar: avatarUrl(user.picture), text: text.trim(), at: iso(now()), replyTo, origin: "user" });
        setText(prefill);
      }}
    >
      <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={replyTo ? "Write your reply" : "What's happening?"} aria-label={replyTo ? "Reply" : "What's happening?"} />
      <div className="bd-compose-foot">
        <span className={left < 0 ? "bd-over" : "bd-count"}>{left}</span>
        <button className="bd-btn" disabled={!text.trim() || left < 0}>
          {replyTo ? "Reply" : "Chirp"}
        </button>
      </div>
    </form>
  );
}

function PostView({ p }: { p: Post }) {
  const { store, user, now } = useSystem();
  const [likes] = useCollection<Like>("birdie.likes");
  const liked = likes.some((l) => l.postId === p.id);
  return (
    <article className="bd-post">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.avatar} alt="" />
      <div>
        <div className="bd-post-head">
          <A href={bd(`/${p.handle}`)}>
            <strong>{p.name}</strong> <span className="bd-handle">@{p.handle}</span>
          </A>
          <A href={bd(`/${p.handle}/status/${p.id}`)} className="bd-time">
            {timeAgo(Date.parse(p.at), now())}
          </A>
        </div>
        <p>
          <Linkified text={p.text} />
        </p>
        <div className="bd-post-actions">
          <A href={bd(`/${p.handle}/status/${p.id}`)}>Reply</A>
          <button
            className={liked ? "on" : ""}
            aria-pressed={liked}
            onClick={async () => {
              if (!user) return;
              const id = `${user.id}:${p.id}`;
              if (liked) await store.delete("birdie.likes", id);
              else await store.put<Like>("birdie.likes", { id, owner: user.id, postId: p.id });
            }}
          >
            ★ {p.likes}
          </button>
          {p.mine && (
            <button onClick={() => store.delete("birdie.posts", p.id)} aria-label="Delete chirp">
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function FollowButton({ handle }: { handle: string }) {
  const { store, user } = useSystem();
  const [follows] = useCollection<Follow>("birdie.follows");
  if (!user || handle === userHandle(user.name)) return null;
  const on = follows.some((f) => f.handle === handle);
  return (
    <button
      className={`bd-follow${on ? " on" : ""}`}
      onClick={async () => {
        const id = `${user.id}:${handle}`;
        if (on) await store.delete("birdie.follows", id);
        else await store.put<Follow>("birdie.follows", { id, owner: user.id, handle });
      }}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}

function Home() {
  usePageTitle("Birdie");
  const { url } = useSite();
  const { user, now } = useSystem();
  const posts = usePosts();
  const [follows] = useCollection<Follow>("birdie.follows");
  const everyone = url.params.get("tab") === "everyone" || follows.length === 0;
  const me = user ? userHandle(user.name) : "";
  const shown = everyone ? posts : posts.filter((p) => p.handle === me || follows.some((f) => f.handle === p.handle));
  const t = now();
  return (
    <div className="bd-columns">
      <aside className="bd-side">
        {user && (
          <div className="bd-card">
            <A href={bd(`/${me}`)}>
              <strong>{user.name}</strong>
            </A>
            <div className="bd-handle">@{me}</div>
            <div className="bd-muted">
              Following {follows.length} · {posts.filter((p) => p.mine).length} chirps
            </div>
          </div>
        )}
        <div className="bd-card">
          <strong>Who to follow</strong>
          {birdieUsers
            .filter((u) => Date.parse(u.joinedAt) <= t)
            .map((u) => (
              <div key={u.handle} className="bd-who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatar} alt="" />
                <A href={bd(`/${u.handle}`)}>@{u.handle}</A>
                <FollowButton handle={u.handle} />
              </div>
            ))}
        </div>
      </aside>
      <main className="bd-main">
        <Compose />
        <nav className="bd-tabs">
          <A href={bd("/")} className={!everyone ? "on" : ""}>
            Home
          </A>
          <A href={bd("/?tab=everyone")} className={everyone ? "on" : ""}>
            Everyone
          </A>
        </nav>
        {!everyone || follows.length > 0 ? null : <p className="bd-muted">Follow people to build your Home timeline. Here&apos;s what everyone is saying:</p>}
        {shown.map((p) => (
          <PostView key={p.id} p={p} />
        ))}
        {shown.length === 0 && <p className="empty">Nothing here yet.</p>}
      </main>
    </div>
  );
}

function Profile({ handle }: { handle: string }) {
  const { user, now, computer } = useSystem();
  const posts = usePosts().filter((p) => p.handle.toLowerCase() === handle.toLowerCase());
  const archive = birdieUsers.find((u) => u.handle.toLowerCase() === handle.toLowerCase());
  const isMe = user && userHandle(user.name).toLowerCase() === handle.toLowerCase();
  usePageTitle(`${archive?.name ?? handle} (@${handle}) on Birdie`);
  if ((!archive || Date.parse(archive.joinedAt) > now()) && !isMe && posts.length === 0) {
    return <main className="bd-main single"><p className="empty">Sorry, that page doesn&apos;t exist!</p></main>;
  }
  return (
    <main className="bd-main single">
      <div className="bd-profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={archive?.avatar ?? (user ? avatarUrl(user.picture) : "")} alt="" />
        <div>
          <h1>{archive?.name ?? user?.name}</h1>
          <div className="bd-handle">@{handle}</div>
          <p>{archive?.bio ?? "Chirping from my Connected PC."}</p>
          {archive && <div className="bd-muted">Joined {new Date(archive.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: computer.timeZone })}</div>}
        </div>
        <FollowButton handle={archive?.handle ?? handle} />
      </div>
      {posts.map((p) => (
        <PostView key={p.id} p={p} />
      ))}
      {posts.length === 0 && <p className="empty">No chirps yet.</p>}
    </main>
  );
}

function Status({ id }: { id: string }) {
  const posts = usePosts();
  const p = posts.find((x) => x.id === id);
  usePageTitle(p ? `${p.name} on Birdie: "${p.text.slice(0, 40)}"` : "Birdie");
  if (!p) return <main className="bd-main single"><p className="empty">This chirp doesn&apos;t exist (yet).</p></main>;
  const replies = posts.filter((x) => x.replyTo === p.id).reverse();
  return (
    <main className="bd-main single">
      <PostView p={p} />
      <Compose replyTo={p.id} prefill={`@${p.handle} `} />
      <h3 className="bd-muted">Replies ({replies.length})</h3>
      {replies.map((r) => (
        <PostView key={r.id} p={r} />
      ))}
    </main>
  );
}

export default function Birdie() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean);
  let page: React.ReactNode;
  if (parts.length === 0) page = <Home />;
  else if (parts[1] === "status" && parts[2]) page = <Status id={parts[2]} />;
  else page = <Profile handle={parts[0]} />;
  return (
    <div className="birdie">
      <header className="bd-header">
        <A href={bd("/")} className="bd-logo">
          🐦 birdie
        </A>
        <A href={bd("/")}>Home</A>
        <A href={bd("/?tab=everyone")}>Discover</A>
      </header>
      {page}
    </div>
  );
}
