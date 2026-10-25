// The built-out back catalogue: eleven productions from 2006 to early 2013.
//
// Written for the Lumine StarWorks reconstruction around the established
// facts (see catalogue-people.ts). Every entry carries provenance
// "reconstructed" so it is never mistaken for documented history.

import type { Anime, VoiceCredit } from "./types";
import { SRC } from "./sources";
import { entry, weekly } from "./entry";
import {
  CIRCUIT_EP9,
  CIRCUIT_LISTED,
  GHOST_LISTED,
  GLASS_LISTED,
  VACANT_LISTED,
} from "./catalogue-people";

const R = [SRC.reconstruction];
// Snapshot taken when the archive opens (Jan 1, 2012 00:00 JST).
const ARCHIVE_OPEN = "2011-12-31T15:00:00Z";
const SCORE_SOURCE = { cite: "YAL score snapshot (reconstructed)" };
const v = (characterId: number, personId: number): VoiceCredit => ({ characterId, personId, language: "Japanese" });

// First airings (UTC). Late-night slots use the Japanese 24+ hour notation.
const AZURE_EP1 = "2006-10-04T09:00:00Z"; // Wed 18:00 JST
const NEON_EP1 = "2008-04-03T17:00:00Z"; // Thu 26:00 JST
const SKYFALL_EP1 = "2009-04-04T08:30:00Z"; // Sat 17:30 JST
const ZERO_EP1 = "2010-07-06T15:30:00Z"; // Tue 24:30 JST
const RIVER_EP1 = "2010-10-07T16:00:00Z"; // Thu 25:00 JST
const SINFUL_EP1 = "2011-08-15T16:00:00Z"; // Mon 25:00 JST
const GLASS_EP1 = "2012-01-11T16:30:00Z"; // Wed 25:30 JST
const CIRCUIT_EP1 = "2012-04-06T15:30:00Z"; // Fri 24:30 JST
const VACANT_EP1 = "2012-07-07T08:00:00Z"; // Sat 17:00 JST
const GHOST_EP1 = "2013-01-10T16:28:00Z"; // Thu 25:28 JST

const last = (list: { airedAt: string | null }[]) => list[list.length - 1].airedAt;

// ── Episode titles ─────────────────────────────────────────────────────────

const azureEps = weekly(AZURE_EP1, [
  "The Weakest Color", "Entrance Exam at the Spire", "A Rival in Crimson", "The Library Has Teeth",
  "Wind Engine, Room Zero", "Lessons in Falling", "Festival of Lanterns", "Blue on Blue",
  "The Professor's Secret Map", "Storm Season", "When the City Tilts", "The Engine Speaks",
  "Celestine, Still Flying",
]);
const neonEps = weekly(NEON_EP1, [
  "Thirty Seconds of Light", "The Ramen Stall Network", "Ghost Trail", "Signal Noise",
  "Rooftop Relay", "The Client Who Wasn't There", "Blackout District", "Afterimage, Before Image",
  "Doyle's Long Night", "Neon Rain", "Every Trail Leads Here", "Light That Stays",
]);
const skyfallEps = weekly(SKYFALL_EP1, [
  "The Sky Cracks Open", "A Frame Nobody Can Start", "Debris Storm Drill", "Wingmates",
  "Ivo's Challenge", "The Ashford Protocol", "Falling Stars over Port Lera", "Black Aegis, Awakened",
  "Shelter Lines", "The Commander's Gamble", "Above the Breach", "Skyfall", "Clear Skies, Aldera",
]);
const zeroEps = weekly(ZERO_EP1, [
  "The Equinox Sets Sail", "Compass at Rest", "Seven Missing Seconds", "The Cook Remembers",
  "Doldrums", "Night Watch", "One Continuous Morning", "Logbook Discrepancy",
  "Captain's Orders", "The Skip Widens", "Lindqvist's Theory", "Crossing Zero",
]);
const riverEps = weekly(RIVER_EP1, [
  "Fireworks over the Embankment", "A Debt on Stone Steps", "Hotaru's Teahouse", "The Alley Below Bridge Six",
  "Ironside", "Footwork", "Lantern Boats", "Rei's Ledger",
  "The Last Bet of Autumn", "Hanabishi Holds Its Breath", "Champion Again", "River of Sparks",
]);
const sinfulEps = weekly(SINFUL_EP1, [
  "Seven Towers", "The Thief Who Sang", "Tower of Sloth", "Debts and Wishes",
  "Nico's Bargain", "Envy Wears Silver", "Moonbirth", "The Long Stairway",
  "Wrath at Dawn", "Crane and Vale", "Greed's Ledger", "Halfway to the Apex",
  "What the Towers Remember", "A Room Full of Light", "A Song Between Floors", "Gluttony's Feast",
  "The Pride of Seraph", "The Fifth Floor", "Vellmore Shines", "Seven Become One",
  "Nico's Climb", "The Apex Door", "The Wish", "Sinful Apex",
]);
const glassEps = weekly(GLASS_EP1, [
  "The First Dark Window", "Memories in Stained Glass", "Father Anselm's Rule", "Tobias and the Lamps",
  "The Window of a Stranger", "Greta's Gift", "Lead and Light", "A Morning That Hasn't Happened",
  "Cracks", "The Restorer's Oath", "All the Windows at Once", "Glass Cathedral",
]);
const circuitEps = weekly(CIRCUIT_EP1, [
  "She Wakes Up on Stage", "Spare Parts", "Reload, Rehearse, Repeat", "Pico Joins the Band",
  "The Producer Returns", "Feedback Loop", "Summer Live (Practice)", "Out of Tune",
  "Memory Card", "Ten Years Late", "Encore Protocol", "Circuit Hearts: Reload",
]);
const vacantEps = weekly(VACANT_EP1, [
  "The Empty Throne", "Mapmaker", "Into the Twilight Border", "Five Claimants",
  "The Prince Without a Banner", "Vossberg's March", "Ink and Iron", "Lady Calder's Table",
  "Pell Runs Ahead", "Siege of Hollowmere", "Where the Old Kings Walk", "Halfway Crowned",
  "Second Front", "The Liminal Army", "A Map with No Edges", "Treaty at Silverford",
  "Cassian's Choice", "The General's Wager", "Twilight Court", "Mirelle's Compass",
  "The Compass Points", "Every Banner Raised", "The Crown Speaks", "Vacant No More",
]);
const ghostEps = weekly(GHOST_EP1, [
  "Today's Special: Regret", "The Shrine Has a Business Plan", "Granny Fumi Won't Leave", "Detective Ozaki Is Not Amused",
  "Bitter, Sweet, Haunted", "School Ghost Festival", "A Ghost Too Big to Eat", "Tsubaki's Ledger",
  "Leftovers", "The Hungry House", "Last Bite", "Thanks for the Meal",
]);

export const catalogueAnime: Anime[] = [
  // ── Azure Sorcerer (Fall 2006) ──────────────────────────────────────────
  entry({
    id: 3390,
    slug: "Azure_Sorcerer",
    title: "Azure Sorcerer",
    titleJapanese: "蒼の魔術師",
    titleRomaji: "Ao no Majutsushi",
    type: "TV",
    episodesPlanned: 13,
    airedFrom: AZURE_EP1,
    airedTo: last(azureEps),
    year: 2006,
    premiered: { season: "fall", year: 2006 },
    broadcast: "Wednesdays at 18:00 (JST)",
    studios: [13],
    source: "Original",
    genres: ["Fantasy", "Adventure", "Comedy"],
    themes: ["Magic", "School"],
    duration: "24 min. per ep.",
    rating: "PG - Children",
    synopsis:
      "In the floating city of Celestine, magic is graded by color, and blue, the faintest shade, is a punchline. Apprentice Rio Ashby is the only blue-ranked sorcerer ever admitted to the Spire Academy, mostly by accident. When the city's ancient Wind Engine starts to falter, Rio discovers that blue magic isn't weak at all: it's the only kind the engine can hear. With a sharp-tongued crimson-ranked rival and a librarian who knows too much, Rio sets out to keep Celestine in the sky.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Ashgrove Animation's first television series. Its early-evening slot made it a gateway fantasy show for many younger viewers in 2006.", visibleFrom: null },
    ],
    staff: [
      { personId: 52, role: "Director" },
      { personId: 53, role: "Character Design" },
      { personId: 54, role: "Music" },
    ],
    characters: [
      { characterId: 101, role: "Main" },
      { characterId: 102, role: "Main" },
      { characterId: 103, role: "Supporting" },
      { characterId: 104, role: "Supporting" },
    ],
    voices: [v(101, 20), v(102, 24), v(103, 29), v(104, 25)],
    themesSongs: [
      { kind: "Opening", title: "Sky-Colored Spell", artist: "Paper Satellite", visibleFrom: null },
      { kind: "Ending", title: "Little Blue", artist: "Clockwork Lily", visibleFrom: null },
    ],
    episodeList: azureEps,
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 7.62, scoredBy: 31204, source: SCORE_SOURCE }],
    relations: [{ kind: "Other", target: { type: "anime", id: 6811 }, note: "Same studio and director." }],
    provenance: "reconstructed",
    sources: [SRC.brief, ...R],
  }),

  // ── Neon Afterimage (Spring 2008) ───────────────────────────────────────
  entry({
    id: 6230,
    slug: "Neon_Afterimage",
    title: "Neon Afterimage",
    titleJapanese: "ネオン・アフターイメージ",
    titleRomaji: "Neon Afutāimēji",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: NEON_EP1,
    airedTo: last(neonEps),
    year: 2008,
    premiered: { season: "spring", year: 2008 },
    broadcast: "Thursdays at 26:00 (JST)",
    studios: [12],
    source: "Original",
    genres: ["Action", "Sci-Fi", "Mystery"],
    themes: ["Cyberpunk"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Neo-Kanazawa, 2081. Bike courier Jin Kurogane can see afterimages, the trails of light people leave in the city's neon for exactly thirty seconds. When a delivery goes wrong and his client vanishes in the middle of a crowded street, the only witness is her afterimage, still running. Teaming up with Mei Sakaki, a hacker who runs her business out of a ramen stall, Jin chases a thirty-second trail across a city that never turns its lights off.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Remembered for its rooftop chase layouts. Layout artist Ren Okado's work here is often cited as the root of the silhouette-readable action fans praise in later series.", visibleFrom: null },
    ],
    staff: [
      { personId: 49, role: "Director" },
      { personId: 48, role: "Layout" },
      { personId: 47, role: "Character Design" },
      { personId: 50, role: "Music" },
    ],
    characters: [
      { characterId: 105, role: "Main" },
      { characterId: 106, role: "Main" },
      { characterId: 107, role: "Supporting" },
    ],
    voices: [v(105, 27), v(106, 22), v(107, 31)],
    themesSongs: [
      { kind: "Opening", title: "Afterglow Circuit", artist: "STRAYLIGHT", visibleFrom: null },
      { kind: "Ending", title: "30 Seconds", artist: "Sena Arisugawa", visibleFrom: null },
    ],
    episodeList: neonEps,
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 7.88, scoredBy: 42117, source: SCORE_SOURCE }],
    relations: [{ kind: "Other", target: { type: "anime", id: 8452 }, note: "Same studio and director." }],
    provenance: "reconstructed",
    sources: [SRC.yalEp1Page4, ...R],
  }),

  // ── Skyfall Chronicle: Black Aegis (Spring 2009) ────────────────────────
  entry({
    id: 5120,
    slug: "Skyfall_Chronicle__Black_Aegis",
    title: "Skyfall Chronicle: Black Aegis",
    titleJapanese: "スカイフォール・クロニクル 黒のイージス",
    titleRomaji: "Sukaifōru Kuronikuru: Kuro no Ījisu",
    synonyms: ["Skyfall Chronicle"],
    type: "TV",
    episodesPlanned: 13,
    airedFrom: SKYFALL_EP1,
    airedTo: last(skyfallEps),
    year: 2009,
    premiered: { season: "spring", year: 2009 },
    broadcast: "Saturdays at 17:30 (JST)",
    studios: [10],
    source: "Original",
    genres: ["Action", "Sci-Fi", "Drama"],
    themes: ["Mecha", "Military"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "When the sky above the island nation of Aldera cracks open, armored Aegis frames are the only thing standing between its cities and the debris storm that follows. Cadet pilot Kai Seward is assigned the Black Aegis, a frame nobody else can even start. As the breach widens and the Aegis Corps runs out of time, Kai learns the frame hasn't been malfunctioning at all. It's been waiting for him.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Co-directed by Haruomi Sendo and Kaihatsu Miura. Miura's tight episode pacing is often credited for packing the story into a single cour.", visibleFrom: null },
    ],
    staff: [
      { personId: 40, role: "Director" },
      { personId: 2, role: "Co-Director" },
      { personId: 41, role: "Series Composition" },
      { personId: 43, role: "Character Design" },
      { personId: 42, role: "Music" },
    ],
    characters: [
      { characterId: 108, role: "Main" },
      { characterId: 109, role: "Main" },
      { characterId: 110, role: "Supporting" },
      { characterId: 111, role: "Supporting" },
    ],
    voices: [v(108, 21), v(109, 25), v(110, 26), v(111, 29)],
    themesSongs: [
      { kind: "Opening", title: "Iron Wings", artist: "Vanguard Nine", visibleFrom: null },
      { kind: "Ending", title: "Clear Skies", artist: "Sena Arisugawa", visibleFrom: null },
    ],
    episodeList: skyfallEps,
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 7.95, scoredBy: 51880, source: SCORE_SOURCE }],
    relations: [{ kind: "Other", target: { type: "anime", id: 9871 }, note: "Same studio, director and writer." }],
    provenance: "reconstructed",
    sources: [SRC.munchyRoll, SRC.sakugaThread, ...R],
  }),

  // ── Zero Latitude (Summer 2010) ─────────────────────────────────────────
  entry({
    id: 7741,
    slug: "Zero_Latitude",
    title: "Zero Latitude",
    titleJapanese: "ゼロ・ラティチュード",
    titleRomaji: "Zero Ratichūdo",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: ZERO_EP1,
    airedTo: last(zeroEps),
    year: 2010,
    premiered: { season: "summer", year: 2010 },
    broadcast: "Tuesdays at 24:30 (JST)",
    studios: [11],
    licensors: [{ companyId: 5, visibleFrom: null }],
    source: "Original",
    genres: ["Sci-Fi", "Mystery", "Drama"],
    themes: ["Time Travel"],
    duration: "23 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "The research ship Equinox sails the equator to study a phenomenon that stops compasses dead: at zero latitude, time skips forward a few seconds every night. Seventeen-year-old navigator-in-training Aoi Minase notices the skips are getting longer, and that someone aboard remembers the missing seconds. Between night watches, a captain who trusts only the logbook, and a physicist with a theory he won't share, Aoi has eleven nights to find out where the time is going.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Episode 7, \"One Continuous Morning\", contains a four-minute single-take sequence storyboarded by Tomoe Suzuhara that is still one of the most talked-about cuts of 2010.", visibleFrom: null },
      { text: "Director Kaihatsu Miura's first series as sole director.", visibleFrom: null },
    ],
    staff: [
      { personId: 2, role: "Director" },
      { personId: 44, role: "Series Composition" },
      { personId: 5, role: "Storyboard", note: "Episode 7 long-take sequence" },
      { personId: 47, role: "Character Design" },
      { personId: 45, role: "Music" },
    ],
    characters: [
      { characterId: 112, role: "Main" },
      { characterId: 113, role: "Main" },
      { characterId: 114, role: "Supporting" },
      { characterId: 115, role: "Supporting" },
    ],
    voices: [v(112, 22), v(113, 27), v(114, 25), v(115, 26)],
    themesSongs: [
      { kind: "Opening", title: "Equator Line", artist: "Paper Satellite", visibleFrom: null },
      { kind: "Ending", title: "Seven Seconds", artist: "Hanae Tsukishiro", visibleFrom: null },
    ],
    episodeList: zeroEps,
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 8.34, scoredBy: 68412, source: SCORE_SOURCE }],
    provenance: "reconstructed",
    sources: [SRC.munchyRoll, SRC.sakugaThread, SRC.yalEp1Page4, ...R],
  }),

  // ── River of Sparks (Fall 2010) ─────────────────────────────────────────
  entry({
    id: 8452,
    slug: "River_of_Sparks",
    title: "River of Sparks",
    titleJapanese: "火花の川",
    titleRomaji: "Hibana no Kawa",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: RIVER_EP1,
    airedTo: last(riverEps),
    year: 2010,
    premiered: { season: "fall", year: 2010 },
    broadcast: "Thursdays at 25:00 (JST)",
    studios: [12],
    source: "Original",
    genres: ["Action", "Drama"],
    themes: ["Martial Arts", "Urban"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "In the canal district of Hanabishi, street fighters settle their debts on the stone embankments while festival fireworks cover the noise. Former champion Souta Kirishima swore he was done fighting, until his younger sister's teahouse ended up on the wrong side of a bet. Now he has one autumn to win it back from the reigning champion, Ironside, without breaking the promise he made to Hotaru.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "The alley fights were storyboarded by Tomoe Suzuhara with action choreography by Yusuke Kagura, a pairing fans still bring up whenever a new fight series airs.", visibleFrom: null },
    ],
    staff: [
      { personId: 49, role: "Director" },
      { personId: 51, role: "Series Composition" },
      { personId: 5, role: "Storyboard", note: "Alley fight sequences" },
      { personId: 9, role: "Action Choreography" },
      { personId: 50, role: "Music" },
    ],
    characters: [
      { characterId: 119, role: "Main" },
      { characterId: 120, role: "Main" },
      { characterId: 121, role: "Supporting" },
      { characterId: 122, role: "Supporting" },
    ],
    voices: [v(119, 21), v(120, 28), v(121, 29), v(122, 30)],
    themesSongs: [
      { kind: "Opening", title: "Spark Embankment", artist: "Vanguard Nine", visibleFrom: null },
      { kind: "Ending", title: "Lantern Boat", artist: "Hanae Tsukishiro", visibleFrom: null },
    ],
    episodeList: riverEps,
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 8.12, scoredBy: 47306, source: SCORE_SOURCE }],
    relations: [{ kind: "Other", target: { type: "anime", id: 6230 }, note: "Same studio and director." }],
    provenance: "reconstructed",
    sources: [SRC.sakugaThread, SRC.yalEp1Page4, ...R],
  }),

  // ── Steelbound Testament (2010 film) ────────────────────────────────────
  entry({
    id: 9133,
    slug: "Steelbound_Testament",
    title: "Steelbound Testament",
    titleJapanese: "鋼の遺言",
    titleRomaji: "Hagane no Yuigon",
    type: "Movie",
    episodesPlanned: 1,
    airedFrom: "2010-11-12T15:00:00Z",
    airedTo: "2010-11-12T15:00:00Z",
    year: 2010,
    releaseNote: "Theatrical release, Nov 13, 2010",
    studios: [2],
    source: "Original",
    genres: ["Action", "Drama", "Mystery"],
    themes: ["Steampunk"],
    duration: "1 hr. 52 min.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "In a city held together by iron bridges, disgraced locksmith Edda Varn is hired to open a vault that has stayed shut for fifty years. Inside is the last will of the Architect, the man who built the city, and three factions are ready to go to war over what it says. With bridge warden Marcus Holloway breaking every oath he swore to help her, Edda has one night to read the testament before the city decides for her.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Produced by Flow Pictures' cinematic unit, the same staff culture that later carried into Studio Burst.", visibleFrom: null },
      { text: "Widely considered the film that made Flow Pictures' cinematic unit famous.", visibleFrom: null },
    ],
    staff: [
      { personId: 60, role: "Director" },
      { personId: 58, role: "Character Design" },
      { personId: 59, role: "Music" },
    ],
    characters: [
      { characterId: 116, role: "Main" },
      { characterId: 117, role: "Main" },
      { characterId: 118, role: "Supporting" },
    ],
    voices: [v(116, 24), v(117, 31), v(118, 29)],
    themesSongs: [{ kind: "Ending", title: "Testament", artist: "Clockwork Lily", visibleFrom: null }],
    episodeList: [{ number: 1, title: "Steelbound Testament", airedAt: "2010-11-12T15:00:00Z", note: "Theatrical release" }],
    scores: [{ capturedAt: ARCHIVE_OPEN, score: 8.41, scoredBy: 39775, source: SCORE_SOURCE }],
    relations: [{ kind: "Other", target: { type: "anime", id: 10380 }, note: "Same studio unit (Flow Pictures)." }],
    provenance: "reconstructed",
    sources: [SRC.aniWirePremiere, ...R],
  }),

  // ── Sinful Apex (Summer 2011 – Winter 2012) ─────────────────────────────
  entry({
    id: 10380,
    slug: "Sinful_Apex",
    title: "Sinful Apex",
    titleJapanese: "シンフル・エイペックス",
    titleRomaji: "Shinfuru Eipekkusu",
    type: "TV",
    episodesPlanned: 24,
    airedFrom: SINFUL_EP1,
    airedTo: last(sinfulEps),
    year: 2011,
    premiered: { season: "summer", year: 2011 },
    broadcast: "Mondays at 25:00 (JST)",
    broadcasts: [
      { label: "Japanese TV premiere", at: SINFUL_EP1 },
      { label: "Japanese TV finale (Episode 24)", at: last(sinfulEps) },
    ],
    studios: [2],
    licensors: [{ companyId: 5, visibleFrom: null }],
    source: "Original",
    genres: ["Action", "Drama", "Supernatural"],
    themes: ["Mythology"],
    duration: "24 min. per ep.",
    rating: "R - 17+ (violence & profanity)",
    synopsis:
      "Seven towers rise over the city of Vellmore, and each is ruled by someone who made a deal with a sin. Whoever reaches the top of all seven, the Apex, is granted a single wish. Mercenary Lyle Crane is climbing for money. Street thief Nico Vale is climbing to clear a debt and sings to keep her nerve on the endless stairways. Floor by floor, the two find out what every tower lord already knows: everyone in Vellmore wants that wish.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      {
        text: "Produced by Flow Pictures' late-era cinematic unit, the production is often described as the studio's \"final breath\". The unit went on to form Studio Burst.",
        visibleFrom: null,
      },
      { text: "The singer LUNE appears as Aria Moonbirth, Vellmore's most famous performer, and sings the ending theme in character.", visibleFrom: null },
      { text: "Funmaxation is releasing a Complete Collection on Blu-ray on November 19, 2013.", visibleFrom: "2013-10-06T00:00:00Z" },
    ],
    staff: [
      { personId: 2, role: "Director" },
      { personId: 57, role: "Series Composition" },
      { personId: 58, role: "Character Design" },
      { personId: 59, role: "Music" },
      { personId: 14, role: "Appearance", note: "As the fictional singer Aria Moonbirth" },
    ],
    characters: [
      { characterId: 123, role: "Main" },
      { characterId: 124, role: "Main" },
      { characterId: 125, role: "Supporting" },
      { characterId: 126, role: "Supporting" },
      { characterId: 127, role: "Supporting" },
    ],
    voices: [v(123, 31), v(124, 20), v(125, 24), v(126, 14), v(127, 27)],
    themesSongs: [
      { kind: "Opening", title: "Seven Steps to Heaven", artist: "STRAYLIGHT", visibleFrom: null },
      { kind: "Ending", title: "Moonbirth", artist: "Aria Moonbirth (LUNE)", visibleFrom: null },
      { kind: "Insert", title: "Between Floors", artist: "Aria Moonbirth (LUNE)", episodes: "15", visibleFrom: null },
    ],
    episodeList: sinfulEps.map((e) => (e.number === 24 ? { ...e, threadId: "t-21990" } : e)),
    scores: [
      { capturedAt: ARCHIVE_OPEN, score: 8.44, scoredBy: 71402, source: SCORE_SOURCE },
      { capturedAt: "2012-01-30T03:00:00Z", score: 8.47, scoredBy: 88931, source: SCORE_SOURCE },
    ],
    relations: [{ kind: "Other", target: { type: "anime", id: 9133 }, note: "Same studio unit (Flow Pictures)." }],
    provenance: "reconstructed",
    sources: [SRC.brief, SRC.archiveBrief, SRC.aniFanWiki, SRC.munchyRoll, ...R],
  }),

  // ── Glass Cathedral (Winter 2012) ───────────────────────────────────────
  entry({
    id: 4407,
    slug: "Glass_Cathedral",
    title: "Glass Cathedral",
    titleJapanese: "硝子の大聖堂",
    titleRomaji: "Garasu no Daiseidō",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: GLASS_EP1,
    airedTo: last(glassEps),
    year: 2012,
    premiered: { season: "winter", year: 2012 },
    broadcast: "Wednesdays at 25:30 (JST)",
    broadcasts: [{ label: "Japanese TV premiere (VBS/KBS)", at: GLASS_EP1 }],
    studios: [11],
    source: "Original",
    genres: ["Mystery", "Drama", "Fantasy"],
    themes: ["Gothic"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "Every pane of the Glass Cathedral in Lindenmoor holds a memory donated by someone in town. When the windows begin going dark one by one, apprentice restorer Elise Hartmann has to find out whose memories are fading, and why the cathedral's newest window shows a morning that hasn't happened yet.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Studio Kinemachi reunited with series composer Tamaki Hoshino and character designer Sayo Kuramoto after Zero Latitude.", visibleFrom: GLASS_LISTED },
    ],
    visibleFrom: GLASS_LISTED,
    staff: [
      { personId: 46, role: "Director" },
      { personId: 44, role: "Series Composition" },
      { personId: 47, role: "Character Design" },
      { personId: 45, role: "Music" },
    ],
    characters: [
      { characterId: 128, role: "Main" },
      { characterId: 130, role: "Main" },
      { characterId: 129, role: "Supporting" },
      { characterId: 131, role: "Supporting" },
    ],
    voices: [v(128, 24), v(130, 26), v(129, 27), v(131, 30)],
    themesSongs: [
      { kind: "Opening", title: "Stained Memory", artist: "Clockwork Lily", visibleFrom: GLASS_EP1 },
      { kind: "Ending", title: "Morning Window", artist: "Hanae Tsukishiro", visibleFrom: GLASS_EP1 },
    ],
    episodeList: glassEps.map((e) => (e.number === 12 ? { ...e, threadId: "t-24410" } : e)),
    scores: [{ capturedAt: "2012-04-02T03:00:00Z", score: 7.71, scoredBy: 24560, source: SCORE_SOURCE }],
    streaming: [{ name: "MunchyRoll", note: "Subtitled simulcast", visibleFrom: GLASS_EP1 }],
    relations: [{ kind: "Other", target: { type: "anime", id: 7741 }, note: "Same studio and writer." }],
    provenance: "reconstructed",
    sources: [SRC.brief, ...R],
  }),

  // ── Circuit Hearts: Reload (Spring 2012) ────────────────────────────────
  entry({
    id: 9608,
    slug: "Circuit_Hearts__Reload",
    title: "Circuit Hearts: Reload",
    titleJapanese: "サーキット・ハーツ リロード",
    titleRomaji: "Sākitto Hātsu: Rirōdo",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: CIRCUIT_EP1,
    airedTo: last(circuitEps),
    year: 2012,
    premiered: { season: "spring", year: 2012 },
    broadcast: "Fridays at 24:30 (JST)",
    studios: [14],
    source: "Original",
    genres: ["Sci-Fi", "Comedy", "Slice of Life"],
    themes: ["Idols", "Music"],
    duration: "24 min. per ep.",
    rating: "PG - Children",
    synopsis:
      "In 2042, the android idol unit Circuit Hearts retired after one perfect concert. Ten years later, junk-shop kid Yuu Takamine finds their lead singer's core in a box of spare parts, and Nanase wakes up convinced it's still the night of the show. To finish that concert, the band has to be rebuilt, reloaded and re-rehearsed by someone who can fix anything but can't sing a note.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Studio Pulsewave animated the concert scenes in full, with every song performed in character.", visibleFrom: CIRCUIT_LISTED },
    ],
    visibleFrom: CIRCUIT_LISTED,
    staff: [
      { personId: 55, role: "Director" },
      { personId: 51, role: "Series Composition" },
      { personId: 43, role: "Character Design" },
      { personId: 56, role: "Music" },
    ],
    characters: [
      { characterId: 132, role: "Main" },
      { characterId: 133, role: "Main" },
      { characterId: 134, role: "Supporting" },
      { characterId: 135, role: "Supporting" },
    ],
    voices: [v(132, 28), v(133, 23), v(134, 30), v(135, 27)],
    themesSongs: [
      { kind: "Opening", title: "Reload My Heart", artist: "Circuit Hearts", visibleFrom: CIRCUIT_EP1 },
      { kind: "Ending", title: "Spare Parts Lullaby", artist: "Paper Satellite", visibleFrom: CIRCUIT_EP1 },
      { kind: "Insert", title: "The Setlist We Never Played", artist: "Circuit Hearts", episodes: "9", visibleFrom: CIRCUIT_EP9 },
    ],
    episodeList: circuitEps.map((e) => (e.number === 12 ? { ...e, threadId: "t-26890" } : e)),
    scores: [{ capturedAt: "2012-06-25T03:00:00Z", score: 7.34, scoredBy: 19842, source: SCORE_SOURCE }],
    streaming: [{ name: "MunchyRoll", note: "Subtitled simulcast", visibleFrom: CIRCUIT_EP1 }],
    provenance: "reconstructed",
    sources: [SRC.brief, ...R],
  }),

  // ── Vacant Crown: Liminal War (Summer – Fall 2012) ──────────────────────
  entry({
    id: 9871,
    slug: "Vacant_Crown__Liminal_War",
    title: "Vacant Crown: Liminal War",
    titleJapanese: "空位の王冠 リミナル・ウォー",
    titleRomaji: "Kūi no Ōkan: Riminaru Wō",
    type: "TV",
    episodesPlanned: 24,
    airedFrom: VACANT_EP1,
    airedTo: last(vacantEps),
    year: 2012,
    premiered: { season: "summer", year: 2012 },
    broadcast: "Saturdays at 17:00 (JST)",
    broadcasts: [{ label: "Japanese TV premiere (VBS/KBS)", at: VACANT_EP1 }],
    studios: [10],
    licensors: [{ companyId: 5, visibleFrom: "2012-10-01T00:00:00Z" }],
    source: "Original",
    genres: ["Fantasy", "Action", "Drama"],
    themes: ["Military", "Political"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "The king of Varos died without an heir, and his throne has stood empty for nine years. Along the kingdom's liminal border, a twilight realm where the armies of the old kings still march, five claimants are fighting for a crown no one has dared to wear. Orphan cartographer Mirelle Aubert can map that border, which makes her the most valuable person on the continent and puts her right in the middle of the war.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Arc Meridian's first two-cour series, reuniting the Skyfall Chronicle team of director Haruomi Sendo, writer Mizuki Tobe and composer Kazane Ichijo.", visibleFrom: VACANT_LISTED },
      { text: "Funmaxation has licensed the series for North America.", visibleFrom: "2012-10-01T00:00:00Z" },
    ],
    visibleFrom: VACANT_LISTED,
    staff: [
      { personId: 40, role: "Director" },
      { personId: 41, role: "Series Composition" },
      { personId: 43, role: "Character Design" },
      { personId: 42, role: "Music" },
    ],
    characters: [
      { characterId: 136, role: "Main" },
      { characterId: 137, role: "Main" },
      { characterId: 138, role: "Supporting" },
      { characterId: 139, role: "Supporting" },
      { characterId: 140, role: "Supporting" },
    ],
    voices: [v(136, 22), v(137, 21), v(138, 29), v(139, 24), v(140, 32)],
    themesSongs: [
      { kind: "Opening", title: "Crownless", artist: "Vanguard Nine", episodes: "1-12", visibleFrom: VACANT_EP1 },
      { kind: "Opening", title: "Liminal", artist: "STRAYLIGHT", episodes: "13-24", visibleFrom: vacantEps[12].airedAt },
      { kind: "Ending", title: "Cartographer", artist: "Sena Arisugawa", visibleFrom: VACANT_EP1 },
    ],
    episodeList: vacantEps.map((e) => (e.number === 24 ? { ...e, threadId: "t-28655" } : e)),
    scores: [{ capturedAt: "2012-12-17T03:00:00Z", score: 8.05, scoredBy: 36220, source: SCORE_SOURCE }],
    streaming: [{ name: "MunchyRoll", note: "Subtitled simulcast", visibleFrom: VACANT_EP1 }],
    relations: [{ kind: "Other", target: { type: "anime", id: 5120 }, note: "Same studio, director and writer." }],
    provenance: "reconstructed",
    sources: [SRC.brief, ...R],
  }),

  // ── Ghost Eater (Winter 2013) ───────────────────────────────────────────
  entry({
    id: 6811,
    slug: "Ghost_Eater",
    title: "Ghost Eater",
    titleJapanese: "ゴーストイーター",
    titleRomaji: "Gōsuto Ītā",
    type: "TV",
    episodesPlanned: 12,
    airedFrom: GHOST_EP1,
    airedTo: last(ghostEps),
    year: 2013,
    premiered: { season: "winter", year: 2013 },
    broadcast: "Thursdays at 25:28 (JST)",
    studios: [13],
    source: "Original",
    genres: ["Supernatural", "Comedy", "Action"],
    themes: ["School"],
    duration: "24 min. per ep.",
    rating: "PG-13 - Teens 13 or older",
    synopsis:
      "High schooler Kenji Sakuraba can eat ghosts, and every one tastes like whatever it regretted most. Hired by Tsubaki Hoshimiya, a shrine maiden with a business plan and a very long client list, he becomes the city's least enthusiastic exorcist, one ghost at a time. Between a resident ghost who won't leave until her drama finishes and a detective who keeps getting his cases, Kenji's appetite has never been busier.",
    synopsisSource: "Written by YAL Rewrite",
    background: [
      { text: "Ashgrove Animation and director Shizuka Ogura's first series together since Azure Sorcerer.", visibleFrom: GHOST_LISTED },
    ],
    visibleFrom: GHOST_LISTED,
    staff: [
      { personId: 52, role: "Director" },
      { personId: 51, role: "Series Composition" },
      { personId: 53, role: "Character Design" },
      { personId: 54, role: "Music" },
    ],
    characters: [
      { characterId: 141, role: "Main" },
      { characterId: 142, role: "Main" },
      { characterId: 143, role: "Supporting" },
      { characterId: 144, role: "Supporting" },
    ],
    voices: [v(141, 23), v(142, 28), v(143, 25), v(144, 31)],
    themesSongs: [
      { kind: "Opening", title: "Itadakimasu Ghost!", artist: "Paper Satellite", visibleFrom: GHOST_EP1 },
      { kind: "Ending", title: "Leftover Moon", artist: "Clockwork Lily", visibleFrom: GHOST_EP1 },
    ],
    episodeList: ghostEps.map((e) => (e.number === 12 ? { ...e, threadId: "t-30120" } : e)),
    scores: [{ capturedAt: "2013-04-01T03:00:00Z", score: 7.58, scoredBy: 21009, source: SCORE_SOURCE }],
    streaming: [{ name: "MunchyRoll", note: "Subtitled simulcast", visibleFrom: GHOST_EP1 }],
    relations: [{ kind: "Other", target: { type: "anime", id: 3390 }, note: "Same studio and director." }],
    provenance: "reconstructed",
    sources: [SRC.brief, ...R],
  }),
];
