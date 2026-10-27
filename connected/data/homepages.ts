// HomePlot: free personal homepages with guestbooks, the kind people made
// for their hobbies, pets and favourite shows. Each update and guestbook
// entry appears only from its date on.

import { media } from "./media";

export const HOMEPLOT_HOST = "homeplot.connectedera.local";

export interface HomeSection {
  heading: string;
  body: string;
  /** Updates show from this date; undated sections are always there. */
  at?: string;
}

export interface HomeTheme {
  bg: string;
  panel: string;
  text: string;
  accent: string;
  font: string;
}

export interface ArchiveHomepage {
  slug: string;
  owner: string;
  title: string;
  tagline: string;
  avatar: string;
  createdAt: string;
  theme: HomeTheme;
  sections: HomeSection[];
  links: { label: string; url: string }[];
  /** Visitors before the archive snapshot; local visits are added on top. */
  baseVisits: number;
  guestbook: { name: string; from?: string; message: string; at: string }[];
}

const av = (k: string) => media(`avatar:${k}`).url;

export const HOME_THEMES: { name: string; theme: HomeTheme }[] = [
  { name: "Sky blue", theme: { bg: "#bfe3ff", panel: "#ffffff", text: "#203040", accent: "#1d6fd1", font: "Verdana, sans-serif" } },
  { name: "Starry night", theme: { bg: "#0d1033", panel: "#1b1f4d", text: "#e8e9ff", accent: "#ffd166", font: "\"Trebuchet MS\", sans-serif" } },
  { name: "Meadow", theme: { bg: "#d9f2c7", panel: "#fbfff5", text: "#2c3b22", accent: "#4f8a2b", font: "Georgia, serif" } },
  { name: "Bubblegum", theme: { bg: "#ffd6ea", panel: "#fff7fb", text: "#4a2738", accent: "#d63c84", font: "\"Comic Sans MS\", \"Comic Neue\", cursive" } },
  { name: "Notebook", theme: { bg: "#f2efe6", panel: "#fffdf7", text: "#2b2b2b", accent: "#b04a2f", font: "\"Courier New\", monospace" } },
];

const theme = (name: string) => HOME_THEMES.find((t) => t.name === name)!.theme;

export const archiveHomepages: ArchiveHomepage[] = [
  {
    slug: "skys-hangar",
    owner: "Sky",
    title: "Sky's Paper Plane Hangar",
    tagline: "Folding guides, flight records and the occasional crash landing",
    avatar: av("rocket"),
    createdAt: "2012-07-25T19:00:00Z",
    theme: theme("Sky blue"),
    sections: [
      { heading: "Welcome to the hangar!", body: "Hi! I'm Sky and I fold paper planes. Lots of them. This page has my favourite folds and my distance records. If you beat one, sign my guestbook and tell me how!" },
      { heading: "My top 3 folds", body: "1. The Dart: easy, fast, flies straight. Start here.\n2. The Glider: wide wings, floats forever if you throw it gently.\n3. The Hammerhead: heavy nose, great in the hallway." },
      { heading: "Records", body: "Hallway: 18 metres (Dart)\nBack garden: 21 metres (Glider, with a little help from the wind)\nDana's record from her MeTube video: 24 metres. Still chasing it!" },
      { heading: "Update: new fold!", body: "Dana posted a folding guide and I tried her version of the Glider. It's really good. I added a picture of mine to my Tum.", at: "2012-07-29T18:00:00Z" },
      { heading: "Update: Star Courier!", body: "OK this isn't planes but Star Courier came out and it's about flying parcels around, so it counts. Level 3 is hard. Very hard.", at: "2012-11-23T20:00:00Z" },
      { heading: "Update: snow planes", body: "Paper planes in the snow don't fly very far, but they look cool. Biscuit the corgi chased one.", at: "2012-12-30T17:00:00Z" },
      { heading: "Update: back to school", body: "Folding during lunch only now. The Dart is still the champion.", at: "2013-09-03T20:00:00Z" },
    ],
    links: [
      { label: "Dana's paper plane challenge on MeTube", url: "http://metube.connectedera.local/watch?v=vid_mt0013" },
      { label: "Star Courier at Freeware Corner", url: "http://freewarecorner.connectedera.local/games/star-courier" },
      { label: "Me on Birdie", url: "http://birdie.connectedera.local/skyblue_kid" },
    ],
    baseVisits: 1287,
    guestbook: [
      { name: "Dana", from: "danasdoodles.tum.connectedera.local", message: "Love the hangar!! Your Hammerhead fold is genius. Rematch soon?", at: "2012-07-26T15:20:00Z" },
      { name: "PixelPilot", message: "Great page! For Star Courier, stay low in the bottom lane. Trust me.", at: "2012-11-24T11:05:00Z" },
      { name: "Grandma Jo", message: "Very nice website sweetheart. I printed the Dart instructions and made one. It flew into the cat.", at: "2012-12-02T14:40:00Z" },
      { name: "Akira", message: "These guides are so clear. I folded a Glider during a piano break and it floated the whole room.", at: "2013-02-10T21:15:00Z" },
      { name: "Mika", from: "Sweden", message: "Hello from Sweden! The Dart fold works great here too.", at: "2013-06-01T09:30:00Z" },
    ],
  },
  {
    slug: "akira-piano",
    owner: "Akira",
    title: "Akira's Piano Corner",
    tagline: "One original song a month, played on an old upright piano",
    avatar: av("guitar"),
    createdAt: "2012-06-02T12:00:00Z",
    theme: theme("Starry night"),
    sections: [
      { heading: "Hello", body: "Welcome! I write a short piano piece every month and put the recordings on MeTube. This page lists them all, with a few notes about each one." },
      { heading: "Songs", body: "Summer Rain (July 2012): written during a storm. The left hand is the thunder, the right hand is the rain on the window." },
      { heading: "About the piano", body: "It's an old upright from my grandparents' house. The middle C sticks a little on humid days, which you can hear in some recordings. I like it that way." },
      { heading: "Summer Rain is up!", body: "My new piece is on MeTube now. Thank you to everyone who listened on the first day, I read every comment.", at: "2012-07-28T21:00:00Z" },
      { heading: "Harbour song in progress", body: "Working on something about the harbour at night. It's slower than usual. Lots of quiet bits.", at: "2013-03-12T22:00:00Z" },
      { heading: "Faster, for once", body: "Practising a faster piece this month. My fingers are learning new tricks.", at: "2013-05-10T20:00:00Z" },
    ],
    links: [
      { label: "Summer Rain on MeTube", url: "http://metube.connectedera.local/watch?v=vid_mt0003" },
      { label: "My MeTube channel", url: "http://metube.connectedera.local/user/AkiraKeys" },
      { label: "Birdie", url: "http://birdie.connectedera.local/AkiraKeys" },
    ],
    baseVisits: 3410,
    guestbook: [
      { name: "Olivia", message: "Summer Rain is my study music now. Thank you!", at: "2012-07-30T19:00:00Z" },
      { name: "Nadia", from: "nadiadraws.tum.connectedera.local", message: "I drew a rainy window while listening to this. Perfect match.", at: "2012-08-12T23:10:00Z" },
      { name: "Tom", message: "Lovely playing. Your recordings sound great, nice microphone placement!", at: "2012-09-20T18:30:00Z" },
      { name: "Leo", message: "Please do a harbour song! I painted that harbour wallpaper and would love a soundtrack for it.", at: "2013-03-01T20:45:00Z" },
    ],
  },
  {
    slug: "hendersons",
    owner: "The Hendersons",
    title: "The Henderson Home Page",
    tagline: "News from our house, mostly about Mochi and Biscuit",
    avatar: av("cat"),
    createdAt: "2009-08-10T12:00:00Z",
    theme: theme("Meadow"),
    sections: [
      { heading: "Meet the family", body: "We're the Hendersons! Mum, Dad, two kids, a cat called Mochi and a corgi called Biscuit. We put our pet videos on MeTube so the grandparents can see them." },
      { heading: "Mochi", body: "Mochi is four, loves sunny windowsills and has never once caught the red dot. She is undefeated in staring contests." },
      { heading: "Biscuit", body: "Biscuit is a corgi. Biscuit likes everything. Especially snow, socks and the postman." },
      { heading: "Family news: the laser pointer video", body: "Our video of Mochi and the laser pointer has had more views than we ever imagined. Mochi is unimpressed by her fame.", at: "2012-09-20T18:00:00Z" },
      { heading: "Family news: first snow", body: "Biscuit saw snow for the first time and hopped around the garden for half an hour. The video is on MeTube!", at: "2012-12-29T19:00:00Z" },
      { heading: "Family news: spring garden", body: "The tulips are up. Biscuit has been told about the tulips. Biscuit has promised.", at: "2013-04-20T12:00:00Z" },
      { heading: "Family news: summer holiday", body: "Back from a week at the seaside. Mochi stayed with Grandma and was spoiled rotten.", at: "2013-08-18T12:00:00Z" },
    ],
    links: [
      { label: "Mochi vs. the Laser Pointer", url: "http://metube.connectedera.local/watch?v=vid_mt0002" },
      { label: "Biscuit's First Snow Day!", url: "http://metube.connectedera.local/watch?v=vid_mt0012" },
      { label: "Our MeTube channel", url: "http://metube.connectedera.local/user/TheHendersonsHome" },
    ],
    baseVisits: 15802,
    guestbook: [
      { name: "Grandma Jo", message: "Hello my darlings! Give Biscuit a cuddle from me.", at: "2011-03-14T15:00:00Z" },
      { name: "Sky", message: "MOCHI IS THE BEST CAT. The laser video made my whole week.", at: "2012-09-16T20:00:00Z" },
      { name: "Dana", message: "Biscuit in the snow is pure joy. Shared it with everyone I know!", at: "2012-12-30T10:30:00Z" },
      { name: "Aya", from: "Japan", message: "Greetings from Osaka! Mochi looks just like my cat.", at: "2013-05-05T03:00:00Z" },
    ],
  },
  {
    slug: "olivias-anime-den",
    owner: "Olivia",
    title: "Olivia's Anime Den",
    tagline: "What I'm watching, what I'm reading, and what you should watch next",
    avatar: av("star"),
    createdAt: "2011-01-08T12:00:00Z",
    theme: theme("Bubblegum"),
    sections: [
      { heading: "Welcome to the den!", body: "Hi, I'm Olivia! I watch way too much anime and keep my lists on YourAnimeList. This page is where I ramble about my favourites. No spoilers, ever. Promise." },
      { heading: "Comfort rewatches", body: "River of Sparks, for cosy evenings.\nNeon Afterimage, when I want something flashy.\nAzure Sorcerer, because I grew up with it." },
      { heading: "Summer 2012", body: "Vacant Crown is my show of the summer. Mirelle and her maps!", at: "2012-07-15T20:00:00Z" },
      { heading: "Manga corner", body: "Lantern Street Couriers on MangaShelf is so cute. Mei is the hardest-working courier in fiction.", at: "2012-08-10T20:00:00Z" },
      { heading: "Winter 2013", body: "Ghost Eater is keeping me company this winter. Also reading Paper Planet, which is the most adorable thing.", at: "2013-01-20T21:00:00Z" },
      { heading: "Spring 2013", body: "Iron to Requiem every Thursday. That soundtrack lives in my head rent-free.", at: "2013-04-06T13:00:00Z" },
      { heading: "Summer 2013", body: "Read Moonlit Bakery, a one-shot about a midnight bakery. Made me want fresh bread at 2am.", at: "2013-06-25T22:00:00Z" },
    ],
    links: [
      { label: "My YourAnimeList", url: "http://yal.connectedera.local/" },
      { label: "MangaShelf", url: "http://manga.connectedera.local/" },
      { label: "AnimeTalkTuesday on MeTube", url: "http://metube.connectedera.local/user/AnimeTalkTuesday" },
    ],
    baseVisits: 6025,
    guestbook: [
      { name: "Nadia", message: "Your recommendations never miss. Starting River of Sparks tonight!", at: "2012-02-02T21:00:00Z" },
      { name: "AnimeTalkTuesday", message: "Love the no-spoilers rule. Respect.", at: "2012-07-20T18:00:00Z" },
      { name: "Sky", message: "Is Lantern Street Couriers good for someone who's never read manga? Asking for me.", at: "2012-08-12T17:00:00Z" },
      { name: "Olivia", message: "@Sky yes!! Start with chapter 1, it reads right to left. You'll love it.", at: "2012-08-12T19:30:00Z" },
      { name: "Hana M.", message: "Thank you for the kind words about Mei! Reading your page made my day.", at: "2013-03-03T04:00:00Z" },
    ],
  },
];

export const archiveHomepage = (slug: string) => archiveHomepages.find((p) => p.slug === slug);
