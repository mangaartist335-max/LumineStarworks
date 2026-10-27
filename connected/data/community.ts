// Archive content for the community sites: Birdie (microblogging), Tum
// (blogs and art), 3Chan (anonymous boards) and TechNook (forums). Every
// post is dated and appears only from that moment on.

import { media } from "./media";

const av = (k: string) => media(`avatar:${k}`).url;
const art = (k: string) => media(`art:${k}`).url;

// ── Birdie ─────────────────────────────────────────────────────────────────

export interface BirdieUser {
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  joinedAt: string;
}

export interface BirdiePost {
  id: string;
  author: string;
  text: string;
  at: string;
  replyTo?: string;
  likes: number;
}

export const birdieUsers: BirdieUser[] = [
  { handle: "PixelPilot", name: "PixelPilotGaming", avatar: av("gamepad"), bio: "Walkthroughs on MeTube every other Saturday. Currently: Star Courier.", joinedAt: "2010-04-02T12:00:00Z" },
  { handle: "DailyDana", name: "Dana", avatar: av("flower"), bio: "Weekend vlogger, sketchbook hoarder, tea enthusiast.", joinedAt: "2011-09-03T12:00:00Z" },
  { handle: "AkiraKeys", name: "Akira", avatar: av("guitar"), bio: "One original piano song a month. Rain is my favourite sound.", joinedAt: "2011-05-22T12:00:00Z" },
  { handle: "TechTipsTom", name: "Tom", avatar: av("robot"), bio: "Easy computer tips. Ask me anything about your PC!", joinedAt: "2009-01-10T12:00:00Z" },
  { handle: "skyblue_kid", name: "Sky", avatar: av("rocket"), bio: "games, paper planes and space stuff", joinedAt: "2012-02-11T12:00:00Z" },
  { handle: "Nadia_draws", name: "Nadia", avatar: av("palette"), bio: "Drawing every day. Fan art on my Tum: nadiadraws.tum.connectedera.local", joinedAt: "2011-07-19T12:00:00Z" },
  { handle: "OtakuOlivia", name: "Olivia", avatar: av("star"), bio: "Anime every night, manga every lunch break. YAL addict.", joinedAt: "2010-10-01T12:00:00Z" },
  { handle: "MeTube", name: "MeTube", avatar: av("sun"), bio: "Broadcast Yourself. Official account.", joinedAt: "2008-03-01T12:00:00Z" },
  { handle: "MangaShelf", name: "MangaShelf", avatar: av("leaf"), bio: "New chapters every week. Read free at manga.connectedera.local", joinedAt: "2010-04-05T12:00:00Z" },
];

let bn = 0;
const chirp = (author: string, at: string, text: string, likes = 3, replyTo?: string): BirdiePost => ({ id: `post_b${String(++bn).padStart(4, "0")}`, author, text, at, likes, replyTo });

export const birdiePosts: BirdiePost[] = [
  chirp("DailyDana", "2012-07-12T14:10:00Z", "First sunny weekend in ages. Picnic, sketchbook, done.", 8),
  chirp("skyblue_kid", "2012-07-21T18:02:00Z", "Just watched @DailyDana's paper plane video. 24 METRES. I'm folding all night", 5),
  chirp("DailyDana", "2012-07-21T18:30:00Z", "@skyblue_kid folding guide is coming next week, promise!", 4, "post_b0002"),
  chirp("AkiraKeys", "2012-07-28T20:15:00Z", "New song is up! Summer Rain, written during last week's storm. metube.connectedera.local/watch?v=vid_mt0003", 21),
  chirp("MangaShelf", "2012-08-03T04:00:00Z", "New series! Lantern Street Couriers chapter 1 is up now. Stairs. So many stairs.", 30),
  chirp("Nadia_draws", "2012-08-05T16:40:00Z", "Lantern Street Couriers is SO cute. Drew Mei already, it's on my Tum", 12),
  chirp("OtakuOlivia", "2012-08-20T23:10:00Z", "Vacant Crown episode 7 tonight. Mirelle with the maps is my favourite thing this summer.", 6),
  chirp("TechTipsTom", "2012-09-02T15:00:00Z", "Tip: right-click any picture in Photo Viewer and set it as your desktop background. Takes two seconds!", 14),
  chirp("MangaShelf", "2012-09-07T04:00:00Z", "Lantern Street Couriers chapter 2: Rooftop Shortcut is out! Melon bread is involved.", 25),
  chirp("skyblue_kid", "2012-09-15T19:00:00Z", "MOCHI VS THE LASER POINTER. I'm crying laughing metube.connectedera.local/watch?v=vid_mt0002", 40),
  chirp("TechTipsTom", "2012-11-10T16:20:00Z", "New tutorial: make your own wallpaper in Paint. Beginner friendly, five minutes.", 18),
  chirp("PixelPilot", "2012-11-21T10:00:00Z", "Star Courier came out yesterday and I've already played it for six hours. Walkthrough series incoming!", 22),
  chirp("skyblue_kid", "2012-11-22T21:30:00Z", "Star Courier level 3 is HARD. Help @PixelPilot", 3),
  chirp("PixelPilot", "2012-11-22T22:05:00Z", "@skyblue_kid stay low in the bottom lane, the gaps open up there. Full video soon!", 9, "post_b0013"),
  chirp("DailyDana", "2012-12-29T18:00:00Z", "Snow day! Biscuit from @TheHendersonsHome has the right idea, just hop around in it.", 11),
  chirp("MangaShelf", "2013-01-11T04:00:00Z", "New series! Paper Planet chapter 1: Fold Here. A boy folds a planet. A small one.", 28),
  chirp("Nadia_draws", "2013-01-13T12:00:00Z", "Pip from Paper Planet is the roundest, happiest character ever. Doodled him immediately.", 15),
  chirp("PixelPilot", "2013-03-02T18:10:00Z", "Star Courier walkthrough part 1 is up! Levels 1-3, every parcel, no deaths.", 19),
  chirp("OtakuOlivia", "2013-04-05T00:30:00Z", "Iron to Requiem episode 1 is out and the soundtrack is already living in my head.", 10),
  chirp("DailyDana", "2013-04-13T22:15:00Z", "Rainy Saturday vlog is up. Pancakes, sketching, a very sleepy Pepper.", 13),
  chirp("MeTube", "2013-05-01T15:00:00Z", "Spring is here! What are you watching this week?", 54),
  chirp("skyblue_kid", "2013-05-20T09:00:00Z", "That SundayStrikers trick shot. Attempt #47 is my new life motto.", 7),
  chirp("MangaShelf", "2013-06-20T04:00:00Z", "One-shot Thursday: Moonlit Bakery by Sora Ichika. A bakery that opens at midnight.", 33),
  chirp("Nadia_draws", "2013-06-21T11:30:00Z", "Moonlit Bakery made me so happy. Now I want bread at midnight.", 9),
  chirp("AkiraKeys", "2013-07-30T20:00:00Z", "Working on the August song. It has a xylophone. I'm very excited about the xylophone.", 12),
  chirp("PixelPilot", "2013-08-17T18:05:00Z", "The FINAL Star Courier part is up: the level 4 boss! Thanks for watching the whole series.", 26),
  chirp("TechTipsTom", "2013-09-04T14:00:00Z", "Back-to-school tip: make a Homework folder in My Documents and pin it. Future you says thanks.", 11),
  chirp("OtakuOlivia", "2013-09-27T01:00:00Z", "Iron to Requiem's finale. Twenty-six Thursdays well spent. Updating my YAL list now.", 14),
  chirp("DailyDana", "2013-10-19T16:00:00Z", "Autumn walk today. The trees are glowing. New wallpaper on WallpaperGarden looks just like it!", 8),
  chirp("MangaShelf", "2013-11-08T04:00:00Z", "Paper Planet chapter 2: Crash Course is here! Rule one: don't take your planet to school.", 31),
  chirp("skyblue_kid", "2013-12-24T20:00:00Z", "Happy holidays everyone!! Folding paper snowflakes instead of planes tonight", 16),
];

// ── Tum ────────────────────────────────────────────────────────────────────

export interface TumPost {
  id: string;
  title?: string;
  text: string;
  image?: string;
  at: string;
  tags: string[];
  notes: number;
}

export interface TumBlog {
  name: string;
  title: string;
  description: string;
  avatar: string;
  createdAt: string;
  tags: string[];
  theme: { bg: string; text: string; accent: string; font: string };
  posts: TumPost[];
}

let tn = 0;
const tpost = (at: string, text: string, opts: Partial<TumPost> = {}): TumPost => ({ id: `post_t${String(++tn).padStart(4, "0")}`, at, text, tags: [], notes: 5, ...opts });

export const tumBlogs: TumBlog[] = [
  {
    name: "nadiadraws",
    title: "Nadia Draws",
    description: "Fan art, sketches and doodles. One drawing a day, most days.",
    avatar: av("palette"),
    createdAt: "2011-07-20T12:00:00Z",
    tags: ["art", "fan art", "drawing"],
    theme: { bg: "#fdf3f6", text: "#3a2a33", accent: "#c4527a", font: "'Trebuchet MS', sans-serif" },
    posts: [
      tpost("2012-08-05T16:30:00Z", "Mei from Lantern Street Couriers! Her courier cap is the best design.", { title: "Mei fan art", image: art("mei-fanart"), tags: ["fan art", "lantern street couriers", "manga"], notes: 48 }),
      tpost("2012-09-16T12:00:00Z", "Mochi mid-wiggle, right before the big pounce. TheHendersonsHome videos are my comfort watch.", { title: "Mochi sketch", image: art("mochi-sketch"), tags: ["sketch", "cat", "metube"], notes: 31 }),
      tpost("2013-01-13T11:50:00Z", "Pip! The roundest planet. Paper Planet is adorable.", { title: "Pip doodle", image: art("pip-doodle"), tags: ["fan art", "paper planet", "manga"], notes: 57 }),
      tpost("2013-05-04T15:00:00Z", "Tried painting a sunset with only five colours. Turned out kind of peaceful.", { title: "Sunset study", image: art("sunset-painting"), tags: ["painting", "study"], notes: 22 }),
    ],
  },
  {
    name: "pixelpilot",
    title: "PixelPilot's Hangar",
    description: "Game notes, high scores and behind-the-scenes from my MeTube walkthroughs.",
    avatar: av("gamepad"),
    createdAt: "2011-01-08T12:00:00Z",
    tags: ["gaming", "walkthrough", "star courier"],
    theme: { bg: "#10162c", text: "#dfe7ff", accent: "#6fd0ff", font: "'Courier New', monospace" },
    posts: [
      tpost("2012-11-21T09:00:00Z", "Star Courier is out and it's lovely. Tiny arcade game, big heart. Notes so far: blue rocks are slow, parcels give 250 points, and level 3 is a real test.", { title: "First look: Star Courier", tags: ["star courier", "games"], notes: 19 }),
      tpost("2013-03-02T18:20:00Z", "Part 1 of the walkthrough is up on MeTube! Recording tip: turn the music down a bit so commentary sits on top.", { title: "Walkthrough part 1 is live", tags: ["star courier", "metube"], notes: 14 }),
      tpost("2013-08-18T12:00:00Z", "Someone drew my ship and I'm framing it. Thank you so much!", { title: "Fan art of the courier ship!", image: art("courier-ship"), tags: ["star courier", "fan art"], notes: 40 }),
    ],
  },
  {
    name: "danasdoodles",
    title: "Dana's Little Things",
    description: "Small happy things: recipes, rainy days, paper planes and Pepper the cat.",
    avatar: av("flower"),
    createdAt: "2011-09-05T12:00:00Z",
    tags: ["life", "recipes", "vlog"],
    theme: { bg: "#f4f8ef", text: "#2e3a2a", accent: "#5c8f3c", font: "Georgia, serif" },
    posts: [
      tpost("2012-07-28T13:00:00Z", "The paper plane that flew 24 metres, as promised! Fold the nose down twice, then add little wing flaps at the back.", { title: "Folding guide", image: art("paper-plane"), tags: ["paper plane", "how to"], notes: 26 }),
      tpost("2013-04-14T10:00:00Z", "The pancakes from the vlog are from Pantry Recipes (the blueberry ones). Add extra blueberries. Always extra blueberries.", { title: "Pancake recipe!", tags: ["recipe", "pancakes"], notes: 12 }),
      tpost("2013-10-19T17:00:00Z", "Ten things that made me happy this week: cocoa, crunchy leaves, a new sketchbook, Pepper's snoring, an autumn wallpaper, letters from my penpal, warm socks, the first scarf day, a good song, and you reading this.", { title: "Ten happy things", tags: ["happy", "autumn"], notes: 33 }),
    ],
  },
];

// ── 3Chan ──────────────────────────────────────────────────────────────────

export interface ChanPost {
  no: number;
  name: string;
  text: string;
  at: string;
  image?: string;
}

export interface ChanThread {
  id: string;
  board: string;
  subject: string;
  posts: ChanPost[];
}

export const chanBoards: { id: string; title: string; description: string }[] = [
  { id: "a", title: "Anime & Manga", description: "Discuss anime and manga. Spoilers in spoiler tags, please." },
  { id: "v", title: "Video Games", description: "Games of all kinds." },
  { id: "g", title: "Technology", description: "Computers, software, phones and gadgets." },
  { id: "mu", title: "Music", description: "Share and talk about music." },
  { id: "r", title: "Random", description: "Anything goes (within the rules). Be nice." },
];

let cn = 30000;
const cp = (at: string, text: string, image?: string, name = "Anonymous"): ChanPost => ({ no: ++cn, name, at, text, image });

export const threeChanThreads: ChanThread[] = [
  { id: "thr_a1", board: "a", subject: "Lantern Street Couriers thread", posts: [cp("2012-08-04T02:00:00Z", "New manga on MangaShelf about a courier girl. The clock tower chapter is so wholesome. Anyone else reading?", art("mei-fanart")), cp("2012-08-04T02:20:00Z", ">tfw two hundred stairs\nfelt that"), cp("2012-08-04T03:05:00Z", "The cat just saying Mrrp is the best character"), cp("2012-09-07T05:00:00Z", "Chapter 2 is out. Rooftops! Rival! Melon bread!")] },
  { id: "thr_a2", board: "a", subject: "Summer 2012 season", posts: [cp("2012-07-16T01:00:00Z", "What are you watching this season? Vacant Crown has my vote, the map stuff is cool."), cp("2012-07-16T01:30:00Z", "Vacant Crown for sure. Two cours too, so plenty to look forward to."), cp("2012-07-17T12:00:00Z", "Catching up on Glass Cathedral from last winter first. Slow but really pretty.")] },
  { id: "thr_a3", board: "a", subject: "Spring 2013: Iron to Requiem", posts: [cp("2013-04-05T03:00:00Z", "Iron to Requiem ep 1. That soundtrack."), cp("2013-04-05T03:12:00Z", "Thursdays are booked until September I guess"), cp("2013-09-27T04:00:00Z", "Finale bump. Good show, good times.")] },
  { id: "thr_v1", board: "v", subject: "Star Courier general", posts: [cp("2012-11-21T05:00:00Z", "Free arcade game on Freeware Corner, pretty fun. Post scores.", art("courier-ship")), cp("2012-11-21T06:10:00Z", "4850 on my first real run. Level 3 is tough."), cp("2012-11-22T00:30:00Z", "Bottom lane on level 3, trust me"), cp("2013-08-18T02:00:00Z", "PixelPilot's boss video is out, the high/low trick works")] },
  { id: "thr_v2", board: "v", subject: "Field Sweeper times", posts: [cp("2012-10-03T15:00:00Z", "Post your best Field Sweeper time. 52 seconds on easy here."), cp("2012-10-03T15:40:00Z", "41s. Middle-click chording changed my life"), cp("2013-02-14T19:00:00Z", "Still can't beat 60 seconds on medium, send help")] },
  { id: "thr_g1", board: "g", subject: "Desktop thread", posts: [cp("2013-02-10T13:00:00Z", "Post your desktops. Retro Grid wallpaper, dock at the bottom, clock gadget.", media("wallpaper-thumb:retro-grid").url), cp("2013-02-10T13:30:00Z", "Aurora Lake + no icons. Clean life."), cp("2013-02-11T08:00:00Z", "ModMyMachine's tour video got me into this, ngl")] },
  { id: "thr_g2", board: "g", subject: "Download speed question", posts: [cp("2012-08-30T20:00:00Z", "Is 1 MB/s good for downloads? Just got cable."), cp("2012-08-30T20:15:00Z", "That's about 8 Mbps, pretty normal for cable. Way better than my old DSL."), cp("2012-08-30T20:40:00Z", "Enjoy it, dial-up kids are jealous")] },
  { id: "thr_mu1", board: "mu", subject: "Piano on MeTube", posts: [cp("2012-07-29T04:00:00Z", "AkiraKeys' Summer Rain is really nice, rain sounds and all"), cp("2012-07-29T05:00:00Z", "The part where the melody comes back is great"), cp("2012-08-12T10:00:00Z", "Waiting for the August one")] },
  { id: "thr_r1", board: "r", subject: "Small wins thread", posts: [cp("2013-03-15T18:00:00Z", "Post a small win from today. I fixed my bike chain by myself."), cp("2013-03-15T18:10:00Z", "Made melon bread from a recipe site and it actually worked"), cp("2013-03-15T18:45:00Z", "Paper plane went over the fence. Neighbour threw it back. Good neighbour."), cp("2013-03-15T19:20:00Z", "Finished my sketchbook. Starting a new one tomorrow")] },
];

// ── TechNook forums ────────────────────────────────────────────────────────

export interface NookPost {
  author: string;
  avatar: string;
  signature: string;
  text: string;
  at: string;
}

export interface NookThread {
  id: string;
  board: string;
  title: string;
  posts: NookPost[];
}

export const nookBoards: { id: string; title: string; description: string }[] = [
  { id: "custom", title: "Desktop Customization", description: "Themes, wallpapers, icons and docks." },
  { id: "software", title: "Software & Games", description: "Recommendations, help and news." },
  { id: "help", title: "Help Desk", description: "Stuck? Ask here. No question is too small." },
];

const SIG: Record<string, [string, string]> = {
  TechTipsTom: [av("robot"), "Easy PC tips every week on MeTube: TechTipsTom"],
  ModMyMachine: [av("rocket"), "Current wallpaper: Retro Grid. Previous wallpaper: also Retro Grid."],
  grandpa_bill: [av("sun"), "Learning something new every day."],
  retro_ricky: [av("gamepad"), "High score hunter. Star Courier PB: 18,250"],
  Nadia_draws: [av("palette"), "nadiadraws.tum.connectedera.local"],
};
const np = (author: string, at: string, text: string): NookPost => ({ author, avatar: SIG[author][0], signature: SIG[author][1], text, at });

export const techNookThreads: NookThread[] = [
  {
    id: "thr_n1",
    board: "help",
    title: "How do I change my desktop background?",
    posts: [
      np("grandpa_bill", "2012-11-11T14:00:00Z", "My grandson made me a wallpaper in Paint and emailed it to me. How do I put it on my desktop?"),
      np("TechTipsTom", "2012-11-11T14:30:00Z", "Great question! Save the picture from the email into My Pictures, open it in Photo Viewer and choose \"Set as desktop background\". You can also go to Control Panel > Personalize and pick it from there."),
      np("grandpa_bill", "2012-11-11T15:10:00Z", "[quote=TechTipsTom]open it in Photo Viewer and choose Set as desktop background[/quote]\nIt worked! Hills and a sun. Thank you!"),
    ],
  },
  {
    id: "thr_n2",
    board: "custom",
    title: "Show off your 2013 desktop!",
    posts: [
      np("ModMyMachine", "2013-01-05T18:00:00Z", "New year, new desktop. Post a description of yours! Mine: Retro Grid wallpaper from WallpaperGarden, dark taskbar, three pinned programs."),
      np("Nadia_draws", "2013-01-05T19:20:00Z", "Cherry Blossom Hills and a folder for every art project. Very pink, very calm."),
      np("retro_ricky", "2013-01-06T10:00:00Z", "[quote=ModMyMachine]Retro Grid wallpaper[/quote]\nRetro Grid gang! Paired it with the Neon Night Drive song for the full effect."),
    ],
  },
  {
    id: "thr_n3",
    board: "software",
    title: "Star Courier tips and high scores",
    posts: [
      np("retro_ricky", "2012-11-24T20:00:00Z", "Got Star Courier from Freeware Corner. Post tips! Mine: every parcel is worth 250, so don't skip them."),
      np("TechTipsTom", "2012-11-25T09:00:00Z", "If the game feels slow, close other programs. The Games window remembers your best score and achievements automatically."),
      np("retro_ricky", "2013-08-18T21:00:00Z", "Finally beat the boss thanks to PixelPilot's video. 18,250!"),
    ],
  },
  {
    id: "thr_n4",
    board: "help",
    title: "Where do downloads go?",
    posts: [
      np("grandpa_bill", "2013-03-02T11:00:00Z", "I downloaded a picture but I can't find it anywhere."),
      np("TechTipsTom", "2013-03-02T11:20:00Z", "Everything you download lands in your Downloads folder. Open Explorer (or the Start menu) and click Downloads. The browser's Downloads page (Ctrl+J) also has a Show in folder link."),
    ],
  },
];
