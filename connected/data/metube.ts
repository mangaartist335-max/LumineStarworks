// MeTube archive: channels, videos and comments as they were published.
// All videos are original works made for the Connected Era (see
// scripts/media/videos.py). Counts are archive snapshots; between snapshots
// they grow smoothly, and they never appear before the video was uploaded.

import type { Availability } from "@/lib/availability";
import { media } from "./media";

export const METUBE_HOST = "metube.connectedera.local";

export interface Channel {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  joinedAt: string;
  about: string;
  color: string;
}

export interface ArchiveComment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  at: string;
}

export interface Video {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  src: string;
  thumb: string;
  duration: number;
  availability: Availability;
  /** [time, views] archive snapshots. */
  views: [string, number][];
  likeRatio: number;
  comments: ArchiveComment[];
  /** Made for the archive in the style of a period upload (Master Bible ch. 7); MeTube says so on the page. */
  reconstruction?: boolean;
}

const av = (k: string) => media(`avatar:${k}`).url;

export const channels: Channel[] = [
  { id: "ch_pixelpilot", handle: "PixelPilotGaming", name: "PixelPilotGaming", avatar: av("gamepad"), joinedAt: "2010-03-14T12:00:00Z", color: "#2a3f8f", about: "Walkthroughs, high-score runs and lots of tips. New Star Courier parts every other Saturday!" },
  { id: "ch_hendersons", handle: "TheHendersonsHome", name: "TheHendersonsHome", avatar: av("cat"), joinedAt: "2009-08-02T12:00:00Z", color: "#c8642e", about: "Our family, our cat Mochi and our corgi Biscuit. Mostly the pets, honestly." },
  { id: "ch_akirakeys", handle: "AkiraKeys", name: "AkiraKeys", avatar: av("guitar"), joinedAt: "2011-05-20T12:00:00Z", color: "#5b4a9e", about: "Original piano pieces, one new song every month. Headphones recommended!" },
  { id: "ch_techtipstom", handle: "TechTipsTom", name: "TechTipsTom", avatar: av("robot"), joinedAt: "2008-11-03T12:00:00Z", color: "#1f6fb2", about: "Easy computer tutorials for everyone. No jargon, promise." },
  { id: "ch_sundaystrikers", handle: "SundayStrikers", name: "SundayStrikers", avatar: av("ball"), joinedAt: "2012-04-15T12:00:00Z", color: "#2e8b46", about: "Our Sunday league team. Trick shots, highlights and a lot of practice." },
  { id: "ch_cutabove", handle: "CutAboveEdits", name: "CutAboveEdits", avatar: av("star"), joinedAt: "2010-10-10T12:00:00Z", color: "#333344", about: "Editing tips for montage makers. Short, sweet and easy to follow." },
  { id: "ch_modmymachine", handle: "ModMyMachine", name: "ModMyMachine", avatar: av("rocket"), joinedAt: "2009-02-27T12:00:00Z", color: "#24507a", about: "Desktop customisation: themes, icons, wallpapers and docks." },
  { id: "ch_dailydana", handle: "DailyDanaVlogs", name: "DailyDanaVlogs", avatar: av("flower"), joinedAt: "2011-09-01T12:00:00Z", color: "#b5577c", about: "Weekend vlogs, sketchbook adventures and lots of tea." },
  // The four creators named in the Master Bible (ch. 7). Their videos are constructed reconstructions.
  { id: "ch_iceburner", handle: "XXICEBURNERXX", name: "XXICEBURNERXX", avatar: av("ball"), joinedAt: "2011-07-02T12:00:00Z", color: "#1d7a3a", about: "soccer is life. under 14s left wing. subscribe for goals!!" },
  { id: "ch_heartcore", handle: "HEARTCORE_ANGEL", name: "HEARTCORE_ANGEL", avatar: av("star"), joinedAt: "2011-11-18T12:00:00Z", color: "#b04a9a", about: "nightcore mixes + my own drawings ~ always credit the original artists <3" },
  { id: "ch_noobdestroyer", handle: "NOOBDESTROYER92", name: "NOOBDESTROYER92", avatar: av("gamepad"), joinedAt: "2010-12-24T12:00:00Z", color: "#2c3e8f", about: "games, arcades and the occasional mall adventure. not actually a noob destroyer." },
  { id: "ch_strawberry", handle: "STRAWBERRY_STATIC", name: "STRAWBERRY_STATIC", avatar: av("flower"), joinedAt: "2012-02-11T12:00:00Z", color: "#c23a64", about: "keyboard, karaoke and talent shows. strawberry milk enthusiast." },
  { id: "ch_animetalk", handle: "AnimeTalkTuesday", name: "AnimeTalkTuesday", avatar: av("sun"), joinedAt: "2010-01-12T12:00:00Z", color: "#8a2f5c", about: "Spoiler-free anime reviews and first impressions every Tuesday." },
];

function video(
  id: string,
  key: string,
  channelId: string,
  title: string,
  uploadedAt: string,
  category: string,
  tags: string[],
  description: string,
  views: [string, number][],
  comments: [string, string, string, string][],
  likeRatio = 0.04,
): Video {
  const file = media(`video:${key}`);
  return {
    id,
    channelId,
    title,
    description,
    category,
    tags,
    src: file.url,
    thumb: media(`video-thumb:${key}`).url,
    duration: file.duration ?? 0,
    availability: { publishedAt: uploadedAt, region: "global" },
    views: [[uploadedAt, 0], ...views],
    likeRatio,
    comments: comments.map(([author, avatar, at, text], i) => ({ id: `cmt_${id.slice(4)}_${i + 1}`, author, avatar: av(avatar), at, text })),
  };
}

export const videos: Video[] = [
  video("vid_mt0013", "paper-plane-challenge", "ch_dailydana", "Paper Plane Distance Challenge", "2012-07-21T16:00:00Z", "People & Blogs", ["paper plane", "challenge", "origami", "summer"],
    "Three designs, one park, one very windy afternoon. Throw 3 is my own design, folded at 2am. Folding guide coming next week if you want it!",
    [["2012-07-28T00:00:00Z", 1840], ["2012-12-31T00:00:00Z", 6200], ["2013-12-31T00:00:00Z", 9400]],
    [["skyblue_kid", "rocket", "2012-07-21T19:12:00Z", "24 metres?! I need that folding guide asap"], ["Nadia_draws", "palette", "2012-07-22T10:03:00Z", "The wide-wing one was so elegant though, it deserved better lol"]]),
  video("vid_mt0003", "summer-rain", "ch_akirakeys", "Summer Rain - Original Piano Piece", "2012-07-28T20:00:00Z", "Music", ["piano", "original", "rain", "relaxing", "music"],
    "My July song! I wrote this during a thunderstorm last week. The rain sounds are real-ish (they're synthesized, but I like to pretend). Sheet music on request.",
    [["2012-08-04T00:00:00Z", 3100], ["2012-12-31T00:00:00Z", 15800], ["2013-12-31T00:00:00Z", 31200]],
    [["MochiFan2001", "fish", "2012-07-29T08:40:00Z", "Listening to this while doing homework. Perfect."], ["quietwatcher_x", "leaf", "2012-07-30T22:15:00Z", "The part at 0:22 gives me chills every time."], ["retro_ricky", "gamepad", "2012-08-12T14:02:00Z", "Please make a longer version!!"]], 0.06),
  video("vid_mt0002", "mochi-laser", "ch_hendersons", "Mochi vs. the Laser Pointer", "2012-09-15T15:30:00Z", "Pets & Animals", ["cat", "funny", "laser", "pets", "mochi"],
    "Day 3 of training Mochi. She is very focused. The cushion pile was 100% part of the plan.",
    [["2012-09-22T00:00:00Z", 12400], ["2012-12-31T00:00:00Z", 58300], ["2013-12-31T00:00:00Z", 104900]],
    [["skyblue_kid", "rocket", "2012-09-15T18:20:00Z", "THE POUNCE. I've watched it ten times"], ["CatLady_Jen", "cat", "2012-09-16T09:11:00Z", "My cat does the exact same wiggle before she jumps"], ["DailyDanaVlogs", "flower", "2012-09-17T20:30:00Z", "Mochi for president"]], 0.05),
  video("vid_mt0004", "paint-wallpaper-tutorial", "ch_techtipstom", "How to Make Your Own Desktop Wallpaper in Paint (Beginner)", "2012-11-10T16:00:00Z", "Howto & Style", ["tutorial", "paint", "wallpaper", "desktop", "beginner", "computer"],
    "Make a simple sky-and-hills wallpaper in Paint, save it as a PNG and set it as your desktop background. Takes about five minutes. Great first project!",
    [["2012-11-17T00:00:00Z", 2200], ["2012-12-31T00:00:00Z", 9100], ["2013-12-31T00:00:00Z", 27600]],
    [["grandpa_bill", "sun", "2012-11-12T13:45:00Z", "Thank you Tom! My grandkids were very impressed with my hills."], ["Nadia_draws", "palette", "2012-11-14T17:30:00Z", "Tip: hold Shift with the ellipse tool for a perfect circle, like he says!"]]),
  video("vid_mt0012", "biscuit-snow-day", "ch_hendersons", "Biscuit's First Snow Day!", "2012-12-29T17:00:00Z", "Pets & Animals", ["dog", "corgi", "snow", "cute", "biscuit"],
    "Biscuit had never seen snow before. He has decided it is the best thing ever. Hot cocoa for the humans afterwards.",
    [["2013-01-05T00:00:00Z", 8800], ["2013-12-31T00:00:00Z", 47100]],
    [["MochiFan2001", "fish", "2012-12-29T20:02:00Z", "The snow face at the end!!"], ["CatLady_Jen", "cat", "2012-12-30T11:20:00Z", "Corgi in snow is the best thing on the internet"]], 0.05),
  video("vid_mt0006", "five-transitions", "ch_cutabove", "5 Smooth Transitions for Your Montage", "2013-01-26T17:00:00Z", "Film & Animation", ["editing", "transitions", "montage", "tutorial"],
    "Cross dissolve, wipe, zoom, slide and dip to white: when to use each one, with examples. Works in pretty much any editor.",
    [["2013-02-02T00:00:00Z", 1500], ["2013-12-31T00:00:00Z", 11200]],
    [["retro_ricky", "gamepad", "2013-01-27T15:00:00Z", "Dip to white is so underrated for music montages"]]),
  video("vid_mt0007", "desktop-tour-2013", "ch_modmymachine", "My Desktop Tour 2013 - Themes, Icons and Docks", "2013-02-09T19:00:00Z", "Science & Technology", ["desktop", "customization", "wallpaper", "theme", "dock"],
    "Four wallpapers, one dock, a clock gadget and a weather widget. All wallpapers are from WallpaperGarden (links in the comments).",
    [["2013-02-16T00:00:00Z", 4400], ["2013-12-31T00:00:00Z", 22900]],
    [["skyblue_kid", "rocket", "2013-02-10T09:15:00Z", "Retro Grid is so good. Changing mine right now"], ["ModMyMachine", "rocket", "2013-02-10T12:00:00Z", "Wallpapers are on wallpapers.connectedera.local, all free for personal use!"]]),
  video("vid_mt0001", "star-courier-1", "ch_pixelpilot", "Star Courier - Levels 1-3 Walkthrough (No Deaths!)", "2013-03-02T18:00:00Z", "Gaming", ["star courier", "walkthrough", "gaming", "arcade", "no deaths"],
    "Part 1 of my Star Courier walkthrough. Levels 1 to 3 with every parcel collected and no deaths. Tip: the blue rocks drift slower, so use them as cover! Part 2 (the boss) coming soon.",
    [["2013-03-09T00:00:00Z", 6100], ["2013-12-31T00:00:00Z", 38500]],
    [["retro_ricky", "gamepad", "2013-03-02T20:44:00Z", "Didn't know you could hug the bottom lane in level 3. Game changer"], ["skyblue_kid", "rocket", "2013-03-03T08:30:00Z", "Finally beat level 3 thanks to this!!"], ["Nadia_draws", "palette", "2013-03-05T19:10:00Z", "Love how calm your walkthroughs are"]]),
  video("vid_mt0010", "iron-to-requiem-first-impressions", "ch_animetalk", "Iron to Requiem - First Impressions (Spring 2013)", "2013-04-09T18:00:00Z", "Film & Animation", ["anime", "iron to requiem", "first impressions", "spring 2013", "review"],
    "Episode 1 thoughts on CHAOS Home's Iron to Requiem: 26 episodes planned, Thursday nights, music by Hiroyuki Sawano. Spoiler-free!",
    [["2013-04-16T00:00:00Z", 2900], ["2013-12-31T00:00:00Z", 14400]],
    [["quietwatcher_x", "leaf", "2013-04-09T21:30:00Z", "That soundtrack really is something."], ["OtakuOlivia", "star", "2013-04-10T07:12:00Z", "Adding it to my list on YAL right now"]]),
  video("vid_mt0008", "rainy-saturday-vlog", "ch_dailydana", "Rainy Saturday Vlog - Pancakes, Sketching and a Sleepy Cat", "2013-04-13T22:00:00Z", "People & Blogs", ["vlog", "rainy day", "pancakes", "sketching", "cat"],
    "A slow, cozy rainy Saturday: blueberry pancakes, a brand new sketchbook and Pepper napping all afternoon. Thanks for hanging out!",
    [["2013-04-20T00:00:00Z", 1700], ["2013-12-31T00:00:00Z", 8300]],
    [["MochiFan2001", "fish", "2013-04-14T10:00:00Z", "Pepper's little breathing is too cute"], ["Nadia_draws", "palette", "2013-04-14T13:22:00Z", "Your sketch of the street is lovely!"]], 0.06),
  video("vid_mt0005", "backyard-trick-shot", "ch_sundaystrikers", "Backyard Trick Shot - Off the Fence and In!", "2013-05-19T21:00:00Z", "Sports", ["soccer", "trick shot", "football", "backyard", "sports"],
    "Attempt #47. Off the fence, off the post, in! Slow-motion replay included because we had to.",
    [["2013-05-26T00:00:00Z", 9400], ["2013-12-31T00:00:00Z", 30100]],
    [["retro_ricky", "gamepad", "2013-05-19T22:30:00Z", "Attempt #47 is dedication"], ["skyblue_kid", "rocket", "2013-05-20T15:45:00Z", "The replay with the trail is so satisfying"]]),
  video("vid_mt0011", "star-courier-boss", "ch_pixelpilot", "Star Courier - Level 4 Boss (Final Walkthrough Part)", "2013-08-17T18:00:00Z", "Gaming", ["star courier", "boss", "walkthrough", "gaming", "arcade"],
    "The final part! How to beat the level 4 boss: stay high or low, wait for the orbs to pass, then line up with the core. GG everyone, thanks for watching the whole series.",
    [["2013-08-24T00:00:00Z", 3800], ["2013-12-31T00:00:00Z", 15600]],
    [["skyblue_kid", "rocket", "2013-08-17T19:05:00Z", "Been waiting for this one!!"], ["retro_ricky", "gamepad", "2013-08-18T11:30:00Z", "Beat it on my second try with the high-lane trick. Thank you!"]]),
  video("vid_mt0009", "sinful-apex-review", "ch_animetalk", "Sinful Apex - Why the Finale Works (Spoiler-Free Review)", "2012-02-07T18:00:00Z", "Film & Animation", ["anime", "sinful apex", "review", "flow pictures", "spoiler-free"],
    "My spoiler-free look at Flow Pictures' Sinful Apex (24 episodes, Aug 2011 to Jan 2012, directed by Kaihatsu Miura) and why the ending lands so well.",
    [["2012-02-14T00:00:00Z", 5200], ["2012-12-31T00:00:00Z", 21800], ["2013-12-31T00:00:00Z", 29400]],
    [["OtakuOlivia", "star", "2012-02-07T20:00:00Z", "The music section is spot on. That ending song!"], ["quietwatcher_x", "leaf", "2012-02-08T12:40:00Z", "Great review, no spoilers at all. Thank you!"]]),
  ...[
    video("vid_mt0101", "summer-league-top5", "ch_iceburner", "TOP 5 GOALS of my Summer 2012 League!!! (u14)", "2012-08-26T19:00:00Z", "Sports", ["soccer", "football", "goals", "summer 2012", "under 14"],
      "my best 5 goals from this summer!! #1 is my first ever volley. shoutout to coach and the whole team, best season ever. (Constructed reconstruction for the Connected Era archive.)",
      [["2012-09-02T00:00:00Z", 640], ["2012-12-31T00:00:00Z", 2310], ["2013-12-31T00:00:00Z", 3900]],
      [["SundayStrikers", "ball", "2012-08-26T21:30:00Z", "That volley!! Come play Sunday league with us when you're older"], ["skyblue_kid", "rocket", "2012-08-27T16:02:00Z", "number 3 nutmeg was so clean lol"]], 0.03),
    video("vid_mt0102", "nightcore-glow-stick-summer", "ch_heartcore", "Nightcore - Glow Stick Summer", "2012-09-08T21:00:00Z", "Music", ["nightcore", "glow stick summer", "neon postcards", "mix", "art"],
      "Original song: Glow Stick Summer by Neon Postcards (Brightside Records), sped up for fun! Drawing is mine, please don't repost without credit ^_^ Go listen to the original too, it's on CV Pop FM all the time. (Constructed reconstruction for the Connected Era archive.)",
      [["2012-09-15T00:00:00Z", 2100], ["2012-12-31T00:00:00Z", 9800], ["2013-12-31T00:00:00Z", 17400]],
      [["Nadia_draws", "palette", "2012-09-09T10:15:00Z", "the glow sticks in the drawing!! so cute"], ["OtakuOlivia", "star", "2012-09-09T19:40:00Z", "added to my homework playlist, it's so energetic"]], 0.02),
    video("vid_mt0103", "claw-machine-20-tries", "ch_noobdestroyer", "MALL FAIL?? 20 Tries at the Claw Machine", "2012-10-13T18:30:00Z", "Comedy", ["mall", "claw machine", "arcade", "fail", "win"],
      "took 20 tries and all my quarters but Sir Fluffington is finally home. never give up guys. (Constructed reconstruction for the Connected Era archive.)",
      [["2012-10-20T00:00:00Z", 1500], ["2012-12-31T00:00:00Z", 6400], ["2013-12-31T00:00:00Z", 11200]],
      [["PixelPilotGaming", "gamepad", "2012-10-13T20:05:00Z", "The persistence! Sir Fluffington deserves his own channel"], ["MochiFan2001", "fish", "2012-10-14T09:12:00Z", "I screamed when it picked him up"]], 0.025),
    video("vid_mt0104", "talent-show-unplugged", "ch_strawberry", "Talent show mishap!! (it turned out great)", "2013-03-02T20:00:00Z", "Music", ["talent show", "keyboard", "school", "live", "spring 2013"],
      "my keyboard plug fell out halfway through and the whole gym started clapping the beat until i plugged it back in. we got second place!!! thank you everyone <3 (Constructed reconstruction for the Connected Era archive.)",
      [["2013-03-09T00:00:00Z", 980], ["2013-06-30T00:00:00Z", 4300], ["2013-12-31T00:00:00Z", 6100]],
      [["AkiraKeys", "guitar", "2013-03-02T22:10:00Z", "Keeping your cool like that is a real musician move. Great playing!"], ["DailyDanaVlogs", "flower", "2013-03-03T11:20:00Z", "The clapping part made me so happy omg"]], 0.02),
  ].map((v) => ({ ...v, reconstruction: true })),
];

export const channelById = (id: string) => channels.find((c) => c.id === id);
export const videoById = (id: string) => videos.find((v) => v.id === id);

/** Views at a moment, interpolated between archive snapshots. */
export function viewsAt(v: Video, now: number): number {
  const pts = v.views.map(([t, n]) => [Date.parse(t), n] as const);
  if (now < pts[0][0]) return 0;
  for (let i = 1; i < pts.length; i++) {
    const [t1, n1] = pts[i];
    const [t0, n0] = pts[i - 1];
    if (now <= t1) return Math.round(n0 + ((n1 - n0) * (now - t0)) / (t1 - t0));
  }
  return pts[pts.length - 1][1];
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
