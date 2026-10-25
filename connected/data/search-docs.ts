// Every page the Connected Era search engine knows about, built from the
// archive sites' own data so results always match what the sites serve.

import type { SearchDoc } from "@/lib/search";
import { channels, videos, METUBE_HOST } from "./metube";
import { firstPublished, mangaTitles, MANGASHELF_HOST } from "./manga";
import { wallpapers, WALLPAPER_HOST } from "./wallpapers";
import { games } from "./games";
import { staticSites } from "./web-pages";
import { birdieUsers, birdiePosts, tumBlogs, threeChanThreads, techNookThreads } from "./community";
import yalIndex from "./generated/yal-index.json";

const http = (host: string, path = "/") => `http://www.${host}${path}`;

export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  docs.push(
    { id: "page_goggle", url: http("goggle.com"), title: "Goggle", description: "Search the web, images and videos.", kind: "web", publishedAt: "2006-01-01T00:00:00Z", site: "Goggle", tags: ["search", "search engine"] },
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
    docs.push({ id: `page_${g.id}`, url: http("freewarecorner.com", `/games/${g.id.replace("game_", "").replace(/_/g, "-")}`), title: `${g.title} - Free ${g.genre} Game - Freeware Corner`, description: `${g.description} By ${g.developer}.`, kind: "web", publishedAt: g.availability.publishedAt, site: "Freeware Corner", tags: ["game", "games", "download", "free", g.genre] });
  }

  for (const s of staticSites) {
    for (const p of s.pages) {
      docs.push({ id: `page_${s.host}_${p.path}`.replace(/[^a-z0-9_]/gi, "_"), url: http(s.host, p.path), title: `${p.title} - ${s.name}`, description: p.summary, body: p.blocks.map((b) => (b.kind === "list" ? b.items.join(" ") : b.kind === "action" ? `${b.label} ${b.note ?? ""}` : b.text)).join(" "), kind: "web", publishedAt: p.publishedAt, site: s.name, tags: p.tags });
    }
  }

  docs.push({ id: "page_birdie", url: http("birdie.com"), title: "Birdie - What's happening?", description: "Short updates from friends, creators and everyone else. Follow people and join the conversation.", kind: "web", publishedAt: "2007-03-01T00:00:00Z", site: "Birdie", tags: ["birdie", "microblog", "social"] });
  for (const u of birdieUsers) docs.push({ id: `page_birdie_${u.handle}`, url: http("birdie.com", `/${u.handle}`), title: `${u.name} (@${u.handle}) on Birdie`, description: u.bio, kind: "web", publishedAt: u.joinedAt, site: "Birdie", tags: ["birdie", u.handle] });
  for (const p of birdiePosts.slice(0, 200)) docs.push({ id: `page_${p.id}`, url: http("birdie.com", `/${p.author}/status/${p.id}`), title: `@${p.author} on Birdie`, description: p.text, kind: "web", publishedAt: p.at, site: "Birdie" });
  docs.push({ id: "page_tum", url: http("tum.com"), title: "Tum - Blogs, art and everything you love", description: "Make a blog, share drawings, photos and thoughts, and follow blogs you like.", kind: "web", publishedAt: "2008-06-01T00:00:00Z", site: "Tum", tags: ["tum", "blog", "art"] });
  for (const b of tumBlogs) {
    docs.push({ id: `page_tum_${b.name}`, url: `http://${b.name}.tum.com/`, title: `${b.title} - Tum`, description: b.description, kind: "web", publishedAt: b.createdAt, site: "Tum", tags: ["tum", "blog", ...b.tags] });
    for (const p of b.posts) docs.push({ id: `page_${p.id}`, url: `http://${b.name}.tum.com/post/${p.id}`, title: `${p.title ?? "Post"} - ${b.title}`, description: p.text, kind: p.image ? "image" : "web", image: p.image, publishedAt: p.at, site: "Tum", tags: p.tags });
  }
  docs.push({ id: "page_3chan", url: http("3chan.org"), title: "3Chan - anonymous discussion boards", description: "Anonymous image boards for games, anime and manga, technology, music and random chat.", kind: "web", publishedAt: "2006-01-01T00:00:00Z", site: "3Chan", tags: ["3chan", "imageboard", "forum", "anonymous"] });
  for (const t of threeChanThreads) docs.push({ id: `page_${t.id}`, url: http("3chan.org", `/${t.board}/thread/${t.id}`), title: `/${t.board}/ - ${t.subject || t.posts[0].text.slice(0, 50)}`, description: t.posts[0].text, kind: "web", publishedAt: t.posts[0].at, site: "3Chan", tags: ["3chan", t.board] });
  docs.push({ id: "page_technook", url: http("technook.net"), title: "TechNook Forums - PC help, customization and software", description: "Friendly forums for PC help, desktop customization, software and hardware.", kind: "web", publishedAt: "2005-09-01T00:00:00Z", site: "TechNook", tags: ["forum", "forums", "technology", "pc", "help"] });
  for (const t of techNookThreads) docs.push({ id: `page_${t.id}`, url: http("technook.net", `/thread/${t.id}`), title: `${t.title} - TechNook Forums`, description: t.posts[0].text.slice(0, 200), kind: "web", publishedAt: t.posts[0].at, site: "TechNook", tags: ["forum", "technology", t.board] });

  docs.push(...(yalIndex as SearchDoc[]));
  return docs;
}
