"use client";

// AniWire: anime news and features. Articles, corrections and comments show
// up on their own dates, so a reader in 2012 never sees a 2013 story. Reader
// comments are stored on this computer and shared by every account on it.

import { useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { A, useSite, usePageTitle } from "../SiteContext";
import { ANIWIRE_HOST, articleBySlug, articles, writers, type Article, type ArticleKind } from "@/data/aniwire";
import { catalogue, FORMAT_LABEL, IRON_TO_REQUIEM, titleBySlug, yalAnimeUrl } from "@/data/catalogue";
import { wikiUrl } from "@/data/wiki";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { userHandle } from "../metube/store";
import { Linkified } from "../community/text";

const aw = (path = "/", params?: Record<string, string>) => siteUrl(ANIWIRE_HOST, path, params);
const SECTIONS: { kind: ArticleKind; path: string; label: string }[] = [
  { kind: "News", path: "news", label: "News" },
  { kind: "Feature", path: "features", label: "Features" },
  { kind: "Review", path: "reviews", label: "Reviews" },
  { kind: "Interview", path: "interviews", label: "Interviews" },
];
const tagPath = (tag: string) => aw(`/tag/${encodeURIComponent(tag.toLowerCase())}`);

interface Comment {
  id: string;
  owner: string;
  articleId: string;
  name: string;
  text: string;
  at: string;
  origin: "user";
}

/** Articles published by the computer's date, newest first. */
function usePublished(): Article[] {
  const { now } = useSystem();
  const t = now();
  return articles.filter((a) => Date.parse(a.publishedAt) <= t).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function useDate() {
  const { computer } = useSystem();
  return (at: string) => formatDate(Date.parse(at), computer.timeZone);
}

function Shell({ children }: { children: React.ReactNode }) {
  const { url, navigate } = useSite();
  const { openApp } = useSystem();
  const [q, setQ] = useState(url.path === "/search" ? (url.params.get("q") ?? "") : "");
  const published = usePublished();
  const tags = [...new Set(published.flatMap((a) => a.tags))].slice(0, 14);
  return (
    <div className="aniwire">
      <header className="aw-mast">
        <A href={aw("/")} className="aw-logo">
          Ani<span>Wire</span>
        </A>
        <span className="aw-tagline">Anime news, features and reviews</span>
        <form
          className="aw-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (q.trim()) navigate(aw("/search", { q: q.trim() }));
          }}
        >
          <input className="field" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search AniWire" aria-label="Search AniWire" />
        </form>
      </header>
      <nav className="aw-nav">
        <A href={aw("/")}>Home</A>
        {SECTIONS.map((s) => (
          <A key={s.path} href={aw(`/${s.path}`)}>
            {s.label}
          </A>
        ))}
      </nav>
      <div className="aw-body">
        <main className="aw-main">{children}</main>
        <aside className="aw-side">
          <h3>Popular tags</h3>
          <div className="aw-tags">
            {tags.map((t) => (
              <A key={t} href={tagPath(t)}>
                {t}
              </A>
            ))}
          </div>
          <h3>Our writers</h3>
          <ul>
            {Object.entries(writers).map(([name, about]) => (
              <li key={name}>
                <A href={aw(`/author/${encodeURIComponent(name)}`)}>{name}</A>
                <small>{about}</small>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      <footer className="aw-foot">
        AniWire · Corrections are noted at the end of each article · Be kind in the comments ·{" "}
        <button className="link-btn" onClick={() => openApp("newsreader", { subscribe: aw("/rss") })}>
          Follow AniWire in News Reader
        </button>
      </footer>
    </div>
  );
}

function ArticleRow({ a }: { a: Article }) {
  const date = useDate();
  return (
    <div className="aw-row">
      {a.image && (
        <A href={aw(`/article/${a.slug}`)} className="aw-thumb" tabIndex={-1} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.image} alt="" />
        </A>
      )}
      <div>
        <span className="aw-kind">{a.kind}</span>
        <A href={aw(`/article/${a.slug}`)} className="aw-row-title">
          {a.title}
        </A>
        <p>{a.dek}</p>
        <small>
          {a.author} · {date(a.publishedAt)}
        </small>
      </div>
    </div>
  );
}

function List({ title, items, empty }: { title: string; items: Article[]; empty: string }) {
  return (
    <>
      <h1 className="aw-h1">{title}</h1>
      {items.map((a) => (
        <ArticleRow key={a.id} a={a} />
      ))}
      {items.length === 0 && <p className="empty">{empty}</p>}
    </>
  );
}

function Home() {
  usePageTitle("AniWire - Anime news, features and reviews");
  const published = usePublished();
  const date = useDate();
  const [lead, ...rest] = published;
  return (
    <Shell>
      {lead ? (
        <A href={aw(`/article/${lead.slug}`)} className="aw-lead">
          {lead.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lead.image} alt="" />
          )}
          <div>
            <span className="aw-kind">{lead.kind}</span>
            <h1>{lead.title}</h1>
            <p>{lead.dek}</p>
            <small>
              {lead.author} · {date(lead.publishedAt)}
            </small>
          </div>
        </A>
      ) : (
        <p className="empty">No stories yet.</p>
      )}
      <h2 className="aw-h2">Latest</h2>
      {rest.slice(0, 8).map((a) => (
        <ArticleRow key={a.id} a={a} />
      ))}
    </Shell>
  );
}

/** "@catalogue" in an article body expands to the whole catalogue list. */
function CatalogueList() {
  return (
    <ul className="aw-catalogue">
      {catalogue.map((t) => (
        <li key={t.slug}>
          <A href={yalAnimeUrl(t)}>{t.title}</A> ({t.years}, {FORMAT_LABEL[t.format]}
          {t.shape ? `, ${t.shape}` : ""}): {t.description}
        </li>
      ))}
    </ul>
  );
}

function Related({ slugs }: { slugs: string[] }) {
  return (
    <ul className="aw-related">
      {slugs.map((slug) => {
        if (slug === "iron-to-requiem") {
          return (
            <li key={slug}>
              <strong>{IRON_TO_REQUIEM.title}</strong> · <A href={yalAnimeUrl(IRON_TO_REQUIEM)}>YourAnimeList</A> · <A href={wikiUrl(IRON_TO_REQUIEM.title)}>AniFanWiki</A>
            </li>
          );
        }
        const t = titleBySlug(slug);
        if (!t) return null;
        return (
          <li key={slug}>
            <strong>{t.title}</strong> ({t.years}) · <A href={yalAnimeUrl(t)}>YourAnimeList</A> · <A href={wikiUrl(t.title)}>AniFanWiki</A>
          </li>
        );
      })}
    </ul>
  );
}

function ArticlePage({ slug }: { slug: string }) {
  const { now, store, user } = useSystem();
  const date = useDate();
  const [userComments] = useCollection<Comment>("aniwire.comments", { allUsers: true });
  const [text, setText] = useState("");
  const t = now();
  const a = articleBySlug(slug);
  const live = a && Date.parse(a.publishedAt) <= t ? a : null;
  usePageTitle(live ? `${live.title} - AniWire` : "Article not found - AniWire");
  if (!live) {
    return (
      <Shell>
        <h1 className="aw-h1">Article not found</h1>
        <p>We couldn&apos;t find that article. Try the search box, or head back to the <A href={aw("/")}>front page</A>.</p>
      </Shell>
    );
  }
  const corrections = (live.corrections ?? []).filter((c) => Date.parse(c.at) <= t);
  const comments = [
    ...(live.comments ?? []).filter((c) => Date.parse(c.at) <= t).map((c, i) => ({ ...c, id: `${live.id}-${i}`, mine: false })),
    ...userComments.filter((c) => c.articleId === live.id && Date.parse(c.at) <= t).map((c) => ({ ...c, mine: c.owner === user?.id })),
  ].sort((x, y) => x.at.localeCompare(y.at));
  return (
    <Shell>
      <article className="aw-article">
        <span className="aw-kind">{live.kind}</span>
        <h1>{live.title}</h1>
        <p className="aw-dek">{live.dek}</p>
        <div className="aw-byline">
          By <A href={aw(`/author/${encodeURIComponent(live.author)}`)}>{live.author}</A> · {date(live.publishedAt)}
        </div>
        {live.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="aw-hero" src={live.image} alt="" />
        )}
        {live.body.map((p, i) =>
          p === "@catalogue" ? (
            <CatalogueList key={i} />
          ) : p.startsWith("Q: ") ? (
            <p key={i} className="aw-q">
              {p.slice(3)}
            </p>
          ) : (
            <p key={i}>{p}</p>
          ),
        )}
        {corrections.map((c) => (
          <p key={c.at} className="aw-correction">
            <strong>Correction, {date(c.at)}:</strong> {c.text}
          </p>
        ))}
        <div className="aw-tagline-row">
          Tags:{" "}
          {live.tags.map((tag) => (
            <A key={tag} href={tagPath(tag)}>
              {tag}
            </A>
          ))}
        </div>
        {live.related.length > 0 && (
          <section>
            <h2 className="aw-h2">Titles in this story</h2>
            <Related slugs={live.related} />
          </section>
        )}
      </article>
      <section className="aw-comments">
        <h2 className="aw-h2">Comments ({comments.length})</h2>
        {comments.map((c) => (
          <div key={c.id} className="aw-comment">
            <strong>{c.name}</strong> <small>{date(c.at)}</small>
            {c.mine && (
              <button className="link-btn" onClick={() => store.delete("aniwire.comments", c.id)}>
                Delete
              </button>
            )}
            <div>
              <Linkified text={c.text} />
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="empty">No comments yet. Say hello!</p>}
        {user ? (
          <form
            className="aw-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!text.trim()) return;
              await store.put<Comment>("aniwire.comments", { id: newId("cmt"), owner: user.id, articleId: live.id, name: userHandle(user.name), text: text.trim().slice(0, 1500), at: iso(now()), origin: "user" });
              setText("");
            }}
          >
            <textarea className="field" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Join the conversation" aria-label="Comment" maxLength={1500} />
            <button className="btn primary" disabled={!text.trim()}>
              Post comment
            </button>
          </form>
        ) : null}
      </section>
    </Shell>
  );
}

function SearchPage() {
  const { url } = useSite();
  const q = (url.params.get("q") ?? "").trim().toLowerCase();
  const items = usePublished().filter((a) => q && [a.title, a.dek, ...a.body, ...a.tags].join(" ").toLowerCase().includes(q));
  usePageTitle(`Search: ${q} - AniWire`);
  return (
    <Shell>
      <List title={`Search results for "${q}"`} items={items} empty="Nothing matched. Try another word." />
    </Shell>
  );
}

export default function AniWire() {
  const { url } = useSite();
  const published = usePublished();
  const parts = url.path.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "article" && parts[1]) return <ArticlePage key={parts[1]} slug={parts[1]} />;
  if (parts[0] === "search") return <SearchPage />;
  if (parts[0] === "tag" && parts[1]) return <TagPage tag={parts[1]} items={published.filter((a) => a.tags.some((t) => t.toLowerCase() === parts[1]))} />;
  if (parts[0] === "author" && parts[1]) return <AuthorPage name={parts[1]} items={published.filter((a) => a.author === parts[1])} />;
  const section = SECTIONS.find((s) => s.path === parts[0]);
  if (section) return <SectionPage label={section.label} items={published.filter((a) => a.kind === section.kind)} />;
  return <Home />;
}

function TagPage({ tag, items }: { tag: string; items: Article[] }) {
  usePageTitle(`${tag} - AniWire`);
  return (
    <Shell>
      <List title={`Tagged: ${tag}`} items={items} empty="No stories with this tag yet." />
    </Shell>
  );
}

function AuthorPage({ name, items }: { name: string; items: Article[] }) {
  usePageTitle(`${name} - AniWire`);
  return (
    <Shell>
      <List title={name} items={items} empty="No stories yet." />
      {writers[name] && <p className="aw-muted">{writers[name]}</p>}
    </Shell>
  );
}

function SectionPage({ label, items }: { label: string; items: Article[] }) {
  usePageTitle(`${label} - AniWire`);
  return (
    <Shell>
      <List title={label} items={items} empty="Nothing here yet. Check back soon!" />
    </Shell>
  );
}
