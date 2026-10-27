"use client";

// TechNook Forums: classic boards with threads, replies, quotes and
// signatures.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection, useUserValue } from "@/components/system/hooks";
import { avatarUrl } from "@/components/system/defaults";
import { A, useSite, usePageTitle } from "../SiteContext";
import { nookBoards, techNookThreads, type NookPost } from "@/data/community";
import { newId } from "@/lib/ids";
import { formatDateTime, iso } from "@/lib/time";
import { Linkified } from "./text";

const tn = (path = "/") => `http://technook.connectedera.local${path}`;

interface UserThread {
  id: string;
  owner: string;
  board: string;
  title: string;
  at: string;
  origin: "user";
}
interface UserPost {
  id: string;
  owner: string;
  threadId: string;
  author: string;
  avatar: string;
  signature: string;
  text: string;
  at: string;
  origin: "user";
}

interface Thread {
  id: string;
  board: string;
  title: string;
  posts: (NookPost & { id: string; mine?: boolean })[];
}

function useForum(): Thread[] {
  const { now, user } = useSystem();
  const [threads] = useCollection<UserThread>("technook.threads", { allUsers: true });
  const [posts] = useCollection<UserPost>("technook.posts", { allUsers: true });
  const t = now();
  const all: Thread[] = [
    ...techNookThreads.map((th) => ({ ...th, posts: th.posts.filter((p) => Date.parse(p.at) <= t).map((p, i) => ({ ...p, id: `${th.id}-${i}` })) })),
    ...threads.filter((th) => Date.parse(th.at) <= t).map((th) => ({ id: th.id, board: th.board, title: th.title, posts: [] as Thread["posts"] })),
  ];
  for (const p of posts.filter((x) => Date.parse(x.at) <= t).sort((a, b) => a.at.localeCompare(b.at))) all.find((th) => th.id === p.threadId)?.posts.push({ ...p, mine: p.owner === user?.id });
  return all.filter((th) => th.posts.length > 0);
}

/** Renders [quote=Name]...[/quote] blocks and plain text, never HTML. */
function PostBody({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const re = /\[quote=([^\]]{1,40})\]([\s\S]*?)\[\/quote\]/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) parts.push(<Linkified key={`t${last}`} text={text.slice(last, m.index)} />);
    parts.push(
      <div key={`q${m.index}`} className="tn-quote">
        <div className="tn-quote-head">Quote from {m[1]}:</div>
        {m[2].trim()}
      </div>,
    );
    last = m.index! + m[0].length;
  }
  if (last < text.length) parts.push(<Linkified key={`t${last}`} text={text.slice(last)} />);
  return <div className="tn-body">{parts}</div>;
}

function ReplyForm({ threadId, initial }: { threadId: string; initial: string }) {
  const { store, user, now } = useSystem();
  const [signature] = useUserValue("technook-signature", "");
  const [text, setText] = useState(initial);
  if (!user) return null;
  return (
    <form
      className="tn-reply"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await store.put<UserPost>("technook.posts", { id: newId("post"), owner: user.id, threadId, author: user.name, avatar: avatarUrl(user.picture), signature, text: text.trim().slice(0, 5000), at: iso(now()), origin: "user" });
        setText("");
      }}
    >
      <strong>Post a reply</strong>
      <textarea className="field" rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
      <button className="btn primary" disabled={!text.trim()}>
        Post Reply
      </button>
    </form>
  );
}

function Index() {
  usePageTitle("TechNook Forums");
  const threads = useForum();
  return (
    <main className="tn-main">
      <table className="tn-table">
        <thead>
          <tr>
            <th>Forum</th>
            <th>Threads</th>
            <th>Posts</th>
          </tr>
        </thead>
        <tbody>
          {nookBoards.map((b) => {
            const list = threads.filter((t) => t.board === b.id);
            return (
              <tr key={b.id}>
                <td>
                  <A href={tn(`/board/${b.id}`)}>
                    <strong>{b.title}</strong>
                  </A>
                  <div className="tn-muted">{b.description}</div>
                </td>
                <td>{list.length}</td>
                <td>{list.reduce((s, t) => s + t.posts.length, 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </main>
  );
}

function Board({ id }: { id: string }) {
  const { store, user, now, computer } = useSystem();
  const { navigate } = useSite();
  const [signature] = useUserValue("technook-signature", "");
  const b = nookBoards.find((x) => x.id === id);
  const threads = useForum().filter((t) => t.board === id);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  usePageTitle(`${b?.title ?? "Forum"} - TechNook Forums`);
  if (!b) return <main className="tn-main"><p>Forum not found.</p></main>;
  return (
    <main className="tn-main">
      <div className="tn-crumbs">
        <A href={tn("/")}>TechNook Forums</A> » {b.title}
      </div>
      <table className="tn-table">
        <thead>
          <tr>
            <th>Thread</th>
            <th>Replies</th>
            <th>Last post</th>
          </tr>
        </thead>
        <tbody>
          {threads.map((t) => {
            const last = t.posts[t.posts.length - 1];
            return (
              <tr key={t.id}>
                <td>
                  <A href={tn(`/thread/${t.id}`)}>{t.title}</A>
                  <div className="tn-muted">by {t.posts[0].author}</div>
                </td>
                <td>{t.posts.length - 1}</td>
                <td className="tn-muted">
                  {formatDateTime(Date.parse(last.at), computer.timeZone)} by {last.author}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {user && (
        <form
          className="tn-reply"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!title.trim() || !text.trim()) return;
            const tid = newId("thr");
            const at = iso(now());
            await store.put<UserThread>("technook.threads", { id: tid, owner: user.id, board: id, title: title.trim().slice(0, 100), at, origin: "user" });
            await store.put<UserPost>("technook.posts", { id: newId("post"), owner: user.id, threadId: tid, author: user.name, avatar: avatarUrl(user.picture), signature, text: text.trim(), at, origin: "user" });
            navigate(tn(`/thread/${tid}`));
          }}
        >
          <strong>Start a new thread</strong>
          <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Thread title" />
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" />
          <button className="btn primary" disabled={!title.trim() || !text.trim()}>
            Post New Thread
          </button>
        </form>
      )}
    </main>
  );
}

function ThreadPage({ id }: { id: string }) {
  const { computer, store } = useSystem();
  const t = useForum().find((x) => x.id === id);
  const [quote, setQuote] = useState("");
  usePageTitle(t ? `${t.title} - TechNook Forums` : "TechNook Forums");
  if (!t) return <main className="tn-main"><p>This thread doesn&apos;t exist (yet).</p></main>;
  const board = nookBoards.find((b) => b.id === t.board)!;
  return (
    <main className="tn-main">
      <div className="tn-crumbs">
        <A href={tn("/")}>TechNook Forums</A> » <A href={tn(`/board/${board.id}`)}>{board.title}</A> » {t.title}
      </div>
      <h1>{t.title}</h1>
      {t.posts.map((p, i) => (
        <div key={p.id} className="tn-post">
          <div className="tn-author">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" />
            <strong>{p.author}</strong>
          </div>
          <div className="tn-content">
            <div className="tn-muted">
              #{i + 1} · {formatDateTime(Date.parse(p.at), computer.timeZone)}
              <button className="link-btn" onClick={() => setQuote(`[quote=${p.author}]${p.text.replace(/\[quote=[^\]]*\][\s\S]*?\[\/quote\]\s*/g, "").slice(0, 300)}[/quote]\n`)}>
                Quote
              </button>
              {p.mine && (
                <button className="link-btn" onClick={() => store.delete("technook.posts", p.id)}>
                  Delete
                </button>
              )}
            </div>
            <PostBody text={p.text} />
            {p.signature && <div className="tn-signature">{p.signature}</div>}
          </div>
        </div>
      ))}
      <ReplyForm key={quote} threadId={t.id} initial={quote} />
    </main>
  );
}

function Profile() {
  usePageTitle("Your profile - TechNook Forums");
  const [signature, setSignature, loaded] = useUserValue("technook-signature", "");
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <main className="tn-main">
      <h1>Your profile</h1>
      <form
        className="tn-reply"
        onSubmit={async (e) => {
          e.preventDefault();
          await setSignature((draft ?? signature).slice(0, 200));
          setDraft(null);
        }}
      >
        <strong>Signature</strong>
        <p className="tn-muted">Shown under every post you make from now on.</p>
        <input className="field" value={draft ?? signature} onChange={(e) => setDraft(e.target.value)} disabled={!loaded} aria-label="Signature" maxLength={200} />
        <button className="btn primary">Save signature</button>
      </form>
    </main>
  );
}

export default function TechNook() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean);
  let page: React.ReactNode;
  if (parts[0] === "board" && parts[1]) page = <Board id={parts[1]} />;
  else if (parts[0] === "thread" && parts[1]) page = <ThreadPage id={parts[1]} />;
  else if (parts[0] === "profile") page = <Profile />;
  else page = <Index />;
  return (
    <div className="technook">
      <header className="tn-header">
        <A href={tn("/")} className="tn-logo">
          TechNook<span>Forums</span>
        </A>
        <nav>
          <A href={tn("/")}>Forums</A>
          <A href={tn("/profile")}>Your profile</A>
        </nav>
      </header>
      {page}
    </div>
  );
}
