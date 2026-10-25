import type { Manga } from "./types";
import { SRC } from "./sources";
import { IOE_ID, IOE_MANGA_ID } from "./anime";
import { active, IOE_PHASE } from "./release";

export const allManga: Manga[] = [
  {
    id: IOE_MANGA_ID,
    phase: IOE_PHASE,
    slug: "Impact_of_Eden",
    title: "Impact of Eden",
    titleJapanese: "エデンの衝撃",
    type: "Manga",
    authors: [{ personId: 1, role: "Story & Art" }],
    status: null,
    volumes: null,
    chapters: null,
    published: null,
    serialization: null,
    genres: ["Action", "Sci-Fi", "School", "Mystery"],
    synopsis: null,
    background: null,
    visibleFrom: null,
    relations: [{ kind: "Adaptation", target: { type: "anime", id: IOE_ID }, visibleFrom: "2013-09-14T15:00:00Z" }],
    provenance: "documented",
    sources: [SRC.brief, SRC.aniFanWiki, SRC.yalEp1],
  },
];

export const manga: Manga[] = active(allManga);
