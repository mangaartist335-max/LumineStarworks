// Forum boards and the general (non-episode) threads seeded for 2012–2013.
//
// The Impact of Eden episode threads come from the archived pages in
// generated/ioe-threads.json. The threads below are reconstructed sample
// content written in the voice of the archive's members; every one is
// labelled "reconstructed" so it is never mistaken for a recovered record.

import type { ForumBoard, Thread } from "./types";
import { IOE_ID, IRON_ID, SINFUL_APEX_ID } from "./anime";

export const boards: ForumBoard[] = [
  { slug: "general", name: "General Anime Discussion", description: "Talk about anything anime that doesn't fit elsewhere.", group: "Anime & Manga" },
  { slug: "seasonal", name: "Seasonal Anime", description: "Season charts, first impressions and what everyone is watching right now.", group: "Anime & Manga" },
  { slug: "episode", name: "Episode Discussion", description: "One thread per episode. No future-episode spoilers.", group: "Anime & Manga" },
  { slug: "manga", name: "Manga Discussion", description: "Chapters, volumes and source material. Spoiler tags required.", group: "Anime & Manga" },
  { slug: "recommendations", name: "Anime Recommendations", description: "Looking for something new? Ask here.", group: "Anime & Manga" },
  { slug: "characters", name: "Character Discussion", description: "Appreciation threads, analysis and favourite characters.", group: "Anime & Manga" },
  { slug: "production", name: "Animation & Production", description: "Studios, staff, sakuga and the business side of anime.", group: "Anime & Manga" },
  { slug: "gaming", name: "Gaming", description: "Video games, visual novels and everything in between.", group: "Community" },
  { slug: "music", name: "Music", description: "OPs, EDs, soundtracks and singles.", group: "Community" },
  { slug: "offtopic", name: "Off Topic", description: "Anything goes (within the rules).", group: "Community" },
  { slug: "support", name: "Community Support", description: "Site help, bug reports and announcements from the YAL staff.", group: "YAL" },
];

export interface SeedThreadPost {
  author: string;
  at: string;
  body: string;
  editedAt?: string;
  editReason?: string;
}

export interface SeedThread extends Thread {
  posts: SeedThreadPost[];
}

export const seedThreads: SeedThread[] = [
  // ── Community Support ───────────────────────────────────────────────────
  {
    id: "t-20114",
    board: "support",
    title: "[Rules] Episode Discussion board guidelines (please read)",
    author: "YALBot",
    createdAt: "2012-01-05T03:00:00Z",
    pinned: true,
    locked: true,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2012-01-05T03:00:00Z",
        body:
          "[b]Welcome to Episode Discussion![/b]\n\nA few rules so everyone can enjoy their shows:\n\n[list]\n[*]One thread per episode. Threads are opened automatically after the regular Japanese broadcast.\n[*]Keep discussion focused on the episode in the thread title.\n[*]No spoilers for future episodes, ever.\n[*]Manga / source material talk goes inside [spoiler] tags.\n[*]Be respectful. Disagreeing about a show is fine; attacking people is not.\n[/list]\n\nSpoiler tags work like this:\n\n[code][spoiler=manga readers only]your text here[/spoiler][/code]\n\n[small]— YAL Staff[/small]",
      },
    ],
  },
  {
    id: "t-31877",
    board: "support",
    title: "Post timestamps show the wrong time zone?",
    author: "CalibrationLunchbox",
    createdAt: "2013-10-05T21:25:00Z",
    provenance: "reconstructed",
    posts: [
      {
        author: "CalibrationLunchbox",
        at: "2013-10-05T21:25:00Z",
        body: "New here (hi!). My posts in the Impact of Eden thread show PDT but everyone else's say JST. Did I break something? lol",
      },
      {
        author: "NovaFanPixel",
        at: "2013-10-05T21:41:00Z",
        body:
          "Nope, that's normal! Timestamps use whatever zone you set in your account settings. Most of the episode-thread regulars use JST so it lines up with broadcast times, but plenty of us in the US and Europe leave it on local time.\n\nWelcome to YAL :)",
      },
      {
        author: "CalibrationLunchbox",
        at: "2013-10-05T21:46:00Z",
        body: "Ahh that makes sense. Leaving it on PDT so I know when to sleep XD thanks!",
      },
    ],
  },

  // ── General Anime Discussion ────────────────────────────────────────────
  {
    id: "t-21950",
    board: "general",
    title: "What are you watching right now? (2012 edition)",
    author: "FinalBossu",
    createdAt: "2012-01-08T11:20:00Z",
    pinned: true,
    provenance: "reconstructed",
    posts: [
      {
        author: "FinalBossu",
        at: "2012-01-08T11:20:00Z",
        body: "New year, new thread! Post what you're currently watching and how it's going. I'll start:\n\n[list]\n[*]Sinful Apex — three episodes left and I'm not ready\n[*]Catching up on my backlog over the holidays\n[/list]",
      },
      {
        author: "NekoToast92",
        at: "2012-01-08T13:02:00Z",
        body: "Sinful Apex as well! Monday nights have been sacred since August. Also rewatching some older stuff with my little brother, he's finally old enough for action shows :3",
      },
      {
        author: "StormWallTheory",
        at: "2012-01-09T02:47:00Z",
        body: "Sinful Apex and that's it, I'm a one-show-at-a-time person. I like to sit with things.\n\nI have a THEORY about the last two episodes but I'll keep it out of here.",
      },
      {
        author: "ShounenLifer_VHS",
        at: "2012-01-24T10:15:00Z",
        body: "Update: Sinful Apex is DONE. Twenty-four episodes and Miura didn't waste a single one. Now I need something new for Mondays. Suggestions welcome in the Recs board!",
      },
    ],
  },
  {
    id: "t-31402",
    board: "general",
    title: "What are you watching right now? (Fall 2013)",
    author: "FinalBossu",
    createdAt: "2013-10-01T10:00:00Z",
    pinned: true,
    provenance: "reconstructed",
    posts: [
      {
        author: "FinalBossu",
        at: "2013-10-01T10:00:00Z",
        body: "Fresh season, fresh thread. What's on your list this fall? Iron to Requiem fans, how are you coping now that it's over? XD",
      },
      {
        author: "NodeCoreOmega",
        at: "2013-10-01T12:31:00Z",
        body: "Still listening to the Iron to Requiem OST on loop, so not coping at all. Going in on Impact of Eden Saturday night. Same composer, so my ears are ready.",
      },
      {
        author: "HollowToast",
        at: "2013-10-01T22:05:00Z",
        body: "Impact of Eden is the only one I'm sure about. Miura directing after Sinful Apex is enough for me.",
      },
      {
        author: "PlanetationBro",
        at: "2013-10-06T04:12:00Z",
        body: "Update after Saturday: Impact of Eden. That's the list. That's the whole list. Go watch it.",
      },
      {
        author: "ChibiComet_92",
        at: "2013-10-07T09:50:00Z",
        body: "Impact of Eden plus whatever my friends make me watch. The Episode 1 thread hit 20 pages in a day, I've never seen this forum move so fast lol",
      },
    ],
  },

  // ── Seasonal Anime ──────────────────────────────────────────────────────
  {
    id: "t-26388",
    board: "seasonal",
    title: "Spring 2013: Iron to Requiem first impressions",
    author: "NodeCoreOmega",
    createdAt: "2013-04-04T14:10:00Z",
    animeId: IRON_ID,
    provenance: "reconstructed",
    posts: [
      {
        author: "NodeCoreOmega",
        at: "2013-04-04T14:10:00Z",
        body: "CHAOS Home + Hiroyuki Sawano + 26 episodes. Episode 1 is out, what did everyone think?\n\nThe music alone has me sold for the whole run.",
      },
      {
        author: "SakugaThreadZero",
        at: "2013-04-04T16:44:00Z",
        body: "Solid opener. Animation is steady rather than flashy, which is honestly what you want for a two-cour show. Let's see how it holds up by summer.",
      },
      {
        author: "FinalBossu",
        at: "2013-04-05T01:20:00Z",
        body: "Thursday nights are booked until September now. Sawano insert tracks hit every single time.",
      },
    ],
  },
  {
    id: "t-30905",
    board: "seasonal",
    title: "Fall 2013 season chart discussion",
    author: "NovaFanPixel",
    createdAt: "2013-09-15T06:30:00Z",
    pinned: true,
    provenance: "reconstructed",
    posts: [
      {
        author: "NovaFanPixel",
        at: "2013-09-15T06:30:00Z",
        body: "The Fall 2013 chart is up! The big one for a lot of us is [b]Impact of Eden[/b]: Studio Burst's debut, Kaihatsu Miura directing, Sawano on music, 25 episodes planned.\n\nWhat are you most hyped for?",
      },
      {
        author: "StormWallTheory",
        at: "2013-09-15T08:02:00Z",
        body: "A brand-new studio whose first ever production is a 25-episode TV series? Bold. I respect it.",
      },
      {
        author: "3EpisodeRule",
        at: "2013-09-16T10:40:00Z",
        body: "Adding it to Plan to Watch. Three episodes and I'll tell you all what I think. You know the rules.",
      },
      {
        author: "KaichouEnjoyer",
        at: "2013-09-20T12:25:00Z",
        body: "Saori Hayami is in the cast. That's all I needed to hear.",
      },
    ],
  },

  // ── Episode Discussion (non-IoE) ────────────────────────────────────────
  {
    id: "t-30610",
    board: "episode",
    title: "Iron to Requiem Episode 26 Discussion",
    author: "YALBot",
    createdAt: "2013-09-26T14:30:00Z",
    animeId: IRON_ID,
    episode: 26,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2013-09-26T14:30:00Z",
        body: "[b]Episode 26 is now available.[/b]\n\nPlease keep discussion focused on Episode 26.\nDo not post spoilers for future episodes.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "NodeCoreOmega",
        at: "2013-09-26T14:51:00Z",
        body: "Twenty-six weeks went by FAST. Thank you CHAOS Home, thank you Sawano. What a ride.",
      },
      {
        author: "FinalBossu",
        at: "2013-09-26T15:20:00Z",
        body: "That last soundtrack cue gave me chills. Buying the OST the day it's out.",
      },
      {
        author: "ChibiComet_92",
        at: "2013-09-26T16:03:00Z",
        body: "Great finale! Thursday nights won't be the same. Good thing Impact of Eden starts next week, same composer so I'm covered XD",
      },
    ],
  },

  // ── Manga Discussion ────────────────────────────────────────────────────
  {
    id: "t-31690",
    board: "manga",
    title: "Impact of Eden manga readers: spoiler-tag etiquette thread",
    author: "NovaFanPixel",
    createdAt: "2013-10-06T03:20:00Z",
    animeId: IOE_ID,
    pinned: true,
    provenance: "reconstructed",
    posts: [
      {
        author: "NovaFanPixel",
        at: "2013-10-06T03:20:00Z",
        body:
          "With the anime airing, the Episode Discussion threads are full of anime-only folks. Let's keep it fun for them.\n\n[list]\n[*]Anything from the manga beyond the current episode goes in [spoiler] tags.\n[*]\"Pay attention to X\" teases count as spoilers too.\n[*]Want to talk freely? This board is the place, just title your thread with the chapter number.\n[/list]",
      },
      {
        author: "ImageboardGoblin",
        at: "2013-10-06T04:30:00Z",
        body: "ok ok I hear you. I'll use the tags. sorry anime-onlies >_>",
      },
      {
        author: "AbigailFanAlready",
        at: "2013-10-06T05:12:00Z",
        body: "Thank you!! Anime-only here and I want to experience everything fresh.",
      },
    ],
  },

  // ── Anime Recommendations ───────────────────────────────────────────────
  {
    id: "t-22048",
    board: "recommendations",
    title: "Looking for shows like Sinful Apex",
    author: "ShounenLifer_VHS",
    createdAt: "2012-01-24T10:40:00Z",
    animeId: SINFUL_APEX_ID,
    provenance: "reconstructed",
    posts: [
      {
        author: "ShounenLifer_VHS",
        at: "2012-01-24T10:40:00Z",
        body: "Just finished Sinful Apex and I need more dense, no-filler action. What should I watch next?",
      },
      {
        author: "HollowToast",
        at: "2012-01-24T21:15:00Z",
        body: "Try [b]Zero Latitude[/b]. Same director, Kaihatsu Miura, and it has one of the best long-take action sequences I've ever seen.",
      },
      {
        author: "SakugaThreadZero",
        at: "2012-01-25T03:02:00Z",
        body: "Seconding Zero Latitude. Tomoe Suzuhara boarded that long take. Also check out [b]Skyfall Chronicle: Black Aegis[/b], which Miura co-directed.",
      },
      {
        author: "ShounenLifer_VHS",
        at: "2013-10-07T09:30:00Z",
        body: "Bumping my own thread a year and a half later because the answer is now obvious: [b]Impact of Eden[/b]. Miura again, and Studio Burst is basically the Sinful Apex crew. Go!",
      },
    ],
  },

  // ── Character Discussion ────────────────────────────────────────────────
  {
    id: "t-31733",
    board: "characters",
    title: "Miyuki Kagemitsu appreciation thread",
    author: "KaichouEnjoyer",
    createdAt: "2013-10-06T09:40:00Z",
    animeId: IOE_ID,
    provenance: "reconstructed",
    posts: [
      {
        author: "KaichouEnjoyer",
        at: "2013-10-06T09:40:00Z",
        body: "She gave the best speech of the season in episode ONE. A thread for appreciating our class president of all time.\n\n[quote=\"Miyuki Kagemitsu\"]Therefore, our choice towards history is REFUSAL![/quote]",
      },
      {
        author: "NovaFanPixel",
        at: "2013-10-06T10:15:00Z",
        body: "Hayami's delivery is unreal. She doesn't get louder, she gets quieter. Instant favourite.",
      },
      {
        author: "PlanetationBro",
        at: "2013-10-06T11:02:00Z",
        body: "\"Barbaracy\" is my new favourite word, I'm using it in every essay from now on.",
      },
    ],
  },

  // ── Animation & Production ──────────────────────────────────────────────
  {
    id: "t-31205",
    board: "production",
    title: "Studio Burst: a brand-new studio from the Flow Pictures crew",
    author: "SakugaThreadZero",
    createdAt: "2013-09-28T07:15:00Z",
    provenance: "reconstructed",
    posts: [
      {
        author: "SakugaThreadZero",
        at: "2013-09-28T07:15:00Z",
        body:
          "Quick summary for anyone catching up:\n\n[list]\n[*]Studio Burst formed out of Flow Pictures' late-era cinematic unit after Sinful Apex.\n[*]Impact of Eden is their first animated work. No shorts, no ONA, nothing before it.\n[*]Kaihatsu Miura directs. Tomoe Suzuhara leads storyboards. Lio Haraguchi on character design.\n[/list]\n\nDebuting with a 25-episode series is a huge swing. Very curious to see the result.",
      },
      {
        author: "NodeCorePilot",
        at: "2013-09-28T09:44:00Z",
        body: "Yusuke Kagura on action choreography too. If the fights look half as good as River of Sparks we're eating well.",
      },
      {
        author: "RetroBluRay_AMV",
        at: "2013-09-29T13:10:00Z",
        body: "Already saving room on my hard drive for the AMV clips. Sawano + Suzuhara boards is going to be AMV gold.",
      },
      {
        author: "SakugaThreadZero",
        at: "2013-10-06T05:30:00Z",
        body: "Update: they did it. Episode 1 is a debut nobody will forget. Frame breakdowns are going up in the episode thread.",
      },
    ],
  },

  // ── Gaming ──────────────────────────────────────────────────────────────
  {
    id: "t-31310",
    board: "gaming",
    title: "VR MMO anime always make me want to play an MMO again",
    author: "ToonblockKid",
    createdAt: "2013-10-07T12:00:00Z",
    provenance: "reconstructed",
    posts: [
      {
        author: "ToonblockKid",
        at: "2013-10-07T12:00:00Z",
        body: "Watched Impact of Eden and now I want to reinstall every MMO I've ever played. Planetation's UI overlays are too good. Anyone else?",
      },
      {
        author: "NodeCorePilot",
        at: "2013-10-07T13:22:00Z",
        body: "Every single time. The combat log jokes in episode 1 were too real. I've definitely been the guy disabling safety settings in 30 seconds.",
      },
      {
        author: "HyperNekoMimi",
        at: "2013-10-07T15:48:00Z",
        body: "I just want the emote that makes five NPCs copy your dance. Is that too much to ask??",
      },
    ],
  },

  // ── Music ───────────────────────────────────────────────────────────────
  {
    id: "t-31744",
    board: "music",
    title: "\"Human x Inhuman\" (Impact of Eden OP) — single out Oct 16",
    author: "sleepySenpai_DesuKa",
    createdAt: "2013-10-06T06:10:00Z",
    animeId: IOE_ID,
    provenance: "reconstructed",
    posts: [
      {
        author: "sleepySenpai_DesuKa",
        at: "2013-10-06T06:10:00Z",
        body: "T.M.Revolution on an anime OP again! The single is out October 16 from Sony Music Japan. Who's buying?",
      },
      {
        author: "FinalBossu",
        at: "2013-10-06T07:30:00Z",
        body: "Day one. Playing it at the END of episode 1 instead of the start was genius, I was already hyped and then THAT kicks in.",
      },
      {
        author: "RetroBluRay_AMV",
        at: "2013-10-16T09:05:00Z",
        body: "Got my copy today! Full version is even better than the TV size. The bridge is amazing.",
      },
    ],
  },

  // ── Off Topic ───────────────────────────────────────────────────────────
  {
    id: "t-31791",
    board: "offtopic",
    title: "Where are you watching from? (time zone roll call)",
    author: "HollowToast",
    createdAt: "2013-10-06T22:40:00Z",
    provenance: "reconstructed",
    posts: [
      {
        author: "HollowToast",
        at: "2013-10-06T22:40:00Z",
        body: "The Impact of Eden thread had people posting from everywhere this weekend. Roll call! UK here, GMT, permanently tired.",
      },
      {
        author: "CalibrationLunchbox",
        at: "2013-10-06T23:15:00Z",
        body: "California, PDT! Raw streams at dinner time, it's actually pretty great.",
      },
      {
        author: "NekoToast92",
        at: "2013-10-07T01:00:00Z",
        body: "East coast US. I watch first thing in the morning before school, best way to start a Sunday.",
      },
      {
        author: "PlanetationBro",
        at: "2013-10-07T02:20:00Z",
        body: "JST gang represent. 25:58 is a perfectly normal time to be awake, I promise.",
      },
    ],
  },

  // ── Episode Discussion: finales of the 2012–2013 back catalogue ─────────
  {
    id: "t-21990",
    board: "episode",
    title: "Sinful Apex Episode 24 Discussion",
    author: "YALBot",
    createdAt: "2012-01-23T16:31:00Z",
    animeId: SINFUL_APEX_ID,
    episode: 24,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2012-01-23T16:31:00Z",
        body: "[b]Episode 24 (\"Sinful Apex\") is now available.[/b]\n\nThis is the final episode. Please keep discussion focused on Episode 24.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "ShounenLifer_VHS",
        at: "2012-01-23T16:52:00Z",
        body: "Twenty-four weeks and Miura didn't waste a single minute. That last climb up the Apex stairway with the whole city lit up underneath them... I'm out of words. Flow Pictures went out swinging.",
      },
      {
        author: "MahouShoujoLifer",
        at: "2012-01-23T17:20:00Z",
        body: "Aria Moonbirth singing [i]Moonbirth[/i] over the final credits while every tower lord shows up in the crowd was SO good. LUNE really did make Aria feel like a real singer all season.",
      },
      {
        author: "StormWallTheory",
        at: "2012-01-23T18:05:00Z",
        body: "I said back in October that Nico's wish would be for someone else and I was RIGHT. She was the heart of this show from episode 2 onward. Mariya Ise, thank you.\n\n[spoiler=the wish]The look on Lyle's face when she says it. Perfect ending.[/spoiler]",
      },
      {
        author: "HollowToast",
        at: "2012-01-24T08:40:00Z",
        body: "Caught it on the train this morning. Great ending, great show, and now my Mondays are free. Already reading the recommendations board for what to watch next.",
      },
      {
        author: "ED_Appreciator",
        at: "2012-01-24T11:15:00Z",
        body: "Full version of Moonbirth when?? The TV size isn't enough, I need all of it.",
      },
    ],
  },
  {
    id: "t-24410",
    board: "episode",
    title: "Glass Cathedral Episode 12 Discussion",
    author: "YALBot",
    createdAt: "2012-03-28T17:00:00Z",
    animeId: 4407,
    episode: 12,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2012-03-28T17:00:00Z",
        body: "[b]Episode 12 (\"Glass Cathedral\") is now available.[/b]\n\nThis is the final episode. Please keep discussion focused on Episode 12.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "NovaFanPixel",
        at: "2012-03-28T17:24:00Z",
        body: "Every window lighting up again at once during the morning bells. Kinemachi saved the best shot of the season for last. Saori Hayami's narration over it was beautiful.",
      },
      {
        author: "QuietWatcher_X",
        at: "2012-03-28T18:10:00Z",
        body: "I've been lurking all season, but I have to post: the reveal of whose memories were fading was set up from the very first episode. Rewatching the whole thing this weekend.",
      },
      {
        author: "KaichouEnjoyer",
        at: "2012-03-29T02:45:00Z",
        body: "Tobias finally getting his own window made me so happy. The lamplighter deserved it.",
      },
      {
        author: "NekoToast92",
        at: "2012-03-29T11:30:00Z",
        body: "Quiet, gentle, and the ending made me smile for an hour. Easily my favourite show of the winter.",
      },
    ],
  },
  {
    id: "t-26890",
    board: "episode",
    title: "Circuit Hearts: Reload Episode 12 Discussion",
    author: "YALBot",
    createdAt: "2012-06-22T16:01:00Z",
    animeId: 9608,
    episode: 12,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2012-06-22T16:01:00Z",
        body: "[b]Episode 12 (\"Circuit Hearts: Reload\") is now available.[/b]\n\nThis is the final episode. Please keep discussion focused on Episode 12.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "RetroBluRay_AMV",
        at: "2012-06-22T16:30:00Z",
        body: "THEY FINISHED THE CONCERT. Ten years late and it was worth it. Pulsewave animated the whole final song with no cuts, I'm going to be making AMVs of this until I'm old.",
      },
      {
        author: "JustHereForOPs",
        at: "2012-06-22T17:05:00Z",
        body: "[i]Reload My Heart[/i] as the encore instead of the closing song was a great choice. Full-size OP in the finale, the classic move.",
      },
      {
        author: "HyperNekoMimi",
        at: "2012-06-22T19:40:00Z",
        body: "Yuu finally singing one (very bad) line on stage and the crowd cheering anyway. I loved that so much.",
      },
      {
        author: "ChibiComet_92",
        at: "2012-06-23T09:12:00Z",
        body: "Pico stole every scene she was in. Please give us an OVA of the band's world tour!",
      },
    ],
  },
  {
    id: "t-28655",
    board: "episode",
    title: "Vacant Crown: Liminal War Episode 24 Discussion",
    author: "YALBot",
    createdAt: "2012-12-15T08:31:00Z",
    animeId: 9871,
    episode: 24,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2012-12-15T08:31:00Z",
        body: "[b]Episode 24 (\"Vacant No More\") is now available.[/b]\n\nThis is the final episode. Please keep discussion focused on Episode 24.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "StormWallTheory",
        at: "2012-12-15T08:52:00Z",
        body: "Twenty-four episodes of setup and the crown speaks in the last ten minutes. Sendo and Tobe planned every map, every banner and every treaty for this moment, and it LANDED.",
      },
      {
        author: "FinalBossu",
        at: "2012-12-15T09:30:00Z",
        body: "Mirelle drawing the new border in the final shot while the second OP plays. Show of the year for me, no contest.",
      },
      {
        author: "NodeCoreOmega",
        at: "2012-12-15T11:02:00Z",
        body: "Kazane Ichijo's choir track for the coronation gave me chills. Buying the soundtrack the day it's out.",
      },
      {
        author: "SakugaThreadZero",
        at: "2012-12-15T13:45:00Z",
        body: "Arc Meridian kept the battle animation consistent across two full cours. The liminal army charge in the finale is going in my sakuga folder.",
      },
      {
        author: "OldSenseiKnees",
        at: "2012-12-16T01:20:00Z",
        body: "Pell running the last message across the border made me cheer out loud. Best kid character of 2012.",
      },
    ],
  },
  {
    id: "t-30120",
    board: "episode",
    title: "Ghost Eater Episode 12 Discussion",
    author: "YALBot",
    createdAt: "2013-03-28T16:58:00Z",
    animeId: 6811,
    episode: 12,
    provenance: "reconstructed",
    posts: [
      {
        author: "YALBot",
        at: "2013-03-28T16:58:00Z",
        body: "[b]Episode 12 (\"Thanks for the Meal\") is now available.[/b]\n\nThis is the final episode. Please keep discussion focused on Episode 12.\n\n[small]— Automated post by YALBot. Replies are open.[/small]",
      },
      {
        author: "NekoToast92",
        at: "2013-03-28T17:15:00Z",
        body: "Granny Fumi finally finishing her drama and moving on with a smile... and then Kenji saying \"thanks for the meal\" to her. What a sweet ending.",
      },
      {
        author: "PlanetationBro",
        at: "2013-03-28T17:48:00Z",
        body: "Tsubaki's business plan actually WORKING in the end is the funniest possible payoff. This show never stopped being fun.",
      },
      {
        author: "AnoneAnoneAnone",
        at: "2013-03-28T20:30:00Z",
        body: "Detective Ozaki asking to be transferred to Kenji's cases permanently. Character growth!",
      },
      {
        author: "ToonblockKid",
        at: "2013-03-29T10:05:00Z",
        body: "Ashgrove did it again. Azure Sorcerer was my childhood and Ghost Eater just became my winter. Season 2 please!",
      },
    ],
  },
];
