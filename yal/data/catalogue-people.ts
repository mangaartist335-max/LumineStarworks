// Studios, staff and characters for the built-out back catalogue.
//
// These records were written for the Lumine StarWorks reconstruction (every
// one is labelled through its sources). They extend, and never contradict,
// the established facts: Flow Pictures made Sinful Apex and Steelbound
// Testament, Kaihatsu Miura directed Zero Latitude and Sinful Apex and
// co-directed Skyfall Chronicle, Tomoe Suzuhara boarded the Zero Latitude
// long take and the River of Sparks alley fights, and Yusuke Kagura
// choreographed River of Sparks. Nothing here is credited to Studio Burst.

import type { Character, Company, Person } from "./types";
import { SRC } from "./sources";

const R = [SRC.reconstruction];

export const catalogueCompanies: Company[] = [
  {
    id: 10,
    slug: "Arc_Meridian",
    name: "Arc Meridian",
    kinds: ["Studio"],
    about: "Animation studio known for large-scale sci-fi and fantasy productions, from aerial mecha battles to two-cour war epics.",
    visibleFrom: null,
    sources: R,
  },
  {
    id: 11,
    slug: "Studio_Kinemachi",
    name: "Studio Kinemachi",
    kinds: ["Studio"],
    about: "Animation studio with a reputation for quiet, carefully paced mystery and drama series.",
    visibleFrom: null,
    sources: R,
  },
  {
    id: 12,
    slug: "Tsukiyo_Pictures",
    name: "Tsukiyo Pictures",
    kinds: ["Studio"],
    about: "Animation studio specialising in late-night action, with a strong in-house layout and choreography team.",
    visibleFrom: null,
    sources: R,
  },
  {
    id: 13,
    slug: "Ashgrove_Animation",
    name: "Ashgrove Animation",
    kinds: ["Studio"],
    about: "Animation studio known for bright, comedic fantasy and supernatural series.",
    visibleFrom: null,
    sources: R,
  },
  {
    id: 14,
    slug: "Studio_Pulsewave",
    name: "Studio Pulsewave",
    kinds: ["Studio"],
    about: "Animation studio focused on music-driven productions and concert animation.",
    visibleFrom: null,
    sources: R,
  },
];

const staff = (id: number, slug: string, name: string, occupations: string[], about?: string): Person => ({
  id,
  slug,
  name,
  occupations,
  about,
  visibleFrom: null,
  sources: R,
});

const voice = (id: number, name: string, nativeName: string): Person => ({
  id,
  slug: name.replace(/ /g, "_"),
  name,
  nativeName,
  occupations: ["Voice actor"],
  visibleFrom: null,
  sources: [SRC.voiceCast],
});

export const cataloguePeople: Person[] = [
  staff(40, "Haruomi_Sendo", "Haruomi Sendo", ["Director"], "Director at Arc Meridian, known for aerial combat and sweeping ensemble war stories."),
  staff(41, "Mizuki_Tobe", "Mizuki Tobe", ["Series composition", "Writer"]),
  staff(42, "Kazane_Ichijo", "Kazane Ichijo", ["Composer"], "Composer of orchestral, choir-heavy scores."),
  staff(43, "Riku_Asahina", "Riku Asahina", ["Character designer"]),
  staff(44, "Tamaki_Hoshino", "Tamaki Hoshino", ["Series composition", "Writer"], "Writer of slow-burn mysteries, often in collaboration with Studio Kinemachi."),
  staff(45, "Yoshiro_Kanda", "Yoshiro Kanda", ["Composer"]),
  staff(46, "Chie_Morisawa", "Chie Morisawa", ["Director"]),
  staff(47, "Sayo_Kuramoto", "Sayo Kuramoto", ["Character designer"]),
  staff(48, "Ren_Okado", "Ren Okado", ["Layout artist", "Animator"], "Layout artist known for silhouette readability in fast action, a skill fans trace back to Neon Afterimage."),
  staff(49, "Daichi_Murase", "Daichi Murase", ["Director"], "Director at Tsukiyo Pictures."),
  staff(50, "Emi_Takatsuki", "Emi Takatsuki", ["Composer"], "Composer mixing electronic beats with traditional instruments."),
  staff(51, "Kouhei_Narumi", "Kouhei Narumi", ["Series composition", "Writer"]),
  staff(52, "Shizuka_Ogura", "Shizuka Ogura", ["Director"], "Director at Ashgrove Animation, known for comedic timing."),
  staff(53, "Hinako_Sera", "Hinako Sera", ["Character designer"]),
  staff(54, "Akito_Kurose", "Akito Kurose", ["Composer"]),
  staff(55, "Shiori_Amane", "Shiori Amane", ["Director"], "Director of concert-driven animation at Studio Pulsewave."),
  staff(56, "Ken_Mizushiro", "Ken Mizushiro", ["Composer"]),
  staff(57, "Yuuto_Hayasaka", "Yuuto Hayasaka", ["Series composition", "Writer"]),
  staff(58, "Mai_Kisaki", "Mai Kisaki", ["Character designer"], "Character designer from Flow Pictures' cinematic unit."),
  staff(59, "Takuma_Saeki", "Takuma Saeki", ["Composer"], "Composer for Flow Pictures' cinematic unit."),
  staff(60, "Aki_Fujisawa", "Aki Fujisawa", ["Director"], "Film director from Flow Pictures' cinematic unit."),

  // Japanese voice cast. Real voice actors, each cast only in titles that aired
  // after their career began (research notes in docs/VOICE_CASTING.md).
  voice(61, "Rie Kugimiya", "釘宮理恵"),
  voice(62, "Tesshou Genda", "玄田哲章"),
  voice(63, "Miyuki Sawashiro", "沢城みゆき"),
  voice(64, "Jouji Nakata", "中田譲治"),
  voice(65, "Mamoru Miyano", "宮野真守"),
  voice(66, "Romi Park", "朴璐美"),
  voice(67, "Yuuichi Nakamura", "中村悠一"),
  voice(68, "Rikiya Koyama", "小山力也"),
  voice(69, "Toshiyuki Morikawa", "森川智之"),
  voice(70, "Sayaka Oohara", "大原さやか"),
  voice(71, "Maaya Sakamoto", "坂本真綾"),
  voice(72, "Norio Wakamoto", "若本規夫"),
  voice(73, "Youko Hikasa", "日笠陽子"),
  voice(74, "Mamiko Noto", "能登麻美子"),
  voice(75, "Daisuke Ono", "小野大輔"),
  voice(76, "Kenyuu Horiuchi", "堀内賢雄"),
  voice(77, "Haruka Tomatsu", "戸松遥"),
  voice(78, "Yuuki Kaji", "梶裕貴"),
  voice(79, "Junichi Suwabe", "諏訪部順一"),
  voice(80, "Jun Fukuyama", "福山潤"),
  voice(81, "Akio Ootsuka", "大塚明夫"),
  voice(82, "Ami Koshimizu", "小清水亜美"),
  voice(83, "Yoshitsugu Matsuoka", "松岡禎丞"),
  voice(84, "Kikuko Inoue", "井上喜久子"),
];

const char = (
  id: number,
  slug: string,
  name: string,
  role: string,
  bio: { text: string; revealedAt?: string | null }[],
  relationships: { characterId: number; label: string; revealedAt?: string | null }[] = [],
  visibleFrom: string | null = null,
): Character => ({
  id,
  slug,
  name,
  role,
  visibleFrom,
  bio: bio.map((b) => ({ text: b.text, revealedAt: b.revealedAt ?? null })),
  relationships: relationships.map((r) => ({ ...r, revealedAt: r.revealedAt ?? null })),
  sources: R,
});

// Air times used for facts revealed mid-season (see catalogue-anime.ts).
export const GLASS_EP8 = "2012-02-29T16:30:00Z";
export const CIRCUIT_EP9 = "2012-06-01T15:30:00Z";
export const VACANT_EP21 = "2012-11-24T08:00:00Z";
export const GHOST_EP7 = "2013-02-21T16:28:00Z";
export const SINFUL_EP23 = "2012-01-16T16:00:00Z";

export const GLASS_LISTED = "2011-12-10T03:00:00Z";
export const CIRCUIT_LISTED = "2012-03-01T03:00:00Z";
export const VACANT_LISTED = "2012-06-01T03:00:00Z";
export const GHOST_LISTED = "2012-12-01T03:00:00Z";

export const catalogueCharacters: Character[] = [
  // Azure Sorcerer (2006)
  char(101, "Rio_Ashby", "Rio Ashby", "Blue-ranked apprentice sorcerer", [
    { text: "The only blue-ranked sorcerer ever admitted to Celestine's Spire Academy, mostly thanks to a paperwork mix-up." },
    { text: "Cheerful, stubborn and terrible at flying. Discovers that blue magic is the only kind the city's ancient Wind Engine can hear." },
  ], [
    { characterId: 102, label: "Rival" },
    { characterId: 104, label: "Mentor" },
  ]),
  char(102, "Celica_Vane", "Celica Vane", "Crimson-ranked prodigy", [
    { text: "Top of the class and very aware of it. Treats Rio as a rounding error, at first." },
    { text: "Secretly practises the 'useless' blue spells at night after watching Rio save the lantern festival." },
  ], [{ characterId: 101, label: "Rival" }]),
  char(103, "Professor_Odran", "Professor Odran", "Spire Academy instructor", [
    { text: "Gruff instructor of applied aeromancy who keeps a map of the Wind Engine's forgotten rooms." },
  ]),
  char(104, "Mina_Lark", "Mina Lark", "Spire Academy librarian", [
    { text: "Runs a library whose books bite. Knows far more about blue magic than she lets on." },
  ], [{ characterId: 101, label: "Student" }]),

  // Neon Afterimage (2008)
  char(105, "Jin_Kurogane", "Jin Kurogane", "Courier", [
    { text: "Bike courier in Neo-Kanazawa who can see 'afterimages', the light trails people leave in the neon for exactly thirty seconds." },
    { text: "Follows a vanished client's afterimage across the city to find out who erased her." },
  ], [{ characterId: 106, label: "Partner" }]),
  char(106, "Mei_Sakaki", "Mei Sakaki", "Hacker", [
    { text: "Runs an information-brokering operation out of the back of a ramen stall. Never misses a delivery deadline, or a chance to tease Jin." },
  ], [{ characterId: 105, label: "Partner" }]),
  char(107, "Captain_Doyle", "Captain Doyle", "City patrol captain", [
    { text: "Patrol captain who keeps arresting Jin and keeps letting him go. Has a soft spot for the ramen stall." },
  ]),

  // Skyfall Chronicle: Black Aegis (2009)
  char(108, "Kai_Seward", "Kai Seward", "Black Aegis pilot", [
    { text: "Cadet pilot on the island nation of Aldera, assigned the Black Aegis, an armored frame no one else can start." },
    { text: "Learns the frame has been waiting for him since the sky first cracked." },
  ], [
    { characterId: 109, label: "Commanding officer" },
    { characterId: 110, label: "Rival" },
  ]),
  char(109, "Rena_Ashford", "Rena Ashford", "Squadron lieutenant", [
    { text: "Leads the cadet squadron with dry humour and a strict flight schedule. Author of the Ashford Protocol." },
  ], [{ characterId: 108, label: "Cadet" }]),
  char(110, "Ivo_Strand", "Ivo Strand", "Rival pilot", [
    { text: "The academy's top-scoring cadet until Kai showed up. Becomes his most reliable wingmate." },
  ], [{ characterId: 108, label: "Wingmate" }]),
  char(111, "Commander_Hale", "Commander Hale", "Aegis Corps commander", [
    { text: "Commander of the Aegis Corps, willing to gamble everything on an untested cadet." },
  ]),

  // Zero Latitude (2010)
  char(112, "Aoi_Minase", "Aoi Minase", "Navigator-in-training", [
    { text: "Seventeen-year-old navigator aboard the research ship Equinox, sailing the equator." },
    { text: "Notices that the nightly time skips at zero latitude are getting longer, and that someone aboard remembers the missing seconds." },
  ], [
    { characterId: 113, label: "Mentor" },
    { characterId: 114, label: "Captain" },
  ]),
  char(113, "Theo_Lindqvist", "Theo Lindqvist", "Expedition physicist", [
    { text: "The expedition's physicist, who has a theory about the skips that he would rather not say out loud." },
  ], [{ characterId: 112, label: "Student" }]),
  char(114, "Marisa_Doran", "Marisa Doran", "Captain of the Equinox", [
    { text: "Calm, exacting captain who runs the ship by the logbook, until the logbook stops agreeing with the clocks." },
  ]),
  char(115, "Haru", "Haru", "Ship's cook", [
    { text: "The Equinox's cook. Serves breakfast at exactly the same second every morning, which turns out to matter." },
  ]),

  // Steelbound Testament (2010 film)
  char(116, "Edda_Varn", "Edda Varn", "Locksmith", [
    { text: "A disgraced locksmith hired to open the vault holding the last will of the man who built the city of iron bridges." },
  ], [{ characterId: 117, label: "Reluctant ally" }]),
  char(117, "Marcus_Holloway", "Marcus Holloway", "Bridge warden", [
    { text: "Warden of the city's bridges, sworn to keep the vault sealed, and the first to break that oath." },
  ], [{ characterId: 116, label: "Reluctant ally" }]),
  char(118, "The_Architect", "The Architect", "Founder of the city", [
    { text: "The city's founder, seen only in recordings and in the clockwork he left behind." },
  ]),

  // River of Sparks (2010)
  char(119, "Souta_Kirishima", "Souta Kirishima", "Former street-fighting champion", [
    { text: "A former champion of Hanabishi's embankment fights who swore he was done, until his sister's teahouse ended up on the wrong side of a bet." },
  ], [
    { characterId: 120, label: "Younger sister" },
    { characterId: 121, label: "Rival" },
  ]),
  char(120, "Hotaru_Kirishima", "Hotaru Kirishima", "Teahouse owner", [
    { text: "Runs the family teahouse by the canal and keeps her brother's ledger of fights, wins and broken promises." },
  ], [{ characterId: 119, label: "Older brother" }]),
  char(121, "Gen_Takeda", "Gen \"Ironside\" Takeda", "Reigning champion", [
    { text: "The reigning embankment champion, nicknamed Ironside. Fights with a grin and settles every debt he owes." },
  ], [{ characterId: 119, label: "Rival" }]),
  char(122, "Rei_Amagi", "Rei Amagi", "Bookmaker", [
    { text: "The district's youngest bookmaker, who knows every bet in Hanabishi and never writes anything down." },
  ]),

  // Sinful Apex (2011–2012)
  char(123, "Lyle_Crane", "Lyle Crane", "Mercenary climber", [
    { text: "A mercenary climbing Vellmore's seven towers for money. Each tower is ruled by someone who made a deal with a sin." },
    { text: "Learns that reaching the Apex grants one wish, and that every tower lord wants it too." },
  ], [{ characterId: 124, label: "Partner" }]),
  char(124, "Nico_Vale", "Nico Vale", "Street thief", [
    { text: "A quick-witted thief who joins Lyle's climb to settle a debt, and sings to keep her nerve on the stairways." },
    { text: "Chooses what the wish will be when the Apex door finally opens.", revealedAt: SINFUL_EP23 },
  ], [
    { characterId: 123, label: "Partner" },
    { characterId: 126, label: "Idol" },
  ]),
  char(125, "Seraph_Elwood", "Seraph Elwood", "Lord of the Tower of Pride", [
    { text: "Lord of the Tower of Pride, elegant, untouchable and certain the Apex is hers by right." },
  ]),
  char(126, "Aria_Moonbirth", "Aria Moonbirth", "Singer", [
    { text: "The most famous singer in Vellmore, whose concerts echo between the tower floors. Played by the singer LUNE." },
  ], [{ characterId: 124, label: "Fan" }]),
  char(127, "Dorian_Graves", "Dorian Graves", "Lord of the Tower of Greed", [
    { text: "Lord of the Tower of Greed, who keeps a ledger of every favour owed in the city." },
  ]),

  // Glass Cathedral (Winter 2012)
  char(128, "Elise_Hartmann", "Elise Hartmann", "Apprentice glass restorer", [
    { text: "Apprentice restorer at the Glass Cathedral of Lindenmoor, where every pane holds a memory donated by someone in town." },
    { text: "Discovers the cathedral's newest window shows her own future morning.", revealedAt: GLASS_EP8 },
  ], [
    { characterId: 129, label: "Guardian" },
    { characterId: 130, label: "Friend" },
  ], GLASS_LISTED),
  char(129, "Father_Anselm", "Father Anselm", "Keeper of the cathedral", [
    { text: "The cathedral's keeper, who forbids anyone from looking through the windows at night." },
  ], [{ characterId: 128, label: "Ward" }], GLASS_LISTED),
  char(130, "Tobias_Wren", "Tobias Wren", "Lamplighter", [
    { text: "Lindenmoor's lamplighter, who notices which windows go dark before anyone else." },
  ], [{ characterId: 128, label: "Friend" }], GLASS_LISTED),
  char(131, "Greta", "Greta", "Glassblower's daughter", [
    { text: "The glassblower's daughter, who donated a memory to the cathedral when she was six and can't remember which one." },
  ], [], GLASS_LISTED),

  // Circuit Hearts: Reload (Spring 2012)
  char(132, "Nanase", "Nanase", "Lead singer of Circuit Hearts", [
    { text: "Lead singer of the idol-android unit Circuit Hearts, retired after one perfect concert in 2042." },
    { text: "Wakes up ten years later in a junk shop, convinced it is still the night of the show." },
    { text: "Finds a memory card holding the setlist the unit never got to perform.", revealedAt: CIRCUIT_EP9 },
  ], [
    { characterId: 133, label: "Mechanic" },
    { characterId: 134, label: "Bandmate" },
  ], CIRCUIT_LISTED),
  char(133, "Yuu_Takamine", "Yuu Takamine", "Junk-shop owner's son", [
    { text: "Found Nanase's core in a box of spare parts. Can fix anything with a circuit board and cannot sing at all." },
  ], [{ characterId: 132, label: "Friend" }], CIRCUIT_LISTED),
  char(134, "Pico", "Pico", "Circuit Hearts keyboardist", [
    { text: "The unit's tiny, hyperactive keyboardist, rebuilt from a karaoke machine." },
  ], [{ characterId: 132, label: "Bandmate" }], CIRCUIT_LISTED),
  char(135, "Shion_Kagari", "Shion Kagari", "Former producer", [
    { text: "Circuit Hearts' original producer, now running a rival label and very interested in the unit's comeback." },
  ], [], CIRCUIT_LISTED),

  // Vacant Crown: Liminal War (Summer–Fall 2012)
  char(136, "Mirelle_Aubert", "Mirelle Aubert", "Cartographer", [
    { text: "An orphan cartographer who can map the liminal border, the twilight realm where the old kings' armies still march." },
    { text: "Her compass points to the person the crown has chosen.", revealedAt: VACANT_EP21 },
  ], [
    { characterId: 137, label: "Ally" },
    { characterId: 140, label: "Scout" },
  ], VACANT_LISTED),
  char(137, "Cassian_Rhode", "Cassian Rhode", "Claimant prince", [
    { text: "A prince without a banner, the least likely of the five claimants to the empty throne of Varos." },
  ], [{ characterId: 136, label: "Ally" }], VACANT_LISTED),
  char(138, "General_Vossberg", "General Vossberg", "Claimant general", [
    { text: "The kingdom's most decorated general, who claims the throne in the name of order." },
  ], [], VACANT_LISTED),
  char(139, "Ines_Calder", "Lady Ines Calder", "Claimant noble", [
    { text: "A noble claimant who fights her war at the dinner table, with treaties instead of swords." },
  ], [], VACANT_LISTED),
  char(140, "Pell", "Pell", "Scout", [
    { text: "A twelve-year-old scout who runs messages through the liminal border faster than anyone." },
  ], [{ characterId: 136, label: "Boss" }], VACANT_LISTED),

  // Ghost Eater (Winter 2013)
  char(141, "Kenji_Sakuraba", "Kenji Sakuraba", "High school ghost eater", [
    { text: "A high school student who can eat ghosts. Each one tastes like whatever it regretted most." },
    { text: "Meets a ghost too big to eat and has to talk it into moving on instead.", revealedAt: GHOST_EP7 },
  ], [
    { characterId: 142, label: "Employer" },
    { characterId: 143, label: "Lodger" },
  ], GHOST_LISTED),
  char(142, "Tsubaki_Hoshimiya", "Tsubaki Hoshimiya", "Shrine maiden", [
    { text: "A shrine maiden with a business plan, a very long client list and no patience for Kenji's complaints about flavour." },
  ], [{ characterId: 141, label: "Employee" }], GHOST_LISTED),
  char(143, "Granny_Fumi", "Granny Fumi", "Resident ghost", [
    { text: "A cheerful ghost who refuses to be eaten until she has finished her favourite drama series." },
  ], [{ characterId: 141, label: "Landlord" }], GHOST_LISTED),
  char(144, "Detective_Ozaki", "Detective Ozaki", "Police detective", [
    { text: "A detective assigned to 'unusual cases' who would very much like to stop being assigned to Kenji." },
  ], [], GHOST_LISTED),
];
