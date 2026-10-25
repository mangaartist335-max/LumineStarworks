// Anime entries in the 2012–2013 YAL database.
//
// Only documented facts are recorded. Anything the references do not state
// stays null/empty and renders as "N/A" or "Not documented".

import type { Anime } from "./types";
import { SRC } from "./sources";
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
const IOE_ADVANCE = "2013-10-01T15:00:00Z"; // Oct 2, 2013 (JST)

function entry(e: Partial<Anime> & Pick<Anime, "id" | "slug" | "title">): Anime {
  return {
    synonyms: [],
    type: "Unknown",
    episodesPlanned: null,
    airedFrom: null,
    airedTo: null,
    year: null,
    broadcasts: [],
    studios: [],
    producers: [],
    licensors: [],
    source: null,
    genres: [],
    themes: [],
    duration: null,
    rating: null,
    synopsis: null,
    background: [],
    visibleFrom: null,
    staff: [],
    characters: [],
    voices: [],
    themesSongs: [],
    episodeList: [],
    relations: [],
    scores: [],
    provenance: "documented",
    sources: [],
    ...e,
  };
}

const UNDOCUMENTED = "Listed in the Lumine StarWorks production archive. Studio, dates, episode count and credits have not been documented yet.";

export const anime: Anime[] = [
  // ── Impact of Eden (2013) ───────────────────────────────────────────────
  entry({
    id: IOE_ID,
    slug: "Impact_of_Eden",
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
      { label: "Advance premiere", at: IOE_ADVANCE, note: "Season 1 advance broadcast. Broadcast time not documented." },
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
    sources: [SRC.brief, SRC.archiveBrief],
    archiveNotes: [
      "YAL's listing date for this entry is not documented, so the archive shows it from its premiere.",
      "Source material, genres, synopsis and other staff credits have not been documented.",
    ],
  }),

  // ── Sinful Apex ─────────────────────────────────────────────────────────
  entry({
    id: SINFUL_APEX_ID,
    slug: "Sinful_Apex",
    title: "Sinful Apex",
    type: "TV",
    episodesPlanned: 24,
    airedFrom: "2011-08-14T15:00:00Z",
    airedTo: "2012-01-22T15:00:00Z",
    year: 2011,
    premiered: { season: "summer", year: 2011 },
    broadcast: "Mondays (derived from air dates; time not documented)",
    studios: [2],
    licensors: [{ companyId: 5, visibleFrom: null }],
    genres: ["Action"],
    visibleFrom: null,
    staff: [
      { personId: 2, role: "Director" },
      { personId: 14, role: "Appearance", note: "As the fictional singer Aria Moonbirth" },
    ],
    background: [
      {
        text: "Produced by Flow Pictures' late-era cinematic unit, the production is often described as the studio's \"final breath\". The unit went on to form Studio Burst.",
        visibleFrom: null,
      },
      {
        text: "Funmaxation is releasing a Complete Collection on Blu-ray on November 19, 2013.",
        visibleFrom: "2013-10-06T00:00:00Z",
      },
    ],
    sources: [SRC.brief, SRC.archiveBrief, SRC.aniFanWiki, SRC.munchyRoll],
    archiveNotes: ["Synopsis, source material and the rest of the staff list have not been documented."],
  }),

  // ── Back catalogue ──────────────────────────────────────────────────────
  entry({
    id: 5120,
    slug: "Skyfall_Chronicle__Black_Aegis",
    title: "Skyfall Chronicle: Black Aegis",
    synonyms: ["Skyfall Chronicle"],
    year: 2009,
    releaseNote: "2009",
    genres: ["Action"],
    staff: [{ personId: 2, role: "Co-Director", source: SRC.sakugaThread }],
    sources: [SRC.munchyRoll, SRC.sakugaThread, SRC.yalEp1Page4],
    archiveNotes: ["Format, studio and episode count have not been documented."],
  }),
  entry({
    id: 7741,
    slug: "Zero_Latitude",
    title: "Zero Latitude",
    year: 2010,
    releaseNote: "2010",
    genres: ["Sci-Fi"],
    staff: [
      { personId: 2, role: "Director" },
      { personId: 5, role: "Storyboard", note: "Long-take sequence" },
    ],
    sources: [SRC.munchyRoll, SRC.sakugaThread, SRC.yalEp1Page4],
    archiveNotes: ["Format, studio and episode count have not been documented."],
  }),
  entry({
    id: 8016,
    slug: "Destiny_Infinite",
    title: "Destiny/Infinite",
    staff: [{ personId: 2, role: "Director" }],
    sources: [SRC.sakugaThread, SRC.yalEp1Page4],
    archiveNotes: ["Release year, format, studio and episode count have not been documented."],
  }),
  entry({
    id: 8452,
    slug: "River_of_Sparks",
    title: "River of Sparks",
    staff: [
      { personId: 5, role: "Storyboard", note: "Alley fight sequences" },
      { personId: 9, role: "Action Choreography" },
    ],
    sources: [SRC.sakugaThread, SRC.yalEp1Page4],
    archiveNotes: ["Release year, format, studio and episode count have not been documented."],
  }),
  entry({
    id: 9133,
    slug: "Steelbound_Testament",
    title: "Steelbound Testament",
    studios: [2],
    background: [
      { text: "Produced by the Flow Pictures cinematic unit whose staff culture later carried into Studio Burst.", visibleFrom: null },
    ],
    sources: [SRC.aniWirePremiere],
    archiveNotes: ["Release year, format, episode count and credits have not been documented."],
  }),
  entry({
    id: 6230,
    slug: "Neon_Afterimage",
    title: "Neon Afterimage",
    sources: [SRC.yalEp1Page4],
    archiveNotes: [UNDOCUMENTED],
  }),
  entry({ id: 4407, slug: "Glass_Cathedral", title: "Glass Cathedral", sources: [SRC.brief], archiveNotes: [UNDOCUMENTED] }),
  entry({ id: 9608, slug: "Circuit_Hearts__Reload", title: "Circuit Hearts: Reload", sources: [SRC.brief], archiveNotes: [UNDOCUMENTED] }),
  entry({ id: 9871, slug: "Vacant_Crown__Liminal_War", title: "Vacant Crown: Liminal War", sources: [SRC.brief], archiveNotes: [UNDOCUMENTED] }),
  entry({ id: 6811, slug: "Ghost_Eater", title: "Ghost Eater", sources: [SRC.brief], archiveNotes: [UNDOCUMENTED] }),
  entry({ id: 3390, slug: "Azure_Sorcerer", title: "Azure Sorcerer", sources: [SRC.brief], archiveNotes: [UNDOCUMENTED] }),
  entry({
    id: 7015,
    slug: "Blizzard_Requiem",
    title: "Blizzard Requiem",
    staff: [{ personId: 3, role: "Head Writer" }],
    sources: [SRC.yalEp1Page4],
    archiveNotes: ["Release year, format, studio and episode count have not been documented."],
  }),
  entry({
    id: 8277,
    slug: "Pale_Garden_Reverie",
    title: "Pale Garden Reverie",
    staff: [{ personId: 3, role: "Series Composition" }],
    sources: [SRC.yalEp1Page4],
    archiveNotes: ["Release year, format, studio and episode count have not been documented."],
  }),
  entry({
    id: 5904,
    slug: "Garden_of_Cinders",
    title: "Garden of Cinders",
    type: "OVA",
    staff: [{ personId: 4, role: "Animation Staff" }],
    sources: [SRC.yalEp1Page4],
    archiveNotes: ["Release year, studio and episode count have not been documented."],
  }),
  entry({
    id: 7390,
    slug: "Iron_Halo_Brigade",
    title: "Iron Halo Brigade",
    staff: [{ personId: 9, role: "Action Choreography" }],
    sources: [SRC.yalEp1Page4],
    archiveNotes: ["Release year, format, studio and episode count have not been documented."],
  }),
];
