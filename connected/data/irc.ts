// Relay Chat's network, irc.connectedera.local: its standing channels and
// the scrollback the regulars left there. Lines appear once their time has
// come. The regulars are the Connected Era's own friendly faces; they show
// up in the logs, not live, so nobody pretends to be online.

import type { LogLine } from "@/lib/irc";

export const NETWORK = "irc.connectedera.local";
export const SERVICE_NICK = "RelayServ";

export interface ArchiveChannel {
  name: string;
  topic: string;
  topicBy: string;
  topicAt: string;
  log: LogLine[];
}

const say = (at: string, nick: string, text: string): LogLine => ({ at, nick, kind: "msg", text });
const act = (at: string, nick: string, text: string): LogLine => ({ at, nick, kind: "action", text });

export const archiveChannels: ArchiveChannel[] = [
  {
    name: "#general",
    topic: "Welcome to irc.connectedera.local! Be nice, have fun. Type /help for commands.",
    topicBy: SERVICE_NICK,
    topicAt: "2010-05-01T12:00:00Z",
    log: [
      say("2012-07-12T23:02:00Z", "sky_kid", "anyone around?"),
      say("2012-07-12T23:03:00Z", "dana_doodles", "hi sky! just finished editing my paper plane vlog"),
      say("2012-07-12T23:04:00Z", "sky_kid", "nice!! i got 18 metres in the hallway today"),
      say("2012-07-12T23:05:00Z", "dana_doodles", "new record! :D"),
      say("2012-11-22T03:10:00Z", "sky_kid", "STAR COURIER IS OUT on freeware corner, go go go"),
      say("2012-11-22T03:12:00Z", "pixelpilot", "confirmed, it's great. stay in the bottom lane on level 3"),
      act("2012-11-22T03:13:00Z", "sky_kid", "runs off to download it"),
      say("2013-09-07T22:30:00Z", "techtom", "reminder: you can set any picture as your wallpaper right from Photo Viewer :)"),
      say("2013-09-07T22:31:00Z", "nadia", "tom is the wallpaper wizard"),
    ],
  },
  {
    name: "#anime",
    topic: "Anime chat. Warn before spoilers, please!",
    topicBy: "olivia_otaku",
    topicAt: "2011-03-02T12:00:00Z",
    log: [
      say("2012-07-21T03:15:00Z", "olivia_otaku", "doing the flow pictures rewatch from the YAL forums, vacant crown first"),
      say("2012-07-21T03:16:00Z", "nadia", "the wide battle shots in that one are so good"),
      say("2012-12-30T01:40:00Z", "olivia_otaku", "saw skyfall chronicle: black aegis today. sky battles on a cinema screen!!"),
      say("2012-12-30T01:42:00Z", "sky_kid", "jealous"),
      say("2013-04-05T02:05:00Z", "olivia_otaku", "iron to requiem starts tonight! who's watching"),
      say("2013-04-05T02:06:00Z", "akira_keys", "me, mostly for the soundtrack"),
      say("2013-09-27T03:30:00Z", "olivia_otaku", "itr finale done. twenty six thursdays, what a ride"),
      act("2013-09-27T03:31:00Z", "nadia", "hands olivia a celebration cookie"),
    ],
  },
  {
    name: "#gaming",
    topic: "Games, high scores and speedruns. Star Courier tips welcome.",
    topicBy: "pixelpilot",
    topicAt: "2010-09-12T12:00:00Z",
    log: [
      say("2012-10-03T19:20:00Z", "pixelpilot", "field sweeper on medium, 58 seconds. beat that"),
      say("2012-10-03T19:24:00Z", "sky_kid", "61. so close"),
      say("2012-10-03T19:25:00Z", "pixelpilot", "middle-click chording, trust me"),
      say("2012-11-22T04:40:00Z", "sky_kid", "4850 in star courier!!"),
      say("2012-11-22T04:41:00Z", "pixelpilot", "huge. welcome to the 4k club"),
      say("2013-08-18T06:10:00Z", "pixelpilot", "boss guide video is up on metube. high then low, every time"),
    ],
  },
  {
    name: "#music",
    topic: "What are you listening to? Share it here.",
    topicBy: "akira_keys",
    topicAt: "2011-06-01T12:00:00Z",
    log: [
      say("2012-07-29T00:15:00Z", "akira_keys", "new piano piece is up on metube: Summer Rain"),
      say("2012-07-29T00:20:00Z", "dana_doodles", "listening now, it's lovely"),
      say("2012-09-09T16:00:00Z", "nadia", "heartcore_angel's nightcore of glow stick summer is stuck in my head"),
      say("2013-01-26T22:45:00Z", "akira_keys", "garage noise played notebook margins three times today and i'm not complaining"),
      say("2013-01-26T22:47:00Z", "sky_kid", "ambient echo at night is perfect for homework btw"),
    ],
  },
  {
    name: "#help",
    topic: "Computer help. Ask anything, no question is too small.",
    topicBy: "techtom",
    topicAt: "2009-11-20T12:00:00Z",
    log: [
      say("2012-08-14T20:00:00Z", "grandpa_bill", "how do I get the pictures out of my email?"),
      say("2012-08-14T20:02:00Z", "techtom", "open the message, click the attachment, then Save to Downloads. it'll be waiting in your Downloads folder!"),
      say("2012-08-14T20:05:00Z", "grandpa_bill", "it worked! thank you young man"),
      say("2013-02-02T16:30:00Z", "sky_kid", "how do i zip a folder"),
      say("2013-02-02T16:31:00Z", "techtom", "right-click it in Explorer, then Add to ZIP archive. easy!"),
    ],
  },
];

/** Nicknames already used by the regulars and the network itself. */
export const RESERVED_NICKS = new Set([SERVICE_NICK, ...archiveChannels.flatMap((c) => [c.topicBy, ...c.log.map((l) => l.nick)])].map((n) => n.toLowerCase()));
export const archiveChannel = (name: string) => archiveChannels.find((c) => c.name === name.toLowerCase());
