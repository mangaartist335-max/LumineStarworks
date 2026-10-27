// Every page the Connected Era search engine knows about, built from the
// archive sites' own data so results always match what the sites serve.

import type { SearchDoc } from "@/lib/search";
import { channels, videos, METUBE_HOST } from "./metube";
import { firstPublished, mangaTitles, MANGASHELF_HOST } from "./manga";
import { wallpapers, WALLPAPER_HOST } from "./wallpapers";
import { games } from "./games";
import { staticSites } from "./web-pages";
import { birdieUsers, birdiePosts, tumBlogs, threeChanThreads, techNookThreads } from "./community";
import { archiveHomepages, HOMEPLOT_HOST } from "./homepages";
import { archiveStories, fandoms, INKPOCKET_HOST } from "./fanfic";
import { ANIWIRE_HOST, articles } from "./aniwire";
import { catalogue, FORMAT_LABEL, LUNE } from "./catalogue";
import { FLOW_HOST, flowNews, workListedFrom } from "./flow";
import { WIKI_NAME, wikiPages, wikiUrl } from "./wiki";
import { plainText } from "@/lib/wiki";
import yalIndex from "./generated/yal-index.json";

const http = (host: string, path = "/") => `http://${host}${path}`;

export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  docs.push(
    { id: "page_search", url: http("search.connectedera.local"), title: "Connected Search", description: "Search the web, images and videos.", kind: "web", publishedAt: "2006-01-01T00:00:00Z", site: "Connected Search", tags: ["search", "search engine"] },
    { id: "page_metube", url: http(METUBE_HOST), title: "MeTube - Broadcast Yourself", description: "Watch, upload and share videos with friends and the world. Gaming, music, pets, tutorials, sports and vlogs.", kind: "web", publishedAt: "2006-01-01T00:00:00Z", site: "MeTube", tags: ["video", "videos", "watch", "upload", "metube"] },
    { id: "page_mangashelf", url: http(MANGASHELF_HOST), title: "MangaShelf - Read Manga Online", description: "Read manga chapters online for free: slice of life, adventure, sci-fi, comedy and one-shots.", kind: "web", publishedAt: "2010-04-01T00:00:00Z", site: "MangaShelf", tags: ["manga", "read", "comics", "chapters"] },
    { id: "page_wallpapergarden", url: http(WALLPAPER_HOST), title: "WallpaperGarden - Free Desktop Wallpapers", description: "Free HD desktop backgrounds: nature, space, city, retro and abstract wallpapers for personal use.", kind: "web", publishedAt: "2008-02-01T00:00:00Z", site: "WallpaperGarden", tags: ["wallpaper", "wallpapers", "background", "desktop", "hd"] },
  );

  for (const v of videos) {
    const ch = channels.find((c) => c.id === v.channelId);
    docs.push({
      id: `page_${v.id}`,
      url: http(METUBE_HOST, `/watch?v=${v.id}`),
      title: `${v.title} - MeTube`,
      description: v.description,
      body: `${ch?.name ?? ""} ${v.category}`,
      kind: "video",
      image: v.thumb,
      publishedAt: v.availability.publishedAt,
      site: "MeTube",
      tags: [...v.tags, ch?.name ?? "", "video"],
    });
  }
  for (const c of channels) {
    docs.push({ id: `page_${c.id}`, url: http(METUBE_HOST, `/user/${c.handle}`), title: `${c.name}'s channel - MeTube`, description: c.about, kind: "web", publishedAt: c.joinedAt, site: "MeTube", tags: ["channel", "video creator", c.handle] });
  }

  for (const m of mangaTitles) {
    docs.push({
      id: `page_${m.id}`,
      url: http(MANGASHELF_HOST, `/manga/${m.slug}`),
      title: `${m.title} by ${m.author} - MangaShelf`,
      description: m.synopsis,
      kind: "web",
      image: m.cover,
      publishedAt: firstPublished(m),
      site: "MangaShelf",
      tags: ["manga", ...m.genres, m.author],
    });
    for (const c of m.chapters) {
      docs.push({
        id: `page_${c.id}`,
        url: http(MANGASHELF_HOST, `/read/${m.slug}/${c.id}`),
        title: `${m.title} ${c.number ? `Chapter ${c.number}: ` : ""}${c.title} - MangaShelf`,
        description: `Read ${m.title}${c.number ? ` chapter ${c.number}` : ""} online. ${m.synopsis.split(". ")[0]}.`,
        kind: "web",
        publishedAt: c.availability.publishedAt,
        site: "MangaShelf",
        tags: ["manga", "chapter", "read online"],
      });
    }
  }

  for (const w of wallpapers) {
    const page = http(WALLPAPER_HOST, `/wallpaper/${w.key}`);
    docs.push({ id: w.id, url: page, title: `${w.title} Wallpaper (${w.width}x${w.height}) - WallpaperGarden`, description: `${w.description} By ${w.artist}. ${w.license}`, kind: "web", image: w.thumb, publishedAt: w.availability.publishedAt, site: "WallpaperGarden", tags: ["wallpaper", "background", w.category] });
    docs.push({ id: `${w.id}_img`, url: page, title: `${w.title} by ${w.artist}`, description: `${w.width}x${w.height} - WallpaperGarden`, kind: "image", image: w.thumb, publishedAt: w.availability.publishedAt, site: "WallpaperGarden", tags: ["wallpaper", w.category] });
  }

  for (const g of games) {
    docs.push({ id: `page_${g.id}`, url: http("freewarecorner.connectedera.local", `/games/${g.id.replace("game_", "").replace(/_/g, "-")}`), title: `${g.title} - Free ${g.genre} Game - Freeware Corner`, description: `${g.description} By ${g.developer}.`, kind: "web", publishedAt: g.availability.publishedAt, site: "Freeware Corner", tags: ["game", "games", "download", "free", g.genre] });
  }

  for (const s of staticSites) {
    for (const p of s.pages) {
      docs.push({ id: `page_${s.host}_${p.path}`.replace(/[^a-z0-9_]/gi, "_"), url: http(s.host, p.path), title: `${p.title} - ${s.name}`, description: p.summary, body: p.blocks.map((b) => (b.kind === "list" ? b.items.join(" ") : b.kind === "action" ? `${b.label} ${b.note ?? ""}` : b.text)).join(" "), kind: "web", publishedAt: p.publishedAt, site: s.name, tags: p.tags });
    }
  }

  docs.push({ id: "page_birdie", url: http("birdie.connectedera.local"), title: "Birdie - What's happening?", description: "Short updates from friends, creators and everyone else. Follow people and join the conversation.", kind: "web", publishedAt: "2007-03-01T00:00:00Z", site: "Birdie", tags: ["birdie", "microblog", "social"] });
  for (const u of birdieUsers) docs.push({ id: `page_birdie_${u.handle}`, url: http("birdie.connectedera.local", `/${u.handle}`), title: `${u.name} (@${u.handle}) on Birdie`, description: u.bio, kind: "web", publishedAt: u.joinedAt, site: "Birdie", tags: ["birdie", u.handle] });
  for (const p of birdiePosts.slice(0, 200)) docs.push({ id: `page_${p.id}`, url: http("birdie.connectedera.local", `/${p.author}/status/${p.id}`), title: `@${p.author} on Birdie`, description: p.text, kind: "web", publishedAt: p.at, site: "Birdie" });
  docs.push({ id: "page_tum", url: http("tum.connectedera.local"), title: "Tum - Blogs, art and everything you love", description: "Make a blog, share drawings, photos and thoughts, and follow blogs you like.", kind: "web", publishedAt: "2008-06-01T00:00:00Z", site: "Tum", tags: ["tum", "blog", "art"] });
  for (const b of tumBlogs) {
    docs.push({ id: `page_tum_${b.name}`, url: `http://${b.name}.tum.connectedera.local/`, title: `${b.title} - Tum`, description: b.description, kind: "web", publishedAt: b.createdAt, site: "Tum", tags: ["tum", "blog", ...b.tags] });
    for (const p of b.posts) docs.push({ id: `page_${p.id}`, url: `http://${b.name}.tum.connectedera.local/post/${p.id}`, title: `${p.title ?? "Post"} - ${b.title}`, description: p.text, kind: p.image ? "image" : "web", image: p.image, publishedAt: p.at, site: "Tum", tags: p.tags });
  }
  docs.push({ id: "page_3chan", url: http("3chan.connectedera.local"), title: "3Chan - anonymous discussion boards", description: "Anonymous image boards for games, anime and manga, technology, music and random chat.", kind: "web", publishedAt: "2006-01-01T00:00:00Z", site: "3Chan", tags: ["3chan", "imageboard", "forum", "anonymous"] });
  for (const t of threeChanThreads) docs.push({ id: `page_${t.id}`, url: http("3chan.connectedera.local", `/${t.board}/thread/${t.id}`), title: `/${t.board}/ - ${t.subject || t.posts[0].text.slice(0, 50)}`, description: t.posts[0].text, kind: "web", publishedAt: t.posts[0].at, site: "3Chan", tags: ["3chan", t.board] });
  docs.push({ id: "page_technook", url: http("technook.connectedera.local"), title: "TechNook Forums - PC help, customization and software", description: "Friendly forums for PC help, desktop customization, software and hardware.", kind: "web", publishedAt: "2005-09-01T00:00:00Z", site: "TechNook", tags: ["forum", "forums", "technology", "pc", "help"] });
  for (const t of techNookThreads) docs.push({ id: `page_${t.id}`, url: http("technook.connectedera.local", `/thread/${t.id}`), title: `${t.title} - TechNook Forums`, description: t.posts[0].text.slice(0, 200), kind: "web", publishedAt: t.posts[0].at, site: "TechNook", tags: ["forum", "technology", t.board] });

  docs.push({ id: "page_homeplot", url: http(HOMEPLOT_HOST), title: "HomePlot - Free personal homepages", description: "Make your own free homepage with a guestbook, a hit counter and your favourite links. Browse pages made by people everywhere.", kind: "web", publishedAt: "2004-03-01T00:00:00Z", site: "HomePlot", tags: ["homepage", "personal page", "guestbook", "free website"] });
  for (const h of archiveHomepages) {
    docs.push({ id: `page_homeplot_${h.slug.replace(/-/g, "_")}`, url: http(HOMEPLOT_HOST, `/~${h.slug}`), title: `${h.title} - HomePlot`, description: h.tagline, body: h.sections.filter((x) => !x.at).map((x) => `${x.heading} ${x.body}`).join(" "), kind: "web", publishedAt: h.createdAt, site: "HomePlot", tags: ["homepage", "guestbook", h.owner] });
  }
  docs.push({ id: "page_inkpocket", url: http(INKPOCKET_HOST), title: "InkPocket - Fan fiction archive", description: "Read and write fan fiction for your favourite manga and games. Reviews, favourites and new chapters every day.", kind: "web", publishedAt: "2009-05-01T00:00:00Z", site: "InkPocket", tags: ["fan fiction", "fanfic", "stories", "writing"] });
  for (const f of fandoms) docs.push({ id: `page_inkpocket_${f.id.replace(/-/g, "_")}`, url: http(INKPOCKET_HOST, `/fandom/${f.id}`), title: `${f.name} fan fiction - InkPocket`, description: `Stories by fans of ${f.name}.`, kind: "web", publishedAt: f.since, site: "InkPocket", tags: ["fan fiction", f.name] });
  for (const st of archiveStories) {
    docs.push({ id: `page_${st.id}`, url: http(INKPOCKET_HOST, `/s/${st.id}`), title: `${st.title} - ${fandoms.find((f) => f.id === st.fandom)?.name ?? ""} fan fiction - InkPocket`, description: `${st.summary} By ${st.author}.`, kind: "web", publishedAt: st.chapters[0].at, site: "InkPocket", tags: ["fan fiction", "fanfic", st.author, ...st.genres] });
  }

  docs.push({ id: "page_aniwire", url: http(ANIWIRE_HOST), title: "AniWire - Anime news, features and reviews", description: "Anime news, features, reviews and interviews, updated every week.", kind: "web", publishedAt: "2008-09-01T00:00:00Z", site: "AniWire", tags: ["anime", "news", "reviews", "aniwire"] });
  for (const a of articles) docs.push({ id: `page_${a.id}`, url: http(ANIWIRE_HOST, `/article/${a.slug}`), title: `${a.title} - AniWire`, description: a.dek, body: a.body.filter((p) => p !== "@catalogue").join(" "), kind: "web", image: a.image, publishedAt: a.publishedAt, site: "AniWire", tags: ["anime", a.kind.toLowerCase(), ...a.tags] });

  docs.push({ id: "page_flowpictures", url: http(FLOW_HOST), title: "Flow Pictures - Official site", description: "Flow Pictures, the animation studio behind Sinful Apex: news, works, staff and music.", kind: "web", publishedAt: "2005-01-01T00:00:00Z", site: "Flow Pictures", tags: ["flow pictures", "studio", "anime"] });
  for (const w of catalogue) {
    const listed = workListedFrom(w.year);
    docs.push({ id: `page_flow_${w.slug.replace(/-/g, "_")}`, url: http(FLOW_HOST, `/works/${w.slug}`), title: `${w.title} - Flow Pictures`, description: `${w.years}, ${FORMAT_LABEL[w.format]}. ${w.description}`, kind: "web", publishedAt: listed ? new Date(listed).toISOString() : `${Math.max(w.year, 2005)}-01-01T00:00:00Z`, site: "Flow Pictures", tags: ["flow pictures", "anime", w.title, ...(w.song ? [w.song, "LUNE"] : [])] });
  }
  for (const n of flowNews) docs.push({ id: `page_${n.id}`, url: http(FLOW_HOST), title: `${n.title} - Flow Pictures`, description: n.body, kind: "web", publishedAt: n.at, site: "Flow Pictures", tags: ["flow pictures", "news"] });
  docs.push({ id: "page_flow_music", url: http(FLOW_HOST, "/music"), title: "Music: LUNE - Flow Pictures", description: LUNE.bio, kind: "web", publishedAt: "2006-06-01T00:00:00Z", site: "Flow Pictures", tags: ["LUNE", "music", "songs", ...LUNE.songs.map((s) => s.song)] });

  for (const p of wikiPages) {
    const first = p.revisions[0];
    docs.push({ id: `page_wiki_${p.title.replace(/[^a-z0-9]+/gi, "_")}`, url: wikiUrl(p.title), title: `${p.title} - ${WIKI_NAME}`, description: plainText(first.text).split("\n")[0].slice(0, 220), body: plainText(first.text), kind: "web", publishedAt: first.at, site: WIKI_NAME, tags: ["wiki", "encyclopedia", p.title] });
  }

  docs.push(...(yalIndex as SearchDoc[]));
  return docs;
}
