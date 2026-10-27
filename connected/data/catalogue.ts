// The anime facts every Connected Era site shares, taken from the Connected
// Era Master Bible (docs/bible): Flow Pictures' earlier catalogue (ch. 18),
// its people registry, LUNE's songs (ch. 19) and the franchise registry
// (ch. 16). AniWire, the Flow Pictures site and AniFanWiki all read from
// here, and YourAnimeList carries the same facts, so the sites
// never disagree. Anything the Bible leaves open stays out.

export type Format = "TV" | "Film" | "OVA" | "TV special";

export interface CatalogueTitle {
  slug: string;
  title: string;
  /** First year, and a readable span when it ran longer. */
  year: number;
  years: string;
  format: Format;
  /** Extra shape from the Bible: "2 cours", "OVA trilogy"... */
  shape?: string;
  description: string;
  /** Registry staff (person slugs) and LUNE's song, when the Bible names one. */
  staff: string[];
  song?: string;
  /** Its YourAnimeList entry. */
  yal: { id: number; slug: string };
  related?: { slug: string; label: string }[];
  /** Only for titles whose studio the Bible states. */
  studio?: string;
}

export interface CataloguePerson {
  slug: string;
  name: string;
  role: string;
  yal: { id: number; slug: string };
  works: string[];
}

export const catalogue: CatalogueTitle[] = [
  { slug: "vacant-crown", title: "Vacant Crown: Liminal War", year: 2000, years: "2000", format: "TV", shape: "with an OVA", description: "Supernatural weapons and wide-angle military conflict.", staff: ["tomoe-suzuhara", "rento-shibasaki"], song: "Gesshoku / Requiem for Zero", yal: { id: 9871, slug: "Vacant_Crown__Liminal_War" } },
  { slug: "river-of-sparks", title: "River of Sparks", year: 2004, years: "Winter 2004", format: "TV", description: "Delinquent school life, urban magic and close-quarters fighting.", staff: ["yusuke-kagura", "aoi-tachikaze"], yal: { id: 8452, slug: "River_of_Sparks" } },
  { slug: "glass-cathedral", title: "Glass Cathedral", year: 2005, years: "2005", format: "Film", description: "Supernatural crime and stained-glass imagery.", staff: ["tomoe-suzuhara", "aoi-tachikaze"], song: "VITRAIL", yal: { id: 4407, slug: "Glass_Cathedral" } },
  { slug: "skyfall-chronicle", title: "Skyfall Chronicle", year: 2006, years: "2006–2007", format: "TV", shape: "2 cours", description: "Floating citadels and warfare.", staff: ["kaihatsu-miura"], yal: { id: 4812, slug: "Skyfall_Chronicle" }, related: [{ slug: "black-aegis", label: "Sequel" }] },
  { slug: "iron-halo-brigade", title: "Iron Halo Brigade", year: 2007, years: "2007", format: "TV", shape: "1 cour", description: "Military mecha and infantry, told with realistic tactics.", staff: [], yal: { id: 7390, slug: "Iron_Halo_Brigade" } },
  { slug: "neon-afterimage", title: "Neon Afterimage", year: 2007, years: "2007", format: "Film", description: "Rain-soaked urban science fiction.", staff: ["mirai-kanzaki"], song: "AFTER//IMAGE", yal: { id: 6230, slug: "Neon_Afterimage" } },
  { slug: "tearfall-resonance", title: "Tearfall Resonance", year: 2007, years: "2007", format: "Film", description: "Two siblings at the centre of a psychic event that shakes their whole city.", staff: [], yal: { id: 7123, slug: "Tearfall_Resonance" } },
  { slug: "circuit-hearts", title: "Circuit Hearts: Reload", year: 2008, years: "2008", format: "TV", shape: "1 cour", description: "Illegal neural-gear competitions.", staff: [], song: "PULSE:RE", yal: { id: 9608, slug: "Circuit_Hearts__Reload" } },
  { slug: "steelbound-testament", title: "Steelbound Testament", year: 2008, years: "2008–2009", format: "TV", shape: "2 cours", description: "Dark fantasy about family and war.", staff: ["keito-kisaragi", "lio-haraguchi", "rento-shibasaki"], song: "ALETHEIA / Ashes Know My Name", yal: { id: 9133, slug: "Steelbound_Testament" }, related: [{ slug: "garden-of-cinders", label: "Side story" }] },
  { slug: "pale-garden-reverie", title: "Pale Garden Reverie", year: 2009, years: "2009", format: "TV", shape: "1 cour", description: "Quiet, supernatural environmental storytelling.", staff: ["keito-kisaragi"], yal: { id: 8277, slug: "Pale_Garden_Reverie" } },
  { slug: "nocturne-of-the-iron-sea", title: "Nocturne of the Iron Sea", year: 2009, years: "2009", format: "Film", description: "A naval horror-adventure.", staff: [], yal: { id: 8640, slug: "Nocturne_of_the_Iron_Sea" } },
  { slug: "blizzard-requiem", title: "Blizzard Requiem", year: 2010, years: "2010–2011", format: "TV", shape: "split 2 cours", description: "Arctic survival and politics.", staff: ["keito-kisaragi"], yal: { id: 7015, slug: "Blizzard_Requiem" } },
  { slug: "garden-of-cinders", title: "Garden of Cinders", year: 2010, years: "2010", format: "OVA", shape: "OVA trilogy", description: "A side story to Steelbound Testament.", staff: [], yal: { id: 5904, slug: "Garden_of_Cinders" }, related: [{ slug: "steelbound-testament", label: "Parent story" }] },
  { slug: "shadowline-oratorio", title: "Shadowline Oratorio", year: 2011, years: "2011", format: "TV", shape: "1 cour", description: "Music and an assassin-choir school.", staff: [], yal: { id: 9420, slug: "Shadowline_Oratorio" } },
  { slug: "zero-latitude", title: "Zero Latitude", year: 2011, years: "2011", format: "TV special", description: "A chase across a megacity during a blackout.", staff: ["kaihatsu-miura"], yal: { id: 7741, slug: "Zero_Latitude" } },
  { slug: "sinful-apex", title: "Sinful Apex", year: 2011, years: "Aug 15, 2011 – Jan 23, 2012", format: "TV", shape: "24 episodes", description: "Flow Pictures' final marquee production.", staff: ["kaihatsu-miura", "lio-haraguchi", "yusuke-kagura", "mirai-kanzaki"], yal: { id: 10380, slug: "Sinful_Apex" }, studio: "Flow Pictures" },
  { slug: "rust-veil-junction", title: "Rust Veil Junction", year: 2012, years: "2012", format: "TV", shape: "1 cour", description: "Rival factions in a steampunk railway city.", staff: [], yal: { id: 11205, slug: "Rust_Veil_Junction" } },
  { slug: "black-aegis", title: "Skyfall Chronicle: Black Aegis", year: 2012, years: "2012", format: "Film", description: "The theatrical sky-warfare sequel to Skyfall Chronicle.", staff: [], yal: { id: 5120, slug: "Skyfall_Chronicle__Black_Aegis" }, related: [{ slug: "skyfall-chronicle", label: "Prequel" }] },
];

/** Older production credits the Bible names without broadcast or studio records. */
export const olderCredits: { title: string; staff: string[]; yal: { id: number; slug: string } }[] = [
  { title: "Ghost Eater", staff: ["yusuke-kagura"], yal: { id: 6811, slug: "Ghost_Eater" } },
  { title: "Destiny/Infinite", staff: ["lio-haraguchi"], yal: { id: 8016, slug: "Destiny_Infinite" } },
  { title: "A Mystical Skyline/Finger", staff: ["tomoe-suzuhara"], yal: { id: 6402, slug: "A_Mystical_Skyline_Finger" } },
  { title: "Azure Sorcerer", staff: [], yal: { id: 3390, slug: "Azure_Sorcerer" } },
];

export const people: CataloguePerson[] = [
  { slug: "kaihatsu-miura", name: "Kaihatsu Miura", role: "Director", yal: { id: 2, slug: "Kaihatsu_Miura" }, works: ["Skyfall Chronicle", "Zero Latitude", "Sinful Apex"] },
  { slug: "keito-kisaragi", name: "Keito Kisaragi", role: "Writer / series composition", yal: { id: 3, slug: "Keito_Kisaragi" }, works: ["Steelbound Testament", "Pale Garden Reverie", "Blizzard Requiem"] },
  { slug: "tomoe-suzuhara", name: "Tomoe Suzuhara", role: "Storyboards", yal: { id: 5, slug: "Tomoe_Suzuhara" }, works: ["Vacant Crown: Liminal War", "Glass Cathedral", "A Mystical Skyline/Finger"] },
  { slug: "lio-haraguchi", name: "Lio Haraguchi", role: "Characters / animation", yal: { id: 4, slug: "Lio_Haraguchi" }, works: ["Destiny/Infinite", "Steelbound Testament", "Sinful Apex"] },
  { slug: "yusuke-kagura", name: "Yusuke Kagura", role: "Fight choreography", yal: { id: 9, slug: "Yusuke_Kagura" }, works: ["River of Sparks", "Ghost Eater", "Sinful Apex"] },
  { slug: "mirai-kanzaki", name: "Mirai Kanzaki", role: "Colour design", yal: { id: 7, slug: "Mirai_Kanzaki" }, works: ["Neon Afterimage", "Sinful Apex"] },
  { slug: "aoi-tachikaze", name: "Aoi Tachikaze", role: "Sound direction", yal: { id: 8, slug: "Aoi_Tachikaze" }, works: ["River of Sparks", "Glass Cathedral"] },
  { slug: "rento-shibasaki", name: "Rento Shibasaki", role: "Music", yal: { id: 15, slug: "Rento_Shibasaki" }, works: ["Vacant Crown: Liminal War", "Steelbound Testament"] },
];

export const LUNE = {
  name: "LUNE",
  realName: "Lena Moonlight",
  bio: "Lena Moonlight, who performs as LUNE, is an independent singer-songwriter. She debuted professionally in 2006 at age 13, has sung for several Flow Pictures productions, and appeared as the singer Aria Moonbirth in Sinful Apex.",
  yal: { id: 14, slug: "LUNE" },
  songs: catalogue.filter((t) => t.song).map((t) => ({ song: t.song!, title: t.title, slug: t.slug })),
};

/** Iron to Requiem's first season (franchise registry): CHAOS Home, 26 Thursdays. */
export const IRON_TO_REQUIEM = {
  title: "Iron to Requiem",
  studio: "CHAOS Home",
  episodes: 26,
  premiere: "2013-04-03T15:00:00Z", // Thursday, Apr 4, 2013 (JST)
  finale: "2013-09-25T15:00:00Z", // Thursday, Sep 26, 2013 (JST)
  music: "Hiroyuki Sawano",
  yal: { id: 16592, slug: "Iron_to_Requiem" },
};

export const SINFUL_APEX_DATES = { premiere: "2011-08-14T15:00:00Z", finale: "2012-01-22T15:00:00Z" }; // Mondays, JST

export const YAL_HOST = "yal.connectedera.local";
export const yalAnimeUrl = (t: { yal: { id: number; slug: string } }) => `http://${YAL_HOST}/anime/${t.yal.id}/${t.yal.slug}`;
export const yalPersonUrl = (p: { yal: { id: number; slug: string } }) => `http://${YAL_HOST}/people/${p.yal.id}/${p.yal.slug}`;
export const titleBySlug = (slug: string) => catalogue.find((t) => t.slug === slug);
export const personBySlug = (slug: string) => people.find((p) => p.slug === slug);
export const FORMAT_LABEL: Record<Format, string> = { TV: "TV series", Film: "Film", OVA: "OVA", "TV special": "TV special" };
