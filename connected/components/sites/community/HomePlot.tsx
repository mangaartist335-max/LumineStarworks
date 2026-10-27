"use client";

// HomePlot: free personal homepages with guestbooks and hit counters.
// Anyone with an account can make a page and sign other people's guestbooks.

import { useEffect, useState } from "react";
import { useSystem } from "@/components/system/system";
import { useCollection } from "@/components/system/hooks";
import { avatarUrl } from "@/components/system/defaults";
import { A, useSite, usePageTitle } from "../SiteContext";
import { archiveHomepages, HOME_THEMES, HOMEPLOT_HOST, type HomeSection, type HomeTheme } from "@/data/homepages";
import { newId } from "@/lib/ids";
import { formatDate, iso } from "@/lib/time";
import { siteUrl } from "@/lib/web/url";
import { userHandle } from "../metube/store";
import { BlobImage, Linkified, PicturePicker } from "./text";

const hp = (path = "/") => siteUrl(HOMEPLOT_HOST, path);

interface UserPage {
  id: string;
  owner: string;
  title: string;
  tagline: string;
  about: string;
  themeName: string;
  links: { label: string; url: string }[];
  pictureBlob?: string;
  createdAt: string;
  updatedAt: string;
  origin: "user";
}
interface Signature {
  id: string;
  owner: string;
  page: string;
  name: string;
  from?: string;
  message: string;
  at: string;
  origin: "user";
}
interface Visits {
  id: string;
  count: number;
}

interface Page {
  slug: string;
  owner: string;
  ownerId?: string;
  title: string;
  tagline: string;
  avatar?: string;
  pictureBlob?: string;
  createdAt: string;
  theme: HomeTheme;
  sections: HomeSection[];
  links: { label: string; url: string }[];
  baseVisits: number;
  guestbook: { id: string; name: string; from?: string; message: string; at: string; mine?: boolean }[];
  user: boolean;
}

function usePages(): Page[] {
  const { now, user, users } = useSystem();
  const [userPages] = useCollection<UserPage>("homeplot.pages", { allUsers: true });
  const [signatures] = useCollection<Signature>("homeplot.guestbook", { allUsers: true });
  const t = now();
  const signed = (slug: string) => signatures.filter((s) => s.page === slug && Date.parse(s.at) <= t).map((s) => ({ ...s, mine: s.owner === user?.id }));
  const pages: Page[] = archiveHomepages
    .filter((p) => Date.parse(p.createdAt) <= t)
    .map((p) => ({
      ...p,
      sections: p.sections.filter((s) => !s.at || Date.parse(s.at) <= t),
      guestbook: [...p.guestbook.filter((g) => Date.parse(g.at) <= t).map((g, i) => ({ ...g, id: `${p.slug}-${i}` })), ...signed(p.slug)].sort((a, b) => b.at.localeCompare(a.at)),
      user: false,
    }));
  for (const u of userPages) {
    if (Date.parse(u.createdAt) > t) continue;
    const owner = users.find((x) => x.id === u.owner);
    pages.push({
      slug: u.id,
      owner: owner?.name ?? u.id,
      ownerId: u.owner,
      title: u.title,
      tagline: u.tagline,
      avatar: owner ? avatarUrl(owner.picture) : undefined,
      pictureBlob: u.pictureBlob,
      createdAt: u.createdAt,
      theme: HOME_THEMES.find((x) => x.name === u.themeName)?.theme ?? HOME_THEMES[0].theme,
      sections: u.about ? [{ heading: "About me", body: u.about }] : [],
      links: u.links,
      baseVisits: 0,
      guestbook: signed(u.id).sort((a, b) => b.at.localeCompare(a.at)),
      user: true,
    });
  }
  return pages;
}

function Directory() {
  usePageTitle("HomePlot - Free personal homepages");
  const { user, computer } = useSystem();
  const pages = usePages();
  const mine = user ? pages.find((p) => p.ownerId === user.id) : undefined;
  const newest = [...pages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="homeplot">
      <header className="hp-header">
        <A href={hp("/")} className="hp-logo">
          🏡 HomePlot
        </A>
        <span>Free personal homepages since 2004</span>
      </header>
      <main className="hp-main">
        <section className="hp-hero">
          <h1>Your own little corner of the web</h1>
          <p>Make a free homepage with a guestbook, a hit counter and all your favourite links. No experience needed!</p>
          {user &&
            (mine ? (
              <div className="hp-row">
                <A href={hp(`/~${mine.slug}`)} className="hp-btn">
                  Visit your page
                </A>
                <A href={hp("/edit")} className="hp-btn secondary">
                  Edit your page
                </A>
              </div>
            ) : (
              <A href={hp("/edit")} className="hp-btn">
                Make my homepage
              </A>
            ))}
        </section>
        <h2>Newest pages</h2>
        <ul className="hp-dir">
          {newest.map((p) => (
            <li key={p.slug}>
              <A href={hp(`/~${p.slug}`)}>
                <strong>{p.title}</strong>
              </A>
              <div className="hp-muted">
                {p.tagline} · by {p.owner} · since {formatDate(Date.parse(p.createdAt), computer.timeZone)} · {p.guestbook.length} guestbook {p.guestbook.length === 1 ? "entry" : "entries"}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}

function Counter({ slug, base }: { slug: string; base: number }) {
  const { store } = useSystem();
  const [visits] = useCollection<Visits>("homeplot.visits", { allUsers: true });
  // Count this visit once.
  useEffect(() => {
    void store.get<Visits>("homeplot.visits", slug).then((v) => store.put<Visits>("homeplot.visits", { id: slug, count: (v?.count ?? 0) + 1 }));
  }, [store, slug]);
  const n = base + (visits.find((v) => v.id === slug)?.count ?? 0);
  return (
    <div className="hp-counter" aria-label={`${n} visitors`}>
      You are visitor number{" "}
      {String(n)
        .padStart(6, "0")
        .split("")
        .map((d, i) => (
          <span key={i}>{d}</span>
        ))}
    </div>
  );
}

function SignForm({ slug }: { slug: string }) {
  const { store, user, now } = useSystem();
  const [name, setName] = useState(user?.name ?? "");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");
  const [thanks, setThanks] = useState(false);
  if (!user) return null;
  return (
    <form
      className="hp-sign"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!name.trim() || !message.trim()) return;
        await store.put<Signature>("homeplot.guestbook", { id: newId("post"), owner: user.id, page: slug, name: name.trim().slice(0, 40), from: from.trim().slice(0, 60) || undefined, message: message.trim().slice(0, 1000), at: iso(now()), origin: "user" });
        setMessage("");
        setThanks(true);
      }}
    >
      <strong>Sign the guestbook</strong>
      <label>
        Name <input className="field" value={name} onChange={(e) => setName(e.target.value)} aria-label="Your name" maxLength={40} />
      </label>
      <label>
        Where you&apos;re from (optional) <input className="field" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Where you're from" maxLength={60} />
      </label>
      <label>
        Message <textarea className="field" rows={3} value={message} onChange={(e) => (setMessage(e.target.value), setThanks(false))} aria-label="Guestbook message" maxLength={1000} />
      </label>
      <button className="hp-btn" disabled={!name.trim() || !message.trim()}>
        Sign guestbook
      </button>
      {thanks && <span role="status">Thanks for signing! Your message is in the guestbook.</span>}
    </form>
  );
}

function Homepage({ slug, guestbookOnly }: { slug: string; guestbookOnly: boolean }) {
  const { computer, store } = useSystem();
  const page = usePages().find((p) => p.slug === slug);
  usePageTitle(page ? (guestbookOnly ? `Guestbook - ${page.title}` : page.title) : "Page not found - HomePlot");
  if (!page) {
    return (
      <div className="homeplot">
        <main className="hp-main">
          <h1>Page not found</h1>
          <p>There&apos;s no HomePlot page at this address (yet).</p>
          <A href={hp("/")}>Browse HomePlot</A>
        </main>
      </div>
    );
  }
  const th = page.theme;
  const entries = guestbookOnly ? page.guestbook : page.guestbook.slice(0, 3);
  return (
    <div className="hp-page" style={{ background: th.bg, color: th.text, fontFamily: th.font, ["--hp-accent" as string]: th.accent, ["--hp-panel" as string]: th.panel }}>
      <div className="hp-page-inner">
        <header className="hp-page-head">
          {page.pictureBlob ? (
            <BlobImage blobId={page.pictureBlob} alt="" className="hp-avatar" />
          ) : page.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={page.avatar} alt="" className="hp-avatar" />
          ) : null}
          <div>
            <h1>{page.title}</h1>
            <p>{page.tagline}</p>
          </div>
        </header>
        <nav className="hp-page-nav">
          <A href={hp(`/~${slug}`)}>Home</A>
          <A href={hp(`/~${slug}/guestbook`)}>Guestbook ({page.guestbook.length})</A>
          <A href={hp("/")}>More HomePlot pages</A>
        </nav>
        {!guestbookOnly &&
          page.sections.map((s, i) => (
            <section key={i} className="hp-panel">
              <h2>{s.heading}</h2>
              {s.at && <div className="hp-date">{formatDate(Date.parse(s.at), computer.timeZone)}</div>}
              <p>
                <Linkified text={s.body} />
              </p>
            </section>
          ))}
        {!guestbookOnly && page.links.length > 0 && (
          <section className="hp-panel">
            <h2>Cool links</h2>
            <ul>
              {page.links.map((l) => (
                <li key={l.url}>
                  <A href={l.url}>{l.label}</A>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="hp-panel">
          <h2>Guestbook</h2>
          {entries.length === 0 && <p>Nobody has signed yet. Be the first!</p>}
          {entries.map((g) => (
            <div key={g.id} className="hp-entry">
              <div className="hp-entry-head">
                <strong>{g.name}</strong>
                {g.from && <span> from {g.from}</span>} <span className="hp-date">{formatDate(Date.parse(g.at), computer.timeZone)}</span>
                {g.mine && (
                  <button className="link-btn" onClick={() => store.delete("homeplot.guestbook", g.id)}>
                    Delete
                  </button>
                )}
              </div>
              <div className="hp-entry-text">
                <Linkified text={g.message} />
              </div>
            </div>
          ))}
          {!guestbookOnly && page.guestbook.length > 3 && <A href={hp(`/~${slug}/guestbook`)}>Read all {page.guestbook.length} entries</A>}
          {guestbookOnly && <SignForm slug={slug} />}
          {!guestbookOnly && (
            <p>
              <A href={hp(`/~${slug}/guestbook`)} className="hp-btn">
                Sign my guestbook!
              </A>
            </p>
          )}
        </section>
        <Counter slug={slug} base={page.baseVisits} />
        <footer className="hp-foot">Free homepage by HomePlot · page by {page.owner}</footer>
      </div>
    </div>
  );
}

function Editor() {
  usePageTitle("Make your homepage - HomePlot");
  const { store, user, now } = useSystem();
  const { navigate } = useSite();
  const [pages, , loaded] = useCollection<UserPage>("homeplot.pages");
  const existing = pages[0];
  if (!user) return null;
  if (!loaded) return <div className="homeplot" />;
  return <EditorForm key={existing?.id ?? "new"} existing={existing} onSave={async (p) => (await store.put<UserPage>("homeplot.pages", p), navigate(hp(`/~${p.id}`)))} owner={user.id} slug={existing?.id ?? userHandle(user.name).toLowerCase()} name={user.name} at={iso(now())} />;
}

function EditorForm({ existing, onSave, owner, slug, name, at }: { existing?: UserPage; onSave: (p: UserPage) => void; owner: string; slug: string; name: string; at: string }) {
  const { store, vfs } = useSystem();
  const [title, setTitle] = useState(existing?.title ?? `${name}'s Homepage`);
  const [tagline, setTagline] = useState(existing?.tagline ?? "Welcome to my corner of the web!");
  const [about, setAbout] = useState(existing?.about ?? "");
  const [themeName, setThemeName] = useState(existing?.themeName ?? HOME_THEMES[0].name);
  const [links, setLinks] = useState(existing?.links.map((l) => `${l.label} | ${l.url}`).join("\n") ?? "");
  const [picture, setPicture] = useState("");
  return (
    <div className="homeplot">
      <header className="hp-header">
        <A href={hp("/")} className="hp-logo">
          🏡 HomePlot
        </A>
        <span>{existing ? "Edit your page" : "Make your homepage"}</span>
      </header>
      <form
        className="hp-main hp-edit"
        onSubmit={async (e) => {
          e.preventDefault();
          let pictureBlob = existing?.pictureBlob;
          if (picture && vfs) {
            pictureBlob = newId("blob");
            await store.putBlob(pictureBlob, await vfs.readBlob(picture));
          }
          const parsed = links
            .split("\n")
            .map((l) => l.split("|").map((x) => x.trim()))
            .filter(([label, url]) => label && url)
            .map(([label, url]) => ({ label: label.slice(0, 60), url: /^https?:\/\//i.test(url) ? url : `http://${url}` }))
            .slice(0, 12);
          onSave({ id: slug, owner, title: title.trim().slice(0, 80) || `${name}'s Homepage`, tagline: tagline.trim().slice(0, 120), about: about.trim().slice(0, 3000), themeName, links: parsed, pictureBlob, createdAt: existing?.createdAt ?? at, updatedAt: at, origin: "user" });
        }}
      >
        <p className="hp-muted">Your address will be homeplot.connectedera.local/~{slug}</p>
        <label>
          Page title <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Page title" maxLength={80} />
        </label>
        <label>
          Tagline <input className="field" value={tagline} onChange={(e) => setTagline(e.target.value)} aria-label="Tagline" maxLength={120} />
        </label>
        <label>
          About me <textarea className="field" rows={6} value={about} onChange={(e) => setAbout(e.target.value)} aria-label="About me" maxLength={3000} />
        </label>
        <label>
          Colours
          <select className="field" value={themeName} onChange={(e) => setThemeName(e.target.value)} aria-label="Colours">
            {HOME_THEMES.map((t) => (
              <option key={t.name}>{t.name}</option>
            ))}
          </select>
        </label>
        <label>
          Picture <PicturePicker value={picture} onChange={setPicture} />
        </label>
        <label>
          Links (one per line: name | address) <textarea className="field" rows={4} value={links} onChange={(e) => setLinks(e.target.value)} aria-label="Links" placeholder="My Tum | danasdoodles.tum.connectedera.local" />
        </label>
        <button className="hp-btn">{existing ? "Save changes" : "Publish my page"}</button>
      </form>
    </div>
  );
}

export default function HomePlot() {
  const { url } = useSite();
  const m = /^\/~([a-z0-9._-]+)(\/guestbook)?\/?$/i.exec(url.path);
  if (m) return <Homepage slug={m[1].toLowerCase()} guestbookOnly={Boolean(m[2])} />;
  if (url.path === "/edit") return <Editor />;
  return <Directory />;
}
