"use client";

// AniFanWiki: the anime encyclopedia anyone can edit. Every save is a new
// revision stored on this computer (shared by all its accounts), so pages
// have a real history, diffs and restores. Starting pages and their history
// come from data/wiki.ts and unfold with the computer's date.

import { createContext, useContext, useMemo, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { A, useSite, usePageTitle } from "../SiteContext";
import { infoboxRowsAt, WIKI_HOST, WIKI_NAME, wikiPageByTitle, wikiRevisions, wikiUrl, type TalkPost } from "@/data/wiki";
import { diffLines, historyOf, isTalk, normalizeTitle, parseWiki, searchPages, subjectOf, talkOf, type Block, type Inline, type Revision } from "@/lib/wiki";
import { newId } from "@/lib/ids";
import { formatDate, formatTime, iso } from "@/lib/time";
import { userHandle } from "../metube/store";

interface UserRevision extends Revision {
  owner: string;
  origin: "user";
}
interface UserTalk {
  id: string;
  owner: string;
  title: string;
  author: string;
  text: string;
  at: string;
  origin: "user";
}

/** All revisions (archive and saved here) and the pages that exist by the computer's date. */
function useWikiData() {
  const { now } = useSystem();
  const [saved, , loaded] = useCollection<UserRevision>("wiki.revisions", { allUsers: true });
  const t = now();
  return useMemo(() => {
    const all: Revision[] = [...wikiRevisions, ...saved.map((r) => ({ ...r, user: true }))];
    const history = (title: string) => historyOf(title, all, t);
    const titles = [...new Set(all.filter((r) => Date.parse(r.at) <= t).map((r) => normalizeTitle(r.title)))].sort((a, b) => a.localeCompare(b));
    const exists = (title: string) => titles.includes(normalizeTitle(title));
    return { all, t, history, titles, exists, loaded, current: (title: string) => history(title).at(-1) };
  }, [saved, t, loaded]);
}

// Loaded once for the whole site, so every view sees the same saved edits.
const WikiCtx = createContext<ReturnType<typeof useWikiData> | null>(null);
function useWiki() {
  const wiki = useContext(WikiCtx);
  if (!wiki) throw new Error("useWiki outside AniFanWiki");
  return wiki;
}

function useWhen() {
  const { computer } = useSystem();
  return (at: string) => `${formatTime(Date.parse(at), computer.timeZone)}, ${formatDate(Date.parse(at), computer.timeZone)}`;
}

function Spoiler({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <span className={`fw-spoiler${shown ? " shown" : ""}`} role="button" tabIndex={0} title={shown ? "" : "Spoiler: click to show"} onClick={() => setShown(true)} onKeyDown={(e) => e.key === "Enter" && setShown(true)}>
      {children}
    </span>
  );
}

function InlineView({ nodes, exists }: { nodes: Inline[]; exists: (t: string) => boolean }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.kind === "text") return <span key={i}>{n.text}</span>;
        if (n.kind === "bold") return <b key={i}><InlineView nodes={n.children} exists={exists} /></b>;
        if (n.kind === "italic") return <i key={i}><InlineView nodes={n.children} exists={exists} /></i>;
        if (n.kind === "spoiler") return <Spoiler key={i}><InlineView nodes={n.children} exists={exists} /></Spoiler>;
        if (n.kind === "external")
          return (
            <A key={i} href={n.href} className="fw-ext">
              {n.label}
            </A>
          );
        const there = exists(n.target);
        return (
          <A key={i} href={there ? wikiUrl(n.target) : wikiUrl(n.target, { action: "edit" })} className={there ? undefined : "fw-new"} title={there ? n.target : `${n.target} (page does not exist)`}>
            {n.label}
          </A>
        );
      })}
    </>
  );
}

function WikiText({ text, exists, toc = true }: { text: string; exists: (t: string) => boolean; toc?: boolean }) {
  const blocks: Block[] = parseWiki(text);
  const headings = blocks.filter((b): b is Extract<Block, { kind: "heading" }> => b.kind === "heading");
  return (
    <div className="fw-text">
      {toc && headings.length >= 3 && (
        <div className="fw-toc">
          <strong>Contents</strong>
          <ol>
            {headings.map((h) => (
              <li key={h.anchor} className={h.level === 3 ? "sub" : ""}>
                <a href={`#${h.anchor}`} onClick={(e) => (e.preventDefault(), document.getElementById(`fw-${h.anchor}`)?.scrollIntoView({ block: "start" }))}>
                  {h.text}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
      {blocks.map((b, i) =>
        b.kind === "heading" ? (
          b.level === 2 ? (
            <h2 key={i} id={`fw-${b.anchor}`}>
              {b.text}
            </h2>
          ) : (
            <h3 key={i} id={`fw-${b.anchor}`}>
              {b.text}
            </h3>
          )
        ) : b.kind === "para" ? (
          <p key={i}>
            <InlineView nodes={b.inline} exists={exists} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>
                <InlineView nodes={it} exists={exists} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}

function Shell({ title, tabs, children }: { title: string; tabs?: React.ReactNode; children: React.ReactNode }) {
  const { navigate } = useSite();
  const { openApp } = useSystem();
  const [q, setQ] = useState("");
  return (
    <div className="anifanwiki">
      <aside className="fw-side">
        <A href={wikiUrl("Main Page")} className="fw-logo">
          <span aria-hidden>✦</span>
          {WIKI_NAME}
          <small>the anime encyclopedia</small>
        </A>
        <nav>
          <A href={wikiUrl("Main Page")}>Main page</A>
          <A href={wikiUrl("Special:RecentChanges")}>Recent changes</A>
          <A href={wikiUrl("Special:AllPages")}>All pages</A>
          <A href={wikiUrl("Help:Editing")}>Help</A>
          <button className="link-btn fw-follow" onClick={() => openApp("newsreader", { subscribe: `http://${WIKI_HOST}/rss` })}>
            Follow recent changes
          </button>
        </nav>
      </aside>
      <div className="fw-page">
        <div className="fw-top">
          <div className="fw-tabs">{tabs}</div>
          <form
            className="fw-search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) navigate(wikiUrl("Special:Search", { q: q.trim() }));
            }}
          >
            <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${WIKI_NAME}`} aria-label={`Search ${WIKI_NAME}`} />
          </form>
        </div>
        <main className="fw-content">
          <h1 className="fw-title">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}

type View = "read" | "edit" | "history" | "talk";

function Tabs({ title, view }: { title: string; view: View }) {
  const subject = subjectOf(title);
  return (
    <>
      <span className="fw-tabgroup">
        <A href={wikiUrl(subject)} className={view !== "talk" ? "on" : ""}>
          {subject.startsWith("Help:") ? "Help page" : "Article"}
        </A>
        <A href={wikiUrl(talkOf(subject))} className={view === "talk" ? "on" : ""}>
          Talk
        </A>
      </span>
      {view !== "talk" && (
        <span className="fw-tabgroup">
          <A href={wikiUrl(subject)} className={view === "read" ? "on" : ""}>
            Read
          </A>
          <A href={wikiUrl(subject, { action: "edit" })} className={view === "edit" ? "on" : ""}>
            {wikiPageByTitle(subject)?.protected ? "View source" : "Edit"}
          </A>
          <A href={wikiUrl(subject, { action: "history" })} className={view === "history" ? "on" : ""}>
            View history
          </A>
        </span>
      )}
    </>
  );
}

function Infobox({ title, t }: { title: string; t: number }) {
  const page = wikiPageByTitle(title);
  const box = page?.infobox;
  if (!box) return null;
  const rows = infoboxRowsAt(page, t);
  return (
    <table className="fw-infobox">
      <caption>{box.heading}</caption>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <th>{r.label}</th>
            <td>{r.href ? <A href={r.href}>{r.value}</A> : r.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReadPage({ title }: { title: string }) {
  const wiki = useWiki();
  const when = useWhen();
  const { url } = useSite();
  const oldid = url.params.get("oldid");
  const history = wiki.history(title);
  const rev = oldid ? history.find((r) => r.id === oldid) : history.at(-1);
  usePageTitle(`${title} - ${WIKI_NAME}`);
  if (!history.length) return <MissingPage title={title} />;
  if (!rev) return <Shell title={title} tabs={<Tabs title={title} view="read" />}><p>That revision isn&apos;t in this page&apos;s history.</p></Shell>;
  const latest = rev.id === history.at(-1)!.id;
  return (
    <Shell title={title} tabs={<Tabs title={title} view="read" />}>
      <div className="fw-sub">From {WIKI_NAME}, the anime encyclopedia anyone can edit</div>
      {!latest && (
        <div className="fw-notice">
          This is an old revision of this page, as edited by <b>{rev.editor}</b> at {when(rev.at)}. It may differ from the <A href={wikiUrl(title)}>current version</A>.
        </div>
      )}
      <Infobox title={title} t={wiki.t} />
      <WikiText text={rev.text} exists={wiki.exists} />
      <div className="fw-foot">
        This page was last edited at {when(history.at(-1)!.at)} by {history.at(-1)!.editor}.
      </div>
    </Shell>
  );
}

function MissingPage({ title }: { title: string }) {
  usePageTitle(`${title} - ${WIKI_NAME}`);
  return (
    <Shell title={title} tabs={<Tabs title={title} view="read" />}>
      <div className="fw-notice">
        {WIKI_NAME} doesn&apos;t have a page with this exact name yet. You can <A href={wikiUrl(title, { action: "edit" })}>create it</A>, or{" "}
        <A href={wikiUrl("Special:Search", { q: title })}>search for {title}</A> in other pages.
      </div>
    </Shell>
  );
}

function EditPage({ title }: { title: string }) {
  const wiki = useWiki();
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const current = wiki.current(title);
  const page = wikiPageByTitle(title);
  const [text, setText] = useState(current?.text ?? "");
  const [summary, setSummary] = useState("");
  const [preview, setPreview] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  usePageTitle(`${current ? "Editing" : "Creating"} ${title} - ${WIKI_NAME}`);
  if (page?.protected) {
    return (
      <Shell title={`View source for ${title}`} tabs={<Tabs title={title} view="edit" />}>
        <div className="fw-notice">
          This page is protected, so only administrators can edit it. You can suggest a change on the <A href={wikiUrl(talkOf(title))}>talk page</A>.
        </div>
        <textarea className="field fw-editor" value={current?.text ?? ""} readOnly rows={18} aria-label="Page source" />
      </Shell>
    );
  }
  if (!user) return null;
  const save = async () => {
    if (!text.trim()) return setNote("A page needs some text before it can be saved.");
    if (current && text === current.text) return setNote("There are no changes to save.");
    await store.put<UserRevision>("wiki.revisions", {
      id: newId("page"),
      owner: user.id,
      title: normalizeTitle(title),
      at: iso(now()),
      editor: userHandle(user.name),
      summary: summary.trim().slice(0, 200) || (current ? "Edited the page" : "New page"),
      text: text.slice(0, 50000),
      origin: "user",
    });
    navigate(wikiUrl(title));
  };
  return (
    <Shell title={`${current ? "Editing" : "Creating"} ${title}`} tabs={<Tabs title={title} view="edit" />}>
      {!current && <div className="fw-notice">You&apos;re creating a new page. Please add only what you can back up with a reliable source.</div>}
      {preview && (
        <div className="fw-preview">
          <div className="fw-preview-head">Preview (not saved yet)</div>
          <WikiText text={text} exists={wiki.exists} />
        </div>
      )}
      <textarea className="field fw-editor" value={text} onChange={(e) => (setText(e.target.value), setNote(null))} rows={20} aria-label="Page text" />
      <label className="fw-summary">
        Summary: <input className="field" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Briefly describe your changes" aria-label="Edit summary" maxLength={200} />
      </label>
      {note && <p className="fw-warn">{note}</p>}
      <div className="fw-buttons">
        <button className="btn primary" onClick={save}>
          Save page
        </button>
        <button className="btn" onClick={() => setPreview(true)}>
          Show preview
        </button>
        <A href={wikiUrl(title)} className="btn">
          Cancel
        </A>
        <A href={wikiUrl("Help:Editing")}>Editing help</A>
      </div>
    </Shell>
  );
}

function HistoryPage({ title }: { title: string }) {
  const wiki = useWiki();
  const when = useWhen();
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const history = wiki.history(title);
  const page = wikiPageByTitle(title);
  usePageTitle(`${title}: Revision history - ${WIKI_NAME}`);
  if (!history.length) return <MissingPage title={title} />;
  const latest = history.at(-1)!;
  const restore = async (r: Revision) => {
    if (!user) return;
    await store.put<UserRevision>("wiki.revisions", { id: newId("page"), owner: user.id, title: normalizeTitle(title), at: iso(now()), editor: userHandle(user.name), summary: `Restored the version of ${when(r.at)} by ${r.editor}`, text: r.text, origin: "user" });
    navigate(wikiUrl(title));
  };
  return (
    <Shell title={`${title}: Revision history`} tabs={<Tabs title={title} view="history" />}>
      <p className="fw-sub">Newest first. Compare a version with the current one (cur) or the one before it (prev).</p>
      <ul className="fw-history">
        {[...history].reverse().map((r, i, list) => {
          const prev = list[i + 1];
          return (
            <li key={r.id}>
              ({r.id === latest.id ? "cur" : <A href={wikiUrl(title, { diff: latest.id, oldid: r.id })}>cur</A>} | {prev ? <A href={wikiUrl(title, { diff: r.id, oldid: prev.id })}>prev</A> : "prev"}){" "}
              <A href={wikiUrl(title, { oldid: r.id })}>{when(r.at)}</A> · {r.editor} · <span className="fw-muted">({r.text.length.toLocaleString("en-US")} bytes)</span> <i>({r.summary})</i>
              {r.id !== latest.id && !page?.protected && user && (
                <button className="link-btn" onClick={() => restore(r)}>
                  restore this version
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function DiffPage({ title, from, to }: { title: string; from: string; to: string }) {
  const wiki = useWiki();
  const when = useWhen();
  const history = wiki.history(title);
  const a = history.find((r) => r.id === from);
  const b = history.find((r) => r.id === to);
  usePageTitle(`${title}: Difference between revisions - ${WIKI_NAME}`);
  if (!a || !b) return <Shell title={title} tabs={<Tabs title={title} view="history" />}><p>Those revisions aren&apos;t in this page&apos;s history.</p></Shell>;
  const lines = diffLines(a.text, b.text);
  return (
    <Shell title={`${title}: Difference between revisions`} tabs={<Tabs title={title} view="history" />}>
      <div className="fw-diffhead">
        <div>
          <b>Revision as of {when(a.at)}</b>
          <br />
          {a.editor} <i>({a.summary})</i>
        </div>
        <div>
          <b>Revision as of {when(b.at)}</b>
          <br />
          {b.editor} <i>({b.summary})</i>
        </div>
      </div>
      <pre className="fw-diff">
        {lines.map((l, i) => (
          <div key={i} className={l.kind}>
            {l.kind === "add" ? "+ " : l.kind === "del" ? "− " : "  "}
            {l.text || " "}
          </div>
        ))}
      </pre>
    </Shell>
  );
}

function TalkPage({ subject }: { subject: string }) {
  const { store, user, now } = useSystem();
  const when = useWhen();
  const wiki = useWiki();
  const [posts] = useCollection<UserTalk>("wiki.talk", { allUsers: true });
  const [text, setText] = useState("");
  const title = talkOf(subject);
  usePageTitle(`${title} - ${WIKI_NAME}`);
  const t = wiki.t;
  const archive: (TalkPost & { id: string; mine: boolean })[] = (wikiPageByTitle(subject)?.talk ?? []).filter((p) => Date.parse(p.at) <= t).map((p, i) => ({ ...p, id: `a${i}`, mine: false }));
  const mine = posts.filter((p) => normalizeTitle(p.title) === subject && Date.parse(p.at) <= t).map((p) => ({ ...p, mine: p.owner === user?.id }));
  const all = [...archive, ...mine].sort((x, y) => x.at.localeCompare(y.at));
  return (
    <Shell title={title} tabs={<Tabs title={title} view="talk" />}>
      <p className="fw-sub">
        This is the talk page for discussing improvements to <A href={wikiUrl(subject)}>{subject}</A>. Please be friendly, and sign off with your name (it&apos;s added for you).
      </p>
      {all.map((p) => (
        <div key={p.id} className="fw-talk">
          <p>{p.text}</p>
          <div className="fw-muted">
            — {p.author}, {when(p.at)}
            {p.mine && (
              <button className="link-btn" onClick={() => store.delete("wiki.talk", p.id)}>
                delete
              </button>
            )}
          </div>
        </div>
      ))}
      {all.length === 0 && <p className="empty">No discussion yet.</p>}
      {user && (
        <form
          className="fw-talkform"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            await store.put<UserTalk>("wiki.talk", { id: newId("post"), owner: user.id, title: subject, author: userHandle(user.name), text: text.trim().slice(0, 3000), at: iso(now()), origin: "user" });
            setText("");
          }}
        >
          <textarea className="field" rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Add to the discussion" placeholder="Add to the discussion" maxLength={3000} />
          <button className="btn primary" disabled={!text.trim()}>
            Post
          </button>
        </form>
      )}
    </Shell>
  );
}

function RecentChanges() {
  const wiki = useWiki();
  const when = useWhen();
  usePageTitle(`Recent changes - ${WIKI_NAME}`);
  const recent = wiki.all.filter((r) => Date.parse(r.at) <= wiki.t).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 50);
  return (
    <Shell title="Recent changes">
      <ul className="fw-history">
        {recent.map((r) => {
          const h = wiki.history(r.title);
          const i = h.findIndex((x) => x.id === r.id);
          return (
            <li key={r.id}>
              ({i > 0 ? <A href={wikiUrl(r.title, { diff: r.id, oldid: h[i - 1].id })}>diff</A> : "new"} | <A href={wikiUrl(r.title, { action: "history" })}>hist</A>) <A href={wikiUrl(r.title)}>{normalizeTitle(r.title)}</A>; {when(r.at)} · {r.editor} <i>({r.summary})</i>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function AllPages() {
  const wiki = useWiki();
  usePageTitle(`All pages - ${WIKI_NAME}`);
  return (
    <Shell title="All pages">
      <ul className="fw-allpages">
        {wiki.titles.map((t) => (
          <li key={t}>
            <A href={wikiUrl(t)}>{t}</A>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function SearchPage() {
  const wiki = useWiki();
  const { url } = useSite();
  const q = url.params.get("q") ?? "";
  usePageTitle(`Search results for "${q}" - ${WIKI_NAME}`);
  const pages = wiki.titles.map((title) => ({ title, text: wiki.current(title)!.text }));
  const results = searchPages(pages, q);
  const exact = wiki.exists(q) ? normalizeTitle(q) : null;
  return (
    <Shell title="Search results">
      {exact ? (
        <p>
          There is a page named <A href={wikiUrl(exact)}>{exact}</A> on {WIKI_NAME}.
        </p>
      ) : (
        q.trim() && (
          <p>
            Create the page <A href={wikiUrl(q, { action: "edit" })} className="fw-new">{normalizeTitle(q)}</A> on {WIKI_NAME}?
          </p>
        )
      )}
      <ul className="fw-results">
        {results.map((r) => (
          <li key={r.title}>
            <A href={wikiUrl(r.title)}>{r.title}</A>
            <div>{r.snippet}</div>
          </li>
        ))}
      </ul>
      {results.length === 0 && <p className="empty">No pages matched.</p>}
    </Shell>
  );
}

export default function AniFanWiki() {
  const wiki = useWikiData();
  if (!wiki.loaded) {
    return (
      <Shell title={WIKI_NAME}>
        <p className="fw-muted">Loading…</p>
      </Shell>
    );
  }
  return (
    <WikiCtx.Provider value={wiki}>
      <Route />
    </WikiCtx.Provider>
  );
}

function Route() {
  const { url } = useSite();
  const raw = url.path.startsWith("/wiki/") ? decodeURIComponent(url.path.slice(6)) : "Main Page";
  const title = normalizeTitle(raw) || "Main Page";
  if (title === "Special:RecentChanges") return <RecentChanges />;
  if (title === "Special:AllPages") return <AllPages />;
  if (title === "Special:Search") return <SearchPage />;
  if (isTalk(title)) return <TalkPage key={title} subject={subjectOf(title)} />;
  const action = url.params.get("action");
  const diff = url.params.get("diff");
  const oldid = url.params.get("oldid");
  if (diff && oldid) return <DiffPage key={`${diff}-${oldid}`} title={title} from={oldid} to={diff} />;
  if (action === "edit") return <EditPage key={title} title={title} />;
  if (action === "history") return <HistoryPage key={title} title={title} />;
  return <ReadPage key={`${title}-${oldid ?? ""}`} title={title} />;
}
