// Anime entries in the 2012–2013 YAL database.
//
// Entries record only what the references state; anything else stays
// null/empty and renders as "N/A" or "Not documented". The back catalogue in
// catalogue-anime.ts follows the Connected Era Master Bible.

import type { Anime } from "./types";
import { SRC } from "./sources";
import { entry } from "./entry";
import { catalogueAnime } from "./catalogue-anime";
import { active, IOE_PHASE } from "./release";
import { IOE_LISTED } from "./industry";
import { IOE_EP1, IOE_EP2, IOE_EP3 } from "./characters";

export const IOE_ID = 19815;
export const IOE_EP0_ID = 19814;
export const NIGHTPOLIS_ID = 1043;
export const IRON_ID = 16592;
export const SINFUL_APEX_ID = 10380;
export const IOE_MANGA_ID = 2101;

// AniWire, Oct 4, 2013: AdultDrift dub and Funmaxation licence announced.
const DUB_ANNOUNCED = "2013-10-04T04:00:00Z";
// Episode 0 special and the advance premiere: dates documented, times not.
const IOE_EP0_AIRED = "2013-09-25T15:00:00Z"; // Sep 26, 2013 (JST)
const IOE_ADVANCE = "2013-09-30T15:00:00Z"; // late night of Mon Sep 30 (Oct 1, 2013 JST)


// Impact of Eden, its Episode 0 special and the Nightpolis Winter OVA are
// future-phase material: kept here, hidden from the active site.
const IOE_FRANCHISE = new Set([IOE_ID, IOE_EP0_ID, NIGHTPOLIS_ID]);

const records: Anime[] = [
  // ── Impact of Eden (2013) ───────────────────────────────────────────────
  entry({
    id: IOE_ID,
    slug: "Impact_of_Eden",
    pagePlanned: true,
    title: "Impact of Eden",
    titleJapanese: "エデンの衝撃",
    titleRomaji: "Eden no Shōgeki",
    synonyms: ["Impact of Eden (2013)", "Impact of Eden Season 1"],
    type: "TV",
    episodesPlanned: 25,
    airedFrom: IOE_EP1,
    airedTo: null,
    year: 2013,
    weeklyFrom: IOE_EP1,
    premiered: { season: "fall", year: 2013 },
    broadcast: "Saturdays at 25:58 (JST)",
    broadcasts: [
      { label: "Episode 0 special", at: IOE_EP0_AIRED, note: "Aired ahead of the season premiere. Broadcast time not documented." },
      { label: "Advance premiere", at: IOE_ADVANCE, note: "Season 1 advance broadcast, late on the night of Monday, Sep 30 (the early hours of Oct 1 JST). Exact time not documented." },
      { label: "Japanese TV premiere (VBS/KBS)", at: IOE_EP1, note: "Regular broadcast, weekly at the same slot." },
      { label: "Subtitled simulcast (MunchyRoll)", at: IOE_EP1, note: "Subtitled releases follow MunchyRoll's standard simulcast schedule, roughly two days after broadcast." },
      { label: "English dub (AdultDrift)", at: null, note: "Announced for broadcast in early 2015. Dub cast not yet announced.", visibleFrom: DUB_ANNOUNCED },
    ],
    studios: [1],
    producers: [4],
    licensors: [{ companyId: 5, visibleFrom: DUB_ANNOUNCED }],
    source: "Manga",
    genres: ["Action", "Sci-Fi", "School", "Mystery"],
    themes: ["Video Game"],
    duration: "24 min. per ep.",
    rating: null,
    synopsis:
      "After struggling at Maple Grove City with his parents, twelve-year-old Sora Gauthier decides to head out on a Soul Anchor Journey to avenge his mother's survival, joining forces with allies Abigail June, Grayson Rothenberg, and Ben Smythe inside Planetation. Running the system from above, however, is a council called Student Council 1, led by its president, Miyuki Kagemitsu.",
    synopsisSource: "Official premise",
    background: [
      {
        text: "Impact of Eden is the first animated work from Studio Burst, which formed out of Flow Pictures' late-era cinematic unit at the conclusion of Sinful Apex. Director Kaihatsu Miura, who directed Sinful Apex, leads the production with series composition by Keito Kisaragi and music by Hiroyuki Sawano, based on the work of creator Natsuki Takuya.",
        visibleFrom: IOE_LISTED,
      },
      {
        text: "AniFanWiki describes the series as an original concept by manga artist Natsuki Takuya, while YAL's episode threads treat the manga as source material; both descriptions are kept here.",
        visibleFrom: IOE_EP1,
      },
      {
        text: "Funmaxation is the North American licensor. An English dub has been announced for broadcast on AdultDrift in early 2015, and a Japanese Blu-ray release is expected for the Q1 2014 season.",
        visibleFrom: DUB_ANNOUNCED,
      },
      {
        text: "The opening theme, \"Human x Inhuman\" by T.M.Revolution (Takanori Nishikawa), was released as a single by Sony Music Japan on October 16, 2013.",
        visibleFrom: "2013-10-15T15:00:00Z",
      },
    ],
    cover: "/covers/impact-of-eden.png",
    visibleFrom: IOE_LISTED,
    franchise: "Impact of Eden",
    staff: [
      { personId: 1, role: "Original Creator" },
      { personId: 2, role: "Director" },
      { personId: 3, role: "Series Composition" },
      { personId: 5, role: "Storyboard / Pacing Lead" },
      { personId: 4, role: "Character Design, Chief Animation Director" },
      { personId: 6, role: "Art Director" },
      { personId: 7, role: "Color Design" },
      { personId: 8, role: "Sound Director" },
      { personId: 9, role: "Action Choreography" },
      { personId: 10, role: "Music" },
      { personId: 11, role: "Producer", note: "Studio Burst" },
      { personId: 12, role: "Producer", note: "AniBlex" },
    ],
    characters: [
      { characterId: 1, role: "Main" },
      { characterId: 2, role: "Main" },
      { characterId: 3, role: "Main" },
      { characterId: 4, role: "Main" },
      { characterId: 5, role: "Main" },
      { characterId: 6, role: "Supporting" },
      { characterId: 7, role: "Supporting" },
      { characterId: 8, role: "Supporting" },
      { characterId: 9, role: "Supporting" },
      { characterId: 10, role: "Supporting" },
      { characterId: 11, role: "Supporting" },
      { characterId: 12, role: "Supporting" },
      { characterId: 13, role: "Supporting" },
    ],
    voices: [
      { characterId: 1, personId: 20, language: "Japanese" },
      { characterId: 2, personId: 22, language: "Japanese" },
      { characterId: 3, personId: 21, language: "Japanese" },
      { characterId: 4, personId: 24, language: "Japanese" },
      { characterId: 5, personId: 23, language: "Japanese" },
      { characterId: 6, personId: 25, language: "Japanese" },
      { characterId: 7, personId: 28, language: "Japanese" },
      { characterId: 8, personId: 26, language: "Japanese" },
      { characterId: 9, personId: 27, language: "Japanese" },
      { characterId: 10, personId: 30, language: "Japanese" },
      { characterId: 11, personId: 29, language: "Japanese" },
      { characterId: 12, personId: 31, language: "Japanese" },
      { characterId: 13, personId: 32, language: "Japanese" },
    ],
    themesSongs: [
      {
        kind: "Opening",
        title: "Human x Inhuman",
        artist: "T.M.Revolution (Takanori Nishikawa)",
        note: "Played over the closing montage of Episode 1.",
        visibleFrom: IOE_EP1,
      },
    ],
    episodeList: [
      { number: 1, title: "Where the Wind Ran First", airedAt: IOE_EP1, threadId: "ioe-ep1" },
      { number: 2, title: "FRONTIER RISK MANAGEMENT: Introduction", airedAt: IOE_EP2, threadId: "ioe-ep2" },
      { number: 3, title: "Battle Circle", airedAt: IOE_EP3, threadId: "ioe-ep3" },
    ],
    relations: [
      { kind: "Other", target: { type: "anime", id: IOE_EP0_ID }, note: "Episode 0 special aired ahead of the Season 1 premiere." },
      { kind: "Adaptation", target: { type: "manga", id: IOE_MANGA_ID } },
      {
        kind: "Other",
        target: { type: "anime", id: NIGHTPOLIS_ID },
        note: "Earlier OVA released under the Impact of Eden name. Its story relationship to the 2013 series has not been documented.",
      },
    ],
    scores: [
      {
        capturedAt: "2013-10-06T20:18:00Z",
        score: 8.51,
        scoredBy: 2847,
        source: { cite: "AniWire premiere review, Oct 6, 2013 4:18 PM EDT" },
      },
    ],
    streaming: [
      { name: "MunchyRoll", note: "Subtitled simulcast", visibleFrom: IOE_EP1 },
    ],
    sources: [SRC.brief, SRC.aniFanWiki, SRC.aniWirePremiere, SRC.yalEp1, SRC.yalEp2, SRC.yalEp3],
    archiveNotes: [
      "Age rating has not been documented.",
      "No ending theme was credited as of the premiere; Episode 1 closed with a short instrumental cue.",
    ],
  }),

  // ── Impact of Eden: Episode 0 ───────────────────────────────────────────
  entry({
    id: IOE_EP0_ID,
    slug: "Impact_of_Eden__Episode_0",
    pagePlanned: true,
    title: "Impact of Eden: Episode 0",
    synonyms: ["Impact of Eden Episode 0 special"],
    type: "Special",
    episodesPlanned: 1,
    airedFrom: IOE_EP0_AIRED,
    airedTo: IOE_EP0_AIRED,
    year: 2013,
    studios: [1],
    source: "Manga",
    cover: "/covers/impact-of-eden.png",
    visibleFrom: IOE_LISTED,
    franchise: "Impact of Eden",
    relations: [
      { kind: "Other", target: { type: "anime", id: IOE_ID }, note: "Aired ahead of the Season 1 premiere." },
    ],
    sources: [SRC.brief, SRC.archiveBrief],
    archiveNotes: ["Episode title, broadcast time and running time have not been documented."],
  }),

  // ── Impact of Eden: Nightpolis Winter (2005 OVA) ────────────────────────
  entry({
    id: NIGHTPOLIS_ID,
    slug: "Impact_of_Eden__Nightpolis_Winter",
    title: "Impact of Eden: Nightpolis Winter",
    synonyms: ["Nightpolis Winter"],
    type: "OVA",
    year: 2005,
    releaseNote: "2005",
    visibleFrom: null,
    franchise: "Impact of Eden",
    relations: [
      {
        kind: "Other",
        target: { type: "anime", id: IOE_ID },
        note: "Later TV series released under the Impact of Eden name. Its story relationship to this OVA has not been documented.",
        visibleFrom: IOE_LISTED,
      },
    ],
    sources: [SRC.brief],
    archiveNotes: [
      "A separate 2005 OVA entry, distinct from the 2013 television series. The two records are intentionally kept apart.",
      "Exact release date, studio, staff, cast and episode count are pending documentation.",
    ],
  }),

  // ── Iron to Requiem (Season 1) ──────────────────────────────────────────
  entry({
    id: IRON_ID,
    slug: "Iron_to_Requiem",
    title: "Iron to Requiem",
    synonyms: ["Iron to Requiem Season 1"],
    type: "TV",
    episodesPlanned: 26,
    airedFrom: "2013-04-03T15:00:00Z",
    airedTo: "2013-09-25T15:00:00Z",
    year: 2013,
    premiered: { season: "spring", year: 2013 },
    broadcast: "Thursdays (time not documented)",
    broadcasts: [
      { label: "Japanese TV premiere", at: "2013-04-03T15:00:00Z", note: "Weekly on Thursdays. Broadcast time not documented." },
      { label: "Japanese TV finale", at: "2013-09-25T15:00:00Z" },
    ],
    studios: [3],
    visibleFrom: "2013-04-03T15:00:00Z",
    franchise: "Iron to Requiem",
    staff: [{ personId: 10, role: "Music" }],
    sources: [SRC.bibleFranchise, SRC.brief, SRC.archiveBrief],
    archiveNotes: [
      "YAL's listing date for this entry is not documented, so the archive shows it from its premiere.",
      "Source material, genres, synopsis and other staff credits have not been documented.",
    ],
  }),

  // Flow Pictures' earlier catalogue and the older staff-filmography titles
  // live in catalogue-anime.ts.
  ...catalogueAnime,
];

export const allAnime: Anime[] = records.map((a) => (IOE_FRANCHISE.has(a.id) ? { ...a, phase: IOE_PHASE } : a));
export const anime: Anime[] = active(allAnime);
