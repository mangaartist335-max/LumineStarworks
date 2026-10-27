// Flow Pictures' earlier catalogue, as the Connected Era Master Bible records
// it (ch. 18), plus the older staff-filmography titles it names.
//
// Each entry carries only what the Bible states: year, format, its one-line
// description, the staff connections in its people registry and LUNE's songs
// (ch. 19). Everything else (episode titles, casts, air times, studios)
// stays empty and shows as pending. The Bible asks that this catalogue not
// be read as a definitive studio-ownership list, so only Sinful Apex, which
// the franchise registry credits to Flow Pictures, carries a studio.

import type { Anime, StaffCredit, ThemeSong } from "./types";
import { SRC } from "./sources";
import { IOE_PHASE, phaseText } from "./release";
import { entry, weekly } from "./entry";

const SINFUL_APEX_ID = 10380;
export const SKYFALL_ID = 4812;
export const BLACK_AEGIS_ID = 5120;
export const STEELBOUND_ID = 9133;
export const GARDEN_OF_CINDERS_ID = 5904;

// Staff connections from the people registry.
const MIURA = 2;
const KISARAGI = 3;
const HARAGUCHI = 4;
const SUZUHARA = 5;
const KANZAKI = 7;
const TACHIKAZE = 8;
const KAGURA = 9;
const LUNE = 14;
const SHIBASAKI = 15;

const director: StaffCredit = { personId: MIURA, role: "Director" };
const writer: StaffCredit = { personId: KISARAGI, role: "Writer / Series Composition" };
const characters: StaffCredit = { personId: HARAGUCHI, role: "Character Design / Animation" };
const storyboard: StaffCredit = { personId: SUZUHARA, role: "Storyboard" };
const color: StaffCredit = { personId: KANZAKI, role: "Color Design" };
const sound: StaffCredit = { personId: TACHIKAZE, role: "Sound Director" };
const fights: StaffCredit = { personId: KAGURA, role: "Fight Choreography" };
const music: StaffCredit = { personId: SHIBASAKI, role: "Music" };

/** A LUNE song from ch. 19. The Bible lists it without saying whether it's an opening, ending or insert. */
function luneSong(title: string): { song: ThemeSong; credit: StaffCredit } {
  return {
    song: { kind: "Theme", title, artist: "LUNE", note: "Documented or working title. Opening, ending or insert: not yet recorded.", visibleFrom: null },
    credit: { personId: LUNE, role: "Theme Song Performance", note: `"${title}"` },
  };
}

const CATALOGUE_NOTE = "Part of Flow Pictures' earlier catalogue. Which studio animated it is not recorded, so no studio is credited here.";
const pending = (what: string) => `${what} pending in the archive.`;

type FlowTitle = Pick<Anime, "id" | "slug" | "title" | "type" | "year"> &
  Partial<Anime> & {
    description: string;
    song?: string;
  };

/** A catalogue entry built only from what the Bible states. */
function flow({ description, song, staff = [], themesSongs = [], background = [], archiveNotes = [], sources = [], ...rest }: FlowTitle): Anime {
  const lune = song ? luneSong(song) : null;
  return entry({
    ...rest,
    synopsis: description,
    synopsisSource: "Catalogue description",
    background: [{ text: CATALOGUE_NOTE, visibleFrom: null }, ...background],
    staff: lune ? [...staff, lune.credit] : staff,
    themesSongs: lune ? [...themesSongs, lune.song] : themesSongs,
    archiveNotes: [pending("Episode titles, cast, air dates and studio credits are"), ...archiveNotes],
    provenance: "documented",
    sources: [SRC.bibleCatalogue, ...(staff.length ? [SRC.biblePeople] : []), ...(lune ? [SRC.bibleMusic] : []), ...sources],
  });
}

// Sinful Apex aired weekly from Monday Aug 15, 2011 to Monday Jan 23, 2012.
// The broadcast time isn't recorded, so dates sit at 00:00 JST.
const SINFUL_EP1 = "2011-08-14T15:00:00Z";
const sinfulEps = weekly(SINFUL_EP1, Array.from({ length: 24 }, () => "")).map((e) => ({ ...e, title: null }));
const SINFUL_FINALE = sinfulEps[23].airedAt!;
const BLU_RAY_AD = "2013-10-06T00:00:00Z";

export const catalogueAnime: Anime[] = [
  flow({
    id: 9871,
    slug: "Vacant_Crown__Liminal_War",
    title: "Vacant Crown: Liminal War",
    type: "TV",
    year: 2000,
    releaseNote: "2000, TV series with an OVA",
    description: "Supernatural weapons and wide-angle military conflict.",
    genres: ["Supernatural", "Action"],
    themes: ["Military"],
    staff: [storyboard, music],
    song: "Gesshoku / Requiem for Zero",
    archiveNotes: ["The catalogue lists the title as TV + OVA. The OVA's own release details are still to come."],
  }),
  flow({
    id: 8452,
    slug: "River_of_Sparks",
    title: "River of Sparks",
    type: "TV",
    year: 2004,
    premiered: { season: "winter", year: 2004 },
    description: "Delinquent school life, urban magic and close-quarters fighting.",
    genres: ["Action", "Fantasy"],
    themes: ["School", "Delinquents"],
    staff: [fights, sound],
  }),
  flow({
    id: 4407,
    slug: "Glass_Cathedral",
    title: "Glass Cathedral",
    type: "Movie",
    episodesPlanned: 1,
    year: 2005,
    description: "Supernatural crime and stained-glass imagery.",
    genres: ["Supernatural", "Mystery"],
    themes: ["Crime"],
    staff: [storyboard, sound],
    song: "VITRAIL",
  }),
  flow({
    id: SKYFALL_ID,
    slug: "Skyfall_Chronicle",
    title: "Skyfall Chronicle",
    type: "TV",
    year: 2006,
    releaseNote: "2006–2007, two cours",
    description: "Floating citadels and warfare.",
    genres: ["Action", "Fantasy"],
    themes: ["Military"],
    staff: [director],
    relations: [{ kind: "Sequel", target: { type: "anime", id: BLACK_AEGIS_ID }, note: "Theatrical sequel (2012)." }],
    archiveNotes: ["Two cours; the exact episode count is still to come."],
  }),
  flow({
    id: 7390,
    slug: "Iron_Halo_Brigade",
    title: "Iron Halo Brigade",
    type: "TV",
    year: 2007,
    releaseNote: "2007, one cour",
    description: "Military mecha and infantry, told with realistic tactics.",
    genres: ["Action", "Sci-Fi"],
    themes: ["Mecha", "Military"],
  }),
  flow({
    id: 6230,
    slug: "Neon_Afterimage",
    title: "Neon Afterimage",
    type: "Movie",
    episodesPlanned: 1,
    year: 2007,
    description: "Rain-soaked urban science fiction.",
    genres: ["Sci-Fi"],
    staff: [color],
    song: "AFTER//IMAGE",
  }),
  flow({
    id: 7123,
    slug: "Tearfall_Resonance",
    title: "Tearfall Resonance",
    type: "Movie",
    episodesPlanned: 1,
    year: 2007,
    description: "Two siblings at the centre of a psychic event that shakes their whole city.",
    genres: ["Supernatural", "Drama"],
    themes: ["Psychic"],
  }),
  flow({
    id: 9608,
    slug: "Circuit_Hearts__Reload",
    title: "Circuit Hearts: Reload",
    type: "TV",
    year: 2008,
    releaseNote: "2008, one cour",
    description: "Illegal neural-gear competitions.",
    genres: ["Sci-Fi", "Action"],
    themes: ["Competition"],
    song: "PULSE:RE",
  }),
  flow({
    id: STEELBOUND_ID,
    slug: "Steelbound_Testament",
    title: "Steelbound Testament",
    type: "TV",
    year: 2008,
    releaseNote: "2008–2009, two cours",
    description: "Dark fantasy about family and war.",
    genres: ["Fantasy", "Drama"],
    themes: ["Military"],
    staff: [writer, characters, music],
    song: "ALETHEIA / Ashes Know My Name",
    relations: [{ kind: "Side story", target: { type: "anime", id: GARDEN_OF_CINDERS_ID }, note: "OVA trilogy (2010)." }],
    archiveNotes: ["Two cours; the exact episode count is still to come."],
  }),
  flow({
    id: 8277,
    slug: "Pale_Garden_Reverie",
    title: "Pale Garden Reverie",
    type: "TV",
    year: 2009,
    releaseNote: "2009, one cour",
    description: "Quiet, supernatural environmental storytelling.",
    genres: ["Supernatural"],
    themes: ["Nature"],
    staff: [writer],
  }),
  flow({
    id: 8640,
    slug: "Nocturne_of_the_Iron_Sea",
    title: "Nocturne of the Iron Sea",
    type: "Movie",
    episodesPlanned: 1,
    year: 2009,
    description: "A naval horror-adventure.",
    genres: ["Horror", "Adventure"],
    themes: ["Naval"],
  }),
  flow({
    id: 7015,
    slug: "Blizzard_Requiem",
    title: "Blizzard Requiem",
    type: "TV",
    year: 2010,
    releaseNote: "2010–2011, split two cours",
    description: "Arctic survival and politics.",
    genres: ["Drama", "Adventure"],
    themes: ["Survival", "Political"],
    staff: [writer],
    archiveNotes: ["Two cours aired with a break between them; exact dates and the episode count are still to come."],
  }),
  flow({
    id: GARDEN_OF_CINDERS_ID,
    slug: "Garden_of_Cinders",
    title: "Garden of Cinders",
    type: "OVA",
    episodesPlanned: 3,
    year: 2010,
    releaseNote: "2010, OVA trilogy",
    description: "A side story to Steelbound Testament.",
    genres: ["Fantasy", "Drama"],
    relations: [{ kind: "Parent story", target: { type: "anime", id: STEELBOUND_ID } }],
  }),
  flow({
    id: 9420,
    slug: "Shadowline_Oratorio",
    title: "Shadowline Oratorio",
    type: "TV",
    year: 2011,
    releaseNote: "2011, one cour",
    description: "Music and an assassin-choir school.",
    genres: ["Action", "Drama"],
    themes: ["Music", "School"],
  }),
  flow({
    id: 7741,
    slug: "Zero_Latitude",
    title: "Zero Latitude",
    type: "Special",
    episodesPlanned: 1,
    year: 2011,
    releaseNote: "2011, TV special",
    description: "A chase across a megacity during a blackout.",
    genres: ["Action", "Sci-Fi"],
    staff: [director],
  }),
  entry({
    id: SINFUL_APEX_ID,
    slug: "Sinful_Apex",
    title: "Sinful Apex",
    type: "TV",
    episodesPlanned: 24,
    airedFrom: SINFUL_EP1,
    airedTo: SINFUL_FINALE,
    year: 2011,
    premiered: { season: "summer", year: 2011 },
    broadcast: "Mondays (time not recorded)",
    broadcasts: [
      { label: "Japanese TV premiere", at: SINFUL_EP1, note: "Weekly on Mondays." },
      { label: "Japanese TV finale (Episode 24)", at: SINFUL_FINALE },
    ],
    studios: [2],
    // From an AniWire advertisement on the archived Oct 6, 2013 pages.
    licensors: [{ companyId: 5, visibleFrom: BLU_RAY_AD }],
    synopsis: "Flow Pictures' final marquee production.",
    synopsisSource: "Catalogue description",
    background: [
      {
        text: phaseText(
          IOE_PHASE,
          "Flow Pictures' final marquee production, often described as the studio's \"final breath\". Its late-era cinematic unit went on to form Studio Burst.",
          "Flow Pictures' final marquee production, often described as the studio's \"final breath\".",
        ),
        visibleFrom: null,
      },
      { text: "The singer LUNE appears as Aria Moonbirth.", visibleFrom: null },
      { text: "Funmaxation is releasing a Complete Collection on Blu-ray on November 19, 2013.", visibleFrom: BLU_RAY_AD },
    ],
    staff: [director, characters, fights, color],
    characters: [{ characterId: 126, role: "Supporting" }],
    voices: [{ characterId: 126, personId: LUNE, language: "Japanese" }],
    episodeList: sinfulEps.map((e) => (e.number === 24 ? { ...e, threadId: "t-21990" } : e)),
    provenance: "documented",
    sources: [SRC.bibleFranchise, SRC.bibleCatalogue, SRC.biblePeople, SRC.bibleMusic, SRC.brief, { cite: "AniWire advertisement, \"Sinful Apex Complete Collection on Blu-ray Nov 19\" (Oct 6, 2013)" }],
    archiveNotes: [pending("Episode titles, the rest of the cast, genres, a full synopsis and theme songs are"), "The Bible notes that the detailed character and song map is still partly open."],
  }),
  flow({
    id: 11205,
    slug: "Rust_Veil_Junction",
    title: "Rust Veil Junction",
    type: "TV",
    year: 2012,
    releaseNote: "2012, one cour",
    description: "Rival factions in a steampunk railway city.",
    genres: ["Sci-Fi", "Action"],
    themes: ["Steampunk"],
    archiveNotes: ["The premiere season and exact dates are still to come."],
  }),
  flow({
    id: BLACK_AEGIS_ID,
    slug: "Skyfall_Chronicle__Black_Aegis",
    title: "Skyfall Chronicle: Black Aegis",
    type: "Movie",
    episodesPlanned: 1,
    year: 2012,
    releaseNote: "2012, theatrical film",
    description: "The theatrical sky-warfare sequel to Skyfall Chronicle.",
    genres: ["Action", "Fantasy"],
    themes: ["Military"],
    relations: [{ kind: "Prequel", target: { type: "anime", id: SKYFALL_ID }, note: "TV series (2006–2007)." }],
    archiveNotes: ["The release date is still to come. Kaihatsu Miura's registry entry names \"Skyfall\"; whether that includes this film is not yet recorded."],
  }),

  // Older staff-filmography titles: the Bible creates their title IDs but
  // fixes no seasons, studios or producers, so none are given here.
  ...(
    [
      [6811, "Ghost_Eater", "Ghost Eater", [fights]],
      [8016, "Destiny_Infinite", "Destiny/Infinite", [characters]],
      [6402, "A_Mystical_Skyline_Finger", "A Mystical Skyline/Finger", [storyboard]],
      [3390, "Azure_Sorcerer", "Azure Sorcerer", []],
    ] as [number, string, string, StaffCredit[]][]
  ).map(([id, slug, title, staff]) =>
    entry({
      id,
      slug,
      title,
      staff,
      provenance: "documented",
      sources: [SRC.bibleCatalogue, ...(staff.length ? [SRC.biblePeople] : [])],
      archiveNotes: ["An older production credit. Year, format, studio and broadcast details are still to come."],
    }),
  ),
];
