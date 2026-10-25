"use client";

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { A, useSite, usePageTitle } from "../SiteContext";
import { chanBoards, threeChanThreads, type ChanPost } from "@/data/community";
import { newId } from "@/lib/ids";
import { formatDateTime, iso } from "@/lib/time";
import { BlobImage, PicturePicker } from "./text";

const tc = (path = "/") => `http://www.3chan.org${path}`;

interface UserChanPost {
  id: string;
  owner: string;
  board: string;
  threadId: string;
  no: number;
  subject?: string;
  text: string;
  imageBlob?: string;
  at: string;
  origin: "user";
}

interface Post extends ChanPost {
  imageBlob?: string;
  mine?: boolean;
  id?: string;
}
interface Thread {
  id: string;
  board: string;
  subject: string;
  posts: Post[];
}

function useThreads(): Thread[] {
  const { now, user } = useSystem();
  const [mine] = useCollection<UserChanPost>("3chan.posts", { allUsers: true });
  const t = now();
  const threads: Thread[] = threeChanThreads
    .map((th) => ({ ...th, posts: th.posts.filter((p) => Date.parse(p.at) <= t) as Post[] }))
    .filter((th) => th.posts.length > 0);
  for (const p of mine.filter((x) => Date.parse(x.at) <= t).sort((a, b) => a.no - b.no)) {
    const post: Post = { no: p.no, name: "Anonymous", text: p.text, at: p.at, imageBlob: p.imageBlob, mine: p.owner === user?.id, id: p.id };
    const th = threads.find((x) => x.id === p.threadId);
    if (th) th.posts.push(post);
    else threads.push({ id: p.threadId, board: p.board, subject: p.subject ?? "", posts: [post] });
  }
  return threads.sort((a, b) => b.posts[b.posts.length - 1].at.localeCompare(a.posts[a.posts.length - 1].at));
}

function nextNo(threads: Thread[]): number {
  return Math.max(30100, ...threads.flatMap((t) => t.posts.map((p) => p.no))) + 1;
}

function PostText({ text }: { text: string }) {
  return (
    <blockquote className="tc-text">
      {text.split("\n").map((line, i) => {
        const quote = /^>>(\d+)/.exec(line);
        if (quote)
          return (
            <div key={i}>
              <a href={`#p${quote[1]}`} className="tc-quotelink" onClick={(e) => (e.preventDefault(), document.getElementById(`p${quote[1]}`)?.scrollIntoView({ block: "center" }))}>
                &gt;&gt;{quote[1]}
              </a>
              {line.slice(quote[0].length)}
            </div>
          );
        if (line.startsWith(">")) return <div key={i} className="tc-green">{line}</div>;
        return <div key={i}>{line || " "}</div>;
      })}
    </blockquote>
  );
}

function PostBox({ p, op, onQuote }: { p: Post; op?: boolean; onQuote: (no: number) => void }) {
  const { computer, store } = useSystem();
  return (
    <div className={op ? "tc-op" : "tc-reply"} id={`p${p.no}`}>
      {p.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.image} alt="" className="tc-image" />
      )}
      {p.imageBlob && <BlobImage blobId={p.imageBlob} alt="" className="tc-image" />}
      <div className="tc-head">
        <span className="tc-name">{p.name}</span> {formatDateTime(Date.parse(p.at), computer.timeZone)}{" "}
        <button className="tc-no" onClick={() => onQuote(p.no)} title="Quote this post">
          No.{p.no}
        </button>
        {p.mine && p.id && (
          <button className="link-btn" onClick={() => store.delete("3chan.posts", p.id!)}>
            [Delete]
          </button>
        )}
      </div>
      <PostText text={p.text} />
    </div>
  );
}

function Form({ board, threadId, threads, initial = "", onDone }: { board: string; threadId?: string; threads: Thread[]; initial?: string; onDone?: (threadId: string) => void }) {
  const { store, user, now, vfs } = useSystem();
  const [subject, setSubject] = useState("");
  const [text, setText] = useState(initial);
  const [fileId, setFileId] = useState("");
  if (initial && !text.startsWith(initial.trim()) && text === "") setText(initial);
  return (
    <form
      className="tc-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user || !vfs || !text.trim()) return;
        let imageBlob: string | undefined;
        if (fileId) {
          imageBlob = newId("blob");
          await store.putBlob(imageBlob, await vfs.readBlob(fileId));
        }
        const tid = threadId ?? newId("thr");
        await store.put<UserChanPost>("3chan.posts", { id: newId("post"), owner: user.id, board, threadId: tid, no: nextNo(threads), subject: threadId ? undefined : subject.trim(), text: text.trim().slice(0, 2000), imageBlob, at: iso(now()), origin: "user" });
        setText("");
        setSubject("");
        setFileId("");
        onDone?.(tid);
      }}
    >
      <table>
        <tbody>
          <tr>
            <td>Name</td>
            <td>Anonymous</td>
          </tr>
          {!threadId && (
            <tr>
              <td>Subject</td>
              <td>
                <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
              </td>
            </tr>
          )}
          <tr>
            <td>Comment</td>
            <td>
              <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Comment" />
            </td>
          </tr>
          <tr>
            <td>File</td>
            <td>
              <PicturePicker value={fileId} onChange={setFileId} />
            </td>
          </tr>
        </tbody>
      </table>
      <button className="btn">{threadId ? "Reply" : "New thread"}</button>
    </form>
  );
}

function Index() {
  usePageTitle("3Chan");
  const threads = useThreads();
  return (
    <div className="tc-index">
      <h1>3Chan</h1>
      <p>Anonymous discussion boards. Be nice, stay on topic, have fun.</p>
      <div className="tc-boards">
        {chanBoards.map((b) => (
          <div key={b.id}>
            <A href={tc(`/${b.id}/`)}>
              /{b.id}/ - {b.title}
            </A>
            <small>
              {b.description} · {threads.filter((t) => t.board === b.id).length} threads
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Board({ board }: { board: string }) {
  const { navigate } = useSite();
  const b = chanBoards.find((x) => x.id === board);
  const threads = useThreads();
  usePageTitle(`/${board}/ - ${b?.title ?? "Board"} - 3Chan`);
  if (!b) return <div className="tc-index"><h1>404 - Board not found</h1></div>;
  const list = threads.filter((t) => t.board === board);
  return (
    <div className="tc-board">
      <h1>
        /{b.id}/ - {b.title}
      </h1>
      <Form board={board} threads={threads} onDone={(tid) => navigate(tc(`/${board}/thread/${tid}`))} />
      <hr />
      {list.map((t) => (
        <div key={t.id} className="tc-thread-preview">
          <PostBox p={t.posts[0]} op onQuote={() => navigate(tc(`/${board}/thread/${t.id}`))} />
          {t.subject && <strong className="tc-subject">{t.subject}</strong>}{" "}
          <A href={tc(`/${board}/thread/${t.id}`)}>[Reply]</A>
          {t.posts.length > 3 && <div className="tc-omitted">{t.posts.length - 3} replies omitted.</div>}
          {t.posts.slice(-2).filter((p) => p !== t.posts[0]).map((p) => (
            <PostBox key={p.no} p={p} onQuote={() => navigate(tc(`/${board}/thread/${t.id}`))} />
          ))}
          <hr />
        </div>
      ))}
      {list.length === 0 && <p className="empty">No threads yet. Start one!</p>}
    </div>
  );
}

function ThreadView({ board, id }: { board: string; id: string }) {
  const threads = useThreads();
  const t = threads.find((x) => x.id === id);
  const [quote, setQuote] = useState("");
  usePageTitle(t ? `/${board}/ - ${t.subject || t.posts[0].text.slice(0, 40)} - 3Chan` : "3Chan");
  if (!t) return <div className="tc-index"><h1>404 - Thread not found</h1><A href={tc(`/${board}/`)}>Return</A></div>;
  return (
    <div className="tc-board">
      <A href={tc(`/${board}/`)}>[Return]</A>
      {t.subject && <h2 className="tc-subject">{t.subject}</h2>}
      {t.posts.map((p, i) => (
        <PostBox key={p.no} p={p} op={i === 0} onQuote={(no) => setQuote(`>>${no}\n`)} />
      ))}
      <hr />
      <Form key={quote} board={board} threadId={t.id} threads={threads} initial={quote} />
    </div>
  );
}

export default function ThreeChan() {
  const { url } = useSite();
  const parts = url.path.split("/").filter(Boolean);
  let page: React.ReactNode;
  if (parts.length === 0) page = <Index />;
  else if (parts[1] === "thread" && parts[2]) page = <ThreadView board={parts[0]} id={parts[2]} />;
  else page = <Board board={parts[0]} />;
  return (
    <div className="threechan">
      <nav className="tc-nav">
        [
        {chanBoards.map((b, i) => (
          <span key={b.id}>
            {i > 0 && " / "}
            <A href={tc(`/${b.id}/`)}>{b.id}</A>
          </span>
        ))}
        ] <A href={tc("/")}>[Home]</A>
      </nav>
      {page}
    </div>
  );
}
