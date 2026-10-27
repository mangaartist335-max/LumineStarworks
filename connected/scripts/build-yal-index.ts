// Builds the search engine's index of YourAnimeList pages from YAL's own
// data (../yal/data), so search results match what YAL actually serves.
// Release-state controls apply: material held back for a later phase (such
// as Impact of Eden) is not in YAL's active exports and so is not indexed.
//
//   npm run index:yal   → data/generated/yal-index.json

import { writeFileSync } from "node:fs";
import path from "node:path";
import { anime } from "../../yal/data/anime";
import { characters } from "../../yal/data/characters";
import { companies, people } from "../../yal/data/industry";
import { seedThreads } from "../../yal/data/forums";
import type { SearchDoc } from "../lib/search";

const HOST = "http://yal.connectedera.local";
const SITE = "YourAnimeList";
const YAL_OPENED = "2008-06-01T00:00:00Z";
const docs: SearchDoc[] = [];

docs.push({
  id: "page_yal_home",
  url: `${HOST}/`,
  title: "YourAnimeList - Anime and Manga Database and Community",
  description: "Track your anime, discuss episodes and explore the anime database with the YourAnimeList community.",
  kind: "web",
  publishedAt: YAL_OPENED,
  site: SITE,
  tags: ["anime", "manga", "database", "forum", "list"],
});

for (const a of anime) {
  if (a.provenance === "documented" && !a.synopsis && a.episodeList.length === 0) continue; // credit-only entries
  const firstSeen = a.visibleFrom ?? a.airedFrom ?? YAL_OPENED;
  const year = a.airedFrom ? new Date(a.airedFrom).getUTCFullYear() : null;
  docs.push({
    id: `page_yal_anime_${a.id}`,
    url: `${HOST}/anime/${a.id}/${a.slug}`,
    title: `${a.title}${year ? ` (${year})` : ""} - YourAnimeList`,
    description: (a.synopsis ?? `${a.title} on YourAnimeList.`).replace(/\[Written by [^\]]+\]/, "").trim(),
    body: a.background.map((b) => b.text).join(" "),
    kind: "web",
    publishedAt: firstSeen,
    site: SITE,
    tags: ["anime", a.type, ...(a.genres ?? [])].filter(Boolean) as string[],
  });
}

for (const c of characters) {
  docs.push({
    id: `page_yal_character_${c.id}`,
    url: `${HOST}/character/${c.id}/${c.slug}`,
    title: `${c.name} - YourAnimeList`,
    description: `${c.role}. ${c.bio.filter((b) => !b.revealedAt)[0]?.text ?? ""}`.trim(),
    kind: "web",
    publishedAt: c.visibleFrom ?? YAL_OPENED,
    site: SITE,
    tags: ["anime", "character"],
  });
}

for (const p of people) {
  docs.push({
    id: `page_yal_person_${p.id}`,
    url: `${HOST}/people/${p.id}/${p.slug}`,
    title: `${p.name} - YourAnimeList`,
    description: [p.occupations.join(", "), p.about].filter(Boolean).join(". "),
    kind: "web",
    publishedAt: p.visibleFrom ?? YAL_OPENED,
    site: SITE,
    tags: ["anime", "staff", ...p.occupations],
  });
}

for (const c of companies) {
  docs.push({
    id: `page_yal_company_${c.id}`,
    url: `${HOST}/company/${c.id}/${c.slug}`,
    title: `${c.name} - YourAnimeList`,
    description: c.about ?? `${c.name} on YourAnimeList.`,
    kind: "web",
    publishedAt: c.visibleFrom ?? YAL_OPENED,
    site: SITE,
    tags: ["anime", "studio", "company"],
  });
}

for (const t of seedThreads) {
  docs.push({
    id: `page_yal_thread_${t.id}`,
    url: `${HOST}/forum/thread/${t.id}`,
    title: `${t.title} - YourAnimeList Forums`,
    description: t.posts[0]?.body.replace(/\[\/?[a-z]+(=[^\]]*)?\]/g, "").slice(0, 200) ?? t.title,
    kind: "web",
    publishedAt: t.createdAt,
    site: SITE,
    tags: ["forum", "anime", "discussion"],
  });
}

const out = path.join(__dirname, "..", "data", "generated", "yal-index.json");
writeFileSync(out, JSON.stringify(docs, null, 1) + "\n");
console.log(`Wrote ${docs.length} YAL pages to ${path.relative(process.cwd(), out)}`);
