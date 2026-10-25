// Connected Messenger's rules, kept free of React so tests can drive them:
// who is online when, which status message shows, what an automatic reply
// says, conversation ids and emoticons.

import type { Presence } from "@/components/system/types";
import type { SampleContact } from "@/data/messenger";
import { zonedParts } from "./time";

export interface Conversation {
  id: string;
  /** Account ids (usr_...) and sample contact ids (ct_...). */
  members: string[];
  group: boolean;
  title?: string;
  createdBy: string;
  createdAt: string;
  origin: "user";
}

export interface ImMessage {
  id: string;
  conversationId: string;
  from: string;
  text: string;
  at: string;
  kind: "text" | "nudge" | "away" | "system";
  /** "scripted" = an automatic reply from a sample contact. */
  origin: "user" | "scripted";
  /** The user message an automatic reply answers. */
  replyTo?: string;
}

export const COL_CONVERSATIONS = "im.conversations";
export const COL_MESSAGES = "im.messages";
export const COL_CONTACTS = "im.contacts";

/** The same id from both sides, so two accounts always share one chat. */
export function directId(a: string, b: string): string {
  return `conv_dm_${[a, b].sort().join("_")}`;
}

export function presenceAt(c: SampleContact, t: number, zone: string): Presence {
  const p = zonedParts(t, zone);
  const day = new Date(Date.UTC(p.y, p.mo, p.d)).getUTCDay();
  const hour = p.h + p.mi / 60;
  // Later slots win, so a short "away" can sit inside a longer "online".
  let status: Presence = "offline";
  for (const s of c.schedule) if ((!s.days || s.days.includes(day)) && hour >= s.from && hour < s.to) status = s.status;
  return status;
}

export function statusMessageAt(c: SampleContact, t: number): string {
  let text = "";
  for (const m of c.statusMessages) if (Date.parse(m.from) <= t) text = m.text;
  return text;
}

const GREETING = /^(hi+|hey+|hello|yo|sup|hiya|howdy|good (morning|afternoon|evening))\b/i;
const HOW_ARE_YOU = /how ('?re|are) (you|u)|how'?s it going|what'?s up|wassup|how have you been/i;

/** An automatic reply from a sample contact. `n` is how many it has already sent in this chat. */
export function scriptedReply(c: SampleContact, text: string, n: number): string {
  const pick = (list: string[]) => list[n % list.length];
  const t = text.toLowerCase();
  if (/metube\.com/.test(t)) return pick(c.links.metube);
  if (/mangashelf\.net/.test(t)) return pick(c.links.manga);
  if (/(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org)\b/.test(t)) return pick(c.links.other);
  if (HOW_ARE_YOU.test(t)) return pick(c.howAreYou);
  if (GREETING.test(t.trim())) return pick(c.greetings);
  for (const topic of c.topics) if (new RegExp(`\\b(${topic.match})`, "i").test(t)) return pick(topic.replies);
  return pick(c.smallTalk);
}

export const EMOTICONS: [string, string][] = [
  [":D", "😄"],
  [":-D", "😄"],
  [":)", "🙂"],
  [":-)", "🙂"],
  [";)", "😉"],
  [";-)", "😉"],
  [":P", "😛"],
  [":p", "😛"],
  [":O", "😮"],
  [":o", "😮"],
  [":(", "🙁"],
  ["B)", "😎"],
  ["<3", "❤️"],
  ["(y)", "👍"],
  ["(Y)", "👍"],
  ["XD", "😆"],
  ["^_^", "😊"],
  ["(*)", "⭐"],
  ["(music)", "🎵"],
  ["(pizza)", "🍕"],
];

/** Splits text into plain runs, emoticons and links for display. */
export type ChatToken = { kind: "text"; text: string } | { kind: "emoticon"; code: string; emoji: string } | { kind: "link"; text: string; url: string };

const LINK = /((?:https?:\/\/|www\.)[^\s]+|\b[a-z0-9-]+\.(?:com|net|org)(?:\/[^\s]*)?)/gi;

export function tokenize(text: string): ChatToken[] {
  const out: ChatToken[] = [];
  let last = 0;
  const pushText = (s: string) => {
    let rest = s;
    while (rest) {
      let best: { i: number; code: string; emoji: string } | null = null;
      for (const [code, emoji] of EMOTICONS) {
        const i = rest.indexOf(code);
        if (i >= 0 && (!best || i < best.i || (i === best.i && code.length > best.code.length))) best = { i, code, emoji };
      }
      if (!best) {
        out.push({ kind: "text", text: rest });
        break;
      }
      if (best.i > 0) out.push({ kind: "text", text: rest.slice(0, best.i) });
      out.push({ kind: "emoticon", code: best.code, emoji: best.emoji });
      rest = rest.slice(best.i + best.code.length);
    }
  };
  for (const m of text.matchAll(LINK)) {
    const raw = m[1].replace(/[.,!?)]+$/, "");
    if (m.index! > last) pushText(text.slice(last, m.index));
    const url = /^https?:\/\//i.test(raw) ? raw : `http://${raw.toLowerCase().startsWith("www.") ? raw : `www.${raw}`}`;
    out.push({ kind: "link", text: raw, url });
    last = m.index! + raw.length;
  }
  if (last < text.length) pushText(text.slice(last));
  return out;
}

/** How long ago an account's heartbeat counts as "signed in". */
export const PRESENCE_TTL_MS = 90_000;

export interface Heartbeat {
  status: Presence;
  message: string;
  at: number;
}

export function accountPresence(hb: Heartbeat | undefined, realNow: number): Presence {
  if (!hb || realNow - hb.at > PRESENCE_TTL_MS) return "offline";
  return hb.status;
}
