// MangaShelf catalogue. Three original stories drawn for the Connected Era
// (scripts/media/manga.py); each chapter appears on MangaShelf on its
// release date and not before.

import type { Availability } from "@/lib/availability";
import { media } from "./media";

export const MANGASHELF_HOST = "mangashelf.net";

export interface MangaChapter {
  id: string;
  number: number | null;
  title: string;
  folder: string;
  pages: number;
  availability: Availability;
}

export interface MangaTitle {
  id: string;
  slug: string;
  title: string;
  author: string;
  genres: string[];
  status: "Ongoing" | "Completed" | "One-shot";
  direction: "rtl" | "ltr";
  cover: string;
  synopsis: string;
  chapters: MangaChapter[];
}

function chapter(id: string, series: string, folder: string, number: number | null, title: string, publishedAt: string): MangaChapter {
  return { id, number, title, folder: `/media/manga/${series}/${folder}`, pages: media(`manga-chapter:${series}/${folder}`).pages ?? 0, availability: { publishedAt, region: "global" } };
}

export const mangaTitles: MangaTitle[] = [
  {
    id: "mg_lantern",
    slug: "lantern-street-couriers",
    title: "Lantern Street Couriers",
    author: "Hana Mizuki",
    genres: ["Slice of Life", "Adventure", "Comedy"],
    status: "Ongoing",
    direction: "rtl",
    cover: media("manga-cover:lantern-street").url,
    synopsis: "Mei wants to be a courier on Lantern Street, where every parcel has a story. Her first job? A delivery to the very top of the old clock tower. A cheerful story about stairs, rooftops, rivals and melon bread.",
    chapters: [
      chapter("chap_lantern_1", "lantern-street", "ch1", 1, "First Delivery", "2012-08-03T03:00:00Z"),
      chapter("chap_lantern_2", "lantern-street", "ch2", 2, "Rooftop Shortcut", "2012-09-07T03:00:00Z"),
    ],
  },
  {
    id: "mg_paper",
    slug: "paper-planet",
    title: "Paper Planet",
    author: "Ren Takagi",
    genres: ["Sci-Fi", "Comedy"],
    status: "Ongoing",
    direction: "rtl",
    cover: media("manga-cover:paper-planet").url,
    synopsis: "Taro has folded a thousand paper planes. One night he folds a planet instead: Pip, who is small, round, very chatty and would like to find home. Preferably after breakfast.",
    chapters: [
      chapter("chap_paper_1", "paper-planet", "ch1", 1, "Fold Here", "2013-01-11T03:00:00Z"),
      chapter("chap_paper_2", "paper-planet", "ch2", 2, "Crash Course", "2013-11-08T03:00:00Z"),
    ],
  },
  {
    id: "mg_moonlit",
    slug: "moonlit-bakery",
    title: "Moonlit Bakery",
    author: "Sora Ichika",
    genres: ["Fantasy", "Slice of Life"],
    status: "One-shot",
    direction: "rtl",
    cover: media("manga-cover:moonlit-bakery").url,
    synopsis: "Hina's bakery opens at midnight, and most nights nobody comes. Then a visitor with rabbit ears asks for moon bread. A gentle one-shot about very long journeys and fresh bread.",
    chapters: [chapter("chap_moonlit_1", "moonlit-bakery", "oneshot", null, "Moonlit Bakery", "2013-06-20T03:00:00Z")],
  },
];

export const mangaById = (id: string) => mangaTitles.find((m) => m.id === id);
export const mangaBySlug = (slug: string) => mangaTitles.find((m) => m.slug === slug);
export function chapterById(id: string): { manga: MangaTitle; chapter: MangaChapter } | undefined {
  for (const m of mangaTitles) {
    const c = m.chapters.find((x) => x.id === id);
    if (c) return { manga: m, chapter: c };
  }
  return undefined;
}

export const pageUrl = (c: MangaChapter, page: number) => `${c.folder}/${String(page).padStart(2, "0")}.png`;

/** Series appear once their first chapter is out. */
export const firstPublished = (m: MangaTitle) => m.chapters.map((c) => c.availability.publishedAt).sort()[0];
