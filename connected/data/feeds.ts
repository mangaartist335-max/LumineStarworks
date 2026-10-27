// The RSS feeds Connected Era sites publish, built from each site's own data
// so a feed item always matches the page it links to. News Reader shows an
// item only once its date has come.

import { HOST } from "@/lib/web/hosts";
import { ANIWIRE_HOST, articles } from "./aniwire";
import { FLOW_HOST, flowNews } from "./flow";
import { WIKI_NAME, wikiRevisions, wikiUrl } from "./wiki";
import { channels, METUBE_HOST, videos } from "./metube";
import { MANGASHELF_HOST, mangaTitles } from "./manga";
import { techNookThreads, tumBlogs } from "./community";
import { archiveStories, INKPOCKET_HOST } from "./fanfic";
import { normalizeTitle, plainText } from "@/lib/wiki";

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  summary: string;
  at: string;
}

export interface Feed {
  id: string;
  title: string;
  site: string;
  /** The feed's own address, and the site it belongs to (for typing a site's address instead). */
  url: string;
  home: string;
  description: string;
  items: FeedItem[];
}

const http = (host: string, path = "/") => `http://${host}${path}`;
const clip = (s: string, n = 260) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const newestFirst = (items: FeedItem[]) => [...items].sort((a, b) => b.at.localeCompare(a.at));

export const feeds: Feed[] = [
  {
    id: "feed_aniwire",
    title: "AniWire",
    site: "AniWire",
    url: http(ANIWIRE_HOST, "/rss"),
    home: http(ANIWIRE_HOST),
    description: "Anime news, features, reviews and interviews.",
    items: newestFirst(articles.map((a) => ({ id: `fi_${a.id}`, title: a.title, link: http(ANIWIRE_HOST, `/article/${a.slug}`), summary: a.dek, at: a.publishedAt }))),
  },
  {
    id: "feed_flow",
    title: "Flow Pictures News",
    site: "Flow Pictures",
    url: http(FLOW_HOST, "/rss"),
    home: http(FLOW_HOST),
    description: "News from the studio.",
    items: newestFirst(flowNews.map((n) => ({ id: `fi_${n.id}`, title: n.title, link: http(FLOW_HOST, n.work ? `/works/${n.work}` : "/"), summary: n.body, at: n.at }))),
  },
  {
    id: "feed_wiki",
    title: `${WIKI_NAME}: Recent changes`,
    site: WIKI_NAME,
    url: http(HOST.wiki, "/rss"),
    home: http(HOST.wiki),
    description: "Every edit to the anime encyclopedia anyone can edit.",
    items: newestFirst(
      wikiRevisions
        .filter((r) => !r.title.startsWith("Help:"))
        .map((r) => ({ id: `fi_${r.id}`, title: `${normalizeTitle(r.title)}: ${r.summary}`, link: wikiUrl(r.title, { oldid: r.id }), summary: `${r.editor} edited ${normalizeTitle(r.title)}. ${clip(plainText(r.text).replace(/\n/g, " "), 200)}`, at: r.at })),
    ),
  },
  {
    id: "feed_mangashelf",
    title: "MangaShelf: New chapters",
    site: "MangaShelf",
    url: http(MANGASHELF_HOST, "/rss"),
    home: http(MANGASHELF_HOST),
    description: "Every new chapter, as soon as it's up.",
    items: newestFirst(
      mangaTitles.flatMap((m) => m.chapters.map((c) => ({ id: `fi_${c.id}`, title: c.number ? `${m.title} chapter ${c.number}: ${c.title}` : c.title === m.title ? `${m.title} (one-shot)` : `${m.title}: ${c.title}`, link: http(MANGASHELF_HOST, `/read/${m.slug}/${c.id}`), summary: `New from ${m.author}. ${m.synopsis.split(". ")[0]}.`, at: c.availability.publishedAt }))),
    ),
  },
  {
    id: "feed_inkpocket",
    title: "InkPocket: Just updated",
    site: "InkPocket",
    url: http(INKPOCKET_HOST, "/rss"),
    home: http(INKPOCKET_HOST),
    description: "New chapters of fan fiction stories.",
    items: newestFirst(archiveStories.flatMap((s) => s.chapters.map((c, i) => ({ id: `fi_${s.id}_${i + 1}`, title: `${s.title}, chapter ${i + 1}: ${c.title}`, link: http(INKPOCKET_HOST, `/s/${s.id}/${i + 1}`), summary: `By ${s.author}. ${s.summary}`, at: c.at })))),
  },
  {
    id: "feed_technook",
    title: "TechNook Forums: New threads",
    site: "TechNook",
    url: http(HOST.technook, "/rss"),
    home: http(HOST.technook),
    description: "Fresh questions and tips from the TechNook community.",
    items: newestFirst(techNookThreads.map((t) => ({ id: `fi_${t.id}`, title: t.title, link: http(HOST.technook, `/thread/${t.id}`), summary: clip(`${t.posts[0].author}: ${t.posts[0].text}`), at: t.posts[0].at }))),
  },
  ...channels.map((c) => ({
    id: `feed_metube_${c.handle.toLowerCase()}`,
    title: `${c.name} on MeTube`,
    site: "MeTube",
    url: http(METUBE_HOST, `/rss/${c.handle}`),
    home: http(METUBE_HOST, `/user/${c.handle}`),
    description: c.about,
    items: newestFirst(videos.filter((v) => v.channelId === c.id).map((v) => ({ id: `fi_${v.id}`, title: v.title, link: http(METUBE_HOST, `/watch?v=${v.id}`), summary: clip(v.description), at: v.availability.publishedAt }))),
  })),
  ...tumBlogs.map((b) => ({
    id: `feed_tum_${b.name}`,
    title: `${b.title} (Tum)`,
    site: "Tum",
    url: `http://${b.name}.${HOST.tum}/rss`,
    home: `http://${b.name}.${HOST.tum}/`,
    description: b.description,
    items: newestFirst(b.posts.map((p) => ({ id: `fi_${p.id}`, title: p.title ?? clip(p.text, 60), link: `http://${b.name}.${HOST.tum}/post/${p.id}`, summary: clip(p.text), at: p.at }))),
  })),
].filter((f) => f.items.length > 0);

export const feedById = (id: string) => feeds.find((f) => f.id === id);

/** The feed at a typed address: the feed itself, or the site it belongs to. Null if there isn't one. */
export function findFeed(address: string): Feed | null {
  const a = address.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
  if (!a) return null;
  const bare = (u: string) => u.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return feeds.find((f) => bare(f.url) === a) ?? feeds.find((f) => bare(f.home) === a) ?? null;
}
