// Connected Messenger's sample contacts: friends who come with every new
// account, the same people who post on Birdie, Tum and MeTube. Their
// online times, status messages and chat replies are scripted, and the app
// labels their replies as automatic so they're never mistaken for a person
// typing. Real conversations happen between accounts on this computer.

import type { Presence } from "@/components/system/types";

export interface ScheduleSlot {
  /** 0 = Sunday. Omit for every day. */
  days?: number[];
  /** Local hours on the computer's clock, [from, to). */
  from: number;
  to: number;
  status: Exclude<Presence, "offline">;
}

export interface SampleContact {
  id: string;
  name: string;
  email: string;
  avatar: string;
  /** Status messages, each shown from its date on. */
  statusMessages: { from: string; text: string }[];
  schedule: ScheduleSlot[];
  awayMessage: string;
  greetings: string[];
  howAreYou: string[];
  smallTalk: string[];
  links: { metube: string[]; manga: string[]; other: string[] };
  topics: { match: string; replies: string[] }[];
}

const EVERY_EVENING: ScheduleSlot[] = [
  { from: 16, to: 23, status: "online" },
  { days: [0, 6], from: 10, to: 16, status: "online" },
];

export const sampleContacts: SampleContact[] = [
  {
    id: "ct_dana",
    name: "Dana",
    email: "dana.doodles@connectmail.net",
    avatar: "flower",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "picnic weather!! ☀" },
      { from: "2012-10-15T00:00:00Z", text: "editing the pumpkin vlog 🎃" },
      { from: "2012-12-20T00:00:00Z", text: "snow day vlog is up!" },
      { from: "2013-04-01T00:00:00Z", text: "new sketchbook, who dis" },
      { from: "2013-08-20T00:00:00Z", text: "autumn sketch walks start soon 🍂" },
    ],
    schedule: [...EVERY_EVENING, { days: [1, 2, 3, 4, 5], from: 12, to: 13, status: "away" }],
    awayMessage: "Out sketching! Back in a bit 🌼",
    greetings: ["heyyy! :D", "hi hi! what's up?", "oh hey you! :)"],
    howAreYou: ["pretty good! just made tea and I'm editing a video. you?", "good! a little sleepy but happy. how's your day going?"],
    smallTalk: ["haha yes", "omg same", "that sounds really fun :)", "ooh tell me more!", "lol I love that", "you should totally do it!"],
    links: {
      metube: ["ooh watching now!", "HAHA I love this one", "adding it to my favorites :D"],
      manga: ["oh I've been meaning to read that!", "is it good?? I need something new to read"],
      other: ["ooh thanks, I'll check it out later!", "bookmarking this :)"],
    },
    topics: [
      { match: "draw|sketch|art|paint", replies: ["yesss show me when it's done!", "I've been drawing leaves all week lol"] },
      { match: "vlog|video|metube", replies: ["the next vlog is a paper plane contest, it got very competitive", "editing takes me forever but it's worth it :)"] },
      { match: "tea|coffee", replies: ["tea gang 🍵", "I have like nine kinds of tea, it's a problem"] },
    ],
  },
  {
    id: "ct_sky",
    name: "Sky",
    email: "skyblue.kid@connectmail.net",
    avatar: "rocket",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "folding paper planes all summer ✈" },
      { from: "2012-11-21T00:00:00Z", text: "STAR COURIER IS OUT" },
      { from: "2013-03-01T00:00:00Z", text: "level 4 boss... someday" },
      { from: "2013-09-01T00:00:00Z", text: "back to school but still gaming" },
    ],
    schedule: [{ from: 15, to: 22, status: "online" }, { days: [0, 6], from: 9, to: 15, status: "online" }],
    awayMessage: "brb dinner",
    greetings: ["yo!", "hey!! :D", "sup"],
    howAreYou: ["good! just got home. wanna play something?", "great, I finally beat level 3 lol"],
    smallTalk: ["lol", "nice!!", "haha true", "wait really? cool", "XD", "ok that's awesome"],
    links: {
      metube: ["LOL watching", "omg I saw this yesterday, the ending!!", "haha sending this to everyone"],
      manga: ["is it the one with the planet? I like that one", "ok I'll read it after my homework"],
      other: ["cool I'll look", "nice find"],
    },
    topics: [
      { match: "star courier|game|play|level|boss", replies: ["stay in the bottom lane, PixelPilot says the gaps open up there", "I got 4,200 points yesterday!! so close to 5k"] },
      { match: "plane|fold", replies: ["the dart fold is still the best one", "I got 18 metres in the hallway lol"] },
      { match: "homework|school", replies: ["ugh math homework", "school is fine, lunch is the best part"] },
    ],
  },
  {
    id: "ct_nadia",
    name: "Nadia",
    email: "nadia.draws@connectmail.net",
    avatar: "palette",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "drawing every day! nadiadraws.tum.com" },
      { from: "2012-08-05T00:00:00Z", text: "Lantern Street Couriers fan art is up ♥" },
      { from: "2013-01-15T00:00:00Z", text: "Paper Planet is so cute aaa" },
      { from: "2013-06-25T00:00:00Z", text: "taking commissions soon!" },
    ],
    schedule: [{ from: 13, to: 18, status: "busy" }, { from: 18, to: 24, status: "online" }, { days: [0, 6], from: 11, to: 13, status: "online" }],
    awayMessage: "In drawing mode, I'll answer when I come up for air ✏",
    greetings: ["hiii ♥", "hey there! :)", "oh hi!"],
    howAreYou: ["good! I'm colouring a new piece right now", "doing well! my hand is tired from inking lol"],
    smallTalk: ["aww <3", "hehe", "that's so nice", "omg yes", "I love that", ":D"],
    links: {
      metube: ["haha cute!", "ooh I'll watch it while I colour"],
      manga: ["YES I love that series, Mei is my favourite", "oh I drew fan art of that one!"],
      other: ["ooh pretty", "thanks! I'll have a look"],
    },
    topics: [
      { match: "draw|art|fan ?art|commission|tum", replies: ["I'm working on a Paper Planet piece next!", "you should post your drawings on Tum too!"] },
      { match: "manga|lantern|paper planet|moonlit", replies: ["Lantern Street Couriers chapter 2 has the best rooftop scene", "Pip from Paper Planet is the cutest thing ever"] },
    ],
  },
  {
    id: "ct_akira",
    name: "Akira",
    email: "akira.keys@connectmail.net",
    avatar: "guitar",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "♪ new song every month" },
      { from: "2012-07-28T00:00:00Z", text: "Summer Rain is up on MeTube!" },
      { from: "2013-05-10T00:00:00Z", text: "practicing something faster for once" },
    ],
    schedule: [{ from: 19, to: 24, status: "online" }, { days: [0, 6], from: 14, to: 19, status: "away" }],
    awayMessage: "At the piano. I'll be back after this song ♪",
    greetings: ["hey :)", "hello!", "hi, good to see you on"],
    howAreYou: ["good, thanks! been playing all afternoon", "pretty relaxed today. you?"],
    smallTalk: ["nice :)", "haha", "that's cool", "I like that", "mm sounds good"],
    links: {
      metube: ["oh nice, the music in this is good", "watching now :)"],
      manga: ["I don't read much manga but I'll give it a try"],
      other: ["thanks, I'll take a look"],
    },
    topics: [
      { match: "music|song|piano|play|rain", replies: ["the next song is about the harbour at night", "rain sounds make everything better honestly"] },
    ],
  },
  {
    id: "ct_olivia",
    name: "Olivia",
    email: "otaku.olivia@connectmail.net",
    avatar: "star",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "summer anime season!!" },
      { from: "2012-10-01T00:00:00Z", text: "fall season is STACKED" },
      { from: "2013-04-01T00:00:00Z", text: "spring season list on YAL is done ✔" },
      { from: "2013-09-01T00:00:00Z", text: "updating my YAL list..." },
    ],
    schedule: [{ from: 18, to: 24, status: "online" }, { days: [0, 6], from: 12, to: 18, status: "online" }],
    awayMessage: "Watching an episode, back in 24 minutes ;)",
    greetings: ["hey!! :D", "hiya!", "omg hi"],
    howAreYou: ["good!! catching up on my backlog", "great, I just finished a whole season lol"],
    smallTalk: ["lol yes", "SAME", "omg", "that's so true", "haha :P", "we have to talk about this more"],
    links: {
      metube: ["lol I'll watch it after this episode", "haha nice"],
      manga: ["ooh is that on MangaShelf? adding it to my list", "I read chapter 1, it's so good!"],
      other: ["ooh thanks!", "bookmarked!"],
    },
    topics: [
      { match: "anime|yal|episode|season|watch", replies: ["have you updated your YAL list? mine is a mess lol", "I'm rewatching something cosy this week"] },
      { match: "manga", replies: ["MangaShelf has new chapters on Fridays, I check every week", "I'm reading three series at once lol"] },
    ],
  },
  {
    id: "ct_tom",
    name: "Tom",
    email: "techtips.tom@connectmail.net",
    avatar: "robot",
    statusMessages: [
      { from: "2012-07-01T00:00:00Z", text: "Ask me anything about your PC!" },
      { from: "2012-11-10T00:00:00Z", text: "New tutorial: wallpapers in Paint" },
      { from: "2013-07-01T00:00:00Z", text: "Tip: right-click a picture > Set as desktop background" },
    ],
    schedule: [{ days: [1, 2, 3, 4, 5], from: 9, to: 17, status: "busy" }, { from: 17, to: 22, status: "online" }, { days: [0, 6], from: 10, to: 20, status: "online" }],
    awayMessage: "Working on a tutorial right now. I'll get back to you soon!",
    greetings: ["Hi there! :)", "Hello!", "Hey, good to hear from you"],
    howAreYou: ["Doing well, thanks! Recording a new tutorial today.", "Good! Fixing my uncle's computer, as usual :)"],
    smallTalk: ["Great!", "Sounds good.", "Happy to help any time.", "Nice one :)", "Glad that worked out!"],
    links: {
      metube: ["Thanks, I'll watch it on my break!", "Ha, nice one."],
      manga: ["Not really my thing, but my niece might like it!"],
      other: ["Thanks for the link!", "I'll have a look later."],
    },
    topics: [
      { match: "wallpaper|background", replies: ["Easy one: open the picture in Photo Viewer and click Set as desktop background.", "WallpaperGarden has lots of free ones, then right-click the file in Downloads."] },
      { match: "download|file|folder", replies: ["Downloads end up in your Downloads folder. Open Explorer and it's in Favorites on the left.", "If a download stops, open about:downloads in the browser and hit Retry."] },
      { match: "zip|archive", replies: ["The Archive Manager can make and extract ZIP files. Right-click files > Add to ZIP archive."] },
      { match: "help|how|problem|broken", replies: ["Restarting fixes more than you'd think :)", "Tell me what you clicked and what happened, and we'll figure it out."] },
    ],
  },
];

export const sampleContactById = (id: string) => sampleContacts.find((c) => c.id === id);
export const sampleContactByEmail = (email: string) => sampleContacts.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
export const DEFAULT_CONTACTS = sampleContacts.map((c) => c.id);
